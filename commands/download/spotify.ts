import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'spotify',
  aliases: ['spotifydl'],
  description: 'Descargar canción de Spotify',
  usage: '<url>',
  example: '.spotify https://open.spotify.com/track/...',
  endpoint: 'download.spotify',
  requireUrl: true,
  as: 'audio',
  cooldown: 10,
  caption: '📥 Descargar canción de Spotify',
});
