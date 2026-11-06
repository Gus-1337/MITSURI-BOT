import { randomInt } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'ship', aliases: ['pareja', 'love'], category: 'fun',
  description: 'Calcular la compatibilidad entre dos personas', usage: '@user1 @user2', example: '.ship @a @b',
  async execute(ctx) {
    const [a, b] = ctx.mentioned.length >= 2 ? ctx.mentioned : [ctx.sender, ctx.mentioned[0] ?? ctx.sender];
    const pfp = async (jid: string) => {
      try { return await ctx.sock.profilePictureUrl(jid, 'image'); }
      catch { return 'https://picsum.photos/seed/mitsuri-pfp/300/300'; }
    };
    const pct = randomInt(1, 100);
    const verdict = pct > 85 ? '💖 Amor verdadero' : pct > 60 ? '🌸 Buena pareja' : pct > 35 ? '🍰 Podría funcionar' : '🍃 Mejor amigos';
    try {
      const result = await ctx.api('canvas.ship', {
        image1: await pfp(a), image2: await pfp(b),
        name1: a.split('@')[0], name2: b.split('@')[0],
        percentage: pct, text: verdict,
      });
      return ctx.sendApiResult(result, { as: 'image', caption: `💞 *SHIP* · ${pct}% · ${verdict}` });
    } catch {
      return ctx.reply(`💞 *SHIP*\n│ @${a.split('@')[0]} 💗 @${b.split('@')[0]}\n│ Compatibilidad: *${pct}%*\n│ ${verdict}`);
    }
  },
};
export default command;
