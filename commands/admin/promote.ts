import { targetJids, requireBotAdmin, shortJid } from '../../lib/group.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'promote', aliases: ['promover', 'admin'], category: 'admin', access: 'admin',
  description: 'Dar administrador a un usuario', usage: '<@mención | responder | número>', example: '.promote @usuario',
  async execute(ctx) {
    const targets = targetJids(ctx);
    if (!targets.length) return ctx.reply('❌ Menciona a alguien, responde a su mensaje o escribe su número.');
    if (!await requireBotAdmin(ctx)) return;
    try {
      const result = await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, 'promote');
      const status = Array.isArray(result) ? (result[0]?.status ?? '200') : '200';
      return ctx.reply(`✅ *Dar administrador a un usuario*\n│ 👤 ${targets.map(shortJid).join(', ')}\n│ 📄 Estado: ${status}`);
    } catch (error: any) {
      return ctx.reply(`❌ No pude hacerlo: ${String(error?.message ?? error).slice(0, 150)}`);
    }
  },
};
export default command;
