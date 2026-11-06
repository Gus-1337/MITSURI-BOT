import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'link', aliases: ['invite', 'enlace'], category: 'admin', access: 'group',
  description: 'Obtener el enlace de invitación del grupo', cooldown: 5,
  async execute(ctx) {
    try {
      const code = await ctx.sock.groupInviteCode(ctx.jid);
      return ctx.reply(`🔗 *Enlace del grupo*\nhttps://chat.whatsapp.com/${code}`);
    } catch {
      return ctx.reply('❌ No pude obtener el enlace. ¿Soy administradora del grupo? 💖');
    }
  },
};
export default command;
