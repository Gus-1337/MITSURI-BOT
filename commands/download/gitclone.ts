import { apiCommand } from '../../lib/cmd.js';

export default apiCommand({
  name: 'gitclone',
  aliases: ['clone'],
  description: 'Descargar repositorio de GitHub en ZIP',
  usage: '<url>',
  example: '.gitclone https://github.com/user/repo',
  endpoint: 'download.gitclone',
  requireUrl: true,
  as: 'document',
  cooldown: 10,
  caption: '📥 Descargar repositorio de GitHub en ZIP',
});
