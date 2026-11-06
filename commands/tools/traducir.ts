import { apiCommand } from '../../lib/cmd.js';
import { pickText } from '../../lib/api.js';

export default apiCommand({
  name: 'traducir',
  aliases: ['translate', 'trad'],
  description: 'Traducir texto a otro idioma',
  usage: '<idioma> | <texto>',
  example: '.traducir en | Hola mundo',
  endpoint: 'tools.translate',
  require: true,
  as: 'text',
  params: (ctx, raw) => { const [lang, ...rest] = raw.split('|'); return { language: rest.length ? lang.trim() : 'en', text: (rest.length ? rest.join('|').trim() : raw).trim() }; },
  format: (json) => `🌐 *Traducción*
${pickText(json)}`,
});
