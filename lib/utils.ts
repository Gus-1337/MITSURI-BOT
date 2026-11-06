/** Utilidades de mensajes, JIDs y formato (compatibles con el fork baileys-beta). */
import { bot } from '../config.js';

/** Desenvuelve viewOnce / efímeros / documentos con caption. */
export function unwrap(message: any): any {
  let m = message;
  for (let i = 0; i < 5 && m; i++) {
    if (m.viewOnceMessage?.message) { m = m.viewOnceMessage.message; continue; }
    if (m.viewOnceMessageV2?.message) { m = m.viewOnceMessageV2.message; continue; }
    if (m.ephemeralMessage?.message) { m = m.ephemeralMessage.message; continue; }
    if (m.documentWithCaptionMessage?.message) { m = m.documentWithCaptionMessage.message; continue; }
    if (m.editedMessage?.message) { m = m.editedMessage.message; continue; }
    break;
  }
  return m ?? {};
}

/** Texto legible de cualquier tipo de mensaje. */
export function extractText(msg: any): string {
  const m = unwrap(msg?.message);
  return String(
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.stickerMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    m.interactiveResponseMessage?.body?.text ||
    ''
  );
}

/**
 * ID del botón/lista pulsado.
 * El fork devuelve nativeFlow en `interactiveResponseMessage.nativeFlowResponseMessage.paramsJson`,
 * pero también damos soporte a botones clásicos y listas.
 */
export function extractButtonId(msg: any): string | null {
  const m = unwrap(msg?.message);
  const interactive = m.interactiveResponseMessage;
  if (interactive?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const params = JSON.parse(interactive.nativeFlowResponseMessage.paramsJson);
      const id = params.id ?? params.selectedId ?? params.rowId ?? params.buttonId;
      if (typeof id === 'string' && id.trim()) return id.trim();
    } catch { /* paramsJson no es JSON */ }
  }
  const candidates = [
    m.buttonsResponseMessage?.selectedButtonId,
    m.listResponseMessage?.singleSelectReply?.selectedRowId,
    m.templateButtonReplyMessage?.selectedId,
    interactive?.body?.text,
  ];
  for (const c of candidates) if (typeof c === 'string' && c.trim()) return c.trim();
  return null;
}

/** JID real del que envió el mensaje (en grupos usa `participant`). */
export function getSenderJid(msg: any): string {
  const key = msg?.key ?? {};
  const raw = (msg?.participant || key.participantPn || key.senderPn || key.participant || key.remoteJid || '') as string;
  return normalizeJid(raw);
}

export function normalizeJid(jid: string): string {
  if (!jid) return '';
  const [user, server] = jid.split('@');
  if (!server) return jid;
  if (server === 'lid') return `${user}@s.whatsapp.net`; // comparación por número, no por LID
  if (server === 's.whatsapp.net') return `${user.split(':')[0]}@s.whatsapp.net`;
  return jid;
}

export function jidToNumber(jid: string): string { return (jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, ''); }
export function numberToJid(number: string): string { return `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`; }
export function isGroupJid(jid: string): boolean { return (jid || '').endsWith('@g.us'); }

export function isOwner(msg: any, senderJid: string): boolean {
  const number = jidToNumber(senderJid);
  // config.owner es un Set de números (varios dueños)
  const numbers: Set<string> | undefined = (bot.owner as any).numbers;
  if (numbers?.has(number)) return true;
  if (bot.owner.number && number === bot.owner.number) return true;
  return ((bot.owner.extraJids ?? []) as string[]).some((j: string) => jidToNumber(j) === number);
}

/** Menciones + contexto del mensaje. */
export function getContextInfo(msg: any): any {
  const m = unwrap(msg?.message);
  return m.extendedTextMessage?.contextInfo ||
    m.imageMessage?.contextInfo || m.videoMessage?.contextInfo ||
    m.documentMessage?.contextInfo || m.stickerMessage?.contextInfo ||
    m.audioMessage?.contextInfo || m.interactiveResponseMessage?.contextInfo || {};
}

export function getQuoted(msg: any): any {
  const ctx = getContextInfo(msg);
  if (!ctx?.quotedMessage) return null;
  return {
    key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant, fromMe: false },
    message: ctx.quotedMessage,
    pushName: '',
  };
}

export function getMentioned(msg: any): string[] {
  const ctx = getContextInfo(msg);
  return (ctx?.mentionedJid ?? []).map((j: string) => normalizeJid(j));
}

/** Tipo de media del mensaje citado. */
export function getMediaType(msg: any): string | null {
  const m = unwrap(msg?.message);
  const keys = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage', 'gifMessage'];
  for (const k of keys) if (m[k]) return k;
  return null;
}

export function mimetypeOf(type: string): string {
  return ({
    imageMessage: 'image/jpeg', videoMessage: 'video/mp4', audioMessage: 'audio/mpeg',
    stickerMessage: 'image/webp', documentMessage: 'application/octet-stream', gifMessage: 'video/mp4',
  } as Record<string, string>)[type] || 'application/octet-stream';
}

export function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${sec}s`].filter(Boolean).join(' ');
}

export function formatNumber(n: number): string { return Number(n || 0).toLocaleString('es-PE'); }
export function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
export function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function truncate(text: string, max: number): string { return text.length > max ? `${text.slice(0, max - 3)}…` : text; }
export function capitalize(text: string): string { return text.charAt(0).toUpperCase() + text.slice(1); }
export function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
export function extractUrl(text: string): string | null {
  const match = String(text || '').match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}
export function isValidNumber(n: string): boolean { return /^\d{8,15}$/.test(n); }
export function now(): number { return Date.now(); }
export function dayPassed(timestamp: number): boolean { return Date.now() - timestamp >= 24 * 60 * 60 * 1000; }
