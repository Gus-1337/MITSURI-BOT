import { bot, apis, categories } from '../../config.js';
import { commandCount } from '../../lib/loader.js';
import { getStats } from '../../lib/db.js';
import { subCount } from '../../lib/subbot.js';
import { formatUptime, formatNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'infobot', aliases: ['botinfo', 'estado', 'status'], category: 'main',
  description: 'Estado, estadísticas y APIs del bot', cooldown: 3,
  async execute(ctx) {
    const stats = getStats();
    const apiList = Object.values(apis).map(a => `│ ${a.enabled ? '✅' : '❌'} ${a.label}`).join('\n');
    const text = [
      `🌸 *${bot.name} · INFO*`,
      `│ 🏷️ Versión: ${bot.version}`,
      `│ 👑 Dueño: ${bot.owner.name}${bot.owner.number ? ` (+${bot.owner.number})` : ''}`,
      `│ 🌎 Modo: ${bot.mode} · Zona: ${bot.timezone}`,
      `│ ⏱️ Activo: ${formatUptime(process.uptime() * 1000)}`,
      `│ 🧩 Comandos: ${commandCount()} en ${Object.keys(categories).length} categorías`,
      `│ 💬 Mensajes: ${formatNumber(stats.messages)} · Comandos: ${formatNumber(stats.commands)}`,
      `│ 🤖 Sub-bots: ${subCount()}`,
      `│ 💾 RAM: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      '├─ *APIs*',
      apiList,
      '╰───────────────╯',
      '',
      `_Todo se configura en \`config.ts\`._`,
    ].join('\n');
    return ctx.reply(text);
  },
};
export default command;
