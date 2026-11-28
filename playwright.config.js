import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Sous Windows, si %TEMP% n'a pas de droits hérités, le bac à sable réseau de Chromium
// rend le profil temporaire impossible à supprimer (EPERM en boucle dans Playwright).
// Un sous-dossier dans node_modules/.cache/ (ignoré par Git, droits hérités propres)
// évite le blocage ; il est nettoyé par globalTeardown même si un test échoue.
if (process.platform === 'win32') {
  const pwTmpDir = resolve('node_modules/.cache/pw-tmp');
  mkdirSync(pwTmpDir, { recursive: true });
  process.env.TEMP = pwTmpDir;
  process.env.TMP = pwTmpDir;
}

// Tests dans un vrai navigateur, sur la version construite (comme en ligne).
// Rappel : ce navigateur n'a pas de carte graphique en headless, ses temps ne veulent rien dire.
// Même moteur partout (local Windows et CI Linux) : CanvasRenderer pour la suite fonctionnelle
// (évite le WebGL logiciel à ~4 i/s en CI Ubuntu), plus un projet dédié `webgl` (fenêtre visible
// sur la vraie carte graphique en local, headless en CI) qui vérifie le démarrage, le changement
// de lieu (RenderTexture) et le retournement 2.5D sous WebGL.
const CANVAS_ONLY_LAUNCH = { args: ['--disable-webgl', '--disable-webgl2'] };

export default defineConfig({
  testDir: 'tests/e2e',
  globalTeardown: './tests/e2e/teardown.js',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173/' },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js build && node ./node_modules/vite/bin/vite.js preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'pc',
      testIgnore: /webgl\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
        launchOptions: CANVAS_ONLY_LAUNCH,
      },
    },
    {
      // Téléphone de référence simulé : Oppo Reno 2 en paysage (20:9), Chrome Android.
      name: 'telephone',
      testIgnore: /webgl\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 914, height: 411 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        launchOptions: CANVAS_ONLY_LAUNCH,
      },
    },
    {
      // Vérification dédiée du chemin WebGL (démarrage, fondu RenderTexture, retournement 2.5D, zéro erreur console).
      // En local : fenêtre visible (vraie carte graphique) ; en CI : headless (SwiftShader).
      name: 'webgl',
      testMatch: /webgl\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
        headless: Boolean(process.env.CI),
      },
    },
  ],
});
