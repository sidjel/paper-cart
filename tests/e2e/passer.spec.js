import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers.js';

// Bouton « Passer » (séance 77) : toutes les répliques d'un coup, jusqu'à une question (ici : le nom du
// joueur, pendant la première rencontre) ; chaque réplique passée reste dans l'historique.

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  watchConsole(page, errors);
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.equip();
    for (const [k, v] of [['narrator.speed', 400], ['narrator.hold', 0.3], ['narrator.holdPerChar', 0], ['narrator.followDelay', 0.1], ['narrator.enabled', false], ['narrator.enabled', true]]) window.paperCart.set(k, v);
  });
});
test.afterEach(() => expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]));

const narr = (page) => page.evaluate(() => window.paperCart.narrator());

test('Passer : la rencontre défile d’un coup jusqu’au choix du nom ; les répliques sont dans l’historique', async ({ page }, info) => {
  test.setTimeout(60_000);
  // Au pied de l'étagère, devant la banane, puis scanner : la première rencontre commence.
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.scanState().reach === 0, null, { timeout: 8000 });
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await narr(page)).voice, { timeout: 25000 }).toBe('heros');
  const skip = page.locator('.skip-button');
  await expect(skip).toHaveClass(/visible/);
  const before = (await page.evaluate(() => window.paperCart.journal())).length;
  if (info.project.name === 'telephone') await skip.tap({ force: true });
  else await page.keyboard.press('Tab');
  // Arrêt à la question : le choix du nom.
  await expect(page.locator('.name-picker')).toBeVisible({ timeout: 5000 });
  await expect(skip).not.toHaveClass(/visible/); // il faut choisir
  const after = await page.evaluate(() => window.paperCart.journal());
  expect(after.length).toBeGreaterThan(before + 3); // les répliques passées sont gardées
  expect(after.join(' ')).toMatch(/Qui es-tu/);
});

test('Pause › Options : les réglages des joueurs, chacun expliqué ; Retour ramène à la pause', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('pause');
  await page.locator('.pause-card button', { hasText: 'Options' }).click();
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('options');
  const opts = page.locator('.player-options');
  await expect(opts).toBeVisible();
  await expect(opts.locator('.po-help').first()).not.toBeEmpty();
  await opts.locator('.po-back').click();
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('pause');
  // Le panneau des développeurs (⚙) a aussi une explication sous chaque réglage.
  await page.keyboard.press('F2');
  await expect(page.locator('.settings .setting-help').first()).not.toBeEmpty();
});
