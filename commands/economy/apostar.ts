import { randomInt, formatNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'apostar', aliases: ['bet', 'ruleta', 'coinflip'], category: 'economy',
  description: 'Apuesta monedas a cara o cruz', usage: '<cantidad> <cara|cruz>', example: '.apostar 100 cara',
  async execute(ctx) {
    const amount = Number((ctx.args[0] || '').replace(/[^0-9]/g, ''));
    const choice = (ctx.args[1] || '').toLowerCase();
    if (!amount || amount <= 0 || !['cara', 'cruz'].includes(choice)) {
      return ctx.reply(`❌ Uso: \`${ctx.prefix}apostar <cantidad> cara|cruz\``);
    }
    const u = ctx.db.getUser(ctx.sender, ctx.pushName);
    if (u.coins < amount) return ctx.reply(`❌ Solo tienes ${formatNumber(u.coins)} 🪙.`);
    const result = randomInt(0, 1) === 0 ? 'cara' : 'cruz';
    const win = result === choice;
    ctx.db.addCoins(ctx.sender, win ? amount : -amount);
    return ctx.reply(`${win ? '🎉 *¡GANASTE!*' : '😢 *Perdiste*'}\n│ 🪙 Salió: *${result}*\n│ ${win ? '+' : '-'}${formatNumber(amount)} 🪙\n│ 💰 Saldo: ${formatNumber(ctx.db.getUser(ctx.sender).coins)}`);
  },
};
export default command;
