import { setBotName } from '../../lib/settings.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'setbotname', aliases: ['botname'], category: 'owner', access: 'owner',
  description: 'Cambiar el nombre del bot', usage: '<nombre>', example: '.setbotname MITSURI-MD',
  async execute(ctx) {
    const name = ctx.text.trim();
    if (!name) return ctx.reply('❌ Escribe el nuevo nombre.');
    setBotName(name.slice(0, 40));
    return ctx.reply(`✅ Ahora me llamo *${name.slice(0, 40)}* 🌸`);
  },
};
export default command;
