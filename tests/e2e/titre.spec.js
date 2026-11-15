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
  await expect(page.locator('.player-options')).toBeVisible();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('options');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('title');
  await expect(page.locator('.title-screen')).toBeVisible();
  await page.keyboard.press('Enter'); // de retour au titre, « Commencer » est mis en avant
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('Options : plein écran (choix) et filtre écran cathodique', async ({ page }, info) => {
  await page.locator('.title-button', { hasText: 'Options' }).click();
  const panel = page.locator('.player-options');
  await expect(panel).toBeVisible();
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

test('Options du joueur : menu assorti au titre, réglages du joueur seulement', async ({ page }, info) => {
  await page.locator('.title-button', { hasText: 'Options' }).click();
  const po = page.locator('.player-options');
  await expect(po).toBeVisible();
  await expect(page.locator('.settings')).toBeHidden(); // pas le panneau de développement
  expect(await page.evaluate(() => window.paperCart.state())).toBe('options');
  for (const t of ['Son', 'Affichage', 'Accessibilité']) await expect(po.locator('h3', { hasText: t })).toBeVisible();
  await expect(po.locator('[data-key^="bench."], [data-key^="loop."], [data-key^="debug."], [data-key^="quick."]')).toHaveCount(0);
  // Fond sombre et touches de bleu clair
  expect(await po.evaluate((e) => getComputedStyle(e).borderTopColor)).toBe('rgb(143, 211, 255)');
  await page.screenshot({ path: `test-results/captures/options-${info.project.name}.png` });
  // Un réglage change vraiment le jeu : la taille du texte.
  await po.locator('select[data-key="access.textSize"]').selectOption('grande');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ts').trim())).toBe('1.2');
  // Retour au titre (bouton), puis Commencer.
  if (info.project.name === 'telephone') await po.locator('.po-back').tap();
  else await po.locator('.po-back').click();
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('title');
  await expect(po).toBeHidden();
});

test('Options du joueur : au clavier (haut/bas, Échap)', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('.player-options')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => document.activeElement?.dataset.key)).toBe('audio.music');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('title');
});
