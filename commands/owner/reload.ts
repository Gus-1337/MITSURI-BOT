import { loadCommands, commandCount } from '../../lib/loader.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'reload', aliases: ['recargar'], category: 'owner', access: 'owner',
  description: 'Recargar todos los comandos sin reiniciar el bot', cooldown: 5,
  async execute(ctx) {
    const n = await loadCommands();
    return ctx.reply(`✅ Comandos recargados: *${n}* (${commandCount()} en memoria).`);
  },
};
export default command;
