<div align="center">

# 🌸 MITSURI-MD

**MITSURI-BOT · WhatsApp Multi-Device · menú por categorías con botones · config plano · APIs con fallback**

![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen) ![Baileys](https://img.shields.io/badge/Baileys-beta%20fork-blue) ![TS](https://img.shields.io/badge/TypeScript-5.7-blue) ![License](https://img.shields.io/badge/license-MIT-yellow)

</div>

---

## Estructura

```
MITSURI-BOT/
├── commands/            # 84 comandos en 14 carpetas
│   ├── admin/  anime/  download/  economy/  fun/  ia/  logomaker/
│   ├── main/   nsfw/   owner/     perfil/   stickers/  subbot/  tools/
├── lib/                 # motor
│   ├── api.ts           # cliente con fallback + parser de endpoints planos
│   ├── buttons.ts       # botones Native Flow + fallback a texto
│   ├── cmd.ts           # fábrica declarativa de comandos
│   ├── config-engine.ts # deriva bot/apis/categories/menu/limits/theme
│   ├── config-types.ts  # tipos internos
│   ├── db.ts  group.ts  loader.ts  menu.ts  respond.ts
│   ├── runtime.ts  settings.ts  subbot.ts  types.ts  utils.ts
├── config.ts            # globals + config + banners + links + endpoints + categorías
├── handler.ts  index.ts
└── package.json  tsconfig.json  .env.example  .gitignore
```

```bash
npm install
npm start
```

Node.js ≥ 20. QR en la terminal; `AUTH_METHOD=code` para código de vinculación. Si la conexión devuelve `405`, es bloqueo de red al WebSocket de WhatsApp (sandbox/proxy), no del bot.

---

## config.ts

```ts
const ownerNumbers = new Set(['51926519334', '51986425908', '5491128178894']);

global.api  = { url: 'https://api.stellarwa.xyz', key: 'proyectsV2' };
global.APIs = {
  melody:     { url: 'https://api.melodiaauris.qzz.io', key: 'OguriCap-Bot' },
  anabot:     { url: 'https://anabot.my.id', key: 'freeApikey' },
  delirius:   { url: 'https://api.delirius.online', key: null },
  stellar:    { url: 'https://api.stellarwa.xyz', key: 'proyectsV2' },
  siputzx:    { url: 'https://api.siputzx.my.id', key: null },
  evogb:      { url: 'https://api.evogb.org', key: process.env.EVOGB_KEY || 'putostodos' },
  yosoyyo:    { url: 'https://api-yosoyyo-api-ofc.onrender.com', key: process.env.YOSOYYO_KEY || null },
  starlights: { url: 'https://apis-starlights-team.koyeb.app/starlight', key: null },
  popcat:     { url: 'https://api.popcat.xyz/v2', key: null },
};

export const config = {
  botName: 'MITSURI-MD',
  devName: 'GUS',
  prefix: '.',
  owner: ownerNumbers,
  banner: 'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
  icon: 'https://cdn.dix.lat/me/q2se_20261008-r2x1-0f9o-f489.jpg',
  coin: 'coins',
  api: { url: 'https://api.stellarwa.xyz', key: 'proyectsV2' },
  banners: { main: '…', info: '…', download: '…', profile: '…', logo: '…' },
  links: { default: 'https://github.com/Gus-1337/MITSURI-BOT' },
  mode: 'public', auth: 'qr', menuStyle: 'list', cooldown: 3, autoReact: '🌸',
};

export const endpoints = {
  'ia.chatgpt': ['stellar:/ai/chatgpt?text={text}', 'delirius:/ia/chatgpt?q={text}'],
  'download.ytmp3': ['delirius:/download/ytmp3?url={url}', 'stellar:/dl/ytmp3?url={url}'],
};

export const CATEGORIAS = {
  main: { e: '🌸', n: 'Principal', d: 'Menú e info', f: 'main', o: 1 },
  game: { e: '🎲', n: 'Juegos', d: 'Dados y apuestas', f: 'fun', o: 10, only: ['dado', 'moneda'] },
};
```

`config.ts` no lleva comentarios: es `global.api`, `global.APIs`, `config`, `endpoints`, `CATEGORIAS`, el montaje de `lib/config-engine.ts` y el watcher con `chalk`. Los objetos que consume el motor (`apis`, `bot`, `categories`, `menu`, `limits`, `theme`) se derivan solos. Al guardar el archivo se re-importa y se mutan los objetos vivos, sin reiniciar (`fs.watch().unref()`, `CONFIG_WATCH=0` lo apaga).

`config.banners` tiene 21 claves, `config.links` el botón URL de cada categoría. `ownerNumbers` es un Set: los 3 números son dueños. `.setprefix`, `.setbanner`, `.setlink`, `.setmenu`, `.setbotname` persisten en `database/database.json`.

---

## APIs

Las 9 APIs de `global.APIs` se registran solas con su `key` y `keyParam` (`apikey`). Rutas verificadas en uso:

| API | Endpoints |
|---|---|
| stellar | `/ai/chatgpt`, `/tools/brat`, `/short/tinyurl`, `/stalking/github`, `/tools/npmjs`, `/dl/*`, `/sfw/*` |
| delirius | `/download/*`, `/anime/*`, `/reactions/{tipo}`, `/canvas/*`, `/tools/*`, `/search/*`, `/random/*`, `/ia/*` |
| siputzx | `/api/s/youtube?query=` |
| popcat | `/v2/translate?text=&to=` |

`melody`, `anabot`, `evogb`, `yosoyyo`, `starlights` están registradas con su key; sus rutas requieren login o docs privados, así que no se inventaron endpoints. Agregar una es una línea en `endpoints`.

Cada comando llama a un nombre lógico (`ctx.api('download.ytmp3', { url })`). Los proveedores se prueban en orden: si uno falla por HTTP, `status:false`, `error:true` o timeout, pasa al siguiente. Los `{nombre}` se sustituyen por parámetros y la key se añade sola.

---

## Menú y botones

19 categorías, cada una con su banner y su botón URL. Las que no son carpeta filtran comandos con `only`: `info`, `gacha`, `game`, `utils`, `otros`. Aliases: `.menu perfil` → `profile`, `.menu logomaker` → `logo`, `.menu principal` → `main`.

`.menu` abre una lista `single_select`; `.menu <categoría>` muestra el banner, botones de comandos, paginación, «⬅️ Menú principal» y el botón URL. Los IDs son comandos completos (`.menu anime 2`). Si WhatsApp rechaza el interactivo, degrada a texto numerado. `menuStyle` acepta `list`, `buttons`, `text`.

---

## Comandos

84 comandos en 14 carpetas: descargas, IA, anime, stickers, logomaker, economía, perfil, grupos, dueño, sub-bots, herramientas, diversión, main y NSFW (bloqueado por defecto; `.checknsfw` es moderación de imágenes).

```ts
import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'hola', aliases: ['hi'], description: 'Saluda con IA',
  usage: '<nombre>', endpoint: 'ia.chatgpt', require: true, as: 'text',
});
```

`lib/loader.ts` escanea `commands/**/*.ts` solo; la categoría sale de la carpeta. `.reload` recarga sin reiniciar. También se pueden exportar varios con `export const commands: Command[] = [...]`.

Multi-Device real (sesión en `session/`, QR o pairing code, reconexión), sub-bots con sesión propia (`.serbot`, `.subbots`, `.delsubbot`), permisos `all | group | admin | owner | private | nsfw`, cooldown, bans, anti-link, bienvenidas y rechazo de llamadas.

---

## Seguridad

- **Revoca/rota el token de GitHub compartido en el chat.** No se usó para clonar, no está en el repo y no se hizo push.
- `session/`, `sessions/`, `.env`, `database/` están en `.gitignore`.
- Las keys de `config.ts` son públicas en un repo público: muévelas a `.env` (`STELLAR_API_KEY`, `EVOGB_KEY`, `YOSOYYO_KEY`).
- Baileys viene de `git+https://github.com/Andresv27728/baileys-beta.git`.

---

## Verificado

`npm run typecheck` · `npm run build` · arranque con 84 comandos y 9 APIs · 43 endpoints · 19 categorías · botones/listas · hot-reload · llamadas reales a Stellar, Delirius, SiputzX y PopCat.

MIT 🌸
