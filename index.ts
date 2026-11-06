/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  🌸 MITSURI-MD · Punto de entrada                           ║
 * ║  WhatsApp Multi-Device (Baileys beta) · QR o Pairing Code   ║
 * ║  Conexión basada en el flujo que sí entrega el código        ║
 * ╚═══════════════════════════════════════════════════════════╝
 */
import 'dotenv/config';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import readline from 'node:readline';
import chalk from 'chalk';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from '@whiskeysockets/baileys';

import { config, bot, apis } from './config.js';
import { handleMessage, handleGroupParticipants, invalidateGroupCache } from './handler.js';
import { loadCommands, commandCount } from './lib/loader.js';
import { pedirCodigoVinculacion } from './lib/pairing.js';
import { applySettings } from './lib/settings.js';
import { setMainSocket } from './lib/runtime.js';
import { restoreSubs, setSubMessageHandler } from './lib/subbot.js';
import { sleep } from './lib/utils.js';

const logger = P({ level: process.env.LOG_LEVEL || 'silent' });
const sessionDir = path.resolve(process.cwd(), bot.sessionDir);
const CODE_TTL_MS = Math.max(5_000, Number(process.env.PAIRING_TTL_MS) || 120_000);
const TTL_TEXTO = CODE_TTL_MS >= 60_000
  ? `${Math.round(CODE_TTL_MS / 60_000)} minuto${Math.round(CODE_TTL_MS / 60_000) === 1 ? '' : 's'}`
  : `${Math.round(CODE_TTL_MS / 1000)} segundos`;
const PAIRING_DELAY_MS = Math.max(1_000, Number(process.env.PAIRING_DELAY_MS) || 3_000);

const httpAgent = new https.Agent({ keepAlive: true, maxSockets: 100, keepAliveMsecs: 15000, scheduling: 'fifo' });

const methodCodeQR = process.argv.includes('--qr');
const methodCode = process.argv.includes('code') || process.argv.includes('--code');

let waVersion: number[] | undefined;
let reconnectTimer: NodeJS.Timeout | null = null;
let pairTimer: NodeJS.Timeout | null = null;
let codeRequested = false;
let codeInFlight = false;
let connected = false;
let reiniciando = false;
let pairSuccess = false;
let activeSock: any = null;
let numeroVinculacion = '';

function normalizePhone(input: any): string {
  let s = String(input ?? '').replace(/\D/g, '');
  if (!s) return '';
  s = s.replace(/^0+/, '');
  if (s.length === 10 && s.startsWith('3')) s = '57' + s;
  if (process.env.PAIRING_LEGACY_PREFIX === '1') {
    if (s.startsWith('52') && !s.startsWith('521') && s.length >= 12) s = '521' + s.slice(2);
    if (s.startsWith('54') && !s.startsWith('549') && s.length >= 11) s = '549' + s.slice(2);
  }
  return s;
}

function limpiarSesion(): void {
  if (fs.existsSync(sessionDir)) {
    try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch { /* ignorar */ }
  }
  fs.mkdirSync(sessionDir, { recursive: true });
}

function banner(): void {
  const line = '─'.repeat(52);
  console.log(`\n╭${line}╮`);
  console.log(`│  🌸  ${bot.name} v${bot.version}  ·  WhatsApp Multi-Device  ${' '.repeat(8)}│`);
  console.log(`│  ${'Dulce por fuera, fuerte por dentro.'.padEnd(50)}│`);
  console.log(`╰${line}╯`);
  console.log(`   👑 Dueño      : ${bot.owner.name}${bot.owner.number ? ` (+${bot.owner.number})` : ' (sin configurar)'}`);
  console.log(`   🔣 Prefijos   : ${bot.prefixes.join(' ')}`);
  console.log(`   🧩 Comandos   : ${commandCount()}`);
  console.log(`   🔌 APIs       : ${Object.values(apis).filter(a => a.enabled).map(a => a.label).join(' · ')}`);
  console.log(`   🔐 Sesión     : ${sessionDir}`);
  console.log(`   📲 Vinculación: ${bot.auth === 'code' ? `Código de 8 dígitos (+${numeroVinculacion || bot.owner.number}) · vence en ${TTL_TEXTO}` : 'QR en terminal'}`);
  if (waVersion) console.log(`   🆕 WA Web     : ${waVersion.join('.')} (versión actual)`);
  console.log('');
}

let consola: readline.Interface | null = null;
let pendiente: ((valor: string) => void) | null = null;
const colaLineas: string[] = [];

function initConsola(): void {
  if (consola) return;
  consola = readline.createInterface({ input: process.stdin, output: process.stdout });
  consola.on('line', linea => {
    if (pendiente) { const fn = pendiente; pendiente = null; fn(linea); }
    else colaLineas.push(linea);
  });
  consola.on('close', () => {
    if (pendiente) { const fn = pendiente; pendiente = null; fn(''); }
    consola = null;
  });
}

const askQuestion = async (query: string): Promise<string> => {
  initConsola();
  process.stdout.write(query);
  const enCola = colaLineas.shift();
  if (enCola !== undefined) return enCola.trim();
  return new Promise<string>(resolve => {
    let cerrado = false;
    const timer = setTimeout(() => responder(''), 60_000);
    timer.unref();
    function responder(valor: string): void {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(timer);
      if (pendiente === responder) pendiente = null;
      resolve(valor.trim());
    }
    pendiente = responder;
  });
};

function displayLoadingMessage(): void {
  console.log(chalk.bold.white(`\nPor favor, ingresa tu número de WhatsApp.\n` +
    `${chalk.bold.cyan('Ejemplo: +52 1 33 1916 4806  /  +51 926 519 334')}\n` +
    `${chalk.bold.white('---> ')} `));
}

async function elegirVinculacion(): Promise<void> {
  const metodo = (process.env.AUTH_METHOD || '').trim().toLowerCase();
  const forzarQR = methodCodeQR || metodo === 'qr' || metodo === '1';
  const forzarCodigo = methodCode || metodo === 'code' || metodo === 'pairing' || metodo === '2';

  let opcion = '';
  let usarCodigo = false;

  if (forzarQR) {
    opcion = '1';
    console.log(chalk.gray('   → Código QR, sin preguntar.'));
  } else if (forzarCodigo) {
    opcion = '2';
    usarCodigo = true;
    console.log(chalk.gray('   → Código de 8 dígitos, sin preguntar.'));
  } else if (!process.stdin.isTTY) {
    opcion = '1';
    console.log(chalk.gray('   Sin terminal interactiva → QR. Usa AUTH_METHOD=qr|code o --qr/code.'));
  } else {
    const lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》';
    console.log(chalk.white(`╭${lineM}`));
    opcion = await askQuestion(
      `┊ ${chalk.bold.cyan(' METODO DE VINCULACION ')}\n` +
      `┊ ${chalk.bold.white('⇢ Opcion 1:')} ${chalk.cyan('Codigo QR.')}\n` +
      `┊ ${chalk.bold.white('⇢ Opcion 2:')} ${chalk.cyan('Codigo de 8 digitos.')}\n` +
      `╰${lineM}\n${chalk.bold.white('---> ')}`
    );
    usarCodigo = opcion === '2';
  }

  if (opcion !== '1' && opcion !== '2') {
    console.log(chalk.yellow('   Opción no válida → se usa el Código QR.'));
    opcion = '1';
    usarCodigo = false;
  }

  process.env.AUTH_METHOD = usarCodigo ? 'code' : 'qr';
  config.auth = usarCodigo ? 'code' : 'qr';
  bot.auth = config.auth;
  console.log(chalk.green(`   ✔ ${usarCodigo ? 'Opción 2 · Código de 8 dígitos' : 'Opción 1 · Código QR'}\n`));

  if (!usarCodigo) return;

  if (bot.pairingCode && bot.pairingCode.length !== 8) {
    console.log(chalk.yellow(`   PAIRING_CODE debe tener 8 caracteres (tiene ${bot.pairingCode.length}), se genera uno automático.`));
    bot.pairingCode = '';
  }

  let numero = normalizePhone(process.env.PAIRING_NUMBER || '');
  if (process.stdin.isTTY) {
    displayLoadingMessage();
    const respuesta = await askQuestion('');
    numero = normalizePhone(respuesta || numero || bot.owner.number);
  }
  if (!numero) numero = normalizePhone(bot.owner.number);
  if (!numero) {
    console.error('❌ Para el código define PAIRING_NUMBER en .env o un número en config.ts.');
    process.env.AUTH_METHOD = 'qr';
    config.auth = 'qr';
    bot.auth = 'qr';
    return;
  }

  numeroVinculacion = numero;
  config.owner.add(numero);
  bot.owner.numbers.add(numero);
  const jid = `${numero}@s.whatsapp.net`;
  if (!bot.owner.extraJids.includes(jid)) bot.owner.extraJids.push(jid);
  process.env.OWNER_NUMBER = numero;
  console.log(chalk.cyan(`   📞 Se vinculará +${numero}\n`));
}

function reiniciarVinculacion(motivo: string, ms = 2000): void {
  if (reiniciando || connected || bot.auth !== 'code') return;
  reiniciando = true;
  console.log(chalk.yellow(`\n${motivo}\n`));
  if (pairTimer) { clearTimeout(pairTimer); pairTimer = null; }
  try { activeSock?.end?.(new Error('reiniciar vinculación')); } catch { /* ya cerrado */ }
  limpiarSesion();
  codeRequested = false;
  codeInFlight = false;
  pairSuccess = false;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reiniciando = false;
    start(true).catch(e => console.error('[RECONNECT]', e));
  }, ms);
}

function programarVencimiento(): void {
  if (pairTimer) clearTimeout(pairTimer);
  pairTimer = setTimeout(() => {
    pairTimer = null;
    if (connected) return;
    reiniciarVinculacion(`⏱️  El código venció (${TTL_TEXTO}). Generando uno nuevo…`);
  }, CODE_TTL_MS);
  pairTimer.unref?.();
}

async function start(nuevaSesion = false): Promise<void> {
  fs.mkdirSync(sessionDir, { recursive: true });
  if (nuevaSesion && bot.auth === 'code') limpiarSesion();

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    logger,
    printQRInTerminal: false,
    version: (waVersion || undefined) as any,
    browser: Browsers.macOS('Safari'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    markOnlineOnConnect: false,
    emitOwnEvents: false,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    downloadHistory: false,
    fireInitQueries: false,
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: undefined,
    retryRequestDelayMs: 250,
    getMessage: async () => undefined,
    fetchOpts: { agent: httpAgent } as any,
  } as any);

  activeSock = sock;
  setMainSocket(sock);
  sock.ev.on('creds.update', async () => { await saveCreds(); });

  const esQR = bot.auth === 'qr';

  function solicitarCodigo(): void {
    if (bot.auth !== 'code' || codeRequested || codeInFlight || connected || state.creds.registered || reiniciando) return;
    codeInFlight = true;
    const numero = numeroVinculacion || normalizePhone(bot.owner.number);
    console.log(chalk.cyan('   ⏳ Pidiendo el código de 8 dígitos a WhatsApp…'));
    void pedirCodigoVinculacion({
      sock,
      numero,
      customCode: bot.pairingCode || undefined,
      intentos: 12,
      esperaMs: 1000,
      onCode: (code: string) => {
        codeRequested = true;
        const bonito = code.match(/.{1,4}/g)?.join('-') || code;
        const vence = new Date(Date.now() + CODE_TTL_MS);
        const hora = vence.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: bot.timezone });
        console.log(chalk.white.bgBlue(' CODIGO DE VINCULACION ') + chalk.bold.white(` : ${bonito}`));
        console.log(`   📞 Número : +${numero}`);
        console.log(`   ⏱️  Vence en ${TTL_TEXTO} (${hora}) · se genera uno nuevo solo al vencer`);
        console.log(`   WhatsApp → Ajustes → Dispositivos vinculados → Vincular con número de teléfono\n`);
        programarVencimiento();
      },
      onError: (mensaje: string) => {
        console.error(chalk.red('[ ERROR ] Falla al generar código de vinculación:'), mensaje);
        reiniciarVinculacion('♻️  Limpiando sesión y reintentando con un código nuevo…');
      },
    }).finally(() => { codeInFlight = false; });
  }

  if (!esQR && !state.creds.registered) {
    setTimeout(solicitarCodigo, PAIRING_DELAY_MS).unref?.();
  }

  sock.ev.on('connection.update', async (u: any) => {
    const { connection, lastDisconnect, qr, isNewLogin } = u;
    if (isNewLogin) pairSuccess = true;

    if (qr && !state.creds.registered) {
      if (esQR) {
        console.log('\n📲 Escanea este QR con WhatsApp → Dispositivos vinculados:\n');
        qrcode.generate(qr, { small: true });
      } else {
        solicitarCodigo();
      }
    }

    if (connection === 'open') {
      connected = true;
      if (pairTimer) { clearTimeout(pairTimer); pairTimer = null; }
      console.log(`✅ ${bot.name} conectado como ${sock.user?.id ?? 'desconocido'}`);
      console.log(`   Escribe ${bot.prefix}menu en cualquier chat para empezar.\n`);
    }

    if (connection === 'close') {
      if (reiniciando) return;
      connected = false;
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const isStreamError = String((lastDisconnect?.error as any)?.message ?? '').includes('Stream Errored');

      if (statusCode === 515 || isStreamError) {
        console.log(chalk.yellow('[ RECONNECT ] Reiniciando socket por actualización de sesión...'));
        if (!reconnectTimer) reconnectTimer = setTimeout(() => { reconnectTimer = null; start(false).catch(e => console.error('[RECONNECT]', e)); }, 2000);
      } else if (statusCode === DisconnectReason.loggedOut) {
        if (bot.auth === 'code' && !state.creds.registered && !pairSuccess) {
          reiniciarVinculacion('♻️  WhatsApp cerró la vinculación a medias. Limpiando sesión y pidiendo un código nuevo…');
          return;
        }
        console.log(chalk.red('[ SESSION ] Sesión cerrada desde el teléfono. Limpiando...'));
        limpiarSesion();
        if (!reconnectTimer) reconnectTimer = setTimeout(() => { reconnectTimer = null; start(true).catch(e => console.error('[RECONNECT]', e)); }, 2000);
      } else {
        console.log(chalk.yellow(`⚠️ Conexión cerrada (${statusCode ?? 'desconocido'}). Reconectando en 3s…`));
        if (!reconnectTimer) reconnectTimer = setTimeout(() => { reconnectTimer = null; start(false).catch(e => console.error('[RECONNECT]', e)); }, 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
    if (type !== 'notify') return;
    for (const msg of messages ?? []) {
      if (!msg?.key?.id || !msg.message) continue;
      const jid = msg.key.remoteJid || '';
      if (jid === 'status@broadcast' || jid.endsWith('@broadcast')) continue;
      await handleMessage(sock, msg);
    }
  });

  sock.ev.on('group-participants.update', async (update: any) => {
    invalidateGroupCache(update?.id);
    await handleGroupParticipants(sock, update);
  });
  sock.ev.on('groups.update', (events: any[]) => {
    for (const e of events ?? []) if (e?.id) invalidateGroupCache(e.id);
  });

  if (bot.rejectCalls) {
    sock.ev.on('call', async (calls: any[]) => {
      for (const call of calls ?? []) {
        if (call.status !== 'offer') continue;
        try {
          await (sock as any).rejectCall?.(call.id, call.from);
          await sock.sendMessage(call.from, { text: '🌸 No acepto llamadas, ¡escríbeme un mensaje! 💖' }).catch(() => {});
        } catch { /* el fork puede no exponer rejectCall */ }
      }
    });
  }
}

async function main(): Promise<void> {
  try {
    const r = await fetchLatestBaileysVersion();
    waVersion = r.version;
    if (!r.isLatest) console.log(chalk.yellow('   ⚠️ No se pudo consultar la versión de WA Web; se usa la del fork.'));
  } catch {
    console.log(chalk.yellow('   ⚠️ No se pudo consultar la versión de WA Web; se usa la del fork.'));
  }

  await elegirVinculacion();
  const loaded = await loadCommands();
  banner();
  if (!loaded) console.warn('⚠️ No se cargó ningún comando. Revisa la carpeta commands/.');
  applySettings();
  setSubMessageHandler((sock, msg) => { void handleMessage(sock, msg, { isSubbot: true }); });
  await restoreSubs().catch(e => console.error('[SUBBOT] restore:', e));
  await start(true);
}

main().catch(error => {
  console.error('💥 Error fatal al iniciar:', error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    console.log(`\n👋 Cerrando ${bot.name}…`);
    await sleep(150);
    process.exit(0);
  });
}
