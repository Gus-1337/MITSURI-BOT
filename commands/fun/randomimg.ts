import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'randomimg',
  aliases: ['perro', 'gato', 'random'],
  description: 'Imagen aleatoria de perro, gato, café…',
  usage: '<tipo>',
  example: '.perro',
  endpoint: 'tools.random',
  as: 'image',
  caption: '🎲 Imagen aleatoria',
  params: (ctx, raw) => { const map: Record<string, string> = { perro: 'dog', dog: 'dog', gato: 'cat', cat: 'cat', cafe: 'coffee', coffee: 'coffee', pato: 'duck', duck: 'duck', paisaje: 'picsum', picsum: 'picsum' }; const cmd = ctx.typed; return { type: map[cmd] || map[(raw || '').toLowerCase()] || 'dog' }; },
});
