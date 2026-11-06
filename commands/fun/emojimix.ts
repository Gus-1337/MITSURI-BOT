import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'emojimix',
  aliases: ['emoji', 'mixemoji'],
  description: 'Mezclar dos emojis',
  usage: '<emoji1> <emoji2>',
  example: '.emojimix 😊 😍',
  endpoint: 'canvas.emojimix',
  require: true,
  as: 'image',
  cooldown: 6,
  params: (ctx, raw) => { const [a, b] = raw.split(/\s+/); return { emoji1: a || '😊', emoji2: b || '😍' }; },
});
