import { apiCommand } from '../../lib/cmd.js';
import { formatResults } from '../../lib/api.js';

export default apiCommand({
  name: 'pinterest',
  aliases: ['pin'],
  description: 'Buscar imágenes en Pinterest',
  usage: '<tema>',
  example: '.pinterest sakura',
  endpoint: 'search.pinterest',
  require: true,
  format: (json) => `📌 *Pinterest*
${formatResults(json, 6)}`,
});
