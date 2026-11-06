import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'gemini',
  aliases: ['geminis'],
  description: 'Pregúntale a Google Gemini',
  usage: '<pregunta>',
  example: '.gemini Hola, ¿quién eres?',
  endpoint: 'ia.gemini',
  require: true,
  as: 'text',
  cooldown: 8,
  caption: '♊ *Pregúntale a Google Gemini*',
});
