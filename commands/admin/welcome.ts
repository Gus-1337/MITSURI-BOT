import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'welcome', aliases: [], category: 'admin', access: 'admin',
  description: 'Activar o desactivar Mensajes de bienvenida/despedida', usage: '<on|off>', example: '.welcome on',
  async execute(ctx) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = ctx.db.getGroup(ctx.jid).welcome;
      return ctx.reply(`⚙️ *Mensajes de bienvenida/despedida*\n│ Estado: ${current ? '✅ Activo' : '❌ Inactivo'}\n│ Uso: \`${ctx.prefix}welcome on|off\``);
    }
    ctx.db.setGroup(ctx.jid, { welcome: arg === 'on' });
    return ctx.reply(`${arg === 'on' ? '✅ Activado' : '❌ Desactivado'}: *Mensajes de bienvenida/despedida*`);
  },
};
export default command;
