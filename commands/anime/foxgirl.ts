import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'foxgirl',
  aliases: ['kitsune'],
  description: 'Fox girl aleatoria',
  endpoint: 'anime.foxgirl',
  as: 'image',
  caption: '🦊 Kitsune~',
});
