import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'ssweb',
  aliases: ['screenshot', 'captura'],
  description: 'Captura de pantalla de una página web',
  usage: '<url>',
  example: '.ssweb https://google.com',
  endpoint: 'tools.ssweb',
  requireUrl: true,
  as: 'image',
  cooldown: 10,
  caption: '📸 Captura web',
});
