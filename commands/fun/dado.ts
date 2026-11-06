import { randomInt } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'dado', aliases: ['dice', 'dados'], category: 'fun',
  description: 'Lanzar uno o varios dados', usage: '[caras]', example: '.dado 20', cooldown: 2,
  async execute(ctx) {
    const sides = Math.min(100, Math.max(2, Number(ctx.args[0]) || 6));
    const rolls = Array.from({ length: 3 }, () => randomInt(1, sides));
    return ctx.reply(`🎲 *Dado de ${sides} caras*\n│ Resultados: ${rolls.join(' · ')}\n│ Total: ${rolls.reduce((a, b) => a + b, 0)}`);
  },
};
export default command;
