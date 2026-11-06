import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'mediafire',
  aliases: ['mf'],
  description: 'Descargar archivo de MediaFire',
  usage: '<url>',
  example: '.mediafire https://www.mediafire.com/file/...',
  endpoint: 'download.mediafire',
  requireUrl: true,
  as: 'document',
  cooldown: 10,
  caption: '📥 Descargar archivo de MediaFire',
});
