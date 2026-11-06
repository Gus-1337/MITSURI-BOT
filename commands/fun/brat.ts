import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'brat',
  description: 'Generar imagen estilo Brat',
  usage: '<texto>',
  example: '.brat hola',
  endpoint: 'canvas.brat',
  require: true,
  as: 'image',
  caption: '💚 Brat',
});
