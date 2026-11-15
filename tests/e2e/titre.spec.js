import { test, expect } from '@playwright/test';

// Écran titre : grand nom du jeu, image, Commencer et Options (doigt, souris, clavier).

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
});
test.afterEach(async () => {
  expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]);
});

test('écran titre : nom du jeu, image, Commencer lance la partie', async ({ page }, info) => {
  const screen = page.locator('.title-screen');
  await expect(screen).toBeVisible();
  await expect(screen.locator('.title-main')).toHaveText(/Paper Cart/i);
  await expect(screen.locator('.title-sub')).toHaveText('The Final Checkout');
  await expect.poll(() => screen.locator('.title-image').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: `test-results/captures/titre-${info.project.name}.png` });
  const start = screen.locator('.title-button', { hasText: 'Commencer' });
  if (info.project.name === 'telephone') await start.tap();
  else await start.click();
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
  await expect(screen).toBeHidden();
});

test('écran titre : Options ouvre les réglages, Fermer revient au titre ; clavier', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.keyboard.press('ArrowRight'); // « Options » mis en avant
  await page.keyboard.press('Enter');
  await expect(page.locator('.settings')).toBeVisible();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('menu');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('title');
  await expect(page.locator('.title-screen')).toBeVisible();
  await page.keyboard.press('Enter'); // de retour au titre, « Commencer » est mis en avant
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('Options : plein écran (choix) et filtre écran cathodique', async ({ page }, info) => {
  await page.locator('.title-button', { hasText: 'Options' }).click();
  const panel = page.locator('.settings');
  await expect(panel).toBeVisible();
  await panel.locator('.settings-tab', { hasText: 'Affichage' }).click();
  await expect(panel.locator('select[data-key="display.fullscreenMode"]')).toBeVisible();
  await expect(page.locator('.crt')).toBeHidden();
  await panel.locator('input[data-key="display.crt"]').check();
  await expect(page.locator('.crt')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('title');
  await page.screenshot({ path: `test-results/captures/titre-${info.project.name}-crt.png` });
  // Le filtre ne bloque pas les clics : Commencer lance la partie.
  const start = page.locator('.title-button', { hasText: 'Commencer' });
  if (info.project.name === 'telephone') await start.tap();
  else await start.click();
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/captures/jeu-${info.project.name}-crt.png` });
});
