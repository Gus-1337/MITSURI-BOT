import { targetJids } from '../../lib/group.js';
import type { Command } from '../../lib/types.js';

export const commands: Command[] = [
  {
    name: 'banuser', aliases: ['banear'], category: 'owner', access: 'owner',
    description: 'Bloquear a un usuario para que no use el bot', usage: '<@mención | número>',
    async execute(ctx) {
      const targets = targetJids(ctx);
      if (!targets.length) return ctx.reply('❌ Menciona o escribe el número del usuario.');
      for (const jid of targets) ctx.db.banUser(jid);
      return ctx.reply(`✅ Usuario(s) baneados: ${targets.map(j => j.split('@')[0]).join(', ')}`);
    },
  },
  {
    name: 'unbanuser', aliases: ['desbanear'], category: 'owner', access: 'owner',
    description: 'Desbloquear a un usuario', usage: '<@mención | número>',
    async execute(ctx) {
      const targets = targetJids(ctx);
      if (!targets.length) return ctx.reply('❌ Menciona o escribe el número del usuario.');
      for (const jid of targets) ctx.db.unbanUser(jid);
      return ctx.reply(`✅ Usuario(s) desbaneados.`);
    },
  },
];
