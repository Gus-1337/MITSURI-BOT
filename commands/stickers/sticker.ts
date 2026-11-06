import { loadSharp, SHARP_HINT } from '../../lib/sharp.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'sticker', aliases: ['s', 'stiker', 'pegatina'], category: 'stickers',
  description: 'Convertir una imagen citada en sticker (WEBP)', usage: '[responder a imagen]',
  example: '.sticker', cooldown: 4,
  async execute(ctx) {
    const media = await ctx.downloadQuoted();
    if (!media) return ctx.reply('🖼️ Responde a una *imagen* con el comando para convertirla en sticker.');
    if (!/image|webp/.test(media.mimetype)) return ctx.reply('❌ Solo imágenes estáticas (no video ni audio).');
    const sharp = await loadSharp();
    if (!sharp) return ctx.reply(SHARP_HINT);
    try {
      const webp = await sharp(media.buffer, { animated: false })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 85 })
        .toBuffer();
      return ctx.send({ sticker: webp });
    } catch (error: any) {
      return ctx.reply(`❌ No pude convertir la imagen: ${String(error?.message ?? error).slice(0, 140)}`);
    }
  },
};
export default command;
