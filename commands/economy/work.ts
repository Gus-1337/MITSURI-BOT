import { limits } from '../../config.js';
import { randomInt, formatNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const JOBS = ['🌸 repartiste flores', '🍰 horneaste pasteles', '⚔️ entrenaste con tu espada', '📦 ayudaste en el dojo', '🎏 pintaste carteles'];
const command: Command = {
  name: 'work', aliases: ['trabajar', 'trabajo'], category: 'economy',
  description: 'Trabajar para ganar monedas', cooldown: 5,
  async execute(ctx) {
    const u = ctx.db.getUser(ctx.sender, ctx.pushName);
    const wait = 5 * 60 * 1000;
    if (Date.now() - u.lastWork < wait) {
      return ctx.reply(`⏳ Estás cansad@. Vuelve en *${Math.ceil((wait - (Date.now() - u.lastWork)) / 60000)} min*.`);
    }
    const earned = randomInt(limits.workMin, limits.workMax);
    ctx.db.updateUser(ctx.sender, { lastWork: Date.now() });
    ctx.db.addCoins(ctx.sender, earned);
    ctx.db.addXp(ctx.sender, 10);
    return ctx.reply(`💼 *Trabajo terminado*\n│ ${JOBS[Math.floor(Math.random() * JOBS.length)]}\n│ +${formatNumber(earned)} 🪙 · +10 XP`);
  },
};
export default command;
