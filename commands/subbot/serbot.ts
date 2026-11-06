import { createSub } from '../../lib/subbot.js';
import { isValidNumber } from '../../lib/utils.js';
import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'serbot', aliases: ['code', 'subbot', 'vincular'], category: 'subbot', access: 'owner',
  description: 'Vincular un número secundario con código de emparejamiento', usage: '<número>',
  example: '.serbot 51912345678', cooldown: 10,
  async execute(ctx) {
    const number = (ctx.args[0] || '').replace(/[^0-9]/g, '');
    if (!isValidNumber(number)) return ctx.reply(`❌ Número inválido. Debe incluir código de país, sin "+".\n_Ejemplo: \`${ctx.prefix}serbot 51912345678\`_`);
    await ctx.reply('⏳ Pidiendo el código de vinculación a WhatsApp…');
    try {
      const code = await createSub(number);
      const pretty = code.match(/.{1,4}/g)?.join('-') ?? code;
      return ctx.reply([
        '🤖 *SUB-BOT · CÓDIGO*',
        `│ 📱 +${number}`,
        `│ 🔐 \`${pretty}\``,
        '│',
        '│ 1️⃣ WhatsApp → ⚙️ Ajustes',
        '│ 2️⃣ Dispositivos vinculados',
        '│ 3️⃣ Vincular con número de teléfono',
        '│ 4️⃣ Introduce el código',
        '╰───────────────╯',
        '_El código caduca en pocos minutos._',
      ].join('\n'));
    } catch (error: any) {
      return ctx.reply(`❌ ${String(error?.message ?? error).slice(0, 220)}`);
    }
  },
};
export default command;
