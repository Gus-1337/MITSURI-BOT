import { bot } from '../../config.js';
import { getCommand } from '../../lib/loader.js';
import { enabledCategories } from '../../lib/menu.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'help', aliases: ['ayuda', 'info'], category: 'main',
  description: 'Ver los detalles de un comando', usage: '<comando>', example: '.help play',
  async execute(ctx) {
    const name = (ctx.args[0] || '').replace(/^[.#!\/]/, '').toLowerCase();
    if (!name) {
      const cats = enabledCategories().map(c => `│ ${c.emoji} *${c.name}* → \`${bot.prefix}menu ${c.id}\``).join('\n');
      return ctx.replyButtons({
        text: `🌸 *${bot.name} · AYUDA*\n\n╭─ *Categorías*\n${cats}\n╰───────────────╯\n\n_Escribe \`${bot.prefix}help <comando>\` para ver su uso._`,
        buttons: [
          { label: '📂 Menú', id: `${ctx.prefix}menu` },
          { label: '📜 Comandos', id: `${ctx.prefix}comandos` },
        ],
      });
    }
    const cmd = getCommand(name);
    if (!cmd) return ctx.reply(`❌ El comando *${name}* no existe.\nPrueba con \`${bot.prefix}menu\`.`);
    const lines = [
      `🌸 *COMANDO · ${cmd.name}*`,
      `│ 📝 ${cmd.description}`,
      `│ 📂 Categoría: ${cmd.category}`,
      `│ 🔣 Uso: \`${bot.prefix}${cmd.name}${cmd.usage ? ` ${cmd.usage}` : ''}\``,
      cmd.example ? `│ 💡 Ejemplo: \`${cmd.example}\`` : '',
      cmd.aliases?.length ? `│ 🔁 Alias: ${cmd.aliases.map(a => `\`${a}\``).join(', ')}` : '',
      `│ 🔒 Acceso: ${cmd.access ?? 'all'}`,
      `│ ⏳ Cooldown: ${cmd.cooldown ?? 3}s`,
      '╰───────────────╯',
    ].filter(Boolean);
    return ctx.replyButtons({
      text: lines.join('\n'),
      buttons: [
        { label: '📂 Menú', id: `${ctx.prefix}menu` },
        { label: `📁 ${cmd.category}`, id: `${ctx.prefix}menu ${cmd.category}` },
      ],
    });
  },
};
export default command;
