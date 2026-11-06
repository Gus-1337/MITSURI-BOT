/**
 * Fábrica de comandos declarativos para las APIs.
 * Permite crear un comando nuevo en 8 líneas sin repetir validaciones:
 *
 *   export default apiCommand({
 *     name: 'neko', category: 'anime', description: 'Neko aleatoria',
 *     endpoint: 'anime.neko', as: 'image',
 *   });
 */
import { bot } from '../config.js';
import { extractUrl } from './utils.js';
import type { Command, CommandContext } from './types.js';

export interface ApiCommandOptions {
  name: string;
  aliases?: string[];
  category?: string;
  description: string;
  usage?: string;
  example?: string;
  access?: Command['access'];
  cooldown?: number;
  hidden?: boolean;
  /** Clave del endpoint en config.ts. */
  endpoint: string;
  /** Exige texto/argumentos. Mensaje personalizado opcional. */
  require?: boolean | string;
  /** Exige una URL http(s) en el texto o en el mensaje citado. */
  requireUrl?: boolean;
  /** Construye los parámetros del endpoint. Por defecto { text, url }. */
  params?: (ctx: CommandContext, raw: string) => Record<string, string | number | undefined>;
  /** Cómo enviar el resultado al chat. */
  as?: 'image' | 'video' | 'audio' | 'document' | 'text';
  /** Caption fijo o dinámico. */
  caption?: string | ((ctx: CommandContext) => string);
  /** Formatea el JSON a texto (útil para búsquedas / IA). */
  format?: (json: any, ctx: CommandContext) => string;
}

export function apiCommand(opts: ApiCommandOptions): Command {
  return {
    name: opts.name,
    aliases: opts.aliases,
    category: opts.category,
    description: opts.description,
    usage: opts.usage,
    example: opts.example,
    access: opts.access ?? 'all',
    cooldown: opts.cooldown,
    hidden: opts.hidden,
    async execute(ctx) {
      const raw = (ctx.text || ctx.quotedText || '').trim();
      if (opts.require && !raw) {
        const msg = typeof opts.require === 'string' ? opts.require :
          `❌ Escribe algo después del comando.\n_Ejemplo: \`${bot.prefix}${opts.name} ${opts.usage ?? 'texto'}\`_`;
        return ctx.reply(msg);
      }
      let params: Record<string, string | number | undefined> = { text: raw, url: extractUrl(raw) ?? raw };
      if (opts.requireUrl) {
        const url = extractUrl(raw) || extractUrl(ctx.quotedText || '');
        if (!url) return ctx.reply(`❌ Necesito un enlace.\n_Ejemplo: \`${bot.prefix}${opts.name} ${opts.usage ?? 'https://...'}\`_`);
        params.url = url;
      }
      if (opts.params) params = { ...params, ...opts.params(ctx, raw) };
      const result = await ctx.api(opts.endpoint, params);
      if (opts.format) return ctx.reply(opts.format(result.json, ctx));
      const caption = typeof opts.caption === 'function' ? opts.caption(ctx) : opts.caption;
      return ctx.sendApiResult(result, { as: opts.as, caption });
    },
  };
}

/** Mensaje de error estándar para comandos que necesitan un argumento. */
export function usage(prefix: string, name: string, args: string, tip = ''): string {
  return `❌ Uso: \`${prefix}${name} ${args}\`${tip ? `\n_${tip}_` : ''}`;
}
