/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  🌸 MITSURI-MD · Punto de entrada                           ║
 * ║  WhatsApp Multi-Device (Baileys beta) · QR o Pairing Code   ║
 * ║  Toda la personalización está en config.ts                  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import chalk from 'chalk';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';

import { config, bot, apis } from './config.js';
import { handleMessage, handleGroupParticipants, invalidateGroupCache } from './handler.js';
import { loadCommands, commandCount } from './lib/loader.js';
import { pedirCodigoVinculacion } from './lib/pairing.js';
import { applySettings } from './lib/settings.js';
import { setMainSocket } from './lib/runtime.js';
import { restoreSubs, setSubMessageHandler } from './lib/subbot.js';
import { sleep } from './lib/utils.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });
const sessionDir = path.resolve(process.cwd(), bot.sessionDir);
const CODE_TTL_MS = Math.max(5_000, Number(process.env.PAIRING_TTL_MS) || 120_000);
const PAIRING_FALLBACK_MS = Math.max(500, Number(process.env.PAIRING_FALLBACK_MS) || 10_000);
const TTL_TEXTO = CODE_TTL_MS >= 60_000
  ? `${Math.round(CODE_TTL_MS / 60_000)} minuto${Math.round(CODE_TTL_MS / 60_000) === 1 ? '' : 's'}`
  : `${Math.round(CODE_TTL_MS / 1000)} segundos`;

let reconnectTimer: NodeJS.Timeout | null = null;
let pairTimer: NodeJS.Timeout | null = null;
let codeRequested = false;
let codeInFlight = false;
let connected = false;
let reiniciando = false;
let pairSuccess = false;
let activeSock: any = null;
let numeroVinculacion = '';

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
  console.log(`   📲 Vinculación: ${bot.auth === 'code' ? `Código de 8 dígitos (+${numeroVinculacion || bot.owner.number}) · vence en ${TTL_TEXTO}` : 'QR en terminal'}\n`);
}

function askQuestion(pregunta: string): Promise<string> {
  return new Promise<string>(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let cerrado = false;
    let timer: NodeJS.Timeout | undefined;
    const responder = (valor: string): void => {
      if (cerrado) return;
      cerrado = true;
      if (timer) clearTimeout(timer);
      rl.close();
      resolve(valor.trim());
    };
    rl.question(pregunta, respuesta => responder(respuesta ?? ''));
    rl.on('close', () => responder(''));
    timer = setTimeout(() => responder(''), 60_000);
    timer.unref();
  });
}

async function elegirVinculacion(): Promise<void> {
  const metodo = (process.env.AUTH_METHOD || '').trim().toLowerCase();
  const argv = process.argv.slice(2);
  const methodCodeQR = metodo === 'qr' || metodo === '1' || argv.includes('--qr');
  const methodCode = metodo === 'code' || metodo === 'pairing' || metodo === '2' || argv.includes('--code') || argv.includes('--pairing');

  let opcion = '';
  let usarCodigo = false;

  if (methodCodeQR) {
    opcion = '1';
    console.log(chalk.gray('   AUTH_METHOD=qr → Código QR, sin preguntar.'));
  } else if (methodCode) {
    opcion = '2';
    usarCodigo = true;
    console.log(chalk.gray('   AUTH_METHOD=code → Código de 8 dígitos, sin preguntar.'));
  } else if (!process.stdin.isTTY) {
    opcion = '1';
    console.log(chalk.gray('   Sin terminal interactiva → QR. Usa AUTH_METHOD=qr|code o --qr/--code para elegir.'));
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

  const porDefecto = (process.env.PAIRING_NUMBER || bot.owner.number || '').replace(/[^0-9]/g, '');
  let numero = porDefecto;
  if (process.stdin.isTTY) {
    const respuesta = await askQuestion(chalk.bold.white(`   ┊ TU número a vincular, con código de país y sin + (Enter = ${porDefecto}): `));
    if (respuesta) numero = respuesta.replace(/[^0-9]/g, '');
  }
  if (!numero) {
    console.error('❌ Para el código de 8 dígitos define OWNER_NUMBER o PAIRING_NUMBER en .env, o un número en config.ts.');
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

function limpiarSesion(): void {
  fs.rmSync(sessionDir, { recursive: true, force: true });
  fs.mkdirSync(sessionDir, { recursive: true });
}

function reiniciarVinculacion(motivo: string, ms = 1200): void {
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
    start().catch(e => console.error('[RECONNECT]', e));
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

async function start(): Promise<void> {
  fs.mkdirSync(sessionDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  } as any);

  activeSock = sock;
  setMainSocket(sock);
  sock.ev.on('creds.update', saveCreds);

  function solicitarCodigo(): void {
    if (bot.auth !== 'code' || codeRequested || codeInFlight || connected || state.creds.registered || reiniciando) return;
    codeInFlight = true;
    const numero = numeroVinculacion || bot.owner.number;
    console.log(chalk.cyan('   ⏳ Pidiendo el código de 8 dígitos a WhatsApp…'));
    void pedirCodigoVinculacion({
      sock,
      numero,
      customCode: bot.pairingCode || undefined,
      onCode: (code: string) => {
        codeRequested = true;
        const vence = new Date(Date.now() + CODE_TTL_MS);
        const hora = vence.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: bot.timezone });
        console.log(`\n🔐 CÓDIGO DE VINCULACIÓN: ${code}`);
        console.log(`   Número : +${numero}`);
        console.log(`   ⏱️  Vence en ${TTL_TEXTO} (${hora}) · se genera uno nuevo solo al vencer`);
        console.log(`   WhatsApp → Ajustes → Dispositivos vinculados → Vincular con número de teléfono\n`);
        programarVencimiento();
      },
      onError: (mensaje: string) => {
        console.error(`❌ No se pudo pedir el código de vinculación: ${mensaje}`);
      },
    }).finally(() => { codeInFlight = false; });
  }

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update;
    if (isNewLogin) pairSuccess = true;

    if (qr && !state.creds.registered) {
      if (bot.auth === 'qr') {
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
      const status = (lastDisconnect?.error as any)?.output?.statusCode;
      const reason = status ?? 'desconocido';
      if (status === DisconnectReason.loggedOut) {
        if (bot.auth === 'code' && !state.creds.registered && !pairSuccess) {
          reiniciarVinculacion('♻️  WhatsApp cerró la vinculación a medias. Limpiando sesión y pidiendo un código nuevo…');
          return;
        }
        if (pairSuccess) {
          console.log('🔄 WhatsApp pide reiniciar para terminar la vinculación…');
        } else {
          console.log('🚪 Sesión cerrada desde el teléfono. Borra la carpeta session/ para volver a vincular.');
          return;
        }
      }
      console.log(`⚠️ Conexión cerrada (${reason}). Reconectando en 3s…`);
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => { reconnectTimer = null; start().catch(e => console.error('[RECONNECT]', e)); }, 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
    if (type !== 'notify') return;
    for (const msg of messages ?? []) {
      await handleMessage(sock, msg);
    }
  });

  sock.ev.on('group-participants.update', async (event: any) => {
    invalidateGroupCache(event?.jid);
    await handleGroupParticipants(sock, event);
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

  if (bot.auth === 'code' && !state.creds.registered) {
    setTimeout(solicitarCodigo, PAIRING_FALLBACK_MS).unref?.();
  }
}

function limpiarSesionIncompleta(): void {
  if (bot.auth !== 'code') return;
  try {
    const credPath = path.join(sessionDir, 'creds.json');
    if (!fs.existsSync(credPath)) return;
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    if (creds?.registered) return;
    if (!creds?.me && !creds?.pairingCode) return;
    limpiarSesion();
    console.log(chalk.yellow('   ♻️ Había una vinculación a medias: se limpió session/ para pedir un código nuevo.\n'));
  } catch {
    return;
  }
}

async function main(): Promise<void> {
  await elegirVinculacion();
  limpiarSesionIncompleta();
  const loaded = await loadCommands();
  banner();
  if (!loaded) {
    console.warn('⚠️ No se cargó ningún comando. Revisa la carpeta commands/.');
  }
  applySettings();
  setSubMessageHandler((sock, msg) => { void handleMessage(sock, msg, { isSubbot: true }); });
  await restoreSubs().catch(e => console.error('[SUBBOT] restore:', e));
  await start();
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
