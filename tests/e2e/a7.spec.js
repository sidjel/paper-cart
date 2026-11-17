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
