import { apiCommand } from '../../lib/cmd.js';
import { formatResults } from '../../lib/api.js';

export default apiCommand({
  name: 'ytsearch',
  aliases: ['buscaryt', 'yts'],
  description: 'Buscar videos en YouTube',
  usage: '<búsqueda>',
  example: '.ytsearch Mitsuri AMV',
  endpoint: 'search.youtube',
  require: true,
  format: (json) => `🔎 *YouTube*
${formatResults(json, 6)}`,
});
