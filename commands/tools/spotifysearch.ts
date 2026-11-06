import { apiCommand } from '../../lib/cmd.js';
import { formatResults } from '../../lib/api.js';

export default apiCommand({
  name: 'spotifysearch',
  aliases: ['spotisearch'],
  description: 'Buscar canciones en Spotify',
  usage: '<canción>',
  example: '.spotifysearch Twice',
  endpoint: 'search.spotify',
  require: true,
  format: (json) => `🎧 *Spotify*
${formatResults(json, 5)}`,
});
