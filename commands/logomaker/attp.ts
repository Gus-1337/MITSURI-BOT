import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'attp',
  description: 'Logo de texto animado (ATTP)',
  usage: '<texto>',
  example: '.attp Mitsuri',
  endpoint: 'canvas.attp',
  require: true,
  as: 'image',
  caption: '✨ Tu logo animado',
});
