import sharp from 'sharp';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'toimg', aliases: ['toimage', 'stickerimg'], category: 'stickers',
  description: 'Convertir un sticker citado en imagen PNG', usage: '[responder a sticker]', cooldown: 4,
  async execute(ctx) {
    const media = await ctx.downloadQuoted();
    if (!media || media.type !== 'stickerMessage') return ctx.reply('🖼️ Responde a un *sticker* con el comando.');
    try {
      const png = await sharp(media.buffer).png().toBuffer();
      return ctx.replyImage(png, '🖼️ Sticker → imagen');
    } catch (error: any) {
      return ctx.reply(`❌ No pude convertir el sticker: ${String(error?.message ?? error).slice(0, 140)}`);
    }
  },
};
export default command;
