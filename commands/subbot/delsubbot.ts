import { stopSub } from '../../lib/subbot.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'delsubbot', aliases: ['stopsub', 'delsub'], category: 'subbot', access: 'owner',
  description: 'Detener y desvincular un sub-bot', usage: '<número>', example: '.delsubbot 51912345678',
  async execute(ctx) {
    const number = (ctx.args[0] || '').replace(/[^0-9]/g, '');
    if (!number) return ctx.reply(`❌ Uso: \`${ctx.prefix}delsubbot <número>\``);
    const ok = await stopSub(number);
    return ctx.reply(ok ? `✅ Sub-bot +${number} detenido.` : `❌ No había ningún sub-bot activo con +${number}.`);
  },
};
export default command;
