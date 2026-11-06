import { apiCommand } from '../../lib/cmd.js';
import { prettyJson } from '../../lib/api.js';

export default apiCommand({
  name: 'github',
  aliases: ['ghstalk'],
  description: 'Información de un perfil de GitHub',
  usage: '<usuario>',
  example: '.github torvalds',
  endpoint: 'tools.github',
  require: true,
  format: (json) => `🐙 *GitHub*
${prettyJson(json, 1600)}`,
});
