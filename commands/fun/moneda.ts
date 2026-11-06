import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'moneda', aliases: ['coin', 'caraocruz'], category: 'fun',
  description: 'Lanzar una moneda', cooldown: 2,
  async execute(ctx) {
    const r = Math.random() < 0.5 ? '🪙 Cara' : '🪙 Cruz';
    return ctx.reply(`🌸 *${r}*${ctx.text ? `\n│ Motivo: ${ctx.text}` : ''}`);
  },
};
export default command;
