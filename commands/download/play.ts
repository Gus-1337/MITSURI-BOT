import { extractUrl } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'play', aliases: ['ytmp3', 'musica', 'song', 'audio'], category: 'download',
  description: 'Descargar audio de YouTube por URL o por nombre', usage: '<url o búsqueda>',
  example: '.play https://youtu.be/...', cooldown: 10,
  async execute(ctx) {
    const raw = (ctx.text || ctx.quotedText || '').trim();
    if (!raw) return ctx.reply(`❌ Pásame un enlace o el nombre de la canción.\n_Ejemplo: \`${ctx.prefix}play Mitsuri AMV\`_`);
    const url = extractUrl(raw);
    if (url) {
      const result = await ctx.api('download.ytmp3', { url });
      return ctx.sendApiResult(result, { as: 'audio', caption: '🎵 *MITSURI-MD* · Audio' });
    }
    const search = await ctx.api('search.youtube', { text: raw });
    const rows: any[] = Array.isArray(search.json?.data) ? search.json.data
      : Array.isArray(search.json?.result) ? search.json.result : [];
    const first = rows.find(r => r?.url || r?.link);
    if (!first) return ctx.reply(`🔎 No encontré resultados para *${raw}*.`);
    await ctx.reply(`🔎 *${String(first.title ?? raw).slice(0, 80)}*\n⏳ Descargando audio…`);
    const result = await ctx.api('download.ytmp3', { url: first.url ?? first.link });
    return ctx.sendApiResult(result, { as: 'audio', caption: `🎵 ${String(first.title ?? raw).slice(0, 80)}` });
  },
};
export default command;
