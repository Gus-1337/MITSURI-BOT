import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'ytmp4',
  aliases: ['ytvideo', 'ytv'],
  description: 'Descargar video de YouTube',
  usage: '<url>',
  example: '.ytmp4 https://youtube.com/watch?v=...',
  endpoint: 'download.ytmp4',
  requireUrl: true,
  as: 'video',
  cooldown: 10,
  caption: '📥 Descargar video de YouTube',
});
