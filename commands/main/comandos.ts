import { allCommandsText } from '../../lib/menu.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'comandos', aliases: ['lista', 'list', 'commands'], category: 'main',
  description: 'Lista completa de comandos por categoría', cooldown: 2,
  async execute(ctx) { return ctx.reply(allCommandsText()); },
};
export default command;
