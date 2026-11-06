/** Estado global en tiempo de ejecución (socket principal y hora de arranque). */
import type { Socket } from './types.js';

let mainSocket: Socket = null;
export const startedAt = Date.now();

export function setMainSocket(sock: Socket): void { mainSocket = sock; }
export function getMainSocket(): Socket { return mainSocket; }
export function uptimeMs(): number { return Date.now() - startedAt; }
