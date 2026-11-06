/**
 * Cargador dinámico de comandos.
 * Escanea recursivamente commands/<categoria>/*.ts y registra cada comando.
 * La categoría se toma del nombre de la carpeta (o de cmd.category).
 * Funciona tanto con `tsx` (.ts) como con el build compilado (.js).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Command } from './types.js';
import { categories } from '../config.js';

const registry = new Map<string, Command>();
const unique: Command[] = [];
const ext = import.meta.url.endsWith('.ts') ? '.ts' : '.js';

export function commandRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'commands');
}

async function walk(dir: string): Promise<string[]> {
  let entries: import('node:fs').Dirent[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith(ext) && !entry.name.endsWith(`.d${ext}`)) files.push(full);
  }
  return files.sort();
}

function isCommand(value: any): value is Command {
  return !!value && typeof value === 'object' && typeof value.name === 'string' && typeof value.execute === 'function';
}

function register(cmd: Command, fallbackCategory: string): void {
  const category = cmd.category || fallbackCategory;
  const normalized: Command = {
    access: 'all', enabled: true, hidden: false, aliases: [],
    ...cmd,
    category,
    name: cmd.name.toLowerCase().trim(),
  };
  for (const name of [normalized.name, ...(normalized.aliases ?? []).map(a => a.toLowerCase().trim())]) {
    if (!name) continue;
    if (registry.has(name) && registry.get(name) !== normalized) {
      console.warn(`[LOADER] Comando duplicado "${name}" en ${category}, se conserva el primero.`);
      continue;
    }
    registry.set(name, normalized);
  }
  unique.push(normalized);
}

/** (Re)carga todos los comandos; útil para el comando .reload del dueño. */
export async function loadCommands(): Promise<number> {
  registry.clear();
  unique.length = 0;
  const root = commandRoot();
  const files = await walk(root);
  let loaded = 0;
  for (const file of files) {
    const relative = path.relative(root, file);
    const folder = relative.split(path.sep)[0] || 'main';
    try {
      const mod: any = await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
      const exported = mod.default ?? mod.command ?? mod.cmd;
      const list: Command[] = Array.isArray(mod.commands)
        ? mod.commands
        : Array.isArray(exported) ? exported : exported ? [exported] : [];
      if (!list.length) {
        // Permite también `export const xyz: Command = {...}` sin default.
        const found = Object.values(mod).find(isCommand) as Command | undefined;
        if (found) list.push(found);
      }
      for (const cmd of list) {
        if (!isCommand(cmd)) { console.warn(`[LOADER] ${relative} no exporta un comando válido.`); continue; }
        register(cmd, folder);
        loaded++;
      }
    } catch (error) {
      console.error(`[LOADER] Error al cargar ${relative}:`, error);
    }
  }
  return loaded;
}

export function getCommand(name: string): Command | undefined {
  return registry.get((name || '').toLowerCase().trim());
}
export function allCommands(): Command[] { return [...unique]; }
export function getCommandsByCategory(category: string): Command[] {
  return unique.filter(c => c.category === category);
}
export function commandCount(): number { return unique.length; }
export function categoryIds(): string[] { return Object.keys(categories); }

export default { loadCommands, getCommand, allCommands, getCommandsByCategory, commandCount };
