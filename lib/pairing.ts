/**
 * Solicitud del código de 8 dígitos.
 *
 * Este fork de Baileys emite `connection: 'connecting'` en un process.nextTick,
 * ANTES de que el WebSocket abra: pedir el código ahí falla siempre con
 * "Connection Closed". El momento seguro es cuando el servidor manda
 * `pair-device` (nosotros lo vemos como el evento `qr`), que llega después del
 * handshake. Aun así se reintenta por si el socket se cerró en el medio.
 *
 * Si se pasa `customCode` y el servidor lo rechaza, se reintenta sin él para
 * que WhatsApp genere el suyo (así un código propio nunca bloquea la vinculación).
 */
import { sleep } from './utils.js';

export interface PairingOptions {
  sock: any;
  numero: string;
  customCode?: string;
  onCode: (code: string) => void;
  onError: (mensaje: string) => void;
  onAviso?: (mensaje: string) => void;
  intentos?: number;
  esperaMs?: number;
}

export async function pedirCodigoVinculacion({
  sock, numero, customCode, onCode, onError, onAviso, intentos = 8, esperaMs = 1000,
}: PairingOptions): Promise<boolean> {
  const limpio = String(numero || '').replace(/[^0-9]/g, '');
  if (!limpio) {
    onError('Falta el número a vincular (PAIRING_NUMBER en .env o el que pide el menú).');
    return false;
  }
  let ultimo = 'el WebSocket nunca se abrió';
  let elegido: string | undefined = customCode;
  for (let i = 0; i < intentos; i++) {
    if (sock?.ws?.isOpen) {
      try {
        const code = elegido
          ? await sock.requestPairingCode(limpio, elegido)
          : await sock.requestPairingCode(limpio);
        onCode(code);
        return true;
      } catch (error: any) {
        ultimo = String(error?.message ?? error);
        if (elegido) {
          elegido = undefined;
          onAviso?.('⚠️  WhatsApp rechazó el código elegido; se usa uno generado por WhatsApp.');
        }
      }
    }
    await sleep(esperaMs);
  }
  onError(`${ultimo}. Revisa tu conexión (sin VPN ni proxy), prueba otra red y vuelve a correr npm start.`);
  return false;
}
