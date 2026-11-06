/** Tipos internos del motor. NO hace falta tocarlos para personalizar el bot. */
export type ApiName = string;

export interface ApiConfig {
  label: string;
  baseUrl: string;
  key?: string;
  keyParam?: string;
  enabled: boolean;
  timeoutMs: number;
  docs: string;
}

export interface EndpointProvider {
  api: ApiName;
  path: string;
  query?: Record<string, string>;
  fixed?: Record<string, string>;
}

/** Forma antigua (objeto) soportada por compatibilidad. */
export interface EndpointDef {
  description?: string;
  kind?: 'auto' | 'json' | 'image' | 'video' | 'audio';
  providers: EndpointProvider[];
  timeoutMs?: number;
}

export interface CategoryConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  banner: string;
  link: string;
  linkLabel: string;
  enabled: boolean;
  order: number;
  /** Carpeta de commands/ de la que salen los comandos. */
  folder?: string;
  /** Solo estos comandos (para categorías virtuales tipo info / game / gacha). */
  only?: string[];
}
