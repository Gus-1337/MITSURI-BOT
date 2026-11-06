import { apiCommand } from '../../lib/cmd.js';
import { prettyJson } from '../../lib/api.js';

export default apiCommand({
  name: 'animeinfo',
  aliases: ['animebuscar'],
  description: 'Información de un anime',
  usage: '<nombre>',
  example: '.animeinfo Kimetsu no Yaiba',
  endpoint: 'anime.info',
  require: true,
  format: (json) => `🎏 *Información del anime*
${prettyJson(json, 1800)}`,
});
