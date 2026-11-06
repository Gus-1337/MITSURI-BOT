import { apiCommand } from '../../lib/cmd.js';
import { prettyJson } from '../../lib/api.js';

export default apiCommand({
  name: 'checknsfw',
  aliases: ['detectnsfw'],
  category: 'nsfw',
  description: 'Analizar si una imagen es contenido sensible (moderación)',
  usage: '<url de imagen>',
  example: '.checknsfw https://.../foto.jpg',
  endpoint: 'tools.checknsfw',
  requireUrl: true,
  format: (json) => `🔞 *Análisis de imagen*
${prettyJson(json, 1200)}`,
});
