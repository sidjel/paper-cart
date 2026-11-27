import { defineConfig, devices } from '@playwright/test';

// Tests dans un vrai navigateur, sur la version construite (comme en ligne).
// Rappel : ce navigateur n'a pas de carte graphique, ses temps ne veulent rien dire.
// Même moteur partout (local Windows et CI Linux) : CanvasRenderer pour la suite fonctionnelle
// (évite le WebGL logiciel à ~4 i/s en CI Ubuntu), plus un projet dédié `webgl` qui vérifie
// le démarrage, le changement de lieu (RenderTexture) et le retournement 2.5D sous WebGL.
const CANVAS_ONLY_LAUNCH = { args: ['--disable-webgl', '--disable-webgl2'] };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173/' },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
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
      name: 'webgl',
      testMatch: /webgl\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
      },
    },
  ],
});
