import { apiCommand } from '../../lib/cmd.js';
import { prettyJson } from '../../lib/api.js';

export default apiCommand({
  name: 'wiki',
  aliases: ['wikipedia'],
  description: 'Buscar en Wikipedia',
  usage: '<tema>',
  example: '.wiki Iquitos',
  endpoint: 'search.wiki',
  require: true,
  format: (json) => `📚 *Wikipedia*
${prettyJson(json, 1700)}`,
});
