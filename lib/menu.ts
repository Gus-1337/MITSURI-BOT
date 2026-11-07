/**
 * Constructor de menús por categorías.
 * Lee las categorías (nombre, emoji, banner y link) desde config.ts y los
 * comandos desde el registro cargado por lib/loader.ts.
 */
import { bot, categories, menu, theme } from '../config.js';
import { sendButtons, sendList } from './buttons.js';
import { getCommandsByCategory, allCommands } from './loader.js';
import { getPrefixes } from './db.js';
import { truncate } from './utils.js';
import type { Message, Socket, Command } from './types.js';
import type { CategoryConfig } from './config-types.js';

export interface MenuOptions { quoted?: Message | boolean; page?: number }

export function enabledCategories() {
  return Object.values(categories).filter(c => c.enabled).sort((a, b) => a.order - b.order);
}

/** Comandos visibles de una categoría (respeta `folder` y `only` del config). */
export function categoryCommands(cat: CategoryConfig): Command[] {
  let cmds = getCommandsByCategory(cat.folder ?? cat.id).filter(c => !c.hidden && c.enabled !== false);
  if (cat.only?.length) cmds = cmds.filter(c => cat.only!.includes(c.name));
  return cmds;
}

export function resolveCategory(input: string): string | null {
  const key = (input || '').trim().toLowerCase();
  if (!key) return null;
  if (categories[key]) return key;
  return Object.values(categories).find(c =>
    c.name.toLowerCase() === key || c.emoji === input.trim(),
  )?.id ?? null;
}

/** Encabezado limpio: sin estadísticas ni listas de relleno. */
export function header(): string {
  return [
    theme.menuTitle,
    `│ ${theme.menuSubtitle}`,
    '│',
    `│ 👑 Dueño: *${bot.owner.name}*${bot.owner.number ? ` (+${bot.owner.number})` : ''}`,
    `│ 🔣 Prefijos: ${getPrefixes().join(' ')}`,
    '╰───────────────╯',
  ].join('\n');
}

/** Texto completo SOLO para el modo `text` (sin botones, necesita la lista para navegar). */
export function mainMenuText(page = 1, perPage = 7): string {
  const cats = enabledCategories();
  const pages = Math.max(1, Math.ceil(cats.length / perPage));
  const p = Math.min(Math.max(1, page), pages);
  const slice = cats.slice((p - 1) * perPage, p * perPage);
  const list = slice.map(c => `│ ${c.emoji} *${c.name}* · \`${bot.prefix}menu ${c.id}\``).join('\n');
  return [
    header(),
    '',
    `📂 *CATEGORÍAS*  (${p}/${pages})`,
    list,
    '',
    `_Ejemplo: \`${bot.prefix}menu anime\`_`,
  ].join('\n');
}

/** Menú principal: lista desplegable, botones paginados o texto (según config.menu.style). */
export async function sendMainMenu(sock: Socket, jid: string, opts: MenuOptions = {}): Promise<any> {
  const cats = enabledCategories();
  const main = categories.main;
  const page = Math.max(1, opts.page ?? 1);
  const q = { quoted: opts.quoted };

  if (menu.style === 'text') {
    return sock.sendMessage(jid, { text: truncate(mainMenuText(page), 4000) }, q);
  }

  const text = header();

  if (menu.style === 'buttons') {
    const perPage = menu.buttonsPerPage;
    const pages = Math.max(1, Math.ceil(cats.length / perPage));
    const p = Math.min(page, pages);
    const buttons = cats.slice((p - 1) * perPage, p * perPage).map(c => ({
      label: `${c.emoji} ${c.name}`,
      id: `${bot.prefix}menu ${c.id}`,
    }));
    if (p > 1) buttons.push({ label: menu.prevLabel, id: `${bot.prefix}menu ${p - 1}` });
    if (p < pages) buttons.push({ label: menu.nextLabel, id: `${bot.prefix}menu ${p + 1}` });
    return sendButtons(sock, jid, {
      text, buttons,
      image: menu.showBanner ? main.banner : undefined,
      footer: theme.footer,
      link: { label: main.linkLabel, url: main.link },
      quoted: opts.quoted,
    });
  }

  // Por defecto: lista interactiva (un botón que despliega todas las categorías).
  const sections = [
    {
      title: '📂 Categorías',
      rows: cats.map(c => ({
        title: `${c.emoji} ${c.name}`,
        description: c.description,
        id: `${bot.prefix}menu ${c.id}`,
      })),
    },
    {
      title: 'ℹ️ Accesos rápidos',
      rows: [
        { title: '🏓 Ping', description: 'Velocidad del bot', id: `${bot.prefix}ping` },
        { title: '📊 Info', description: 'Estado del bot', id: `${bot.prefix}infobot` },
        { title: '📜 Comandos', description: 'Lista completa', id: `${bot.prefix}comandos` },
      ],
    },
  ];
  return sendList(sock, jid, {
    text, title: `${bot.name} · Menú`, buttonLabel: menu.listButtonLabel,
    sections, image: menu.showBanner ? main.banner : undefined,
    footer: theme.footer, link: { label: main.linkLabel, url: main.link },
    quoted: opts.quoted,
  });
}

/** Menú de UNA categoría: lista de comandos + botones + banner + link de la categoría. */
export async function sendCategoryMenu(sock: Socket, jid: string, categoryId: string, opts: MenuOptions = {}): Promise<any> {
  const cat = categories[categoryId];
  if (!cat) return sock.sendMessage(jid, { text: `❌ Categoría *${categoryId}* no existe.` }, { quoted: opts.quoted });
  const cmds = categoryCommands(cat);
  const perPage = 8;
  const pages = Math.max(1, Math.ceil(cmds.length / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const slice = cmds.slice((page - 1) * perPage, page * perPage);

  const lines = slice.length
    ? slice.map(c => `│ ✧ \`${bot.prefix}${c.name}${c.usage ? ` ${c.usage}` : ''}\`\n│    ${c.description}`).join('\n')
    : '│ _(sin comandos disponibles)_';
  const text = [
    `${cat.emoji} *${cat.name.toUpperCase()}* · ${bot.name}`,
    `│ ${cat.description}`,
    `│ 📄 Página ${page}/${pages} · ${cmds.length} comandos`,
    '╰───────────────╯',
    '',
    lines,
    '',
    `_Usa \`${bot.prefix}help <comando>\` para ver los detalles._`,
  ].join('\n');

  const buttons: { label: string; id: string }[] = slice.slice(0, 3).map(c => ({
    label: `ℹ️ ${c.name}`,
    id: `${bot.prefix}help ${c.name}`,
  }));
  if (page > 1) buttons.push({ label: menu.prevLabel, id: `${bot.prefix}menu ${cat.id} ${page - 1}` });
  if (page < pages) buttons.push({ label: menu.nextLabel, id: `${bot.prefix}menu ${cat.id} ${page + 1}` });
  buttons.push({ label: menu.backLabel, id: `${bot.prefix}menu` });

  return sendButtons(sock, jid, {
    text, buttons,
    title: `${cat.emoji} ${cat.name}`,
    image: menu.showBanner ? cat.banner : undefined,
    footer: `${theme.footer} · ${cat.name}`,
    link: { label: cat.linkLabel, url: cat.link },
    quoted: opts.quoted,
  });
}

/** Lista completa de comandos en texto (comando .comandos). */
export function allCommandsText(): string {
  const chunks = enabledCategories().map(cat => {
    const cmds = categoryCommands(cat);
    if (!cmds.length) return '';
    return `${cat.emoji} *${cat.name.toUpperCase()}*\n${cmds.map(c => `│ ${bot.prefix}${c.name}${c.usage ? ` ${c.usage}` : ''}`).join('\n')}`;
  }).filter(Boolean);
  return `*📜 ${bot.name} · COMANDOS*\n\n${chunks.join('\n\n')}\n\n_Total: ${allCommands().filter(c => !c.hidden).length} comandos_`;
}

export default { sendMainMenu, sendCategoryMenu, mainMenuText, allCommandsText, resolveCategory, enabledCategories };
