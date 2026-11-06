import { sleep } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'bc', aliases: ['broadcast', 'difusion'], category: 'owner', access: 'owner',
  description: 'Enviar un comunicado a todos los grupos', usage: '<mensaje>', example: '.bc Hola a todos',
  cooldown: 30,
  async execute(ctx) {
    const text = (ctx.text || ctx.quotedText || '').trim();
    if (!text) return ctx.reply(`❌ Uso: \`${ctx.prefix}bc <mensaje>\``);
    const groups = await (ctx.sock.groupFetchAllParticipating?.() ?? Promise.resolve({}));
    const jids = Object.keys(groups ?? {});
    if (!jids.length) return ctx.reply('❌ No encontré grupos.');
    await ctx.reply(`📢 Enviando a *${jids.length}* grupos…`);
    let ok = 0;
    for (const jid of jids) {
      try { await ctx.sock.sendMessage(jid, { text: `📢 *COMUNICADO · ${ctx.pushName}*\n\n${text}` }); ok++; } catch { /* grupo inaccesible */ }
      await sleep(300);
    }
    return ctx.reply(`✅ Comunicado enviado a *${ok}/${jids.length}* grupos.`);
  },
};
export default command;
