import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'qrcode',
  aliases: ['createqr'],
  description: 'Generar código QR de un texto o enlace',
  usage: '<texto>',
  example: '.qrcode https://github.com',
  endpoint: 'canvas.createqr',
  require: true,
  as: 'image',
  caption: '🔳 Código QR',
});
