import { setMenuStyle } from '../../lib/settings.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'setmenu', aliases: ['menustyle'], category: 'owner', access: 'owner',
  description: 'Cambiar el estilo del menú', usage: '<list|buttons|text>', example: '.setmenu buttons',
  async execute(ctx) {
    const style = (ctx.args[0] || '').toLowerCase();
    if (!['list', 'buttons', 'text'].includes(style)) return ctx.reply('❌ Estilos: *list* (lista), *buttons* (botones), *text* (texto).');
    setMenuStyle(style);
    return ctx.reply(`✅ Menú en modo *${style}*. Usa \`${ctx.prefix}menu\` para verlo.`);
  },
};
export default command;
