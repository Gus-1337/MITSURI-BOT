/**
 * Cliente de APIs.
 * - Lee las URLs, claves y endpoints desde config.ts (un solo lugar).
 * - Prueba los proveedores en orden hasta que uno responda bien (fallback).
 * - Normaliza respuestas binarias (imagen/audio/video) y JSON.
 * - Extrae texto o URL de media de JSONs con formas distintas (las 3 APIs
 *   devuelven esquemas diferentes: data, result, response, download…).
 */
import axios from 'axios';
import { apis, endpoints, limits } from '../config.js';
import type { ApiName, EndpointDef, EndpointProvider } from './config-types.js';

export interface ApiAttempt {
  provider: ApiName;
  url: string;
  error: string;
}

export interface ApiResult {
  ok: boolean;
  endpoint: string;
  provider: ApiName;
  providerLabel: string;
  url: string;
  status: number;
  contentType: string;
  json?: any;
  buffer?: Buffer;
  attempts: ApiAttempt[];
}

export class ApiError extends Error {
  constructor(message: string, public attempts: ApiAttempt[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Sustituye `{nombre}` por el valor del parámetro. */
function interpolate(template: string, params: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key) => {
    const v = params[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

/**
 * Atajo plano del config:  'stellar:/tools/brat?text={text}'
 * → { api:'stellar', path:'/tools/brat', query:{ text:'{text}' } }
 * Así añadir un endpoint es una sola línea en config.ts.
 */
export function parseProvider(raw: string): EndpointProvider | null {
  const match = raw.match(/^([a-zA-Z0-9_-]+):(\/.*)$/);
  if (!match) return null;
  const [, api, rest] = match;
  const [path, qs] = rest.split('?');
  const query: Record<string, string> = {};
  if (qs) {
    for (const piece of qs.split('&')) {
      if (!piece) continue;
      const [key, value = ''] = piece.split('=');
      try { query[key] = decodeURIComponent(value); } catch { query[key] = value; }
    }
  }
  return { api, path, query };
}

export function providersOf(def: string[] | EndpointDef): EndpointProvider[] {
  if (Array.isArray(def)) return def.map(parseProvider).filter((p): p is EndpointProvider => !!p);
  return def.providers ?? [];
}

function buildUrl(provider: EndpointProvider, params: Record<string, any>): string | null {
  const cfg = apis[provider.api];
  if (!cfg?.enabled) return null;
  const path = interpolate(provider.path, params);
  if (path.includes('{')) return null; // faltó un parámetro obligatorio

  const url = new URL(cfg.baseUrl);
  url.pathname = path.startsWith('/') ? path : `/${path}`;

  const query = { ...(provider.fixed ?? {}), ...(provider.query ?? {}) };
  for (const [key, raw] of Object.entries(query)) {
    const value = interpolate(String(raw), params);
    if (!value || value.includes('{')) continue;
    url.searchParams.set(key, value);
  }
  if (cfg.key && cfg.keyParam) url.searchParams.set(cfg.keyParam, cfg.key);
  return url.toString();
}

/** Devuelve true cuando el JSON indica error de negocio (aunque el HTTP sea 200). */
function isFailure(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.status === false || payload.ok === false || payload.success === false || payload.error === true || payload.isError === true) return true;
  if ([400, 401, 403, 429, 500].includes(Number(payload.code))) return true;
  if (typeof payload.data === 'string' && /^error\s*:/i.test(payload.data)) return true;
  if (typeof payload.msg === 'string' && /^error\s*:/i.test(payload.msg)) return true;
  return false;
}

/**
 * Llama a un endpoint lógico de config.ts.
 *   await callEndpoint('download.ytmp3', { url })
 * Prueba cada proveedor en orden; lanza ApiError si todos fallan.
 */
export async function callEndpoint(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
): Promise<ApiResult> {
  const def: string[] | EndpointDef | undefined = endpoints[endpoint];
  if (!def) throw new ApiError(`El endpoint "${endpoint}" no existe en config.ts`);
  const providers = providersOf(def);
  const defTimeout = Array.isArray(def) ? undefined : def.timeoutMs;

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) clean[k] = v;

  const attempts: ApiAttempt[] = [];
  for (const provider of providers) {
    const cfg = apis[provider.api];
    const url = buildUrl(provider, clean);
    if (!url) {
      attempts.push({ provider: provider.api, url: '(sin url)', error: `API desactivada o faltan parámetros (${provider.path})` });
      continue;
    }
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: defTimeout ?? cfg?.timeoutMs ?? 30_000,
        validateStatus: () => true,
        maxContentLength: limits.maxMediaBytes * 2,
        maxBodyLength: limits.maxMediaBytes * 2,
        headers: { 'User-Agent': 'MITSURI-MD/1.0 (+https://github.com/Gus-1337/MITSURI-BOT)', Accept: '*/*' },
      });
      const contentType = String(response.headers['content-type'] || 'application/octet-stream');
      const buffer = Buffer.from(response.data ?? []);
      if (response.status < 200 || response.status >= 300) {
        attempts.push({ provider: provider.api, url, error: `HTTP ${response.status}` });
        continue;
      }
      let json: any;
      if (/json|text\/plain/i.test(contentType)) {
        try { json = JSON.parse(buffer.toString('utf8')); } catch { /* binario con content-type raro */ }
      }
      if (isFailure(json)) {
        attempts.push({ provider: provider.api, url, error: String(json?.message ?? json?.msg ?? json?.data ?? 'respuesta con status:false').slice(0, 160) });
        continue;
      }
      return {
        ok: true,
        endpoint,
        provider: provider.api,
        providerLabel: cfg?.label ?? provider.api,
        url,
        status: response.status,
        contentType,
        json,
        buffer: json ? undefined : buffer,
        attempts,
      };
    } catch (error: any) {
      attempts.push({ provider: provider.api, url, error: String(error?.message ?? error).slice(0, 160) });
    }
  }
  throw new ApiError(
    `Ninguna API respondió para *${endpoint}*. Probadas: ${attempts.map(a => `${a.provider} (${a.error})`).join(' | ') || 'ninguna'}`,
    attempts,
  );
}

/* ─────────────────── Extracción de datos de JSON ─────────────────── */

/** Todas en minúsculas: las claves del JSON se comparan con toLowerCase(). */
const TEXT_KEYS = [
  'response', 'answer', 'respuesta', 'resultado', 'reply', 'text', 'message', 'msg',
  'content', 'translation', 'translated', 'traduccion', 'shorturl', 'short_url',
  'lyrics', 'letra', 'description', 'title', 'data', 'result', 'output',
];
const MEDIA_KEYS = [
  'download', 'downloadurl', 'download_url', 'direct', 'directurl', 'media', 'mediaurl',
  'mp3', 'mp4', 'video', 'audio', 'image', 'url', 'link', 'thumbnail', 'result', 'data',
];
/** Metadatos que nunca deben presentarse como "respuesta" al usuario. */
const NOISE_KEYS = new Set([
  'creator', 'status', 'code', 'service', 'api', 'provider', 'type', 'format',
  'mimetype', 'filename', 'id', 'version', 'author', 'channel', 'copyright',
]);

type Found = { key: string; path: string; value: string; depth: number };

function walk(value: any, path = '', depth = 0, out: Found[] = []): Found[] {
  if (depth > 6 || out.length > 400) return out;
  if (typeof value === 'string') {
    const key = path.split('.').pop() || '';
    out.push({ key, path, value, depth });
    return out;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < Math.min(value.length, 30); i++) walk(value[i], `${path}[${i}]`, depth + 1, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, depth + 1, out);
  }
  return out;
}

/** Lee un valor por ruta tipo "data.download". */
export function getPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/** Primer texto útil de un JSON de IA / traductor / acortador / clima… */
export function pickText(json: any): string {
  if (typeof json === 'string') return json;
  if (!json || typeof json !== 'object') return '';
  const found = walk(json).filter(f => typeof f.value === 'string' && f.value.trim().length > 0);
  const isUrl = (s: string) => /^https?:\/\//i.test(s);
  const score = (f: Found) => {
    const key = f.key.toLowerCase();
    let s = 0;
    const idx = TEXT_KEYS.indexOf(key);
    if (idx >= 0) s += (TEXT_KEYS.length - idx) * 2;
    if (!isUrl(f.value)) s += 12; else s -= 25;
    if (NOISE_KEYS.has(key)) s -= 40;
    if (/^(true|false|success|ok)$/i.test(f.value)) s -= 40;
    if (f.value.length > 20) s += 5;
    if (f.depth <= 2) s += 3;
    if (/^error/i.test(f.value)) s -= 50;
    return s;
  };
  const best = found.sort((a, b) => score(b) - score(a))[0];
  return best ? best.value.trim() : '';
}

/** Primera URL de media (mp3/mp4/imagen) presente en un JSON. */
export function pickMediaUrl(json: any, prefer?: 'audio' | 'video' | 'image'): string | undefined {
  if (typeof json === 'string') return /^https?:\/\//i.test(json) ? json : undefined;
  if (!json || typeof json !== 'object') return undefined;
  const urls = walk(json).filter(f => /^https?:\/\/\S+$/i.test(f.value.trim()));
  const ext = (s: string) => {
    const u = s.toLowerCase();
    if (/\.(mp3|m4a|ogg|wav|flac|aac)(\?|$)/.test(u)) return 'audio';
    if (/\.(mp4|webm|mkv|mov|gif)(\?|$)/.test(u)) return 'video';
    if (/\.(jpg|jpeg|png|webp|avif|gif)(\?|$)/.test(u)) return 'image';
    return '';
  };
  const score = (f: Found) => {
    let s = 0;
    const idx = MEDIA_KEYS.indexOf(f.key.toLowerCase());
    if (idx >= 0) s += (MEDIA_KEYS.length - idx) * 2;
    if (f.key.toLowerCase() === 'download') s += 40;
    const kind = ext(f.value);
    if (kind) s += 12;
    if (prefer && kind === prefer) s += 25;
    if (/savetube|cdn|urlbox|delirius|ryuzei|stellar|files?\./i.test(f.value)) s += 6;
    if (f.depth <= 2) s += 3;
    if (/github\.com|youtube\.com\/watch|spotify\.com\/track|instagram\.com\/p\//i.test(f.value)) s -= 10;
    return s;
  };
  return urls.sort((a, b) => score(b) - score(a))[0]?.value.trim();
}

/** Descarga una URL externa como Buffer con límite de tamaño. */
export async function fetchUrlBuffer(url: string, maxBytes = limits.maxMediaBytes): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 45_000,
    maxContentLength: maxBytes,
    maxBodyLength: maxBytes,
    validateStatus: () => true,
    headers: { 'User-Agent': 'MITSURI-MD/1.0', Accept: '*/*' },
  });
  if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status} al descargar ${url}`);
  return {
    buffer: Buffer.from(response.data),
    contentType: String(response.headers['content-type'] || 'application/octet-stream'),
  };
}

/** Convierte un array de resultados de búsqueda en texto legible para WhatsApp. */
export function formatResults(json: any, limit = 8): string {
  const rows: any[] =
    Array.isArray(json) ? json :
    Array.isArray(json?.data) ? json.data :
    Array.isArray(json?.result) ? json.result :
    Array.isArray(json?.results) ? json.results :
    Array.isArray(json?.data?.videos) ? json.data.videos : [];
  if (!rows.length) return pickText(json) || JSON.stringify(json?.data ?? json ?? {}).slice(0, 1200);
  return rows.slice(0, limit).map((row: any, i: number) => {
    if (typeof row === 'string') return `│ ${i + 1}. ${row}`;
    const title = row.title ?? row.name ?? row.song ?? row.track ?? row.word ?? row.username ?? row.query ?? '—';
    const extra = row.author ?? row.channel ?? row.artist ?? row.duration ?? row.views ?? row.description ?? row.subtitle ?? '';
    const link = row.url ?? row.link ?? row.download ?? '';
    return `│ ${i + 1}. *${String(title).slice(0, 70)}*${extra ? `\n│     ${String(extra).slice(0, 70)}` : ''}${link ? `\n│     ${String(link).slice(0, 100)}` : ''}`;
  }).join('\n');
}

/** Texto plano de un JSON cualquiera (para comandos de información). */
export function prettyJson(json: any, maxLength = 1500): string {
  const data = json?.data ?? json?.result ?? json;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return formatResults(json);
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .slice(0, 25)
      .map(([k, v]) => `│ *${k}:* ${typeof v === 'object' ? JSON.stringify(v).slice(0, 160) : String(v).slice(0, 220)}`)
      .join('\n');
  }
  return String(data ?? '').slice(0, maxLength);
}
