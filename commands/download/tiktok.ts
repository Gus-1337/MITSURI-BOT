import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'tiktok',
  aliases: ['tt', 'ttdl'],
  description: 'Descargar TikTok sin marca de agua',
  usage: '<url>',
  example: '.tiktok https://vt.tiktok.com/...',
  endpoint: 'download.tiktok',
  requireUrl: true,
  as: 'video',
  cooldown: 10,
  caption: '📥 Descargar TikTok sin marca de agua',
});
