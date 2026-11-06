import { formatNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'perfil', aliases: ['profile', 'me'], category: 'perfil',
  description: 'Ver tu perfil del bot', cooldown: 2,
  async execute(ctx) {
    const target = ctx.mentioned[0] ?? ctx.sender;
    const u = ctx.db.getUser(target, ctx.pushName);
    return ctx.reply([
      '👤 *PERFIL*',
      `│ 🌸 Nombre: ${u.name || ctx.pushName}`,
      `│ 📱 Número: +${ctx.senderNumber}`,
      `│ ${u.registered ? '✅' : '❌'} Registrado`,
      `│ ${u.premium ? '💎 Premium' : '🌸 Usuario'}`,
      `│ ⭐ Nivel ${u.level} · ${u.xp} XP`,
      `│ 🪙 ${formatNumber(u.coins)} monedas`,
      `│ 💬 ${formatNumber(u.messages)} mensajes`,
      `│ 📅 Desde: ${new Date(u.createdAt).toLocaleDateString('es-PE')}`,
      '╰───────────────╯',
    ].join('\n'));
  },
};
export default command;
