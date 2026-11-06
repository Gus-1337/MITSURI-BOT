/**
 * Tipos compartidos del bot.
 * Los tipos del socket se mantienen como `any` a propósito: el fork
 * "baileys-beta" añade campos (interactiveButtons, interactiveMessage…)
 * que no existen en las definiciones oficiales de @whiskeysockets/baileys.
 * Así los comandos pueden usar tanto la API estándar como la del fork.
 */
import type { ApiResult } from './api.js';
import type * as db from './db.js';

export type Socket = any;
export type Message = any;

export type AccessLevel = 'all' | 'group' | 'admin' | 'owner' | 'private' | 'nsfw';

export interface ReplyOptions {
  /** Citar el mensaje del usuario. Por defecto true. */
  quoted?: Message | boolean;
  mentions?: string[];
  /** Reenviar como mensaje "view once" (solo soportado por el fork). */
  viewOnce?: boolean;
}

export interface ButtonItem {
  /** Texto visible del botón. */
  label: string;
  /** Comando completo a ejecutar, ej: ".menu anime" o ".ping". */
  id: string;
}

export interface ButtonsOptions {
  text: string;
  buttons: ButtonItem[];
  title?: string;
  footer?: string;
  /** URL de imagen de cabecera (banner de la categoría). */
  image?: string;
  /** Botón de enlace externo (cta_url). */
  link?: { label: string; url: string };
  quoted?: Message | boolean;
}

export interface CommandContext {
  sock: Socket;
  msg: Message;
  jid: string;
  sender: string;
  senderNumber: string;
  pushName: string;
  isGroup: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  botIsAdmin: boolean;
  isSubbot: boolean;
  prefix: string;
  /** Nombre canónico del comando. */
  command: string;
  /** Texto exacto que escribió el usuario (puede ser un alias). */
  typed: string;
  args: string[];
  /** Todos los argumentos unidos. */
  text: string;
  mentioned: string[];
  quoted: Message | null;
  quotedText: string;

  /** Enviar texto al chat actual. */
  reply(text: string, opts?: ReplyOptions): Promise<any>;
  /** Enviar una imagen (URL o Buffer). */
  replyImage(image: string | Buffer, caption?: string, opts?: ReplyOptions): Promise<any>;
  /** Enviar un documento (URL o Buffer). */
  replyDocument(doc: string | Buffer, fileName: string, mimetype: string, caption?: string, opts?: ReplyOptions): Promise<any>;
  /** Enviar mensaje con botones interactivos + fallback a texto. */
  replyButtons(opts: ButtonsOptions): Promise<any>;
  /** Enviar contenido cualquiera de Baileys. */
  send(content: any, opts?: any): Promise<any>;
  /** Reaccionar al mensaje del usuario. */
  react(emoji: string): Promise<any>;
  /** Llamar a un endpoint configurado en config.ts. */
  api(endpoint: string, params?: Record<string, string | number | undefined>): Promise<ApiResult>;
  /** Ayudantes para respuestas de APIs. */
  sendApiResult(result: ApiResult, opts?: { caption?: string; as?: 'image' | 'video' | 'audio' | 'document' | 'text'; fileName?: string }): Promise<any>;
  db: typeof db;
  /** Cargar imagen/audio/video citado por el usuario. */
  downloadQuoted(): Promise<{ buffer: Buffer; mimetype: string; type: string } | null>;
}

export interface Command {
  /** Nombre principal (sin prefijo). */
  name: string;
  aliases?: string[];
  /** Carpeta dentro de commands/ (se autodetecta si se omite). */
  category?: string;
  description: string;
  usage?: string;
  example?: string;
  access?: AccessLevel;
  /** true = no aparece en el menú. */
  hidden?: boolean;
  enabled?: boolean;
  cooldown?: number;
  tags?: string[];
  execute(ctx: CommandContext): Promise<any> | any;
}

export interface UserData {
  jid: string;
  name: string;
  coins: number;
  bank: number;
  xp: number;
  level: number;
  registered: boolean;
  lastDaily: number;
  lastWork: number;
  messages: number;
  banned: boolean;
  premium: boolean;
  createdAt: number;
}

export interface GroupData {
  jid: string;
  welcome: boolean;
  antilink: boolean;
  nsfw: boolean;
  onlyAdmin: boolean;
  banned: boolean;
  customBanner?: string;
  customLink?: string;
}
