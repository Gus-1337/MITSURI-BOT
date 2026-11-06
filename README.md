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
│   ├── pairing.ts       # código de 8 dígitos esperando a que el socket esté listo
│   ├── runtime.ts  settings.ts  sharp.ts  subbot.ts  types.ts  utils.ts
├── config.ts            # globals + config + banners + links + endpoints + categorías
├── handler.ts  index.ts
├── install-termux.sh    # instalador de un toque para Android
├── update.sh            # git pull + npm install + sesión limpia + arrancar
└── package.json  tsconfig.json  .env.example  .gitignore
```

```bash
npm install
npm start
```

Node.js ≥ 20. Si la conexión devuelve `405`, es bloqueo de red al WebSocket de WhatsApp (sandbox/proxy), no del bot.

### 🔄 Actualizar (si ya instalaste antes)

```bash
cd ~/MITSURI-BOT && bash update.sh
```

Hace `git pull` + `npm install` + `rm -rf session` + `npm start`. **Usalo siempre que el bot no muestre el código**: evita quedarte con una copia vieja o una sesión a medias. También como `npm run update`.

---

### 🔗 Instalaciónes Básicas

> Requiere **Node.js ≥ 20**. En Android usa Termux de **F-Droid o GitHub**, no el de Play Store (está descontinuado y rompe con Node ≥ 20).

<details>
<summary><strong>🪷 Cloud</strong> — Shell</summary>

```bash
git clone https://github.com/Gus-1337/MITSURI-BOT.git
```

```bash
cd MITSURI-BOT
```

```bash
yarn install
```

```bash
npm install
```

```bash
npm start
```

</details>

<details open>
<summary><strong>🪷 Termux</strong> — Manualmente</summary>

```bash
termux-setup-storage
```
```bash
apt update && apt upgrade && pkg install -y git nodejs-lts ffmpeg yarn
```

```bash
git clone https://github.com/Gus-1337/MITSURI-BOT.git
```

```bash
cd MITSURI-BOT
```

```bash
yarn install
```

```bash
npm install
```

```bash
npm start
```

> *Si aparece **(Y/I/N/O/D/Z) [default=N] ?** use la letra **"y"** y luego **"ENTER"** para continuar con la instalación.*
>
> *`yarn install` es opcional: con `npm install` alcanza.*
>
> ⚡ **Atajo:** `bash install-termux.sh` (o `npm run install:termux`) hace todos estos pasos solo: instala Node y git, activa `termux-wake-lock`, crea `.env`, corre `npm install` y deja `sharp` funcionando con WebAssembly en Android.

</details>

<details>
<summary><strong>🪷 Comandos para tener mas tiempo activo</strong> — el Bot</summary>

> *Ejecutar estos comandos dentro de la carpeta MITSURI-BOT*
```bash
termux-wake-lock && npm i -g pm2 && pm2 start npm --name mitsuri -- start && pm2 save && pm2 logs
```

#### Opciones Disponibles
> *Esto eliminará todo el historial que hayas establecido con PM2:*
```bash
pm2 delete mitsuri
```

> *Si tienes cerrado Termux y quieres ver de nuevo la ejecución usa:*
```bash
pm2 logs mitsuri
```

> *Si deseas detener la ejecución del Bot usa:*
```bash
pm2 stop mitsuri
```

> *Si deseas iniciar de nuevo la ejecución del Bot usa:*
```bash
pm2 start mitsuri
```

---

### En caso de detenerse
> _Si después de instalar el bot Termux te salta en blanco, se fue tu internet o reiniciaste tu celular, solo realiza estos pasos:_
```bash
cd && cd MITSURI-BOT && npm start
```
---
### Obtener nuevo inicio de Sessión
> *Detén el bot, haz click en el símbolo (ctrl) [default=z] usar la letra **"z"** + **"ENTER"** hasta que salga algo verde similar a: `MITSURI-BOT $`*

```bash
cd && cd MITSURI-BOT && rm -rf session && npm start
```
</details>

<details>
<summary><strong>🩹 Solución de problemas</strong></summary>

| Síntoma | Arreglo |
|---|---|
| No aparece el código / `Connection Closed` / «Sesión cerrada desde el teléfono» | Copia vieja: `cd ~/MITSURI-BOT && bash update.sh`. Elegí `2`, poné tu número y esperá 5–10 s. Sin VPN ni proxy. |
| El código venció | Dura 2 minutos; el bot muestra uno nuevo solo. No hace que lo hagas a mano. `PAIRING_TTL_MS` en `.env` lo cambia. |
| `405` al conectar | Bloqueo de red al WebSocket de WhatsApp (VPN, firewall de datos, sandbox). Probá otra red. |
| `Could not load the "sharp" module using the android-arm64 runtime` | `npm install --force --no-save @img/sharp-wasm32` o `bash install-termux.sh`. El bot arranca igual; solo `.sticker` y `.toimg` avisan. |
| `node -v` menor a 20 | `pkg install -y nodejs-lts` |
| `npm install` falla al traer Baileys | Falta `git`: `pkg install -y git` |
| Avisos `npm warn allow-scripts` (npm 11.16+/12) | Política nueva de scripts, **no rompen nada**. El repo ya lleva `allowScripts` en `package.json`; en una copia vieja: `git pull && npm install`. |
| Aviso de `fluent-ffmpeg` | Opcional, solo vistas previas de video: `pkg install -y ffmpeg` |
| Se desconecta al apagar la pantalla | `termux-wake-lock` + desactivar optimización de batería |
| Escribí `1`/`2` en «¿Iniciar el bot ahora?» | Ahora arranca directo con QR (`1`) o código (`2`); con Enter o `s` el bot pregunta el método. |

</details>

---

## Vinculación

Al arrancar, `index.ts` pregunta cómo quieres vincular:

```
╭⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》
┊  METODO DE VINCULACION
┊ ⇢ Opcion 1: Codigo QR.
┊ ⇢ Opcion 2: Codigo de 8 digitos.
╰⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》
--->
```

Escribe `1` o `2`. Con la opción 2 te pide **tu número** (con código de país, sin `+`; Enter = dueño) y después de unos segundos imprime:

```
🔐 CÓDIGO DE VINCULACIÓN: A1B2C3D4
   Número : +523319164806
   ⏱️  Vence en 2 minutos (11:52) · se genera uno nuevo solo al vencer
   WhatsApp → Ajustes → Dispositivos vinculados → Vincular con número de teléfono
```

En el celular: **WhatsApp → Ajustes → Dispositivos vinculados → Vincular con número de teléfono** → escribí ese código. El número elegido se agrega a los dueños de la sesión.

**El código dura 2 minutos.** No se regenera a cada rato: al vencer, el bot limpia la sesión, se reconecta y muestra uno nuevo (`⏱️ El código venció a los 2 minutos. Generando uno nuevo…`). Podés cambiar el tiempo con `PAIRING_TTL_MS` en `.env` (milisegundos, mínimo 30000). Si WhatsApp cierra la vinculación a medias con `401`, tampoco se muere: se autolimpia y pide otro código en vez de decir «sesión cerrada desde el teléfono».

`lib/pairing.ts` espera a que el socket esté realmente listo antes de pedir el código: este fork de Baileys emite `connection: 'connecting'` antes de abrir el WebSocket, y pedirlo ahí falla con *Connection Closed* (por eso antes no salía ningún código). Además, si quedó una vinculación a medias en `session/`, se limpia sola al arrancar.

Para saltar la pregunta:

```bash
AUTH_METHOD=qr npm start
AUTH_METHOD=code PAIRING_NUMBER=51926519334 npm start
npm start -- --qr
npm start -- --code
```

`PAIRING_CODE` fija un código propio de 8 caracteres, `PAIRING_TTL_MS` el tiempo de vida (por defecto `120000` = 2 min). En servidores sin terminal interactiva (PM2, Docker, CI) no se pregunta: usa QR salvo que definas `AUTH_METHOD` y `PAIRING_NUMBER`. Las variables se leen de `.env` (`dotenv/config` en `index.ts`) o del entorno.

> **¿Sigue sin salir el código o dice `Connection Closed` / «Sesión cerrada desde el teléfono»?** Estás corriendo una copia vieja. Un solo comando lo arregla:
> ```bash
> cd ~/MITSURI-BOT && bash update.sh
> ```
> Elegí `2`, poné tu número y esperá de 5 a 10 segundos (verás `⏳ Pidiendo el código de 8 dígitos a WhatsApp…`). Desactivá VPN/proxy y probá con datos móviles u otra WiFi; un `405` significa que la red bloquea el WebSocket de WhatsApp, no un error del bot.

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

- **Revoca/rota el token de GitHub compartido en el chat.** Se usó solo como header temporal para el push, no quedó guardado en `.git/config` ni en ningún archivo; al haber estado en texto plano, dálo por comprometido.
- `session/`, `sessions/`, `.env`, `database/` están en `.gitignore`.
- Las keys de `config.ts` son públicas en un repo público: muévelas a `.env` (`STELLAR_API_KEY`, `EVOGB_KEY`, `YOSOYYO_KEY`).
- Baileys viene de `git+https://github.com/Andresv27728/baileys-beta.git`.

---

## Verificado

`npm run typecheck` · `npm run build` · arranque con 84 comandos y 9 APIs · 43 endpoints · 19 categorías · botones/listas · hot-reload · menú de vinculación QR/código · código de 8 dígitos impreso con socket real y probado con `lib/pairing.ts` (5 casos) · TTL de 2 minutos con regeneración · autolimpieza de sesión en `401` · `update.sh` · `install-termux.sh` · `sharp` probado con solo WASM (y el bot arrancando igual sin `sharp`) · llamadas reales a Stellar, Delirius, SiputzX y PopCat.

MIT 🌸
