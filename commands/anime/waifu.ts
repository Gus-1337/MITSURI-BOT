import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'waifu',
  aliases: ['waifus'],
  description: 'Imagen waifu aleatoria',
  endpoint: 'anime.waifu',
  as: 'image',
  caption: '🌸 Una waifu para ti 💖',
});
