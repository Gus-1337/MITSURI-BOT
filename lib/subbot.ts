/**
 * Gestor de Sub-Bots (Multi-Device real).
 * Cada sub-bot tiene su propia sesión en sessions/sub/<numero>/ y su propio
 * socket de Baileys; comparte el handler y todos los comandos del bot.
 * La vinculación se hace con código de emparejamiento (sin QR).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import * as db from './db.js';
import type { Message, Socket } from './types.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logger = pino({ level: 'silent' });

interface SubEntry { sock: Socket; number: string; startedAt: number }
const subs = new Map<string, SubEntry>();

type SubHandler = (sock: Socket, msg: Message) => void;
let messageHandler: SubHandler = () => {};

export function setSubMessageHandler(fn: SubHandler): void { messageHandler = fn; }

function authDir(number: string): string {
  return path.join(ROOT, 'sessions', 'sub', number);
}

/** Crea un socket nuevo para un número. Si `withCode` es true devuelve el código de vinculación. */
async function boot(number: string, withCode: boolean): Promise<string | null> {
  const { state, saveCreds } = await useMultiFileAuthState(authDir(number));
  const sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    printQRInTerminal: false,
  } as any);
  subs.set(number, { sock, number, startedAt: Date.now() });
  sock.ev.on('creds.update', saveCreds);

  let codePromise: Promise<string | null> = Promise.resolve(null);
  if (withCode) {
    codePromise = new Promise<string>((resolve, reject) => {
      let requested = false;
      const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado pidiendo el código de vinculación.')), 20_000);
      const onUpdate = async (update: any) => {
        if (!requested && (update.connection === 'connecting' || update.qr)) {
          requested = true;
          try {
            const code = await sock.requestPairingCode(number);
            clearTimeout(timer);
            resolve(code);
          } catch (error) { clearTimeout(timer); reject(error); }
        }
      };
      sock.ev.on('connection.update', onUpdate);
    });
  }

  sock.ev.on('connection.update', (update: any) => {
    if (update.connection === 'open') {
      console.log(`[SUBBOT] +${number} conectado ✅`);
      db.addSub(number);
    }
    if (update.connection === 'close') {
      const status = (update.lastDisconnect?.error as any)?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        subs.delete(number);
        db.removeSub(number);
        console.log(`[SUBBOT] +${number} cerró sesión.`);
      } else {
        console.log(`[SUBBOT] +${number} reconectando…`);
        setTimeout(() => {
          if (subs.has(number)) boot(number, false).catch(e => console.error('[SUBBOT] reconexión fallida:', e?.message));
        }, 3000).unref?.();
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }: any) => {
    if (type !== 'notify') return;
    for (const msg of messages ?? []) {
      try { messageHandler(sock, msg); } catch (error) { console.error('[SUBBOT] handler:', error); }
    }
  });

  return codePromise;
}

/** Pide un código de vinculación para un número nuevo. */
export async function createSub(number: string): Promise<string> {
  if (subs.has(number)) throw new Error(`El sub-bot +${number} ya está en marcha.`);
  const code = await boot(number, true);
  if (!code) throw new Error('No se pudo generar el código.');
  return code;
}

/** Reconecta los sub-bots guardados al arrancar el bot (sesiones ya vinculadas). */
export async function restoreSubs(): Promise<number> {
  const numbers = db.listSubs();
  for (const number of numbers) {
    if (fs.existsSync(path.join(authDir(number), 'creds.json'))) {
      try { await boot(number, false); } catch (error) { console.error(`[SUBBOT] +${number}:`, error); }
    } else {
      db.removeSub(number);
    }
  }
  return subs.size;
}

export async function stopSub(number: string): Promise<boolean> {
  const entry = subs.get(number);
  if (!entry) return false;
  try { await entry.sock.logout?.(); } catch { /* puede fallar si no hay red */ }
  try { entry.sock.end?.(new Error('detenido por el dueño')); } catch { /* noop */ }
  subs.delete(number);
  db.removeSub(number);
  return true;
}

export function listSubs(): { number: string; startedAt: number }[] {
  return [...subs.values()].map(s => ({ number: s.number, startedAt: s.startedAt }));
}

export function subCount(): number { return subs.size; }
