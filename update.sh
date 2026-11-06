#!/usr/bin/env bash
# 🌸 MITSURI-MD · actualiza el bot y arranca con sesión limpia
set -euo pipefail

say()  { printf '\n\033[1;36m%s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m  ✔ %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m  ⚠ %s\033[0m\n' "$1"; }
die()  { printf '\033[1;31m  ✖ %s\033[0m\n' "$1" >&2; exit 1; }

say "🌸 MITSURI-MD · actualizar y arrancar limpio"

if [ ! -f package.json ] || ! grep -q '"name": "mitsuri-bot"' package.json 2>/dev/null; then
  die "Entrá primero a la carpeta del bot: cd ~/MITSURI-BOT && bash update.sh"
fi

say "1/4 · Descargando la última versión"
if [ -d .git ]; then
  git pull --ff-only || die "No se pudo hacer git pull. Revisá tu conexión o cloná de nuevo."
  ok "código al día ($(git rev-parse --short HEAD))"
else
  warn "No hay carpeta .git (¿descargaste el ZIP?). Se usa el código que tenés."
fi

say "2/4 · Instalando dependencias"
npm install --no-audit --no-fund
ok "npm install"

say "3/4 · Borrando la sesión anterior"
rm -rf session
ok "session/ limpia, se pedirá un código nuevo"

say "4/4 · Iniciando MITSURI-MD"
exec npm start
