/**
 * Bloqueo de instancia única.
 *
 * Dos procesos usando la misma carpeta `session/` se patean entre sí:
 * WhatsApp cierra uno con 428 (Connection Closed) y manda 515 al otro,
 * y ambos reconectan en bucle. Con este lock el segundo proceso ni arranca.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface LockResult { ok: boolean; pid?: number; file: string }

export function lockFile(sessionDir: string, root: string): string {
  const hash = crypto.createHash('md5').update(path.resolve(sessionDir)).digest('hex').slice(0, 8);
  return path.join(root, `.mitsuri-${hash}.lock`);
}

/** ¿Sigue vivo ese PID y además es un proceso del bot? (evita falsos positivos por PID reutilizado) */
function procesoVivo(pid: number): boolean {
  try { process.kill(pid, 0); } catch { return false; }
  try {
    const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');
    return /bot\.ts|index\.ts|tsx|mitsuri/i.test(cmd);
  } catch {
    return true; // sin /proc (Windows), confiar en kill(pid, 0)
  }
}

export function adquirirLock(sessionDir: string, root: string): LockResult {
  const file = lockFile(sessionDir, root);
  if (process.env.MITSURI_ALLOW_MULTI === '1') return { ok: true, file };
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data?.pid && data.pid !== process.pid && procesoVivo(Number(data.pid))) {
        return { ok: false, pid: Number(data.pid), file };
      }
      fs.rmSync(file, { force: true });
    }
    fs.writeFileSync(file, JSON.stringify({
      pid: process.pid,
      startedAt: Date.now(),
      sessionDir: path.resolve(sessionDir),
      argv: process.argv.slice(0, 3),
    }));
    return { ok: true, file };
  } catch {
    return { ok: true, file }; // si no se puede escribir, no bloqueamos el arranque
  }
}

export function liberarLock(file: string): void {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data?.pid === process.pid) fs.rmSync(file, { force: true });
  } catch { /* ya no está */ }
}
