import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'deepseek',
  aliases: ['deep'],
  description: 'Pregúntale a DeepSeek V3',
  usage: '<pregunta>',
  example: '.deepseek Hola, ¿quién eres?',
  endpoint: 'ia.deepseek',
  require: true,
  as: 'text',
  cooldown: 8,
  caption: '🐋 *Pregúntale a DeepSeek V3*',
});
