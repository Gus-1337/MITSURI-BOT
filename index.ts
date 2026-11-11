/**
 * MITSURI-MD · entrada universal para paneles (HidenCloud / Pterodactyl)
 *
 * El egg "Node.js TypeScript" del panel ejecuta:
 *   ts-node --esm /home/container/index.ts
 *
 * Con Node 23 eso usa el "type stripping" nativo, que NO reescribe los imports
 * './config.js' -> './config.ts': el bot moría con
 * ERR_MODULE_NOT_FOUND: Cannot find module '/home/container/config.js'.
 *
 * Este archivo es la ÚNICA entrada que ve ese lanzador y por eso no tiene
 * ningún import relativo a .ts: sólo módulos node: integrados. Arranca el bot
 * real (bot.ts) con tsx, que sí resuelve los .ts. Es el mismo comando que
 * `npm start`, así que el código de vinculación, el lock de instancia única y
 * la recarga de comandos se comportan igual en Termux, PM2 y en el panel.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(root, 'bot.ts');
const require = createRequire(import.meta.url);

let cli: string;
try {
  cli = require.resolve('tsx/cli');
} catch {
  cli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
}

if (!fs.existsSync(cli) || !fs.existsSync(entry)) {
  console.error('\n  ✖ MITSURI-MD: no encuentro tsx o bot.ts.');
  console.error('    Entrá a la carpeta del bot y ejecutá:  npm install\n');
  process.exit(1);
}

console.log('🌸 MITSURI-MD · arrancando con tsx (entrada compatible con el panel)');

let apagando = false;

const child = spawn(process.execPath, [cli, 'bot.ts'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, MITSURI_LAUNCHER: '1' },
});

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
for (const signal of signals) {
  process.on(signal, () => {
    apagando = true;
    if (!child.killed) child.kill(signal);
  });
}

child.on('error', (error) => {
  console.error('  ✖ No se pudo iniciar tsx:', error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (apagando) process.exit(0);
  process.exit(typeof code === 'number' ? code : signal ? 1 : 0);
});
