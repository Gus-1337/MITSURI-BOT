/** Ayudantes para comandos de administración de grupos. */
import { getSenderJid, jidToNumber, normalizeJid, numberToJid } from './utils.js';
import type { CommandContext } from './types.js';

/** Obtiene los JIDs objetivo de: menciones, mensaje citado o número escrito. */
export function targetJids(ctx: CommandContext): string[] {
  if (ctx.mentioned?.length) return ctx.mentioned.map(normalizeJid);
  if (ctx.quoted) return [getSenderJid(ctx.quoted)];
  const raw = (ctx.args[0] ?? '').replace(/[^0-9]/g, '');
  return raw.length >= 8 ? [numberToJid(raw)] : [];
}

/** Verifica que el bot sea admin del grupo; avisa al usuario si no lo es. */
export async function requireBotAdmin(ctx: CommandContext): Promise<boolean> {
  if (!ctx.isGroup) { await ctx.reply('👥 Este comando solo funciona en grupos.'); return false; }
  if (!ctx.botIsAdmin && !ctx.isOwner) { await ctx.reply('👑 Necesito ser administradora del grupo para hacer eso 💖.'); return false; }
  return true;
}

export function shortJid(jid: string): string { return jidToNumber(jid); }
