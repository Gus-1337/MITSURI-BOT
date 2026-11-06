import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'facebook',
  aliases: ['fb', 'fbdl'],
  description: 'Descargar video / Reel de Facebook',
  usage: '<url>',
  example: '.facebook https://facebook.com/...',
  endpoint: 'download.facebook',
  requireUrl: true,
  as: 'video',
  cooldown: 10,
  caption: '📥 Descargar video / Reel de Facebook',
});
