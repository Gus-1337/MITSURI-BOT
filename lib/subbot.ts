/**
 * Gestor de Sub-Bots (Multi-Device real).
 * Cada sub-bot tiene su propia sesión en sessions/sub/<numero>/ y su propio
 * socket de Baileys; comparte el handler y todos los comandos del bot.
 * Usa la misma versión de WA Web y el mismo flujo de código que el bot principal.
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from '@whiskeysockets/baileys';
import * as db from './db.js';
import { pedirCodigoVinculacion } from './pairing.js';
import type { Message, Socket } from './types.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });
const MAX_SUBBOTS = Math.max(1, Number(process.env.MAX_SUBBOTS) || 40);
const httpAgent = new https.Agent({ keepAlive: true, maxSockets: 100, keepAliveMsecs: 15000, scheduling: 'fifo' });

interface SubEntry { sock: Socket; number: string; startedAt: number }
const subs = new Map<string, SubEntry>();

type SubHandler = (sock: Socket, msg: Message) => void;
let messageHandler: SubHandler = () => {};
let waVersion: number[] | undefined;

export function setSubMessageHandler(fn: SubHandler): void { messageHandler = fn; }
export function setSubWaVersion(version: number[] | undefined): void { waVersion = version; }
export function subLimit(): number { return MAX_SUBBOTS; }

async function ensureVersion(): Promise<number[] | undefined> {
  if (waVersion) return waVersion;
  try {
    const r = await fetchLatestBaileysVersion();
    waVersion = r.version;
  } catch {
    waVersion = undefined;
  }
  return waVersion;
}

function authDir(number: string): string {
  return path.join(ROOT, 'sessions', 'sub', number);
}

/** Crea un socket nuevo para un número. Si `withCode` es true devuelve el código de vinculación. */
async function boot(number: string, withCode: boolean): Promise<string | null> {
  const version = await ensureVersion();
  const { state, saveCreds } = await useMultiFileAuthState(authDir(number));
  const sock = makeWASocket({
    logger,
    printQRInTerminal: false,
    version: (version || undefined) as any,
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

  subs.set(number, { sock, number, startedAt: Date.now() });
  sock.ev.on('creds.update', saveCreds);

  let codePromise: Promise<string | null> = Promise.resolve(null);
  if (withCode) {
    codePromise = new Promise<string>((resolve, reject) => {
      let lanzado = false;
      const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado pidiendo el código de vinculación.')), 30_000);
      timer.unref?.();
      const pedir = (): void => {
        if (lanzado) return;
        lanzado = true;
        void pedirCodigoVinculacion({
          sock,
          numero: number,
          intentos: 12,
          esperaMs: 1000,
          onCode: (code: string) => { clearTimeout(timer); resolve(code); },
          onError: (mensaje: string) => { clearTimeout(timer); reject(new Error(mensaje)); },
        });
      };
      sock.ev.on('connection.update', (u: any) => { if (u.qr) pedir(); });
      setTimeout(pedir, 3000).unref?.();
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
        console.log(`[SUBBOT] +${number} reconectando (${status ?? '?'})…`);
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
  if (subs.size >= MAX_SUBBOTS) {
    throw new Error(`Límite de ${MAX_SUBBOTS} sub-bots activos (${subs.size}/${MAX_SUBBOTS}). Sube MAX_SUBBOTS en .env o reparte en varios procesos.`);
  }
  try {
    const code = await boot(number, true);
    if (!code) throw new Error('No se pudo generar el código.');
    return code;
  } catch (error) {
    subs.delete(number);
    throw error;
  }
}

/** Reconecta los sub-bots guardados al arrancar el bot (sesiones ya vinculadas). */
export async function restoreSubs(): Promise<number> {
  const numbers = db.listSubs();
  for (const number of numbers) {
    if (subs.size >= MAX_SUBBOTS) {
      console.warn(`[SUBBOT] Límite ${MAX_SUBBOTS} alcanzado: +${number} queda sin iniciar.`);
      continue;
    }
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
