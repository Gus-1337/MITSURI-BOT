import { formatNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'bal', aliases: ['balance', 'monedas', 'coins', 'wallet'], category: 'economy',
  description: 'Ver tu saldo, banco y nivel', cooldown: 2,
  async execute(ctx) {
    const target = ctx.mentioned[0] ?? ctx.sender;
    const u = ctx.db.getUser(target, ctx.pushName);
    return ctx.reply([
      '💰 *BALANCE*',
      `│ 👤 ${u.name || ctx.pushName}`,
      `│ 🪙 Monedas: ${formatNumber(u.coins)}`,
      `│ 🏦 Banco: ${formatNumber(u.bank)}`,
      `│ ⭐ Nivel ${u.level} · ${u.xp} XP`,
      `│ 💬 Mensajes: ${u.messages}`,
      '╰───────────────╯',
    ].join('\n'));
  },
};
export default command;
