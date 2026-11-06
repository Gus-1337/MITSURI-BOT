import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'llama',
  aliases: ['llama3'],
  description: 'Pregúntale a Llama 3',
  usage: '<pregunta>',
  example: '.llama Hola, ¿quién eres?',
  endpoint: 'ia.llama',
  require: true,
  as: 'text',
  cooldown: 8,
  caption: '🦙 *Pregúntale a Llama 3*',
});
