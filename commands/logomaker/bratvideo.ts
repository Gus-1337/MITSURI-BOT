import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'bratvideo',
  aliases: ['bratvid'],
  description: 'Video estilo Brat con tu texto',
  usage: '<texto>',
  example: '.bratvideo hola',
  endpoint: 'canvas.bratvideo',
  require: true,
  as: 'video',
  cooldown: 10,
  caption: '💚 Brat video',
});
