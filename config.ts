import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { mountConfig } from './lib/config-engine.js';
import type { EndpointDef } from './lib/config-types.js';

export type { ApiConfig, ApiName, EndpointDef, EndpointProvider, CategoryConfig } from './lib/config-types.js';

const ownerNumbers = new Set([
  '51926519334',
  '51986425908',
  '5491128178894',
]);

if (process.env.OWNER_NUMBER) ownerNumbers.add(process.env.OWNER_NUMBER.replace(/[^0-9]/g, ''));

global.api = {
  url: 'https://api.stellarwa.xyz',
  key: process.env.STELLAR_API_KEY || 'proyectsV2',
};

global.APIs = {
  melody:     { url: 'https://api.melodiaauris.qzz.io', key: 'OguriCap-Bot' },
  anabot:     { url: 'https://anabot.my.id', key: 'freeApikey' },
  delirius:   { url: 'https://api.delirius.online', key: null },
  stellar:    { url: 'https://api.stellarwa.xyz', key: process.env.STELLAR_API_KEY || 'proyectsV2' },
  siputzx:    { url: 'https://api.siputzx.my.id', key: null },
  evogb:      { url: 'https://api.evogb.org', key: process.env.EVOGB_KEY || 'putostodos' },
  yosoyyo:    { url: 'https://api-yosoyyo-api-ofc.onrender.com', key: process.env.YOSOYYO_KEY || null },
  starlights: { url: 'https://apis-starlights-team.koyeb.app/starlight', key: null },
  popcat:     { url: 'https://api.popcat.xyz/v2', key: null },
};

declare global {
  var api: { url: string; key: string | null };
  var APIs: Record<string, { url: string; key: string | null }>;
}

export const config = {
  botName: process.env.BOT_NAME || 'MITSURI-MD',
  devName: process.env.OWNER_NAME || 'GUS',
  prefix: process.env.BOT_PREFIX || '.',
  owner: ownerNumbers,
  banner: 'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
  icon: 'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
  coin: 'coins',

  api: {
    url: 'https://api.stellarwa.xyz',
    key: process.env.STELLAR_API_KEY || 'proyectsV2',
  },

  banners: {
    main:      'https://cdn.dix.lat/me/g31n_20260927-c91x-glg3-4178.jpg',
    info:      'https://cdn.dix.lat/me/h7xu_20260927-c91x-2x9p-d0ab.jpg',
    download:  'https://cdn.dix.lat/me/c8a7_20260927-c91x-xs62-7697.jpg',
    profile:   'https://cdn.dix.lat/me/ellu_20260927-c91x-gnxo-633a.png',
    admin:     'https://u.pone.rs/djdhfkyy.jpg',
    stickers:  'https://u.pone.rs/djdhfkyy.jpg',
    tools:     'https://u.pone.rs/djdhfkyy.jpg',
    utils:     'https://u.pone.rs/djdhfkyy.jpg',
    fun:       'https://u.pone.rs/djdhfkyy.jpg',
    game:      'https://u.pone.rs/djdhfkyy.jpg',
    economy:   'https://u.pone.rs/djdhfkyy.jpg',
    gacha:     'https://u.pone.rs/djdhfkyy.jpg',
    anime:     'https://u.pone.rs/djdhfkyy.jpg',
    nsfw:      'https://u.pone.rs/djdhfkyy.jpg',
    otros:     'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
    logo:      'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
    ia:        'https://cdn.dix.lat/me/h7xu_20260927-c91x-2x9p-d0ab.jpg',
    owner:     'https://cdn.dix.lat/me/g31n_20260927-c91x-glg3-4178.jpg',
    subbot:    'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
    perfil:    'https://cdn.dix.lat/me/ellu_20260927-c91x-gnxo-633a.png',
    logomaker: 'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
  },

  links: {
    default:  'https://github.com/Gus-1337/MITSURI-BOT',
    download: 'https://api.delirius.online/download',
    tools:    'https://api.delirius.online/tools',
    utils:    'https://api.delirius.online/tools',
    logo:     'https://api.delirius.online/canvas',
    anime:    'https://api.delirius.online/anime',
    ia:       'https://api.stellarwa.xyz/home#endpoints',
  },

  mode: (process.env.BOT_MODE || 'public') as 'public' | 'private' | 'groups',
  auth: (process.env.AUTH_METHOD || 'qr') as 'qr' | 'code',
  pairingCode: process.env.PAIRING_CODE || '',
  menuStyle: (process.env.MENU_STYLE || 'list') as 'list' | 'buttons' | 'text',
  cooldown: 3,
  autoReact: '🌸',
  timezone: 'America/Lima',
  sessionDir: process.env.SESSION_DIR || './session',
  rejectCalls: true,
  handleFromMe: true,
  ignoreOldMessagesSeconds: 90,
  maxMediaBytes: 30 * 1024 * 1024,
  xpPerMessage: 2,
  xpPerLevel: 100,
  workMin: 50,
  workMax: 250,
  dailyReward: 500,
  nsfwEnabled: false,
};

export const endpoints: Record<string, string[] | EndpointDef> = {
  'anime.waifu':       ['delirius:/anime/waifu', 'delirius:/anime/neko', 'stellar:/anime/waifu'],
  'anime.neko':        ['delirius:/anime/neko'],
  'anime.foxgirl':     ['delirius:/anime/foxgirl'],
  'anime.interaction': ['delirius:/reactions/{text}', 'stellar:/sfw/interaction?type={text}'],
  'anime.info':        ['delirius:/anime/animeinfo?query={text}', 'delirius:/search/anilist?q={text}'],

  'download.ytmp3':      ['delirius:/download/ytmp3?url={url}', 'stellar:/dl/ytmp3?url={url}'],
  'download.ytmp4':      ['delirius:/download/ytmp4?url={url}&format=360p', 'stellar:/dl/ytmp4?url={url}'],
  'download.tiktok':     ['delirius:/download/tiktok?url={url}', 'stellar:/dl/tiktok?url={url}'],
  'download.instagram':  ['delirius:/download/instagram?url={url}', 'stellar:/dl/instagram?url={url}'],
  'download.spotify':    ['delirius:/download/spotifydl?url={url}', 'stellar:/dl/spotify?url={url}'],
  'download.facebook':   ['delirius:/download/facebook?url={url}', 'stellar:/dl/facebook?url={url}'],
  'download.twitter':    ['delirius:/download/twitter?url={url}', 'stellar:/dl/twitter?url={url}'],
  'download.mediafire':  ['delirius:/download/mediafire?url={url}', 'stellar:/dl/mediafire?url={url}'],
  'download.soundcloud': ['delirius:/download/soundcloud?url={url}', 'stellar:/dl/soundcloud?url={url}'],
  'download.gitclone':   ['delirius:/download/gitclone?url={url}'],

  'search.youtube':   ['delirius:/search/ytsearch?q={text}', 'siputzx:/api/s/youtube?query={text}'],
  'search.spotify':   ['delirius:/search/spotify?q={text}&limit=5'],
  'search.lyrics':    ['delirius:/search/lyrics?query={text}'],
  'search.pinterest': ['delirius:/search/pinterest?text={text}'],
  'search.npm':       ['delirius:/search/npm?q={text}&limit=3', 'stellar:/tools/npmjs?q={text}'],
  'search.wiki':      ['delirius:/search/wiki?q={text}&language=es'],
  'search.playstore': ['delirius:/search/playstore?q={text}&limit=5&lang=es'],

  'ia.chatgpt':  ['stellar:/ai/chatgpt?text={text}', 'delirius:/ia/chatgpt?q={text}'],
  'ia.gemini':   ['delirius:/ia/gemini?query={text}', 'stellar:/ai/chatgpt?text={text}'],
  'ia.deepseek': ['stellar:/ai/chatgpt?text={text}', 'delirius:/ia/chatgpt?q={text}'],
  'ia.llama':    ['stellar:/ai/chatgpt?text={text}', 'delirius:/ia/chatgpt?q={text}'],

  'canvas.brat':        ['stellar:/tools/brat?text={text}', 'delirius:/canvas/brat?text={text}'],
  'canvas.ttp':         ['delirius:/canvas/ttp?text={text}'],
  'canvas.attp':        ['delirius:/canvas/attp?text={text}'],
  'canvas.ephoto':      ['delirius:/tools/ephoto?effect={effect}&text={text}'],
  'canvas.createqr':    ['delirius:/canvas/createqr?text={text}'],
  'canvas.quotly':      ['delirius:/canvas/quotly?image={image}&username={name}&text={text}', 'stellar:/tools/quotesticker?text={text}'],
  'canvas.emojimix':    ['delirius:/tools/mixed?emoji1={emoji1}&emoji2={emoji2}', 'stellar:/tools/emojimix?emoji1={emoji1}&emoji2={emoji2}'],
  'canvas.ship':        ['delirius:/canvas/ship?image1={image1}&image2={image2}&name1={name1}&name2={name2}&percentage={percentage}&text={text}'],
  'canvas.book':        ['delirius:/canvas/book?text={text}&footer={footer}'],
  'canvas.bratvideo':   ['delirius:/canvas/bratvideo?text={text}'],

  'tools.translate':  ['popcat:/v2/translate?text={text}&to={language}', 'delirius:/tools/translate?text={text}&language={language}'],
  'tools.ssweb':      ['delirius:/tools/ssweb?url={url}', 'stellar:/tools/ssweb?url={url}'],
  'tools.short':      ['stellar:/short/tinyurl?url={url}', 'delirius:/shorten/tinyurl?url={url}'],
  'tools.github':     ['stellar:/stalking/github?username={text}'],
  'tools.weather':    ['delirius:/ia/weather?query={text}'],
  'tools.random':     ['delirius:/random/{type}'],
  'tools.checknsfw':  ['delirius:/tools/checknsfw?image={url}'],
};

export const CATEGORIAS: Record<string, { e: string; n: string; d: string; f: string; o: number; only?: string[] }> = {
  main:      { e: '🌸', n: 'Principal',    d: 'Menú, ayuda e información',       f: 'main',      o: 1 },
  info:      { e: 'ℹ️', n: 'Información',  d: 'Estado y comandos del bot',       f: 'main',      o: 2,  only: ['ping', 'infobot', 'comandos', 'help'] },
  download:  { e: '📥', n: 'Descargas',    d: 'YouTube, TikTok, IG, Spotify…',    f: 'download',  o: 3 },
  profile:   { e: '👤', n: 'Perfil',       d: 'Registro, nivel y perfil',        f: 'perfil',    o: 4 },
  ia:        { e: '🤖', n: 'Inteligencia', d: 'ChatGPT, Gemini y más IA',        f: 'ia',        o: 5 },
  anime:     { e: '🎏', n: 'Anime',        d: 'Waifus, nekos e interacciones',    f: 'anime',     o: 6 },
  gacha:     { e: '🎴', n: 'Gacha',        d: 'Personajes aleatorios',            f: 'anime',     o: 7,  only: ['waifu', 'neko', 'foxgirl'] },
  stickers:  { e: '🖼️', n: 'Stickers',     d: 'Convierte imágenes y crea citas',  f: 'stickers',  o: 8 },
  fun:       { e: '🎮', n: 'Diversión',    d: 'Juegos, retos y generadores',      f: 'fun',       o: 9 },
  game:      { e: '🎲', n: 'Juegos',       d: 'Dados, monedas y apuestas',        f: 'fun',       o: 10, only: ['dado', 'moneda'] },
  economy:   { e: '💰', n: 'Economía',     d: 'Monedas, daily, work y ranking',   f: 'economy',   o: 11 },
  tools:     { e: '🛠️', n: 'Herramientas', d: 'Traductor, capturas, QR, clima',   f: 'tools',     o: 12 },
  utils:     { e: '🧰', n: 'Utilidades',   d: 'Búsquedas y utilidades',           f: 'tools',     o: 13, only: ['traducir', 'ssweb', 'acortar', 'github', 'clima', 'npm', 'wiki', 'playstore', 'ytsearch', 'spotifysearch', 'letra', 'pinterest'] },
  logo:      { e: '✒️', n: 'Logomaker',    d: 'Crea logos y efectos de texto',    f: 'logomaker', o: 14 },
  admin:     { e: '👑', n: 'Grupos',       d: 'Administración de grupos',         f: 'admin',     o: 15 },
  owner:     { e: '⚙️', n: 'Dueño',        d: 'Solo para los dueños del bot',     f: 'owner',     o: 16 },
  subbot:    { e: '🤖', n: 'Sub-Bots',     d: 'Vincula números secundarios',      f: 'subbot',    o: 17 },
  otros:     { e: '📦', n: 'Otros',        d: 'Extras y moderación',              f: 'subbot',    o: 18, only: ['serbot', 'subbots', 'delsubbot'] },
  nsfw:      { e: '🔞', n: 'NSFW',         d: 'Bloqueado por defecto',            f: 'nsfw',      o: 19 },
};

const engine = mountConfig({ config, endpoints, categorias: CATEGORIAS, APIs: global.APIs });

export const apis = engine.apis;
export const bot = engine.bot;
export const categories = engine.categories;
export const menu = engine.menu;
export const limits = engine.limits;
export const theme = engine.theme;
export const syncConfig = engine.sync;
export const globalAPIs = global.APIs;

const __filename = fileURLToPath(import.meta.url);
let watcher: fs.FSWatcher | null = null;
let reloading = false;

function watchConfig(): void {
  if (reloading || process.env.CONFIG_WATCH === '0') return;
  try {
    watcher?.close();
    watcher = fs.watch(__filename, async (event) => {
      if (event !== 'change' || reloading) return;
      reloading = true;
      watcher?.close();
      console.log(chalk.gray(`Updated ${path.basename(__filename)}`));
      try {
        const fresh = await import(`${import.meta.url}?update=${Date.now()}`);
        Object.assign(config, fresh.config);
        global.api = fresh.config.api;
        global.APIs = fresh.globalAPIs;
        Object.assign(CATEGORIAS, fresh.CATEGORIAS);
        Object.assign(endpoints, fresh.endpoints);
        for (const k of Object.keys(endpoints)) if (!(k in fresh.endpoints)) delete endpoints[k];
        syncConfig();
        console.log(chalk.green('✔ Config recargada en caliente'));
      } catch (error) {
        console.error(chalk.red('✖ Error al recargar config.ts:'), error);
      }
      reloading = false;
      setTimeout(watchConfig, 800);
    });
    watcher.unref?.();
  } catch {
    return;
  }
}

if (!import.meta.url.includes('?update=')) watchConfig();

export default config;
