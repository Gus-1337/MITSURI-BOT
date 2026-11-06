import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'hidetag', aliases: ['tagall', 'mencionar'], category: 'admin', access: 'admin',
  description: 'Mencionar a todos sin que se vea el texto de las menciones', usage: '[mensaje]', example: '.hidetag Hola a todos',
  async execute(ctx) {
    const meta = await ctx.sock.groupMetadata(ctx.jid).catch(() => null);
    const jids: string[] = (meta?.participants ?? []).map((p: any) => p.id);
    if (!jids.length) return ctx.reply('❌ No pude leer los participantes.');
    return ctx.sock.sendMessage(ctx.jid, { text: ctx.text || '📢 *Atención todos*', mentions: jids }, { quoted: ctx.msg });
  },
};
export default command;
