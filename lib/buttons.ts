/**
 * Botones interactivos nativos del fork "baileys-beta" (Native Flow).
 *
 * El fork acepta `sock.sendMessage(jid, { text, footer, interactiveButtons })`,
 * genera un `interactiveMessage.nativeFlowMessage.buttons` y lo envía.
 * Si WhatsApp o el fork rechazan el mensaje interactivo, hacemos fallback
 * automático a texto numerado para que el bot NUNCA se quede sin responder.
 *
 * Los IDs de los botones son comandos completos (".menu anime", ".ping"…)
 * y handler.ts los ejecuta igual que si el usuario los hubiera escrito.
 */
import { bot, theme } from '../config.js';
import type { ButtonItem, ButtonsOptions, Message, Socket } from './types.js';
import { truncate } from './utils.js';

export interface ListRow { title: string; id: string; description?: string }
export interface ListSection { title: string; rows: ListRow[] }
export interface ListOptions {
  text: string;
  buttonLabel: string;
  sections: ListSection[];
  title?: string;
  footer?: string;
  image?: string;
  link?: { label: string; url: string };
  quoted?: Message | boolean;
}

function quickButtons(items: ButtonItem[]) {
  return items.map(b => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: b.label.slice(0, 24), id: b.id }),
  }));
}

function linkButtons(link?: { label: string; url: string }) {
  return link ? [{
    name: 'cta_url',
    buttonParamsJson: JSON.stringify({ display_text: link.label.slice(0, 24), url: link.url, webview_interaction: false }),
  }] : [];
}

function quotedOptions(quoted?: Message | boolean): any {
  if (quoted === false || !quoted) return {};
  return { quoted };
}

/** Fallback legible: lista numerada con los comandos que se pueden escribir. */
function fallbackText(opts: ButtonsOptions): string {
  const lines = opts.buttons.map((b, i) => `│ ${i + 1}️⃣ ${b.label} → \`${b.id}\``).join('\n');
  const link = opts.link ? `\n╰ 🔗 ${opts.link.label}: ${opts.link.url}` : '';
  return `${opts.text}\n\n╭─ *Opciones*\n${lines}${link}\n\n_Escribe el comando si tu WhatsApp no muestra los botones._`;
}

/** Envía un mensaje con botones rápidos (quick_reply) + opcional botón URL. */
export async function sendButtons(sock: Socket, jid: string, opts: ButtonsOptions): Promise<any> {
  const buttons = [...quickButtons(opts.buttons), ...linkButtons(opts.link)];
  const q = quotedOptions(opts.quoted);
  const footer = opts.footer || theme.footer;
  const title = opts.title || `${bot.name} 💖`;

  // Intento 1: botones + banner de imagen (el fork sube la imagen como header).
  if (opts.image) {
    try {
      return await sock.sendMessage(jid, {
        text: opts.text, footer, title, image: { url: opts.image }, interactiveButtons: buttons,
      } as any, q);
    } catch (error) {
      console.warn('[UI] No se pudo enviar banner con botones, reintento sin imagen:', (error as Error)?.message);
    }
  }
  // Intento 2: botones con texto plano.
  try {
    return await sock.sendMessage(jid, {
      text: opts.text, footer, title, interactiveButtons: buttons,
    } as any, q);
  } catch (error) {
    console.warn('[UI] No se pudo enviar mensaje interactivo, uso texto:', (error as Error)?.message);
  }
  // Intento 3: texto numerado (100% compatible).
  return sock.sendMessage(jid, { text: truncate(fallbackText(opts), 4000) }, q);
}

/** Envía una lista desplegable (single_select): ideal para el menú de categorías. */
export async function sendList(sock: Socket, jid: string, opts: ListOptions): Promise<any> {
  const listButton = {
    name: 'single_select',
    buttonParamsJson: JSON.stringify({
      title: opts.buttonLabel,
      sections: opts.sections.map(s => ({
        title: s.title,
        rows: s.rows.map(r => ({ title: r.title.slice(0, 24), description: (r.description || '').slice(0, 60), id: r.id })),
      })),
    }),
  };
  const buttons = [listButton, ...linkButtons(opts.link)];
  const q = quotedOptions(opts.quoted);
  const footer = opts.footer || theme.footer;

  if (opts.image) {
    try {
      return await sock.sendMessage(jid, {
        text: opts.text, footer, title: opts.title || bot.name,
        image: { url: opts.image }, interactiveButtons: buttons,
      } as any, q);
    } catch (error) {
      console.warn('[UI] Lista con banner falló, reintento sin imagen:', (error as Error)?.message);
    }
  }
  try {
    return await sock.sendMessage(jid, {
      text: opts.text, footer, title: opts.title || bot.name, interactiveButtons: buttons,
    } as any, q);
  } catch (error) {
    console.warn('[UI] Lista interactiva falló, uso texto:', (error as Error)?.message);
  }
  const lines = opts.sections.flatMap(s => [
    `╭─ *${s.title}*`,
    ...s.rows.map(r => `│ • ${r.title} → \`${r.id}\``),
  ]).join('\n');
  return sock.sendMessage(jid, {
    text: truncate(`${opts.text}\n\n${lines}${opts.link ? `\n╰ 🔗 ${opts.link.label}: ${opts.link.url}` : ''}`, 4000),
  }, q);
}

export default { sendButtons, sendList };
