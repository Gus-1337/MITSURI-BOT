import { apiCommand } from '../../lib/cmd.js';
import { pickText, prettyJson } from '../../lib/api.js';

export default apiCommand({
  name: 'letra',
  aliases: ['lyrics'],
  description: 'Buscar la letra de una canción',
  usage: '<canción>',
  example: '.letra Yesterday',
  endpoint: 'search.lyrics',
  require: true,
  format: (json) => `🎵 *Letra*
${pickText(json) || prettyJson(json, 1800)}`,
});
