import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'instagram',
  aliases: ['ig', 'igdl'],
  description: 'Descargar publicación / Reel de Instagram',
  usage: '<url>',
  example: '.instagram https://instagram.com/p/...',
  endpoint: 'download.instagram',
  requireUrl: true,
  as: 'video',
  cooldown: 10,
  caption: '📥 Descargar publicación / Reel de Instagram',
});
