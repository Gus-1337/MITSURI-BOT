import { sendMainMenu, sendCategoryMenu, resolveCategory, enabledCategories } from '../../lib/menu.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'menu', aliases: ['menú', 'inicio', 'start', 'ayudamenu'], category: 'main',
  description: 'Menú principal por categorías con botones', usage: '[categoría|página] [página]',
  example: '.menu anime', cooldown: 0, // navegar entre botones no debe tener espera
  async execute(ctx) {
    const [first, second] = ctx.args;
    if (!first) return sendMainMenu(ctx.sock, ctx.jid, { quoted: ctx.msg });
    if (/^\d+$/.test(first)) return sendMainMenu(ctx.sock, ctx.jid, { page: Number(first), quoted: ctx.msg });
    const cat = resolveCategory(first);
    if (!cat) {
      const list = enabledCategories().map(c => `${c.emoji} ${c.id}`).join(' · ');
      return ctx.reply(`❌ Categoría *${first}* no encontrada.\n\n📂 Disponibles:\n${list}`);
    }
    const page = second && /^\d+$/.test(second) ? Number(second) : 1;
    return sendCategoryMenu(ctx.sock, ctx.jid, cat, { page, quoted: ctx.msg });
  },
};
export default command;
