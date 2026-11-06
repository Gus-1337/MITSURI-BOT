import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'twitter',
  aliases: ['x', 'twitterdl'],
  description: 'Descargar video de X / Twitter',
  usage: '<url>',
  example: '.twitter https://x.com/.../status/...',
  endpoint: 'download.twitter',
  requireUrl: true,
  as: 'video',
  cooldown: 10,
  caption: '📥 Descargar video de X / Twitter',
});
