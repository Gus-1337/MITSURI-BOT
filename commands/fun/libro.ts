import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'libro',
  aliases: ['book'],
  description: 'Escribir un texto en un libro',
  usage: '<texto>',
  example: '.libro Te quiero',
  endpoint: 'canvas.book',
  require: true,
  as: 'image',
  caption: '📖 Tu libro',
  params: (ctx, raw) => ({ text: raw, footer: 'MITSURI-MD 🌸' }),
});
