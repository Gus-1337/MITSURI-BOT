import { apiCommand } from '../../lib/cmd.js';
import { prettyJson } from '../../lib/api.js';

export default apiCommand({
  name: 'clima',
  aliases: ['weather'],
  description: 'Clima de una ciudad',
  usage: '<ciudad>',
  example: '.clima Iquitos',
  endpoint: 'tools.weather',
  require: true,
  format: (json) => `🌤️ *Clima*
${prettyJson(json, 1600)}`,
});
