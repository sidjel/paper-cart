import { test, expect } from '@playwright/test';

// A7 (séance 67) : le rayon 2, derrière l'étagère du rayon 7. Ses deux ouvertures sont les deux passages ;
// chacun fait arriver au même endroit, en face (le bon côté), et l'on revient par le même passage.

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.equip();
    window.paperCart.markSaid('rencontre');
  });
});
test.afterEach(() => expect(errors).toEqual([]));

const hero = (page) => page.evaluate(() => window.paperCart.hero());
const arrivedIn = (page, id) => page.waitForFunction((p) => window.paperCart.place() === p && window.paperCart.state() === 'play', id, { timeout: 15000 });

test('A7 : par l’ouverture de gauche, en marchant, on arrive dans le rayon 2 en face ; vers l’avant, on revient', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'clavier : PC');
  // Aller sous l'ouverture de gauche (x 2040–2300), puis vers le fond.
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 2150, null, { timeout: 10000 });
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowUp');
  await arrivedIn(page, 'rayon-2');
  await page.keyboard.up('ArrowUp');
  const h = await hero(page);
  expect(h.x).toBe(2170);
  expect(h.z).toBe(-150); // devant (le rayon 7 est devant le rayon 2)
  await page.screenshot({ path: `test-results/captures/a7-${info.project.name}-rayon2.png` });
  // Vers l'avant : retour au rayon 7, devant la même ouverture.
  await page.keyboard.down('ArrowDown');
  await arrivedIn(page, 'rayon-essai');
  await page.keyboard.up('ArrowDown');
  expect((await hero(page)).x).toBe(2170);
});

test('A7 : l’ouverture de droite mène en face, de l’autre côté du rayon 2, et retour', async ({ page }) => {
  await page.evaluate(() => window.paperCart.useExit('vers-rayon2-b'));
  await arrivedIn(page, 'rayon-2');
  expect((await hero(page)).x).toBe(3140);
  await page.evaluate(() => window.paperCart.useExit('vers-rayon-b'));
  await arrivedIn(page, 'rayon-essai');
  const h = await hero(page);
  expect([h.x, h.z]).toEqual([3140, 220]);
});

test('A7 : panier plein, on repose une carte du rayon 2 dans le rayon 7 : son produit prend la place du produit scanné', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'clavier : PC');
  test.setTimeout(60_000);
  const scanState = () => page.evaluate(() => window.paperCart.scanState());
  await page.evaluate(() => window.paperCart.set('carry.panier', 1));
  // Rayon 2 : scanner les œufs (x 1440).
  await page.evaluate(() => window.paperCart.useExit('vers-rayon2-a'));
  await arrivedIn(page, 'rayon-2');
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.scanState().reach === 2, null, { timeout: 8000 }); // à chaque image (le héros passe vite)
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await scanState()).active, { timeout: 6000 }).toBe(false);
  await expect(page.locator('.panier-count')).toHaveText('1/1');
  // Retour au rayon 7 : le steak (x 1440) ; le panier est plein → échanger la carte des œufs.
  await page.evaluate(() => window.paperCart.useExit('vers-rayon-a'));
  await arrivedIn(page, 'rayon-essai');
  const before = (await page.evaluate(() => window.paperCart.products())).length;
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.scanState().reach === 4, null, { timeout: 8000 });
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.locator('.confirm button', { hasText: 'Oui' }).click();
  await page.locator('.panier .card').first().click();
  await expect(page.locator('.panier')).toBeHidden();
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.products())).length, { timeout: 6000 }).toBe(before + 1);
  const added = (await page.evaluate(() => window.paperCart.products())).at(-1);
  expect(added).toEqual({ id: 'oeufs', x: 1440, scanned: false }); // les œufs, à la place du steak, prêts à scanner
  await expect(page.locator('.product').filter({ visible: true }).locator('xpath=.')).not.toHaveCount(0);
  await page.screenshot({ path: `test-results/captures/a7-${info.project.name}-echange.png` });
});

test('A7 : longer le fond du rayon 7 (ou le bord avant du rayon 2) devant les ouvertures ne fait pas changer de rayon', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'clavier : PC');
  test.setTimeout(40_000);
  // Rayon 7 : contre le fond, puis tout le long vers la droite, devant les deux ouvertures.
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 250);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 3400, null, { timeout: 15000 });
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.paperCart.place())).toBe('rayon-essai');
  // Rayon 2 : contre le bord avant, tout le long vers la gauche.
  await page.evaluate(() => window.paperCart.useExit('vers-rayon2-b'));
  await arrivedIn(page, 'rayon-2');
  await page.keyboard.down('ArrowLeft'); // d'abord hors du prolongement de l'ouverture
  await page.waitForFunction(() => window.paperCart.hero().x < 2900);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => window.paperCart.hero().z < -185);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.hero().x < 1800, null, { timeout: 15000 });
  await page.keyboard.up('ArrowLeft');
  expect(await page.evaluate(() => window.paperCart.place())).toBe('rayon-2');
});

test('A7 au doigt : toucher l’ouverture du rayon de devant (en bas de l’écran) ramène au rayon 7', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'au doigt');
  await page.evaluate(() => window.paperCart.useExit('vers-rayon2-a'));
  await arrivedIn(page, 'rayon-2');
  const vp = page.viewportSize();
  const pt = await page.evaluate(() => window.paperCart.worldToClient(2170, -190));
  await page.touchscreen.tap(pt.x, Math.min(vp.height - 4, pt.y));
  await arrivedIn(page, 'rayon-essai');
  expect((await hero(page)).x).toBe(2170);
  // Et dans l'autre sens : toucher l'ouverture de l'étagère du fond.
  const op = await page.evaluate(() => window.paperCart.worldToClient(2170, 500));
  await page.touchscreen.tap(op.x, op.y);
  await arrivedIn(page, 'rayon-2');
});
