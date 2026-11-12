import { defineConfig, devices } from '@playwright/test';

// Tests dans un vrai navigateur, sur la version construite (comme en ligne).
// Rappel : ce navigateur n'a pas de carte graphique, ses temps ne veulent rien dire.
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
    { name: 'pc', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } } },
    {
      // Téléphone de référence simulé : Oppo Reno 2 en paysage (20:9), Chrome Android.
      name: 'telephone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 914, height: 411 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
