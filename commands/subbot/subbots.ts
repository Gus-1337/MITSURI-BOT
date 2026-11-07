import { listSubs, subCount, subLimit } from '../../lib/subbot.js';
import { formatUptime } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'subbots', aliases: ['listsub', 'listasub'], category: 'subbot', access: 'owner',
  description: 'Listar los sub-bots activos', cooldown: 3,
  async execute(ctx) {
    const subs = listSubs();
    if (!subs.length) return ctx.reply('🤖 No hay sub-bots activos.\n_Usa `' + ctx.prefix + 'serbot <número>` para vincular uno._');
    const lines = subs.map((s, i) => `│ ${i + 1}. +${s.number} · ${formatUptime(Date.now() - s.startedAt)}`);
    const mem = process.memoryUsage();
    return ctx.reply([
      `🤖 *SUB-BOTS (${subCount()}/${subLimit()})*`,
      ...lines,
      '╰───────────────╯',
      `📊 RSS ${(mem.rss / 1048576).toFixed(0)} MB · Heap ${(mem.heapUsed / 1048576).toFixed(0)} MB`,
      '_Límite configurable con_ `MAX_SUBBOTS` _en .env_',
    ].join('\n'));
  },
};
export default command;
