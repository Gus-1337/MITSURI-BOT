import { setPrefixes, applySettings } from '../../lib/settings.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'setprefix', aliases: ['prefijo'], category: 'owner', access: 'owner',
  description: 'Cambiar los prefijos del bot', usage: '<caracteres>', example: '.setprefix .#',
  async execute(ctx) {
    const value = (ctx.args[0] || '').trim();
    if (!value) return ctx.reply(`❌ Uso: \`${ctx.prefix}setprefix .#\` (cada carácter es un prefijo)`);
    const prefixes = [...new Set(value.split(''))].filter(c => !/\s/.test(c));
    setPrefixes(prefixes);
    applySettings();
    return ctx.reply(`✅ Prefijos: ${prefixes.join(' ')}`);
  },
};
export default command;
