import { formatUptime } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'ping', aliases: ['p', 'velocidad'], category: 'main',
  description: 'Comprobar que el bot está vivo', cooldown: 1,
  async execute(ctx) {
    const start = Date.now();
    await ctx.react('🏓');
    const ms = Date.now() - start;
    return ctx.reply(
      `🏓 *Pong!*\n│ ⚡ Respuesta: ${ms}ms\n│ ⏱️ Activo: ${formatUptime(process.uptime() * 1000)}\n│ 🧠 Node ${process.version}\n╰───────── 💖`,
    );
  },
};
export default command;
