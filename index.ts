/**
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  🌸 MITSURI-MD · Punto de entrada                           ║
 * ║  WhatsApp Multi-Device (Baileys beta) · QR o Pairing Code   ║
 * ║  Toda la personalización está en config.ts                  ║
 * ╚═══════════════════════════════════════════════════════════╝
 */
import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';

import { bot, apis } from './config.js';
import { handleMessage, handleGroupParticipants, invalidateGroupCache } from './handler.js';
import { loadCommands, commandCount } from './lib/loader.js';
import { applySettings } from './lib/settings.js';
import { setMainSocket } from './lib/runtime.js';
import { restoreSubs, setSubMessageHandler } from './lib/subbot.js';
import { sleep } from './lib/utils.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });
const sessionDir = path.resolve(process.cwd(), bot.sessionDir);

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
  console.log(`   📲 Vinculación: ${bot.auth === 'code' ? 'Código de emparejamiento' : 'QR en terminal'}\n`);
}

let reconnectTimer: NodeJS.Timeout | null = null;
let codeRequested = false;

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

  setMainSocket(sock);
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && bot.auth === 'qr' && !state.creds.registered) {
      console.log('\n📲 Escanea este QR con WhatsApp → Dispositivos vinculados:\n');
      qrcode.generate(qr, { small: true });
    }

    if (bot.auth === 'code' && connection === 'connecting' && !codeRequested && !state.creds.registered) {
      codeRequested = true;
      if (!bot.owner.number) {
        console.error('❌ AUTH_METHOD=code necesita OWNER_NUMBER en el archivo .env (número con código de país, sin +).');
      } else {
        try {
          const code = bot.pairingCode
            ? await sock.requestPairingCode(bot.owner.number, bot.pairingCode)
            : await sock.requestPairingCode(bot.owner.number);
          console.log(`\n🔐 CÓDIGO DE VINCULACIÓN: ${code}\n   WhatsApp → Dispositivos vinculados → Vincular con número de teléfono\n`);
        } catch (error: any) {
          console.error('❌ No se pudo pedir el código de vinculación:', error?.message ?? error);
        }
      }
    }

    if (connection === 'open') {
      console.log(`✅ ${bot.name} conectado como ${sock.user?.id ?? 'desconocido'}`);
      console.log(`   Escribe ${bot.prefix}menu en cualquier chat para empezar.\n`);
    }

    if (connection === 'close') {
      const status = (lastDisconnect?.error as any)?.output?.statusCode;
      const reason = status ?? (lastDisconnect?.error as any)?.output?.statusCode ?? 'desconocido';
      if (status === DisconnectReason.loggedOut) {
        console.log('🚪 Sesión cerrada desde el teléfono. Borra la carpeta session/ para volver a vincular.');
        return;
      }
      console.log(`⚠️ Conexión cerrada (${reason}). Reconectando en 3s…`);
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => { reconnectTimer = null; codeRequested = false; start().catch(e => console.error('[RECONNECT]', e)); }, 3000);
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
}

async function main(): Promise<void> {
  const loaded = await loadCommands();
  banner(); // después de cargar, para que muestre el número real de comandos
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
