import type { Command } from '../../lib/types.js';

const command: Command = {
  name: 'nombre', aliases: ['setname', 'apodo'], category: 'perfil',
  description: 'Cambiar tu nombre en el bot', usage: '<nombre>', example: '.nombre Mitsuri',
  async execute(ctx) {
    const name = ctx.text.trim();
    if (!name) return ctx.reply(`❌ Uso: \`${ctx.prefix}nombre <tu nombre>\``);
    ctx.db.updateUser(ctx.sender, { name: name.slice(0, 40), registered: true });
    return ctx.reply(`✅ Ahora te llamas *${name.slice(0, 40)}* 🌸`);
  },
};
export default command;
