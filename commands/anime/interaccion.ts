import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'interaccion',
  aliases: ['interact', 'reaccion'],
  description: 'Reacción anime: kiss, hug, slap, pat…',
  usage: '<tipo> [@mención]',
  example: '.interaccion hug',
  endpoint: 'anime.interaction',
  require: true,
  as: 'video',
  cooldown: 5,
  params: (ctx, raw) => ({ text: (raw.split(' ')[0] || 'hug').toLowerCase() }),
});
