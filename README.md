<div align="center">

# 🌸 MITSURI-MD

**MITSURI-BOT · WhatsApp Multi-Device · menú por categorías con botones · config plano · APIs con fallback**

![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen) ![Baileys](https://img.shields.io/badge/Baileys-beta%20fork-blue) ![TS](https://img.shields.io/badge/TypeScript-5.7-blue) ![License](https://img.shields.io/badge/license-MIT-yellow)

</div>

---

## Estructura

```
MITSURI-BOT/
├── commands/            # 85 comandos en 14 carpetas
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

Node.js ≥ 20. El fork trae una versión vieja de WA Web (`2.3000.1035194821`) que hace que WhatsApp rechace el WebSocket con `405`; `index.ts` consulta `fetchLatestBaileysVersion()` y usa la vigente (`2.3000.1043857760`). Si aun así ves `405`, es bloqueo de red (VPN/proxy/sandbox).

### 🔄 Actualizar (si ya instalaste antes)

```bash
cd ~/MITSURI-BOT && bash update.sh
```

Hace `git pull` + `npm install` + `rm -rf session` + `npm start`. **Usalo siempre que el bot no muestre el código**: evita quedarte con una copia vieja o una sesión a medias. También como `npm run update`.

**Desde el propio WhatsApp** (dueño): `.fix`, `.pull`, `.update` o `.actualizar`. Actualiza **sin reiniciar**:

1. `git fetch --prune --tags --force origin` (sirve aunque el historial remoto se haya reescrito).
2. Busca `origin/<rama>`, `origin/main` u `origin/master`.
3. Si tenés commits locales que no están en el remoto, los guarda en `backup-local-<fecha>`.
4. Hace `stash` solo de archivos **rastreados** (sesiones, `.env` y `database/` no se tocan), `git reset --hard` al remoto y `stash pop`.
5. Si cambió `package.json`, corre `npm install` solo.
6. Llama a `loadCommands()` + `syncConfig()`: los **85 comandos se recargan en caliente** y responde con el listado de archivos cambiados.

Solo avisa de reiniciar cuando se tocó el motor (`lib/`, `index.ts`, `handler.ts`), porque esos módulos ya están cargados en memoria. El `config.ts` se recarga solo por su watcher. No borra `session/` ni reinicia el proceso.

### 🔒 Una sola instancia (evita el bucle 428 / 515)

Si dejás un `npm start` corriendo en una sesión de Termux y abrís otro (o además usás PM2), los dos procesos comparten `session/`. WhatsApp cierra uno con **`428 Connection Closed`**, manda **`515 restart required`** al otro, ambos reconectan… y ves «✅ conectado» + `[ RECONNECT ]` sin parar, aunque el bot parezca andar. No es un error del bot ni de la red.

El bot ahora crea un lock (`.mitsuri-<hash>.lock`) al arrancar: si ya hay otro proceso vivo con esa sesión, **el segundo no arranca** y te dice el PID. Al salir (Ctrl+C, SIGTERM, crash) el lock se libera solo.

```bash
# Ver si quedó algo colgado
ps aux | grep -E 'tsx|mitsuri' | grep -v grep

# Termux: matar el viejo y arrancar limpio
pkill -f "tsx index.ts"
cd ~/MITSURI-BOT && rm -rf session && npm start

# Si usás PM2
pm2 delete mitsuri && cd ~/MITSURI-BOT && npm start
```

Además: `440` (otra conexión reemplazó la sesión) espera 20 s, `500`/`411`/`403` limpian la sesión y revinculan, y si hay **4 o más cierres por minuto** el bot frena con backoff de 10–30 s y te imprime estos comandos en la consola. Para shardear a propósito: `MITSURI_ALLOW_MULTI=1` con `SESSION_DIR` distintos por proceso.

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
| `428 Precondition Required / Connection Closed` + `[ RECONNECT ]` en bucle, «conectado» una y otra vez | **Dos procesos con la misma `session/`**. Matá el viejo: `pkill -f "tsx index.ts"` (o `pm2 delete mitsuri`), y si sigue `rm -rf session && npm start`. El bot ahora **bloquea la 2ª instancia** con un lock y avisa el PID. Ver la sección «🔒 Una sola instancia». |
| No aparece el código / «Sesión cerrada desde el teléfono» | Copia vieja: `cd ~/MITSURI-BOT && bash update.sh`. Elegí `2`, poné tu número y esperá 5–10 s. Sin VPN ni proxy. |
| El código venció | Dura 2 minutos; el bot muestra uno nuevo solo. No hace que lo hagas a mano. `PAIRING_TTL_MS` en `.env` lo cambia. |
| `405` al conectar | Versión vieja de WA Web o red bloqueada. Corré `bash update.sh`; el banner debe mostrar `🆕 WA Web : 2.3000.1043857760`. Si dice «se usa la del fork», probá otra WiFi/datos y desactivá VPN. |
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

Escribe `1` o `2`. Con la opción 2 te pide **tu número**:

```
Por favor, ingresa tu número de WhatsApp.
Ejemplo: +52 1 33 1916 4806  /  +51 926 519 334
--->
```

y a los 3 segundos imprime:

```
 CODIGO DE VINCULACION  : A1B2-C3D4
   📞 Número : +523319164806
   ⏱️  Vence en 2 minutos (11:52) · se genera uno nuevo solo al vencer
   WhatsApp → Ajustes → Dispositivos vinculados → Vincular con número de teléfono
```

En el celular: **WhatsApp → Ajustes → Dispositivos vinculados → Vincular con número de teléfono** → escribí ese código. El número elegido se agrega a los dueños de la sesión.

**Conexión reescrita siguiendo un flujo que sí entrega el código:**

- `fetchLatestBaileysVersion()` antes de conectar y se pasa `version` al socket. El fork trae `2.3000.1035194821` y WhatsApp ya usa `2.3000.1043857760`: con la versión vieja el WebSocket responde **405** y nunca se abre. El banner muestra la versión en uso.
- `makeCacheableSignalKeyStore`, `Browsers.macOS('Safari')`, `connectTimeoutMs: 60000`, `keepAliveIntervalMs: 30000`, agente HTTPS keep-alive y las opciones ligeras (`fireInitQueries: false`, `downloadHistory: false`, `markOnlineOnConnect: false`…).
- **Se borra `session/` antes de crear el socket** cuando no estás registrado, igual que en el ejemplo, y se recargan las credenciales. Nada de `creds.me` viejo → nada de `401`.
- El código se pide **3 segundos después de crear el socket** (no en `connection: 'connecting'`, que este fork emite demasiado pronto y daba *Connection Closed*), con reintentos desde `lib/pairing.ts` hasta que el WebSocket esté abierto.
- Reconexión: `515` / *Stream Errored* reinicia el socket, `401` limpia sesión y pide código nuevo, cualquier otro cierre reintenta a los 3 s.

**El código dura 2 minutos** y solo se regenera al vencer (`PAIRING_TTL_MS`). `normalizePhone` limpia el número, quita ceros, convierte los 10 dígitos colombianos a `57` y, si ponés `PAIRING_LEGACY_PREFIX=1`, aplica los prefijos viejos `521`/`549` de México/Argentina.

Para saltar la pregunta:

```bash
AUTH_METHOD=qr npm start
AUTH_METHOD=code PAIRING_NUMBER=51926519334 npm start
npm start -- --qr
npm start -- --code
```

`PAIRING_CODE` fija un código propio de 8 caracteres, `PAIRING_TTL_MS` el tiempo de vida (`120000` = 2 min), `PAIRING_DELAY_MS` la espera antes de pedirlo (`3000`), `PAIRING_LEGACY_PREFIX=1` activa los prefijos viejos `521`/`549`. En servidores sin terminal interactiva (PM2, Docker, CI) no se pregunta: usa QR salvo que definas `AUTH_METHOD` y `PAIRING_NUMBER`. Las variables se leen de `.env` (`dotenv/config` en `index.ts`) o del entorno. También `npm start -- --qr`, `npm start -- --code` o `npm start -- code`.

> **¿Sigue sin salir el código o dice `405`?** Un solo comando actualiza todo y arranca con sesión limpia:
> ```bash
> cd ~/MITSURI-BOT && bash update.sh
> ```
> Elegí `2`, poné tu número y esperá 3–10 segundos. En el banner tiene que decir `🆕 WA Web : 2.3000.1043857760 (versión actual)`; si dice «se usa la del fork», tu red no llega a `raw.githubusercontent.com` (probá otra WiFi o datos móviles). Desactivá VPN/proxy; un `405` persistente significa que la red bloquea el WebSocket de WhatsApp.

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
  banner: 'https://d0mwa043ankuvadx.public.blob.vercel-storage.com/nyx/oSDc1z4.jpeg',
  icon: 'https://d0mwa043ankuvadx.public.blob.vercel-storage.com/nyx/oSDc1z4.jpeg',
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

**Menú limpio**: el texto del menú principal es solo encabezado (nombre, frase, dueño, prefijos). Ya no lleva `Activo`, `Comandos`, `Msgs procesados`, `APIs` ni la lista repetida de `CATEGORÍAS (1/3)`: las categorías van en la lista desplegable / botones, y las estadísticas siguen disponibles en `.infobot`. Con `MENU_STYLE=text` sí se imprime la lista de categorías, porque sin botones es la única forma de navegar.

---

## Comandos

85 comandos en 14 carpetas: descargas, IA, anime, stickers, logomaker, economía, perfil, grupos, dueño, sub-bots, herramientas, diversión, main y NSFW (bloqueado por defecto; `.checknsfw` es moderación de imágenes).

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

## 🤖 Sub-bots: ¿cuántos aguanta?

Cada sub-bot es **un socket de Baileys más dentro del mismo proceso** (no un proceso nuevo): comparte los 85 comandos, `sharp`, el handler y la versión de WA Web. Medido aquí, un socket adicional en reposo suma solo **~2 MB de RSS** porque las librerías ya están cargadas; con sesión real, claves Signal, cachés y tráfico, lo realista es **15–40 MB por sub-bot** y picos de 100+ MB cuando procesa stickers/descargas con `sharp`.

| Recurso | Lo que limita de verdad |
|---|---|
| RAM 125 GB (34 GB libres) | No es el cuello: 34 GB / 30 MB ≈ 1000 sub-bots. Sobra. |
| CPU 16 núcleos con load 11 | **Sí es el cuello.** Quedan ~5 núcleos; un solo event loop de Node atiende a todos. |
| Heap de V8 (~4 GB por proceso en Node 23) | ~3–10 MB de objetos JS por socket → GC se vuelve pesado mucho antes de los 4 GB. |
| WhatsApp / IP | Muchos dispositivos vinculados desde la misma IP de Azure levantan rate-limit o baneo. |
| Disco y fd | `sessions/sub/<numero>/` ≈ 1–3 MB y 1 socket TCP por sub-bot. Irrelevante. |

**Recomendación**

| Escenario | Sub-bots |
|---|---|
| Seguro, un solo proceso, uso ligero | **20–40** (por eso `MAX_SUBBOTS=40` por defecto) |
| Uso intenso (stickers, descargas, IA en cada sub-bot) | **10–15** |
| Repartiendo en 4–8 procesos con PM2 y `MAX_SUBBOTS` por proceso | **100–150** |
| Techo teórico por RAM | ~1000, pero no lo intentes: CPU y WhatsApp caen antes |

`.subbots` muestra `activos/límite`, RSS y heap para vigilarlo. Para subir el tope: `MAX_SUBBOTS=80` en `.env`. Si necesitás más de ~50, shardeá: varios procesos con `SESSION_DIR` y `DB_DIR` distintos, o un PM2 con `--max-old-space-size=2048`. Los sub-bots usan la misma `fetchLatestBaileysVersion()` y el mismo flujo de código de 8 dígitos que el bot principal (antes daban `405` y *Connection Closed*).

---

## Seguridad

- **Revoca/rota el token de GitHub compartido en el chat.** Se usó solo como header temporal para el push, no quedó guardado en `.git/config` ni en ningún archivo; al haber estado en texto plano, dálo por comprometido.
- `session/`, `sessions/`, `.env`, `database/` están en `.gitignore`.
- Las keys de `config.ts` son públicas en un repo público: muévelas a `.env` (`STELLAR_API_KEY`, `EVOGB_KEY`, `YOSOYYO_KEY`).
- Baileys viene de `git+https://github.com/Andresv27728/baileys-beta.git`.

---

## Verificado

`npm run typecheck` · `npm run build` · arranque con 85 comandos y 9 APIs · lock de instancia única (2º proceso bloqueado) · backoff de reconexión verificado · 43 endpoints · 19 categorías · `.fix` probado contra un remoto git real (pull, respaldo, stash y recarga en caliente) · menú limpio verificado en `list`/`buttons`/`text` · botones/listas · hot-reload · menú de vinculación QR/código · `fetchLatestBaileysVersion()` → `2.3000.1043857760` · socket con `makeCacheableSignalKeyStore` + `Browsers.macOS('Safari')` · sesión limpia antes de vincular · código de 8 dígitos impreso con socket real (formato `XXXX-XXXX`) y probado con `lib/pairing.ts` · TTL de 2 minutos con regeneración · reconexión `515`/`401` · sub-bots con la misma versión y código verificado + `MAX_SUBBOTS` · medición de RSS por socket · `update.sh` · `install-termux.sh` · `sharp` probado con solo WASM · llamadas reales a Stellar, Delirius, SiputzX y PopCat.

MIT 🌸
