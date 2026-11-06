import { getSenderJid } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'quotly', aliases: ['citar', 'quote'], category: 'stickers',
  description: 'Crear una tarjeta de cita con un texto', usage: '<texto> o responder a un mensaje',
  example: '.quotly Hola 🌸', cooldown: 6,
  async execute(ctx) {
    const text = (ctx.quotedText || ctx.text || '').trim();
    if (!text) return ctx.reply(`❌ Escribe un texto o responde a un mensaje.\n_Ejemplo: \`${ctx.prefix}quotly Hola\`_`);
    const from = ctx.quoted ? getSenderJid(ctx.quoted) : ctx.sender;
    let image = 'https://picsum.photos/seed/mitsuri-quote/300/300';
    try { image = (await ctx.sock.profilePictureUrl(from, 'image')) || image; } catch { /* sin foto */ }
    const result = await ctx.api('canvas.quotly', { image, name: ctx.pushName || 'Usuario', text });
    return ctx.sendApiResult(result, { as: 'image', caption: '💬 Cita' });
  },
};
export default command;
