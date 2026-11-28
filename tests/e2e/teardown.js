// Nettoyage du dossier temporaire Playwright Windows, exécuté même si un test échoue.
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

export default async function globalTeardown() {
  if (process.platform !== 'win32') return;
  rmSync(resolve('node_modules/.cache/pw-tmp'), { recursive: true, force: true });
}
