/**
 * Backoff para reconexiones. Separado del index para poder probarlo sin levantar el bot.
 * 1–3 cierres → espera normal; 4–7 → 10 s; 8+ → 30 s.
 */
export const VENTANA_MS = 60_000;

export function registrarCierre(cierres: number[], ahora = Date.now()): number {
  cierres.push(ahora);
  while (cierres.length && ahora - cierres[0] > VENTANA_MS) cierres.shift();
  return cierres.length;
}

export function calcularEspera(base: number, n: number): number {
  if (n >= 8) return Math.max(base, 30_000);
  if (n >= 4) return Math.max(base, 10_000);
  return base;
}

export function hayTormenta(n: number): boolean { return n >= 4; }
