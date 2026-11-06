import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'neko',
  aliases: ['nekos'],
  description: 'Neko aleatoria',
  endpoint: 'anime.neko',
  as: 'image',
  caption: '🐱 Nyaa~',
});
