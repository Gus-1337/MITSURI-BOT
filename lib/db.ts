/**
 * Base de datos JSON local, sin dependencias externas.
 * Guarda usuarios (economía/niveles), grupos y ajustes en ./database/.
 * Escritura atómica + debounce para no machacar el disco en cada mensaje.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bot, limits } from '../config.js';
import type { GroupData, UserData } from './types.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_DIR = process.env.DB_DIR || path.join(ROOT, 'database');
const DB_FILE = path.join(DB_DIR, 'database.json');

export interface DatabaseShape {
  users: Record<string, UserData>;
  groups: Record<string, GroupData>;
  bans: { users: string[]; groups: string[] };
  settings: Record<string, any>;
  stats: { messages: number; commands: number; startedAt: number };
  subs: string[];
}

const emptyUser = (jid: string, name = ''): UserData => ({
  jid, name, coins: 0, bank: 0, xp: 0, level: 1,
  registered: false, lastDaily: 0, lastWork: 0, messages: 0,
  banned: false, premium: false, createdAt: Date.now(),
});

const emptyGroup = (jid: string): GroupData => ({
  jid, welcome: false, antilink: false, nsfw: false, onlyAdmin: false, banned: false,
});

const emptyDb = (): DatabaseShape => ({
  users: {}, groups: {}, bans: { users: [], groups: [] }, settings: {},
  stats: { messages: 0, commands: 0, startedAt: Date.now() }, subs: [],
});

let data: DatabaseShape = emptyDb();
let saveTimer: NodeJS.Timeout | null = null;

export function load(): DatabaseShape {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const base = emptyDb();
      data = {
        ...base, ...parsed,
        users: { ...base.users, ...(parsed.users ?? {}) },
        groups: { ...base.groups, ...(parsed.groups ?? {}) },
        bans: { ...base.bans, ...(parsed.bans ?? {}) },
        settings: { ...base.settings, ...(parsed.settings ?? {}) },
        stats: { ...base.stats, ...(parsed.stats ?? {}) },
        subs: parsed.subs ?? [],
      };
    }
  } catch (error) {
    console.error('[DB] No se pudo leer database.json, se usa una base vacía:', error);
    data = emptyDb();
  }
  return data;
}

export function flush(): void {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
  } catch (error) {
    console.error('[DB] Error al guardar:', error);
  }
}

function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; flush(); }, 250);
  saveTimer.unref?.();
}

/* ───────────────────────── Usuarios ───────────────────────── */

export function getUser(jid: string, name = ''): UserData {
  if (!data.users[jid]) { data.users[jid] = emptyUser(jid, name); scheduleSave(); }
  else if (name && !data.users[jid].name) { data.users[jid].name = name; scheduleSave(); }
  return data.users[jid];
}

export function updateUser(jid: string, patch: Partial<UserData>): UserData {
  const user = getUser(jid);
  Object.assign(user, patch);
  scheduleSave();
  return user;
}

export function addCoins(jid: string, amount: number): UserData {
  const user = getUser(jid);
  user.coins = Math.max(0, user.coins + Math.floor(amount));
  scheduleSave();
  return user;
}

export function addXp(jid: string, amount: number): { user: UserData; leveledUp: boolean } {
  const user = getUser(jid);
  user.xp += amount;
  let leveledUp = false;
  while (user.xp >= user.level * limits.xpPerLevel) {
    user.xp -= user.level * limits.xpPerLevel;
    user.level += 1;
    user.coins += 100;
    leveledUp = true;
  }
  scheduleSave();
  return { user, leveledUp };
}

export function topUsers(field: 'coins' | 'level' | 'xp' = 'coins', limit = 10): UserData[] {
  return Object.values(data.users).sort((a, b) => b[field] - a[field]).slice(0, limit);
}

/* ───────────────────────── Grupos ─────────────────────────── */

export function getGroup(jid: string): GroupData {
  if (!data.groups[jid]) { data.groups[jid] = emptyGroup(jid); scheduleSave(); }
  return data.groups[jid];
}

export function setGroup(jid: string, patch: Partial<GroupData>): GroupData {
  return Object.assign(getGroup(jid), patch, (scheduleSave(), {}));
}

/* ───────────────────────── Bans ───────────────────────────── */

export function banUser(jid: string): void { if (!data.bans.users.includes(jid)) data.bans.users.push(jid); scheduleSave(); }
export function unbanUser(jid: string): void { data.bans.users = data.bans.users.filter(j => j !== jid); scheduleSave(); }
export function isUserBanned(jid: string): boolean { return data.bans.users.includes(jid); }
export function banGroup(jid: string): void { if (!data.bans.groups.includes(jid)) data.bans.groups.push(jid); scheduleSave(); }
export function unbanGroup(jid: string): void { data.bans.groups = data.bans.groups.filter(j => j !== jid); scheduleSave(); }
export function isGroupBanned(jid: string): boolean { return data.bans.groups.includes(jid); }

/* ─────────────────────── Ajustes ──────────────────────────── */

export function getSetting<T = any>(key: string, fallback?: T): T | undefined {
  return (data.settings[key] ?? fallback) as T | undefined;
}
export function setSetting(key: string, value: any): void { data.settings[key] = value; scheduleSave(); }
export function allSettings(): Record<string, any> { return data.settings; }

export function getPrefixes(): string[] {
  return getSetting<string[]>('prefixes', [...bot.prefixes]) ?? [...bot.prefixes];
}

/* ─────────────────────── Estadísticas ─────────────────────── */

export function bumpStats(kind: 'messages' | 'commands'): void {
  data.stats[kind] += 1;
  scheduleSave();
}
export function getStats(): DatabaseShape['stats'] { return data.stats; }

/* ─────────────────────── Sub-bots ─────────────────────────── */

export function addSub(number: string): void { if (!data.subs.includes(number)) data.subs.push(number); scheduleSave(); }
export function removeSub(number: string): void { data.subs = data.subs.filter(n => n !== number); scheduleSave(); }
export function listSubs(): string[] { return [...data.subs]; }

load();
process.on('exit', flush);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => { flush(); });
}

export default { load, flush, getUser, updateUser, addCoins, addXp, topUsers, getGroup, setGroup, banUser, unbanUser, isUserBanned, banGroup, unbanGroup, isGroupBanned, getSetting, setSetting, allSettings, getPrefixes, bumpStats, getStats, addSub, removeSub, listSubs };
