import { limits } from '../../config.js';
import { setNsfw } from '../../lib/settings.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'nsfw', aliases: ['nsfwconfig'], category: 'nsfw',
  description: 'Activar/desactivar el permiso NSFW del grupo (bloqueado por defecto)',
  usage: '<on|off>', example: '.nsfw on', cooldown: 5,
  async execute(ctx) {
    const arg = (ctx.args[0] || '').toLowerCase();
    const groupOn = ctx.isGroup ? ctx.db.getGroup(ctx.jid).nsfw : false;
    if (!arg) {
      return ctx.reply([
        '🔞 *CONTENIDO NSFW*',
        `│ Global: ${limits.nsfwEnabled ? '✅' : '❌'}`,
        `│ Este grupo: ${groupOn ? '✅' : '❌'}`,
        '│ 🔒 Bloqueado por defecto por seguridad.',
        '╰───────────────╯',
        '_Solo el dueño puede activarlo globalmente con_ `.nsfw on`',
      ].join('\n'));
    }
    if (!['on', 'off'].includes(arg)) return ctx.reply('❌ Uso: `.nsfw on` o `.nsfw off`.');
    if (!ctx.isOwner) return ctx.reply('🔒 Solo el dueño del bot puede cambiar este ajuste.');
    setNsfw(arg === 'on');
    if (ctx.isGroup) ctx.db.setGroup(ctx.jid, { nsfw: arg === 'on' });
    return ctx.reply(`🔞 Ajuste NSFW: *${arg === 'on' ? 'ACTIVADO' : 'DESACTIVADO'}*.\n_Este proyecto no incluye comandos de contenido explícito por defecto; usa \`.checknsfw\` para moderación de imágenes._`);
  },
};
export default command;
