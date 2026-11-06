/**
 * Ayudantes de respuesta. Construyen los métodos del CommandContext:
 * reply / replyImage / replyDocument / replyButtons / sendApiResult.
 * Todas las salidas pasan por aquí para tener un comportamiento uniforme
 * (citas, límites de texto, fallback de media, etc.).
 */
import fs from 'node:fs/promises';
import pino from 'pino';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { limits, theme } from '../config.js';
import { sendButtons } from './buttons.js';
import { fetchUrlBuffer, pickMediaUrl, pickText, prettyJson, type ApiResult } from './api.js';
import { getMediaType, getQuoted, mimetypeOf, truncate } from './utils.js';
import type { ButtonsOptions, Message, ReplyOptions, Socket } from './types.js';

const logger = pino({ level: 'silent' });

export interface Responder { sock: Socket; jid: string; msg: Message }

export function quotedOptions(r: Responder, opts?: ReplyOptions | boolean): any {
  if (opts === false) return {};
  const quoted = typeof opts === 'object' ? (opts.quoted === false ? null : (opts.quoted || r.msg)) : r.msg;
  const mentions = typeof opts === 'object' ? opts.mentions : undefined;
  return { ...(quoted ? { quoted } : {}), ...(mentions?.length ? { mentions } : {}) };
}

export async function reply(r: Responder, text: string, opts: ReplyOptions = {}): Promise<any> {
  return r.sock.sendMessage(r.jid, { text: truncate(String(text), limits.maxTextLength) }, quotedOptions(r, opts));
}

/** Acepta URL http(s), ruta local o Buffer y lo convierte a Buffer. */
export async function resolveMedia(input: string | Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  if (Buffer.isBuffer(input)) return { buffer: input, contentType: 'application/octet-stream' };
  if (/^https?:\/\//i.test(input)) return fetchUrlBuffer(input);
  if (input.startsWith('data:')) {
    const [, b64] = input.split(',');
    return { buffer: Buffer.from(b64, 'base64'), contentType: input.slice(5, input.indexOf(';')) };
  }
  const buffer = await fs.readFile(input);
  const ct = input.endsWith('.png') ? 'image/png' : input.endsWith('.webp') ? 'image/webp' : input.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
  return { buffer, contentType: ct };
}

export async function replyImage(r: Responder, image: string | Buffer, caption = '', opts: ReplyOptions = {}): Promise<any> {
  const { buffer } = await resolveMedia(image);
  return r.sock.sendMessage(r.jid, { image: buffer, caption: caption || undefined }, quotedOptions(r, opts));
}

export async function replyDocument(
  r: Responder, doc: string | Buffer, fileName: string, mimetype: string, caption = '', opts: ReplyOptions = {},
): Promise<any> {
  const { buffer } = await resolveMedia(doc);
  return r.sock.sendMessage(r.jid, { document: buffer, fileName, mimetype, caption: caption || undefined }, quotedOptions(r, opts));
}

export async function replyButtons(r: Responder, opts: ButtonsOptions): Promise<any> {
  return sendButtons(r.sock, r.jid, {
    ...opts,
    quoted: opts.quoted === false ? false : (opts.quoted || r.msg),
    footer: opts.footer || theme.footer,
  });
}

export async function react(r: Responder, emoji: string): Promise<any> {
  try { return await r.sock.sendMessage(r.jid, { react: { key: r.msg.key, text: emoji } }); } catch { return null; }
}

function guessKind(contentType: string, url: string): 'image' | 'video' | 'audio' | 'document' {
  const ct = contentType.toLowerCase();
  const u = url.toLowerCase();
  if (/image\//.test(ct) || /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/.test(u)) return 'image';
  if (/video\//.test(ct) || /\.(mp4|webm|mkv|mov)(\?|$)/.test(u)) return 'video';
  if (/audio\//.test(ct) || /\.(mp3|m4a|ogg|wav|flac|aac)(\?|$)/.test(u)) return 'audio';
  return 'document';
}

/** Envía un Buffer según su tipo, con o sin caption. */
export async function sendBuffer(
  r: Responder, buffer: Buffer, contentType: string, url: string,
  opts: { caption?: string; as?: 'image' | 'video' | 'audio' | 'document' | 'text'; fileName?: string } = {},
): Promise<any> {
  const q = quotedOptions(r);
  const kind = opts.as && opts.as !== 'text' ? opts.as : guessKind(contentType, url);
  const caption = opts.caption;
  const fileName = opts.fileName || `mitsuri-${Date.now()}.${kind === 'audio' ? 'mp3' : kind === 'video' ? 'mp4' : kind === 'image' ? 'jpg' : 'bin'}`;
  try {
    if (kind === 'image') return await r.sock.sendMessage(r.jid, { image: buffer, caption }, q);
    if (kind === 'video') return await r.sock.sendMessage(r.jid, { video: buffer, caption, mimetype: 'video/mp4' }, q);
    if (kind === 'audio') return await r.sock.sendMessage(r.jid, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, q);
    return await r.sock.sendMessage(r.jid, { document: buffer, mimetype: 'application/octet-stream', fileName, caption }, q);
  } catch (error) {
    // Algunos MP3/MP4 no son reproducibles: se mandan como documento.
    console.warn('[MEDIA] Reenvío como documento:', (error as Error)?.message);
    return r.sock.sendMessage(r.jid, { document: buffer, mimetype: 'application/octet-stream', fileName, caption }, q);
  }
}

/**
 * Convierte la respuesta de una API en un mensaje de WhatsApp.
 * - Binario (imagen/audio/video) → se envía directo.
 * - JSON con URL de media → se descarga y se envía.
 * - JSON de texto/IA/búsqueda → se formatea y se envía como texto.
 */
export async function sendApiResult(
  r: Responder, result: ApiResult,
  opts: { caption?: string; as?: 'image' | 'video' | 'audio' | 'document' | 'text'; fileName?: string } = {},
): Promise<any> {
  if (result.buffer?.length) {
    return sendBuffer(r, result.buffer, result.contentType, result.url, opts);
  }
  const json = result.json;
  if (opts.as !== 'text') {
    const mediaUrl = pickMediaUrl(json, opts.as === 'audio' ? 'audio' : opts.as === 'video' ? 'video' : opts.as === 'image' ? 'image' : undefined);
    if (mediaUrl) {
      try {
        const { buffer, contentType } = await fetchUrlBuffer(mediaUrl);
        return await sendBuffer(r, buffer, contentType, mediaUrl, opts);
      } catch (error) {
        console.warn('[MEDIA] No se pudo descargar el resultado, envío el enlace:', (error as Error)?.message);
        return reply(r, `${opts.caption ? `${opts.caption}\n\n` : ''}🔗 ${mediaUrl}`);
      }
    }
  }
  const text = pickText(json) || prettyJson(json);
  const header = opts.caption ? `${opts.caption}\n\n` : '';
  if (!text) return reply(r, `${header}⚠️ La API respondió, pero no devolvió datos utilizables.\n_Proveedor: ${result.providerLabel}_`);
  return reply(r, `${header}${text}\n\n_· ${result.providerLabel}_`);
}

/** Descarga la media citada por el usuario (imagen, video, audio, sticker). */
export async function downloadQuoted(r: Responder): Promise<{ buffer: Buffer; mimetype: string; type: string } | null> {
  const quoted = getQuoted(r.msg);
  const type = quoted ? getMediaType(quoted) : null;
  if (!quoted || !type) return null;
  try {
    const buffer = await downloadMediaMessage(quoted as any, 'buffer', {}, {
      logger, reuploadRequest: r.sock.updateMediaMessage,
    } as any) as unknown as Buffer;
    return { buffer, mimetype: mimetypeOf(type), type };
  } catch (error) {
    console.warn('[MEDIA] No se pudo descargar la media citada:', (error as Error)?.message);
    return null;
  }
}

export default { reply, replyImage, replyDocument, replyButtons, react, sendApiResult, sendBuffer, resolveMedia, downloadQuoted };
