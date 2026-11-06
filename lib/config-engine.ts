import type { ApiConfig, EndpointDef, CategoryConfig } from './config-types.js';

export interface ConfigState {
  config: any;
  endpoints: Record<string, string[] | EndpointDef>;
  categorias: Record<string, { e: string; n: string; d: string; f: string; o: number; only?: string[] }>;
  APIs: Record<string, { url: string; key: string | null }>;
}

const KEY_PARAMS: Record<string, string> = {
  stellar: 'apikey', anabot: 'apikey', melody: 'apikey', evogb: 'apikey', yosoyyo: 'apikey',
};
const API_LABELS: Record<string, string> = {
  melody: 'Melodia Auris', anabot: 'AnaBot', delirius: 'Delirius', stellar: 'Stellar Labs',
  siputzx: 'SiputzX', evogb: 'EvoGB', yosoyyo: 'Yo Soy Yo', starlights: 'Starlights', popcat: 'PopCat',
};

export function mountConfig(state: ConfigState) {
  const apis: Record<string, ApiConfig> = {};
  const bot: any = {};
  const categories: Record<string, CategoryConfig> = {};
  const menu: any = {};
  const limits: any = {};
  const theme: any = {};

  const cfg = () => state.config;

  function currentApis(): Record<string, { url: string; key: string | null }> {
    return (globalThis as any).APIs || state.APIs;
  }

  function buildApis(): Record<string, ApiConfig> {
    return Object.fromEntries(Object.entries(currentApis()).map(([id, a]) => [id, {
      label: API_LABELS[id] || id,
      baseUrl: a.url.replace(/\/+$/, ''),
      key: a.key || undefined,
      keyParam: a.key ? (KEY_PARAMS[id] || 'apikey') : undefined,
      enabled: true,
      timeoutMs: 35_000,
      docs: a.url,
    }]));
  }

  function buildBot() {
    const c = cfg();
    return {
      name: c.botName,
      shortName: String(c.botName).split('-')[0],
      version: '1.0.0',
      prefixes: (process.env.BOT_PREFIXES || c.prefix).split(''),
      prefix: c.prefix,
      owner: {
        number: [...c.owner][0] ?? '',
        name: c.devName,
        extraJids: [...c.owner].map((n: string) => `${n}@s.whatsapp.net`),
        numbers: new Set(c.owner),
      },
      mode: c.mode,
      auth: c.auth,
      pairingCode: c.pairingCode,
      sessionDir: c.sessionDir,
      timezone: c.timezone,
      language: 'es',
      handleFromMe: c.handleFromMe,
      ignoreOldMessagesSeconds: c.ignoreOldMessagesSeconds,
      rejectCalls: c.rejectCalls,
      autoReact: c.autoReact,
    };
  }

  function buildCategories(): Record<string, CategoryConfig> {
    const c = cfg();
    const out: Record<string, CategoryConfig> = {};
    for (const [id, cat] of Object.entries(state.categorias)) {
      out[id] = {
        id,
        name: cat.n,
        emoji: cat.e,
        description: cat.d,
        banner: (c.banners as Record<string, string>)[id] || c.banner,
        link: (c.links as Record<string, string>)[id] || c.links.default,
        linkLabel: '🌐 Más info',
        enabled: true,
        order: cat.o,
        folder: cat.f,
        only: cat.only,
      };
    }
    for (const [alias, target] of Object.entries({ perfil: 'profile', logomaker: 'logo', principal: 'main' })) {
      if (out[target]) out[alias] = { ...out[target], id: alias, enabled: false };
    }
    return out;
  }

  function buildMenu() {
    const c = cfg();
    return {
      style: c.menuStyle,
      buttonsPerPage: 3,
      showBanner: true,
      listButtonLabel: '📂 Ver categorías',
      backLabel: '⬅️ Menú principal',
      nextLabel: '➡️ Siguiente',
      prevLabel: '⬅️ Anterior',
    };
  }

  function buildLimits() {
    const c = cfg();
    return {
      cooldown: c.cooldown,
      maxMediaBytes: c.maxMediaBytes,
      maxTextLength: 4000,
      xpPerMessage: c.xpPerMessage,
      xpPerLevel: c.xpPerLevel,
      workMin: c.workMin,
      workMax: c.workMax,
      dailyReward: c.dailyReward,
      nsfwEnabled: c.nsfwEnabled,
    };
  }

  function buildTheme() {
    const c = cfg();
    return {
      footer: `${c.botName} · Multi-Device 💖`,
      menuTitle: `🌸 *${c.botName}*`,
      menuSubtitle: 'Dulce por fuera, fuerte por dentro.',
      errorEmoji: '❌',
      loadingEmoji: '⏳',
      successEmoji: '✅',
      lines: '╭───────────────╮\n│ {text}\n╰───────────────╯',
    };
  }

  function sync(): void {
    const freshApis = buildApis();
    for (const k of Object.keys(apis)) if (!(k in freshApis)) delete apis[k];
    Object.assign(apis, freshApis);
    Object.assign(bot, buildBot());
    Object.assign(menu, buildMenu());
    Object.assign(limits, buildLimits());
    Object.assign(theme, buildTheme());
    const freshCats = buildCategories();
    for (const k of Object.keys(categories)) if (!(k in freshCats)) delete categories[k];
    Object.assign(categories, freshCats);
  }

  sync();
  return { apis, bot, categories, menu, limits, theme, sync };
}
