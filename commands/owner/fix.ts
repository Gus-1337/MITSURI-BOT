import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncConfig } from '../../config.js';
import { loadCommands, commandCount } from '../../lib/loader.js';
import type { Command } from '../../lib/types.js';

const execPromise = promisify(exec);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAX_ARCHIVOS = 20;
const LINEA = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄';

// git nunca debe esperar a una persona (credenciales, editor de merge)
const ENTORNO_GIT = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_EDITOR: 'true', GIT_MERGE_AUTOEDIT: 'no' };
const OPCIONES_GIT = { env: ENTORNO_GIT, cwd: ROOT, timeout: 150000, maxBuffer: 10 * 1024 * 1024 };
const OPCIONES_NPM = { env: process.env, cwd: ROOT, timeout: 180000, maxBuffer: 10 * 1024 * 1024 };

const ESTADOS: Record<string, string> = {
  A: '✚ nuevo', M: '✎ editado', D: '✖ eliminado',
  R: '↻ renombrado', C: '⎘ copiado', T: '✎ tipo cambiado',
};

const git = async (comando: string): Promise<string> => (await execPromise(comando, OPCIONES_GIT)).stdout;

/** Intenta un comando y devuelve null si falla (sin lanzar error). */
const gitSuave = async (comando: string): Promise<string | null> => {
  try { return await git(comando); } catch { return null; }
};

/** Convierte la salida de `git diff --name-status` en pares [estado, ruta]. */
function cambios(salida: string): [string, string][] {
  return salida.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [estado, ...rutas] = l.split('\t');
    return [estado, rutas.join(' → ')] as [string, string];
  });
}

const command: Command = {
  name: 'fix', aliases: ['pull', 'update', 'actualizar', 'gitpull'], category: 'owner', access: 'owner',
  description: 'Jala la última versión de GitHub y recarga los comandos sin reiniciar',
  usage: '', example: '.fix', cooldown: 20,
  async execute(ctx) {
    try {
      // 0) ¿Es un repositorio git? Si se instaló por ZIP no hay nada que jalar.
      const esRepo = await gitSuave('git rev-parse --is-inside-work-tree');
      if (!esRepo || !/true/.test(esRepo)) {
        return ctx.reply(`🌸 *SIN REPOSITORIO GIT*\n${LINEA}\n✿ Esta instalación no tiene carpeta .git.\n› Descarga la última versión a mano y reinicia.`);
      }

      const antes = (await git('git rev-parse HEAD')).trim();
      const rama = (await git('git rev-parse --abbrev-ref HEAD')).trim() || 'main';

      // 1) fetch con --prune/--force: aguanta historial reescrito y ramas divergentes
      let fetchOk = await gitSuave('git fetch --prune --tags --force origin');
      if (fetchOk === null) fetchOk = await gitSuave('git fetch --prune --force origin');
      if (fetchOk === null) {
        return ctx.reply(`🌸 *SIN CONEXIÓN CON GITHUB*\n${LINEA}\n✿ No se pudo hacer \`git fetch origin\`.\n› Revisa el remote: \`git remote -v\`\n› O configúralo: \`git remote add origin https://github.com/Gus-1337/MITSURI-BOT.git\``);
      }

      // 2) Elegir la referencia contra la que sincronizar
      let destino = '';
      for (const c of [`origin/${rama}`, 'origin/main', 'origin/master']) {
        const sha = await gitSuave(`git rev-parse --verify --quiet ${c}`);
        if (sha && sha.trim()) { destino = c; break; }
      }
      if (!destino) return ctx.reply(`🌸 *SISTEMA AL DÍA*\n${LINEA}\n✿ No hay rama remota para comparar.`);

      // 3) Respaldar commits locales que no existen en el remoto
      let respaldo = '';
      const adelante = await gitSuave(`git rev-list --count ${destino}..HEAD`);
      if (adelante && Number(adelante.trim()) > 0) {
        const marca = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        respaldo = `backup-local-${marca}`;
        await gitSuave(`git branch ${respaldo} HEAD`);
      }

      // 4) Guardar solo cambios de archivos rastreados; sesiones/.env/database no se tocan
      const sucio = (await gitSuave('git status --porcelain')) || '';
      const lineasSucias = sucio.split('\n').map(l => l.trim()).filter(Boolean);
      const sinResolver = lineasSucias.some(l => /^(UU|AA|DU|UD|AU|UA|DD)/.test(l));
      if (sinResolver) {
        return ctx.reply(`🌸 *CONFLICTOS LOCALES*\n${LINEA}\n✿ Hay archivos sin resolver en el repo.\n› Corre \`git status\` y \`git checkout -- .\` y vuelve a intentar \`${ctx.prefix}fix\`.`);
      }
      const conStash = lineasSucias.some(l => !l.startsWith('??'));
      if (conStash) await gitSuave('git stash push -m "mitsuri-fix-auto"');

      // 5) Sincronizar de verdad
      await git(`git reset --hard ${destino}`);

      // 6) Devolver los cambios locales. Si chocan, el stash NO se pierde y
      //    dejamos el árbol limpio (sin marcadores de conflicto) para no romper el bot.
      let stashPendiente = false;
      if (conStash) {
        const pop = await gitSuave('git stash pop');
        const estado = (await gitSuave('git status --porcelain')) || '';
        const choco = estado.split('\n').some(l => /^(UU|AA|DU|UD|AU|UA|DD)/.test(l.trim()));
        if (pop === null || choco) {
          if (choco) await gitSuave('git reset --hard HEAD');
          stashPendiente = true;
        }
      }

      const despues = (await git('git rev-parse HEAD')).trim();
      const historialCambio = antes !== despues;
      const diff = cambios((await gitSuave(`git diff --name-status ${antes} ${despues}`)) || '');
      const backup = respaldo ? `\n› Respaldo local: \`${respaldo}\`` : '';
      const stashAviso = stashPendiente ? `\n› ⚠️ Cambios locales a salvo en el stash: \`git stash list\` / \`git stash show -p\`` : '';

      if (!historialCambio) {
        return ctx.reply(`🌸 *SISTEMA AL DÍA*\n${LINEA}\n✿ El bot ya tiene la última versión.\n› Versión: \`${despues.slice(0, 7)}\`${backup}${stashAviso}`);
      }

      // 7) Si cambiaron dependencias, instalarlas en caliente
      let instaloDeps = false;
      if (diff.some(([, r]) => /package(-lock)?\.json/.test(r))) {
        try { await execPromise('npm install --no-audit --no-fund', OPCIONES_NPM); instaloDeps = true; }
        catch (e) { console.error('[ FIX ] npm install falló:', (e as Error)?.message); }
      }

      // 8) Recarga real: loader del bot + objetos derivados del config
      const n = await loadCommands().catch(e => { console.error('[ FIX ] Recarga fallida:', e?.message || e); return 0; });
      syncConfig();

      if (diff.length === 0) {
        return ctx.reply(`🌸 *SISTEMA AL DÍA*\n${LINEA}\n✿ Historial resincronizado, sin cambios de código.\n✿ Comandos activos: *${commandCount()}*\n› Versión: \`${despues.slice(0, 7)}\`${backup}${stashAviso}`);
      }

      const lineas = diff.map(([estado, rutas]) => `› ${rutas}  ${ESTADOS[estado[0]] || '✎ cambiado'}`);
      const mostrados = lineas.slice(0, MAX_ARCHIVOS);
      const extra = lineas.length - mostrados.length;
      const bloque = mostrados.length
        ? '```' + mostrados.join('\n') + (extra > 0 ? `\n… y ${extra} más` : '') + '```\n'
        : '';

      // Si tocó el motor, los comandos recargados no bastan para esos archivos
      const tocaMotor = diff.some(([, rutas]) => /(^|[\s,]+)(lib\/|bot\.ts|index\.ts|handler\.ts|tsconfig\.json)/.test(rutas));
      const avisoMotor = tocaMotor
        ? '\n› ⚠️ Se actualizó el motor (lib/ / bot.ts): reinicia cuando puedas para aplicarlo'
        : '\n› Comandos recargados sin reiniciar el bot';
      const avisoPocos = n < 80 ? '\n› ⚠️ Cargaron menos comandos de lo normal: revisa el loader' : '';
      const avisoDeps = instaloDeps ? '\n› Dependencias actualizadas con npm install' : '';

      return ctx.reply(
        `🌸 *ACTUALIZACIÓN EXITOSA*\n${LINEA}\n` +
        `亗 *Editor:* Gus-1337\n` +
        `✎ *Total cambios:* ${lineas.length}\n` +
        `ꕥ *Archivos:*\n${bloque}` +
        `✿ *Comandos activos:* ${commandCount()}\n` +
        `› Versión: \`${despues.slice(0, 7)}\`\n${LINEA}` +
        avisoMotor + avisoPocos + avisoDeps + backup + stashAviso,
      );
    } catch (err: any) {
      console.error('[ FIX ] Error:', err);
      const detalle = String(err?.stderr || err?.message || err)
        .split('\n').map((l: string) => l.trim())
        .filter((l: string) => l && !l.startsWith('From ')).pop() || 'Error desconocido';
      return ctx.reply(`🌸 *NO SE PUDO ACTUALIZAR*\n${LINEA}\n✿ ${detalle.slice(0, 200)}\n› Revisa la conexión con GitHub o corre \`bash update.sh\` a mano.`);
    }
  },
};
export default command;
