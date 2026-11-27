import { test, expect } from '@playwright/test';

// A8 : le chariot poussé (choix de l'auteur, séances 73-74). Devant le héros ; il se retourne
// avec lui ; lâché, il reste là ; poussé, il passe les portes avec le héros. Point de départ de test
// « chariot » (en attendant le comptoir). La lourdeur est vérifiée par les tests de logique (temps du
// navigateur de test trop irréguliers pour la mesurer ici).

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto('./?depart=chariot');
  await page.waitForFunction(() => window.paperCart?.state() === 'play' && window.paperCart.chariot());
});
test.afterEach(() => expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]));

const hero = (page) => page.evaluate(() => window.paperCart.hero());
const chariot = (page) => page.evaluate(() => window.paperCart.chariot());

test('A8 : poussé devant le héros, il se retourne au demi-tour ; lâché, il reste ; repris, il repart ; menu « Chariot »', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await expect(page.locator('.panier-button')).toHaveAttribute('title', 'Chariot (I)');
  await expect(page.locator('.panier-count')).toHaveText('0/12');
  // Vers la droite, jusqu'à un endroit où rien n'est à scanner : le chariot est devant, à droite.
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 900);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(700);
  let h = await hero(page);
  let c = await chariot(page);
  expect(c.pushed).toBe(true);
  expect(c.x - h.x).toBeGreaterThan(100);
  await page.screenshot({ path: `test-results/captures/a8-pousse-${info.project.name}.png` });
  // Demi-tour : il passe de l'autre côté.
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(700);
  h = await hero(page);
  c = await chariot(page);
  expect(c.side).toBe(-1);
  expect(h.x - c.x).toBeGreaterThan(100);
  // Lâcher (rien à scanner ici) : le bouton d'action dit « Lâcher ».
  await expect(page.locator('.scan-button')).toHaveClass(/visible/);
  await expect(page.locator('.scan-button')).toContainText('Lâcher');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await chariot(page)).pushed).toBe(false);
  const left = await chariot(page);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(120);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(500);
  c = await chariot(page);
  expect([c.x, c.z]).toEqual([left.x, left.z]);
  // Revenir à côté : « Pousser ».
  await expect(page.locator('.scan-button')).toHaveClass(/visible/);
  await expect(page.locator('.scan-button')).toContainText('Pousser');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await chariot(page)).pushed).toBe(true);
});

test('A8 : poussé, il passe la porte avec le héros ; lâché, il reste dans son rayon', async ({ page }) => {
  expect(await page.evaluate(() => window.paperCart.useExit('vers-accueil'))).toBe(true);
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'accueil', null, { timeout: 15000 });
  expect(await page.evaluate(() => window.paperCart.scene().chariot.visible)).toBe(true);
  let c = await chariot(page);
  expect([c.place, c.pushed]).toEqual(['accueil', true]);
  // Lâché dans le hall, puis le héros retourne seul au rayon : le chariot reste dans le hall.
  await page.evaluate(() => window.paperCart.chariotToggle());
  expect(await page.evaluate(() => window.paperCart.useExit())).toBe(true);
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'rayon-essai', null, { timeout: 15000 });
  expect(await page.evaluate(() => window.paperCart.scene().chariot.visible)).toBe(false);
  c = await chariot(page);
  expect([c.place, c.pushed]).toEqual(['accueil', false]);
});

test('A8 : R lâche et reprend le chariot, même près d’un produit', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  expect((await chariot(page)).pushed).toBe(true);
  await page.keyboard.press('KeyR');
  await expect.poll(async () => (await chariot(page)).pushed).toBe(false);
  // Hors scan, ni le panier ni la Scanette ne sont tenus en permanence sur le héros.
  expect(await page.evaluate(() => window.paperCart.scene().hero.heldVisible)).toBe(0);
  await page.keyboard.press('KeyR');
  await expect.poll(async () => (await chariot(page)).pushed).toBe(true);
});

test('A8 au doigt : toucher deux fois le chariot le lâche, puis le reprend', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'doigt : téléphone seulement');
  await page.waitForTimeout(600);
  const box = await page.evaluate(() => window.paperCart.scene().chariot.bounds);
  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.5;
  const dbl = async () => {
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(80);
    await page.touchscreen.tap(x, y);
  };
  await dbl();
  await expect.poll(async () => (await chariot(page)).pushed).toBe(false);
  await page.waitForTimeout(500);
  await dbl();
  await expect.poll(async () => (await chariot(page)).pushed).toBe(true);
});

