import { test, expect } from '@playwright/test';

// A8 (1/3) : le caddie suit le héros dans le lieu, se gare et se reprend ; il ne le suit pas d'un lieu à
// l'autre (il reste garé là où il était). Point de départ de test « caddie » (en attendant le comptoir).

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto('./?depart=caddie');
  await page.waitForFunction(() => window.paperCart?.state() === 'play' && window.paperCart.caddie());
});
test.afterEach(() => expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]));

const hero = (page) => page.evaluate(() => window.paperCart.hero());
const caddie = (page) => page.evaluate(() => window.paperCart.caddie());

async function walk(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(500); // le caddie finit de rattraper
}

test('A8 : le caddie suit, se gare, reste garé, se reprend ; le menu s’appelle « Caddie »', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await expect(page.locator('.panier-button')).toHaveAttribute('title', 'Caddie (I)');
  await expect(page.locator('.panier-count')).toHaveText('0/12');
  // Vers la droite, jusqu'à un endroit où rien n'est à scanner (entre le présentoir et le caddie abandonné).
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 1000);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(600);
  let h = await hero(page);
  let c = await caddie(page);
  expect(c.following).toBe(true);
  expect(h.x - c.x).toBeGreaterThan(100); // derrière lui, à distance
  expect(h.x - c.x).toBeLessThan(200);
  await page.screenshot({ path: `test-results/captures/a8-suit-${info.project.name}.png` });
  // Garer (rien à scanner ici) : le bouton d'action dit « Garer ».
  await expect(page.locator('.scan-button')).toContainText('Garer');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await caddie(page)).following).toBe(false);
  const parked = await caddie(page);
  await walk(page, 'ArrowRight', 800);
  c = await caddie(page);
  expect([c.x, c.z]).toEqual([parked.x, parked.z]);
  // Revenir à côté : « Reprendre ».
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.hero().x < window.paperCart.caddie().x + 80);
  await page.keyboard.up('ArrowLeft');
  await expect(page.locator('.scan-button')).toContainText('Reprendre');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await caddie(page)).following).toBe(true);
});

test('A8 : en changeant de lieu, le caddie reste là où il était ; on le retrouve au retour', async ({ page }) => {
  const before = await caddie(page);
  expect(await page.evaluate(() => window.paperCart.useExit('vers-accueil'))).toBe(true);
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'accueil', null, { timeout: 15000 });
  await expect(page.locator('.caddie')).toBeHidden();
  let c = await caddie(page);
  expect(c.place).toBe('rayon-essai');
  expect(c.following).toBe(false);
  expect(await page.evaluate(() => window.paperCart.useExit())).toBe(true);
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'rayon-essai', null, { timeout: 15000 });
  await expect(page.locator('.caddie')).toBeVisible();
  c = await caddie(page);
  expect([c.x, c.z, c.following]).toEqual([before.x, before.z, false]);
});
