import { test, expect } from '@playwright/test';

// Bouton « Passer » (séance 77) : toutes les répliques d'un coup, jusqu'à une question (ici : le nom du
// joueur, pendant la première rencontre) ; chaque réplique passée reste dans l'historique.

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
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
