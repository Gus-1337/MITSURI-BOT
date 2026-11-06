/**
 * Carga diferida de sharp. En Termux/Android no hay binario nativo, así que se
 * usa la variante WebAssembly (@img/sharp-wasm32). Si tampoco está, el bot
 * arranca igual y solo estos comandos avisan cómo instalarlo.
 */
export type SharpModule = typeof import('sharp');

export const SHARP_HINT = '⚠️ No pude cargar sharp. En Termux ejecuta: npm install --force --no-save @img/sharp-wasm32';

export async function loadSharp(): Promise<SharpModule | null> {
  try {
    const mod = await import('sharp');
    return ((mod as any).default ?? mod) as SharpModule;
  } catch {
    return null;
  }
}
