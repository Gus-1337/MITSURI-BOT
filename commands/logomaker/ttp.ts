import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'ttp',
  description: 'Logo de texto brillante (TTP)',
  usage: '<texto>',
  example: '.ttp Mitsuri',
  endpoint: 'canvas.ttp',
  require: true,
  as: 'image',
  caption: '✒️ Tu logo TTP',
});
