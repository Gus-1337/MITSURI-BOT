import { apiCommand } from '../../lib/cmd.js';
import { formatResults } from '../../lib/api.js';

export default apiCommand({
  name: 'npm',
  aliases: ['npmjs'],
  description: 'Buscar paquetes en npm',
  usage: '<nombre>',
  example: '.npm axios',
  endpoint: 'search.npm',
  require: true,
  format: (json) => `📦 *npm*
${formatResults(json, 5)}`,
});
