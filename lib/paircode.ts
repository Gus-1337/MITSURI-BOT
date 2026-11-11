/**
 * Códigos de vinculación legibles.
 *
 * El fork genera el código con Crockford
 * ('123456789ABCDEFGHJKLMNPQRSTVWXYZ'), que incluye pares imposibles de
 * distinguir en la consola de un celular: W parece "VV", V parece U,
 * 1/I/L se confunden, 0/O, 5/S, 8/B, 2/Z... Un solo carácter mal copiado
 * hace que WhatsApp diga "No se pudo vincular el dispositivo".
 *
 * Como el código se usa SÓLO como material PBKDF2 local (el celular deriva
 * la misma clave con lo que escribas), podemos elegirlo nosotros: 8 dígitos
 * del 2 al 9, sin letras y sin 0/1. Nada que confundir.
 */
import { randomInt } from 'node:crypto';

const DIGITOS_SEGUROS = '23456789';

export function generarCodigoSeguro(): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += DIGITOS_SEGUROS.charAt(randomInt(DIGITOS_SEGUROS.length));
  return code;
}

export function normalizarCodigo(valor: unknown): string {
  return String(valor ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function formatearCodigo(code: string): string {
  const limpio = normalizarCodigo(code);
  return limpio.length === 8 ? `${limpio.slice(0, 4)}-${limpio.slice(4)}` : limpio;
}

export function desglosarCodigo(code: string): string {
  return normalizarCodigo(code).split('').join(' ');
}

const CONFUSIONES: Record<string, string> = {
  W: 'la W es UNA sola letra (doble uve), NO dos V',
  V: 'la V es uve, no U ni W',
  U: 'la U es u, no V',
  '1': 'el 1 es el NÚMERO uno, no la letra I',
  I: 'la I es i mayúscula, no el número 1',
  L: 'la L es ele mayúscula, no el número 1',
  '0': 'el 0 es el número cero, no la letra O',
  O: 'la O es la letra o, no el número 0',
  '5': 'el 5 es cinco, no la S',
  S: 'la S es ese, no el 5',
  '8': 'el 8 es ocho, no la B',
  B: 'la B es be, no el 8',
  '2': 'el 2 es dos, no la Z',
  Z: 'la Z es zeta, no el 2',
  M: 'la M es eme, no la N',
  N: 'la N es ene, no la M',
  C: 'la C es ce, no la G',
  G: 'la G es ge, no la C',
  Q: 'la Q es cu, no la O',
  D: 'la D es de, no el 0',
};

/** Avisos sólo para los caracteres que realmente aparecen en el código. */
export function avisosCodigo(code: string): string[] {
  const limpio = normalizarCodigo(code);
  if (esSoloNumerosSeguros(limpio)) return [];
  const vistos = [...new Set(limpio.split(''))];
  return vistos.filter(c => !!CONFUSIONES[c]).map(c => CONFUSIONES[c]);
}

export function esSoloNumerosSeguros(code: string): boolean {
  const limpio = normalizarCodigo(code);
  return limpio.length === 8 && [...limpio].every(c => DIGITOS_SEGUROS.includes(c));
}
