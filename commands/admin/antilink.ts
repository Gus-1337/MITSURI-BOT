import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'antilink', aliases: [], category: 'admin', access: 'admin',
  description: 'Activar o desactivar Anti-enlaces (borra y expulsa)', usage: '<on|off>', example: '.antilink on',
  async execute(ctx) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = ctx.db.getGroup(ctx.jid).antilink;
      return ctx.reply(`⚙️ *Anti-enlaces (borra y expulsa)*\n│ Estado: ${current ? '✅ Activo' : '❌ Inactivo'}\n│ Uso: \`${ctx.prefix}antilink on|off\``);
    }
    ctx.db.setGroup(ctx.jid, { antilink: arg === 'on' });
    return ctx.reply(`${arg === 'on' ? '✅ Activado' : '❌ Desactivado'}: *Anti-enlaces (borra y expulsa)*`);
  },
};
export default command;
