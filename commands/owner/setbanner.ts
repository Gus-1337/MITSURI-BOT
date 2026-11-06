import { categories } from '../../config.js';
import { setBanner } from '../../lib/settings.js';
import { extractUrl } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'setbanner', aliases: ['banner'], category: 'owner', access: 'owner',
  description: 'Cambiar el banner (imagen) de una categoría en caliente', usage: '<categoría> <url>',
  example: '.setbanner anime https://.../banner.jpg',
  async execute(ctx) {
    const [cat, ...rest] = ctx.args;
    const url = extractUrl(rest.join(' '));
    if (!cat || !url) return ctx.reply(`❌ Uso: \`${ctx.prefix}setbanner <categoría> <url>\`\n📂 Categorías: ${Object.keys(categories).join(', ')}`);
    const ok = setBanner(cat.toLowerCase(), url);
    return ctx.reply(ok ? `✅ Banner de *${cat}* actualizado 🌸` : `❌ No existe la categoría *${cat}*.`);
  },
};
export default command;
