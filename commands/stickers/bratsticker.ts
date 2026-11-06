import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'bratsticker',
  aliases: ['sbrat'],
  description: 'Sticker estilo Brat con tu texto',
  usage: '<texto>',
  example: '.sbrat hola',
  endpoint: 'canvas.brat',
  require: true,
  as: 'image',
  caption: '💚 Sticker Brat',
});
