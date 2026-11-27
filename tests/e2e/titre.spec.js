import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers.js';

// Écran titre : grand nom du jeu, image, Commencer et Options (doigt, souris, clavier).

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  watchConsole(page, errors);
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
  // Intro : texte blanc sur fond noir, une ligne à la fois.
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('intro');
  const intro = page.locator('.intro');
  await expect(intro).toBeVisible();
  await expect(intro.locator('.intro-text')).toContainText('pleuvait');
  expect(await intro.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(0, 0, 0)');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `test-results/captures/intro-${info.project.name}.png` });
  // Toucher : ligne suivante.
  if (info.project.name === 'telephone') await intro.tap({ position: { x: 50, y: 50 } });
  else await intro.click({ position: { x: 50, y: 50 } });
  await expect(intro.locator('.intro-text')).toContainText('parking');
  // « Passer » : la partie commence derrière le noir qui s'efface.
  await intro.locator('.intro-skip').click();
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
  await expect(intro).toBeHidden({ timeout: 5000 });
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
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('intro');
  await page.keyboard.press('Enter'); // ligne suivante
  await expect(page.locator('.intro-text')).toContainText('parking');
  await page.keyboard.press('Escape'); // passer l'intro
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
  await page.locator('.intro-skip').click();
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
  await page.waitForTimeout(2000);
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

test('Options : le nom du joueur (une proposition, ou son propre nom tapé)', async ({ page }, info) => {
  await page.locator('.title-button', { hasText: 'Options' }).click();
  const panel = page.locator('.player-options');
  const select = panel.locator('select[data-key="player.name"]');
  await expect(select).toHaveValue('epaisseur'); // par défaut : Épaisseur
  await expect(select.locator('option')).toContainText(['Épaisseur', 'Moitié', 'Double', 'Autre : ton propre nom']);
  await select.selectOption('autre');
  const field = panel.locator('input[data-key="player.customName"]');
  await field.click();
  // Taper un nom ne déclenche aucune commande du jeu (P = pause, I = Panier, D = droite…).
  await page.keyboard.type('Pid<{}>');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('options');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('paper-cart.reglages.v1') || '{}'));
  expect(saved['player.name']).toBe('autre');
  expect(saved['player.customName']).toBe('Pid');
  await page.screenshot({ path: `test-results/captures/options-nom-${info.project.name}.png` });
});

test('mode dev : « Départ » sur l’écran titre ouvre les points de départ ; le rayon 2 y est', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.locator('.title-button', { hasText: 'Départ' }).click();
  const rayon2 = page.locator('.title-departs button', { hasText: 'Rayon 2' });
  await expect(rayon2).toBeVisible();
  await expect(rayon2).toBeInViewport(); // sur le téléphone aussi (avant : sous l'écran)
  await page.screenshot({ path: `test-results/captures/titre-departs-${test.info().project.name}.png` });
  await rayon2.click();
  await page.waitForFunction(() => window.paperCart?.place() === 'rayon-2' && window.paperCart.state() === 'play', null, { timeout: 15000 });
});
