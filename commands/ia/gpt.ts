import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'gpt',
  aliases: ['chatgpt', 'ia'],
  description: 'Pregúntale a ChatGPT',
  usage: '<pregunta>',
  example: '.gpt Hola, ¿quién eres?',
  endpoint: 'ia.chatgpt',
  require: true,
  as: 'text',
  cooldown: 8,
  caption: '🤖 *Pregúntale a ChatGPT*',
});
