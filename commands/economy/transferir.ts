import { targetJids } from '../../lib/group.js';
import { formatNumber, jidToNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'transferir', aliases: ['pay', 'pagar', 'dar'], category: 'economy',
  description: 'Transferir monedas a otro usuario', usage: '<cantidad> @usuario', example: '.transferir 100 @amigo',
  async execute(ctx) {
    const amount = Number((ctx.args[0] || '').replace(/[^0-9]/g, ''));
    const targets = targetJids(ctx);
    const target = targets.find(j => j !== ctx.sender) ?? targets[0];
    if (!Number.isFinite(amount) || amount <= 0 || !target) {
      return ctx.reply(`❌ Uso: \`${ctx.prefix}transferir <cantidad> @usuario\``);
    }
    const me = ctx.db.getUser(ctx.sender, ctx.pushName);
    if (me.coins < amount) return ctx.reply(`❌ Solo tienes ${formatNumber(me.coins)} 🪙.`);
    ctx.db.addCoins(ctx.sender, -amount);
    ctx.db.addCoins(target, amount);
    return ctx.reply(`✅ Transferiste *${formatNumber(amount)} 🪙* a @${jidToNumber(target)}`, { mentions: [target] });
  },
};
export default command;
