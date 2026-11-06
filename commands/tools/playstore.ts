import { apiCommand } from '../../lib/cmd.js';
import { formatResults } from '../../lib/api.js';

export default apiCommand({
  name: 'playstore',
  aliases: ['apksearch'],
  description: 'Buscar apps en Play Store',
  usage: '<app>',
  example: '.playstore WhatsApp',
  endpoint: 'search.playstore',
  require: true,
  format: (json) => `▶️ *Play Store*
${formatResults(json, 5)}`,
});
