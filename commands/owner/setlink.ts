import { categories } from '../../config.js';
import { setLink } from '../../lib/settings.js';
import { extractUrl } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'setlink', aliases: ['linkcat'], category: 'owner', access: 'owner',
  description: 'Cambiar el enlace del botón de una categoría', usage: '<categoría> <url>',
  example: '.setlink anime https://mi-sitio.com',
  async execute(ctx) {
    const [cat, ...rest] = ctx.args;
    const url = extractUrl(rest.join(' '));
    if (!cat || !url) return ctx.reply(`❌ Uso: \`${ctx.prefix}setlink <categoría> <url>\``);
    const ok = setLink(cat.toLowerCase(), url);
    return ctx.reply(ok ? `✅ Link de *${cat}* actualizado 🔗` : `❌ No existe la categoría *${cat}*.`);
  },
};
export default command;
