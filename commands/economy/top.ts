import { formatNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'top', aliases: ['ranking', 'ricos', 'leaderboard'], category: 'economy',
  description: 'Top 10 de usuarios con más monedas', cooldown: 5,
  async execute(ctx) {
    const field = /nivel|level|xp/i.test(ctx.text) ? 'level' : 'coins';
    const users = ctx.db.topUsers(field as 'coins' | 'level', 10);
    if (!users.length) return ctx.reply('📊 Todavía no hay datos. ¡Sé el primero en usar el bot!');
    const medals = ['🥇', '🥈', '🥉'];
    const lines = users.map((u, i) => `│ ${medals[i] ?? '🔹'} ${i + 1}. ${u.name || u.jid.split('@')[0]} · ${formatNumber(field === 'coins' ? u.coins : u.level)}${field === 'coins' ? ' 🪙' : ' ⭐'}`);
    return ctx.reply(`🏆 *TOP 10 · ${field === 'coins' ? 'MONEDAS' : 'NIVELES'}*\n${lines.join('\n')}\n╰───────────────╯`);
  },
};
export default command;
