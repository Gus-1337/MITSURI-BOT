#!/usr/bin/env node
/**
 * MITSURI-MD · entrada universal para paneles (HidenCloud / Pterodactyl)
 *
 * Muchos panels con "egg Node.js (TypeScript)" arrancan así:
 *   /usr/local/bin/ts-node /home/container/${MAIN_FILE}
 *
 * ts-node (y el soporte nativo de .ts de Node 23) NO reescribe los imports
 * './config.js' -> './config.ts', que es lo que exige ESM + NodeNext.
 * Por eso sale: ERR_MODULE_NOT_FOUND: Cannot find module '/home/container/config.js'.
 *
 * Este archivo es JavaScript CommonJS puro: cualquier lanzador lo ejecuta
 * (node, ts-node, PM2, el panel) y él arranca el bot con tsx, que sí resuelve
 * los .ts. Es el mismo comando que `npm start`, así que el comportamiento
 * (código de vinculación, lock de instancia, recarga de comandos) es idéntico.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const entry = path.join(root, 'index.ts');

let cli;
try {
  cli = require.resolve('tsx/cli');
} catch {
  cli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
}

if (!fs.existsSync(cli) || !fs.existsSync(entry)) {
  console.error('\n  ✖ MITSURI-MD: no encuentro tsx o index.ts.');
  console.error('    Entrá a la carpeta del bot y ejecutá:  npm install\n');
  console.error('    En el panel: MAIN_FILE=main.cjs  ·  AUTO_UPDATE=1\n');
  process.exit(1);
}

console.log('🌸 MITSURI-MD · arrancando con tsx (entrada compatible con el panel)');

let apagando = false;

const child = spawn(process.execPath, [cli, 'index.ts'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, MITSURI_LAUNCHER: '1' },
});

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
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
