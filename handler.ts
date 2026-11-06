/**
 * 🌸 MITSURI-MD · Router de mensajes
 * - Entiende texto, botones nativos (native flow), listas y botones clásicos.
 * - Prefijos configurables, permisos, cooldown, bans y anti-link.
 * - Construye el CommandContext que reciben TODOS los comandos.
 */
import { bot, limits, theme } from './config.js';
import { callEndpoint, ApiError } from './lib/api.js';
import * as db from './lib/db.js';
import { getCommand, allCommands } from './lib/loader.js';
import {
  reply, replyImage, replyDocument, replyButtons, react, sendApiResult, downloadQuoted, quotedOptions,
  type Responder,
} from './lib/respond.js';
import {
  extractText, extractButtonId, getSenderJid, jidToNumber, isGroupJid, isOwner as checkOwner,
  getMentioned, getQuoted, normalizeJid, extractUrl,
} from './lib/utils.js';
import type { CommandContext, Message, Socket } from './lib/types.js';

const cooldowns = new Map<string, number>();
/** Cache de metadata de grupos (evita una petición a WhatsApp por cada mensaje). */
const groupCache = new Map<string, { at: number; metadata: any }>();

export interface HandleOptions { isSubbot?: boolean }

/** Distancia de edición simple para sugerir comandos cuando hay un typo. */
function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function suggest(name: string): string | null {
  const names = allCommands().map(c => c.name);
  const best = names.map(n => ({ n, d: levenshtein(name, n) })).sort((a, b) => a.d - b.d)[0];
  return best && best.d <= 2 ? best.n : null;
}

async function groupInfo(sock: Socket, jid: string, sender: string): Promise<{ isAdmin: boolean; botIsAdmin: boolean; metadata: any }> {
  if (!isGroupJid(jid)) return { isAdmin: false, botIsAdmin: false, metadata: null };
  try {
    let cached = groupCache.get(jid);
    if (!cached || Date.now() - cached.at > 60_000) {
      const metadata = await sock.groupMetadata(jid);
      cached = { at: Date.now(), metadata };
      groupCache.set(jid, cached);
    }
    const participants: any[] = cached.metadata?.participants ?? [];
    const adminIds = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => normalizeJid(p.id));
    const me = jidToNumber(sock.user?.id ?? '');
    return {
      metadata: cached.metadata,
      isAdmin: adminIds.includes(sender),
      botIsAdmin: adminIds.some(id => jidToNumber(id) === me),
    };
  } catch {
    return { isAdmin: false, botIsAdmin: false, metadata: null };
  }
}

/** Invalida la cache cuando cambian los participantes / admins. */
export function invalidateGroupCache(jid: string): void { groupCache.delete(jid); }

function buildContext(
  r: Responder, meta: { sender: string; senderNumber: string; pushName: string; isGroup: boolean;
    isOwner: boolean; isAdmin: boolean; botIsAdmin: boolean; isSubbot: boolean;
    prefix: string; command: string; typed: string; args: string[]; text: string; mentioned: string[]; quoted: Message | null },
): CommandContext {
  return {
    sock: r.sock, msg: r.msg, jid: r.jid, ...meta,
    quotedText: meta.quoted ? extractText(meta.quoted) : '',
    reply: (text, opts) => reply(r, text, opts),
    replyImage: (image, caption, opts) => replyImage(r, image, caption, opts),
    replyDocument: (doc, fileName, mimetype, caption, opts) => replyDocument(r, doc, fileName, mimetype, caption, opts),
    replyButtons: (opts) => replyButtons(r, opts),
    send: (content, opts) => r.sock.sendMessage(r.jid, content, opts ?? quotedOptions(r)),
    react: (emoji) => react(r, emoji),
    api: (endpoint, params) => callEndpoint(endpoint, params as any),
    sendApiResult: (result, opts) => sendApiResult(r, result, opts),
    db,
    downloadQuoted: () => downloadQuoted(r),
  };
}

export async function handleMessage(sock: Socket, msg: Message, opts: HandleOptions = {}): Promise<void> {
  try {
    if (!msg?.message || !msg?.key?.remoteJid) return;
    const jid: string = msg.key.remoteJid;
    if (jid === 'status@broadcast') return;
    if (msg.key.fromMe && !bot.handleFromMe) return;

    // Ignorar historia vieja al reconectar.
    const ts = Number(msg.messageTimestamp ?? 0);
    if (bot.ignoreOldMessagesSeconds > 0 && ts > 0) {
      const age = Date.now() / 1000 - (ts > 1e12 ? ts / 1000 : ts);
      if (age > bot.ignoreOldMessagesSeconds) return;
    }

    const buttonId = extractButtonId(msg);
    let raw = extractText(msg).trim();
    // Un botón pulsado se trata exactamente igual que si se escribiera el comando.
    if (buttonId && (!raw || raw === buttonId || buttonId.startsWith('.') || buttonId.startsWith('#'))) raw = buttonId.trim();
    if (!raw) return;

    const sender = getSenderJid(msg);
    const senderNumber = jidToNumber(sender);
    const pushName = String(msg.pushName || msg.verifiedBizName || senderNumber || 'Usuario');
    const isGroup = isGroupJid(jid);
    const isOwner = checkOwner(msg, sender);
    const { isAdmin, botIsAdmin, metadata } = await groupInfo(sock, jid, sender);
    const r: Responder = { sock, jid, msg };

    db.bumpStats('messages');
    const user = db.getUser(sender, pushName);
    user.messages += 1;
    db.addXp(sender, limits.xpPerMessage);

    // Bans y modo privado.
    if (db.isUserBanned(sender) && !isOwner) return;
    if (isGroup && db.isGroupBanned(jid) && !isOwner) return;
    if (bot.mode === 'private' && !isOwner) return;
    if (bot.mode === 'groups' && !isGroup && !isOwner) return;

    // Anti-link de grupo.
    const group = isGroup ? db.getGroup(jid) : null;
    if (group?.antilink && !isAdmin && !isOwner && extractUrl(raw)) {
      try {
        if (botIsAdmin) await sock.sendMessage(jid, { delete: msg.key });
        await sock.sendMessage(jid, { text: `🚫 @${senderNumber}, los enlaces no están permitidos aquí.`, mentions: [sender] }, { quoted: msg });
        if (botIsAdmin) await sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {});
      } catch { /* sin permisos */ }
      return;
    }

    // Prefijo.
    const prefixes = db.getPrefixes();
    const prefix = prefixes.find(p => p && raw.startsWith(p));
    if (!prefix) return;
    const body = raw.slice(prefix.length).trim();
    if (!body) return;
    const [commandName, ...args] = body.split(/\s+/);
    const command = getCommand(commandName);
    const text = args.join(' ').trim();

    if (!command || command.enabled === false) {
      const similar = suggest(commandName.toLowerCase());
      if (similar) await reply(r, `❓ ¿Quisiste decir *${bot.prefix}${similar}*?\nUsa *${bot.prefix}menu* para ver todo.`);
      return;
    }

    // Permisos.
    const deny = async (message: string) => { await reply(r, message); };
    switch (command.access) {
      case 'owner': if (!isOwner) { await deny('🔒 Este comando es solo para el dueño del bot.'); return; } break;
      case 'admin': if (!isGroup || (!isAdmin && !isOwner)) { await deny('👑 Necesitas ser administrador del grupo.'); return; } break;
      case 'group': if (!isGroup) { await deny('👥 Este comando solo funciona en grupos.'); return; } break;
      case 'private': if (isGroup) { await deny('💬 Este comando solo funciona en privado.'); return; } break;
      case 'nsfw':
        if (!limits.nsfwEnabled || !isGroup || !db.getGroup(jid).nsfw) {
          await deny('🔞 Contenido NSFW desactivado. El dueño puede activarlo con *.nsfw on* en el grupo.');
          return;
        }
        break;
    }

    // Cooldown.
    const cdKey = `${sender}:${command.name}`;
    const wait = (command.cooldown ?? limits.cooldown) * 1000;
    const last = cooldowns.get(cdKey) ?? 0;
    if (!isOwner && Date.now() - last < wait) {
      const left = Math.ceil((wait - (Date.now() - last)) / 1000);
      await reply(r, `⏳ Espera *${left}s* para volver a usar *${bot.prefix}${command.name}*.`);
      return;
    }
    cooldowns.set(cdKey, Date.now());

    const ctx = buildContext(r, {
      sender, senderNumber, pushName, isGroup, isOwner, isAdmin, botIsAdmin,
      isSubbot: !!opts.isSubbot, prefix, command: command.name, typed: commandName, args, text,
      mentioned: getMentioned(msg), quoted: getQuoted(msg),
    });

    if (bot.autoReact && !opts.isSubbot) await react(r, bot.autoReact).catch(() => {});
    db.bumpStats('commands');

    try {
      await command.execute(ctx);
    } catch (error: any) {
      console.error(`[CMD] ${command.name}:`, error);
      if (error instanceof ApiError) {
        await reply(r, `${theme.errorEmoji} ${error.message}\n\n_Revisa las APIs en \`config.ts\`._`).catch(() => {});
      } else {
        await reply(r, `${theme.errorEmoji} Ocurrió un error al ejecutar *${bot.prefix}${command.name}*.\n\`${String(error?.message ?? error).slice(0, 220)}\``).catch(() => {});
      }
    }
  } catch (error) {
    console.error('[HANDLER]', error);
  }
}

/** Bienvenida / despedida de grupos (evento group-participants.update). */
export async function handleGroupParticipants(sock: Socket, event: any): Promise<void> {
  try {
    const jid = event?.jid;
    if (!jid) return;
    const group = db.getGroup(jid);
    if (!group.welcome) return;
    const action = event.action; // 'add' | 'remove' | 'promote' | 'demote'
    if (!['add', 'remove'].includes(action)) return;
    const meta = await sock.groupMetadata(jid).catch(() => null);
    const name = meta?.subject || 'el grupo';
    for (const participant of event.participants ?? []) {
      const number = jidToNumber(normalizeJid(participant));
      const text = action === 'add'
        ? `🌸 *Bienvenid@ @${number}* a *${name}*!\nDisfruta tu estadía 💖\n\n_Usa ${bot.prefix}menu para ver mis comandos._`
        : `👋 @${number} salió de *${name}*. ¡Hasta luego!`;
      await sock.sendMessage(jid, { text, mentions: [normalizeJid(participant)] }).catch(() => {});
    }
  } catch (error) {
    console.error('[GROUP]', error);
  }
}

export default { handleMessage, handleGroupParticipants };
