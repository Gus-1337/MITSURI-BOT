import { limits } from '../../config.js';
import { dayPassed, formatNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'daily', aliases: ['diario', 'reclamo'], category: 'economy',
  description: 'Recompensa diaria de monedas', cooldown: 5,
  async execute(ctx) {
    const u = ctx.db.getUser(ctx.sender, ctx.pushName);
    if (!dayPassed(u.lastDaily)) {
      const hours = Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - u.lastDaily)) / 3600000);
      return ctx.reply(`⏳ Ya reclamaste tu daily. Vuelve en *${hours}h*.`);
    }
    ctx.db.updateUser(ctx.sender, { lastDaily: Date.now() });
    ctx.db.addCoins(ctx.sender, limits.dailyReward);
    return ctx.reply(`🎁 *Daily reclamado*\n│ +${formatNumber(limits.dailyReward)} 🪙\n│ 💰 Total: ${formatNumber(u.coins + limits.dailyReward)}`);
  },
};
export default command;
