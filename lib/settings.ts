/**
 * Ajustes persistentes (.setprefix, .setbanner, .setlink, .nsfw on…).
 * Se guardan en database/ y se aplican tanto a los objetos vivos del motor
 * como a `config`, para que sobrevivan al hot-reload de config.ts.
 */
import { config, bot, categories, limits, menu } from '../config.js';
import * as db from './db.js';

export function applySettings(): void {
  const s = db.allSettings();
  if (Array.isArray(s.prefixes) && s.prefixes.length) {
    (bot as any).prefixes = s.prefixes;
    (config as any).prefix = s.prefixes.join('');
  }
  if (typeof s.nsfwEnabled === 'boolean') {
    (limits as any).nsfwEnabled = s.nsfwEnabled;
    (config as any).nsfwEnabled = s.nsfwEnabled;
  }
  if (['list', 'buttons', 'text'].includes(s.menuStyle)) {
    (menu as any).style = s.menuStyle;
    (config as any).menuStyle = s.menuStyle;
  }
  if (typeof s.botName === 'string' && s.botName.trim()) {
    (config as any).botName = s.botName.trim();
    (bot as any).name = s.botName.trim();
  }
  if (s.banners && typeof s.banners === 'object') {
    Object.assign(config.banners, s.banners);
    for (const [id, url] of Object.entries(s.banners)) {
      if (categories[id] && typeof url === 'string') (categories[id] as any).banner = url;
    }
  }
  if (s.links && typeof s.links === 'object') {
    Object.assign(config.links, s.links);
    for (const [id, url] of Object.entries(s.links)) {
      if (categories[id] && typeof url === 'string') (categories[id] as any).link = url;
    }
  }
}

export function setPrefixes(prefixes: string[]): void {
  (bot as any).prefixes = prefixes;
  (config as any).prefix = prefixes.join('');
  db.setSetting('prefixes', prefixes);
}

export function setBanner(categoryId: string, url: string): boolean {
  if (!categories[categoryId]) return false;
  (categories[categoryId] as any).banner = url;
  (config.banners as any)[categoryId] = url;
  db.setSetting('banners', { ...(db.getSetting<Record<string, string>>('banners', {}) ?? {}), [categoryId]: url });
  return true;
}

export function setLink(categoryId: string, url: string): boolean {
  if (!categories[categoryId]) return false;
  (categories[categoryId] as any).link = url;
  (config.links as any)[categoryId] = url;
  db.setSetting('links', { ...(db.getSetting<Record<string, string>>('links', {}) ?? {}), [categoryId]: url });
  return true;
}

export function setNsfw(enabled: boolean): void {
  (limits as any).nsfwEnabled = enabled;
  (config as any).nsfwEnabled = enabled;
  db.setSetting('nsfwEnabled', enabled);
}

export function setMenuStyle(style: string): void {
  (menu as any).style = style;
  (config as any).menuStyle = style;
  db.setSetting('menuStyle', style);
}

export function setBotName(name: string): void {
  (config as any).botName = name;
  (bot as any).name = name;
  db.setSetting('botName', name);
}
