import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'ephoto',
  description: 'Efecto de texto Ephoto360',
  usage: '<efecto> | <texto>',
  example: '.ephoto neon | Mitsuri',
  endpoint: 'canvas.ephoto',
  require: true,
  as: 'image',
  cooldown: 8,
  params: (ctx, raw) => { const [effect, ...rest] = raw.split('|'); return { effect: effect.trim() || 'https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html', text: (rest.join('|').trim() || effect.trim()) }; },
});
