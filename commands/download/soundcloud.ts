import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'soundcloud',
  aliases: ['sc'],
  description: 'Descargar audio de SoundCloud',
  usage: '<url>',
  example: '.soundcloud https://soundcloud.com/...',
  endpoint: 'download.soundcloud',
  requireUrl: true,
  as: 'audio',
  cooldown: 10,
  caption: '📥 Descargar audio de SoundCloud',
});
