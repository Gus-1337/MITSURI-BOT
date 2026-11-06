import { limits } from '../../config.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'rango', aliases: ['level', 'nivel', 'xp'], category: 'perfil',
  description: 'Ver tu nivel y progreso de XP', cooldown: 2,
  async execute(ctx) {
    const u = ctx.db.getUser(ctx.sender, ctx.pushName);
    const need = u.level * limits.xpPerLevel;
    const pct = Math.min(100, Math.round((u.xp / need) * 100));
    const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
    return ctx.reply(`⭐ *NIVEL ${u.level}*\n│ [${bar}] ${pct}%\n│ XP: ${u.xp}/${need}\n│ +2 XP por mensaje · +10 XP por trabajar`);
  },
};
export default command;
