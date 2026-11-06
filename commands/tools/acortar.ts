import { apiCommand } from '../../lib/cmd.js';
import { pickText } from '../../lib/api.js';

export default apiCommand({
  name: 'acortar',
  aliases: ['short', 'tinyurl'],
  description: 'Acortar un enlace',
  usage: '<url>',
  example: '.acortar https://github.com',
  endpoint: 'tools.short',
  requireUrl: true,
  format: (json) => `🔗 *Enlace acortado*
${pickText(json)}`,
});
