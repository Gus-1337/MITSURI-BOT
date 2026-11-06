import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'registrar', aliases: ['register', 'reg'], category: 'perfil',
  description: 'Registrarte en el sistema del bot', usage: '<nombre>', example: '.registrar Gus',
  async execute(ctx) {
    const name = ctx.text.trim();
    if (!name) return ctx.reply(`❌ Escribe tu nombre: \`${ctx.prefix}registrar Gus\``);
    const u = ctx.db.getUser(ctx.sender, ctx.pushName);
    if (u.registered) return ctx.reply(`🌸 Ya estás registrad@ como *${u.name}*. Usa \`${ctx.prefix}nombre\` para cambiarlo.`);
    ctx.db.updateUser(ctx.sender, { registered: true, name: name.slice(0, 40) });
    ctx.db.addCoins(ctx.sender, 100);
    return ctx.reply(`✅ *¡Bienvenid@, ${name.slice(0, 40)}!* 💖\n│ 🎁 Bonus: +100 🪙\n│ Ahora puedes usar \`${ctx.prefix}daily\`, \`${ctx.prefix}work\` y más.`);
  },
};
export default command;
