import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers.js';

// A8 (séances 75-76) : la pile de cartons du rayon 8. À la main, il faut pousser un moment ; au chariot
// avec élan, elle tombe d'un coup. Tombée, elle laisse prendre le rouleau de Papier Toilette (monnaie
// d'échange [TEMP]) ; le monde s'en souvient.

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  watchConsole(page, errors);
});
test.afterEach(() => expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]));

const hero = (page) => page.evaluate(() => window.paperCart.hero());
const pile = (page) => page.evaluate(() => window.paperCart.pile());

async function start(page, depart) {
  await page.goto(`./?depart=${depart}`);
  await page.waitForFunction(() => window.paperCart?.state() === 'play' && window.paperCart.place() === 'rayon-2');
}

test('A8 : à la main, la pile vacille puis tombe ; on prend le rouleau ; elle reste tombée au retour', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await start(page, 'rayon-2');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.hero().x < 1720);
  await page.keyboard.up('ArrowLeft');
  // Monter contre la pile et pousser.
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 130);
  await page.waitForTimeout(500);
  const p = await pile(page);
  expect(p.down).toBe(false);
  expect(p.push).toBeGreaterThan(0); // elle vacille
  await page.waitForFunction(() => window.paperCart.pile().down, null, { timeout: 5000 });
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/captures/pile-tombee-${info.project.name}.png` });
  // Le rouleau se prend (bouton « Prendre »).
  await expect(page.locator('.scan-button')).toContainText('Prendre');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).gear.papier_toilette).toBe(true);
  await expect(page.locator('.item-reveal')).toBeVisible();
  await page.locator('.item-reveal-ok').click();
  await expect(page.locator('.item-reveal')).toBeHidden();
  // Au retour dans le rayon 8, la pile est toujours tombée et le rouleau n'y est plus.
  await page.evaluate(() => window.paperCart.useExit());
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'rayon-essai', null, { timeout: 15000 });
  await page.evaluate(() => window.paperCart.useExit('vers-rayon2-a'));
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'rayon-2', null, { timeout: 15000 });
  expect((await pile(page)).down).toBe(true);
  expect((await page.evaluate(() => window.paperCart.scanState())).pickup).toBe(-1);
});

test('A8 : le chariot poussé avec élan renverse la pile d’un coup', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await start(page, 'chariot-pile');
  // Se placer à gauche de la pile, à sa profondeur, chariot devant (à droite).
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.hero().x < 1000);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.pile().down, null, { timeout: 6000 });
  await page.keyboard.up('ArrowRight');
  const x = (await hero(page)).x;
  expect(x).toBeLessThan(1500); // tombée au premier choc, sans avoir à pousser
});
