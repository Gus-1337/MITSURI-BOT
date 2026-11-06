#!/usr/bin/env bash
# 🌸 MITSURI-MD · instalador de un toque para Termux (Android)
set -euo pipefail

REPO="https://github.com/Gus-1337/MITSURI-BOT.git"
DIR="${MITSURI_DIR:-$HOME/MITSURI-BOT}"

say()  { printf '\n\033[1;36m%s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m  ✔ %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m  ⚠ %s\033[0m\n' "$1"; }
die()  { printf '\033[1;31m  ✖ %s\033[0m\n' "$1" >&2; exit 1; }

say "🌸 MITSURI-MD · instalador para Termux"

ES_TERMUX=0
if [ -n "${TERMUX_VERSION:-}" ] || { [ -n "${PREFIX:-}" ] && [ -d "$PREFIX/etc/termux" ]; } || uname -o 2>/dev/null | grep -qi android; then
  ES_TERMUX=1
fi

if [ "$ES_TERMUX" -eq 1 ]; then
  ok "Termux detectado"
  say "1/6 · Actualizando paquetes del sistema"
  pkg update -y
  pkg upgrade -y
  say "2/6 · Instalando Node.js y Git"
  if ! pkg install -y nodejs-lts git; then
    warn "nodejs-lts no disponible, probando nodejs"
    pkg install -y nodejs git
  fi
  if command -v termux-wake-lock >/dev/null 2>&1; then
    termux-wake-lock || true
    ok "Wake-lock activado (Android no dormirá el proceso)"
  fi
else
  warn "No se detectó Termux: se omiten los paquetes del sistema (sirve igual en PC / proot)."
fi

say "3/6 · Comprobando Node.js"
command -v node >/dev/null 2>&1 || die "Falta Node.js. En Termux: pkg install -y nodejs-lts"
MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$MAJOR" -ge 20 ] || die "Se necesita Node.js >= 20 y tienes $(node -v). En Termux: pkg install -y nodejs-lts"
ok "Node.js $(node -v) · npm $(npm -v)"

say "4/6 · Preparando el proyecto"
if [ -f package.json ] && grep -q '"name": "mitsuri-bot"' package.json 2>/dev/null; then
  DIR="$PWD"
  ok "Usando el repo actual: $DIR"
elif [ -d "$DIR/.git" ]; then
  cd "$DIR"
  git pull --ff-only || warn "No se pudo actualizar, se usa la copia local"
  ok "Repo existente: $DIR"
else
  [ ! -e "$DIR" ] || die "Ya existe $DIR pero no es un repo git. Bórralo o usa MITSURI_DIR=/ruta/otra bash install-termux.sh"
  git clone "$REPO" "$DIR"
  cd "$DIR"
  ok "Repo clonado en $DIR"
fi

say "5/6 · Instalando dependencias npm"
npm install --no-audit --no-fund
if ! node -e "require('sharp')" >/dev/null 2>&1; then
  warn "sharp no tiene binario nativo en Android, instalando su versión WebAssembly"
  SHARP_VER="$(node -p "require('sharp/package.json').version" 2>/dev/null || printf '0.34.5')"
  npm install --force --no-save --no-audit --no-fund "@img/sharp-wasm32@${SHARP_VER}"
fi
if node -e "require('sharp')" >/dev/null 2>&1; then
  ok "sharp listo (.sticker y .toimg funcionan)"
else
  warn "sharp no disponible: el bot arranca igual, esos comandos avisarán cómo instalarlo"
fi

say "6/6 · Configuración"
if [ ! -f .env ]; then
  cp .env.example .env
  ok ".env creado desde .env.example"
else
  ok ".env ya existe, se conserva"
fi

say "✅ Instalación terminada"
printf '  Inicia el bot con:\n'
printf '    cd %s && npm start\n\n' "$DIR"
printf '  Elige 1 (QR) o 2 (código de 8 dígitos). En el mismo celular conviene la opción 2.\n'
printf '  Para que no se caiga: termux-wake-lock, desactiva la optimización de batería y usa tmux.\n'
printf '  Opcional (stickers de video): pkg install -y ffmpeg\n\n'

if [ -t 0 ]; then
  read -r -p "¿Iniciar el bot ahora? [s/N] " RESPUESTA || true
  case "${RESPUESTA:-n}" in
    s|S|si|y|yes) say "Iniciando MITSURI-MD…"; exec npm start ;;
  esac
fi
