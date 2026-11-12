import { test, expect } from '@playwright/test';

// Étape A1 : le jeu démarre sans erreur, on marche au clavier, à la souris, au doigt,
// la pause fige le personnage, les panneaux s'ouvrent.

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
});

test.afterEach(async () => {
  expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]);
});

const hero = (page) => page.evaluate(() => window.paperCart.hero());

test('affiche la version et le rayon', async ({ page }, info) => {
  await expect(page.locator('.version')).toContainText('v ');
  await expect(page.locator('.layer-fond img')).toBeVisible();
  await expect(page.locator('.actor-frame:not([hidden])')).toHaveCount(1);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}.png` });
});

test('marche au clavier (flèches et ZQSD) et se retourne', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  const start = await hero(page);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  const after = await hero(page);
  expect(after.x).toBeGreaterThan(start.x + 50);
  expect(after.facing).toBe(1);

  // Q sur AZERTY = A sur QWERTY : même touche physique (KeyA) → vers la gauche
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyA');
  expect((await hero(page)).facing).toBe(-1);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyW');
  const back = await hero(page);
  expect(back.away).toBe(true);
  expect(back.z).toBeGreaterThan(after.z);
});

test('va au point cliqué ou touché', async ({ page }, info) => {
  const target = await page.evaluate(() => window.paperCart.worldToClient(500, 80));
  if (info.project.name === 'telephone') await page.touchscreen.tap(target.x, target.y);
  else await page.mouse.click(target.x, target.y);
  await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 4000 }).toBe(false);
  const h = await hero(page);
  expect(Math.abs(h.x - 500)).toBeLessThan(8);
  expect(Math.abs(h.z - 80)).toBeLessThan(8);
});

test('s’arrête contre un obstacle', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'même logique que sur PC');
  // Derrière la tête de gondole : il bute devant, sans recherche de chemin.
  const p = await page.evaluate(() => window.paperCart.worldToClient(750, 200));
  const from = await page.evaluate(() => window.paperCart.worldToClient(750, 40));
  await page.mouse.click(from.x, from.y);
  await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 4000 }).toBe(false);
  await page.mouse.click(p.x, p.y);
  await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 4000 }).toBe(false);
  expect((await hero(page)).z).toBeLessThan(122);
});

test('la pause fige le personnage', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('pause');
  await expect(page.locator('.pause')).toBeVisible();
  const before = await hero(page);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  expect((await hero(page)).x).toBe(before.x);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('réglages : ouverture, changement de vitesse, fermeture', async ({ page }) => {
  await page.locator('.hud-button', { hasText: '⚙' }).click();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('menu');
  const slider = page.locator('input[data-key="walk.maxSpeed"]');
  await slider.fill('900');
  await expect(page.locator('.setting.changed')).toHaveCount(1);
  await page.locator('.settings button', { hasText: 'Fermer' }).click();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  const saved = await page.evaluate(() => localStorage.getItem('paper-cart.reglages.v1'));
  expect(JSON.parse(saved)).toEqual({ 'walk.maxSpeed': 900 });
});

test('diagnostic : affichage et rapport', async ({ page }, info) => {
  await page.locator('.hud-button', { hasText: 'DBG' }).click();
  await expect(page.locator('.diag')).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.locator('.diag pre')).toContainText('images/s');
  const report = await page.evaluate(() => window.paperCart.report());
  expect(report).toContain('Version');
  expect(report.length).toBeLessThan(4000);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}-diag.png` });
});

test('passe derrière le présentoir puis revient devant', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  // Monter au pied des étagères, puis longer le rayon jusque derrière le présentoir.
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 240);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 740);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);
  let lv = await page.evaluate(() => window.paperCart.levels());
  expect(lv.hero).toBeLessThan(lv['presentoir-crousti']);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}-derriere.png` });

  // Contourner par la droite et redescendre devant.
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 930);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => window.paperCart.hero().z < 60);
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(100);
  lv = await page.evaluate(() => window.paperCart.levels());
  expect(lv.hero).toBeGreaterThan(lv['presentoir-crousti']);
});

test('la feuille se retourne quand il change de côté', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  const flip = page.locator('.actor-flip');
  await page.keyboard.down('ArrowLeft');
  // Pendant le retournement, la feuille est plus étroite qu'en entier.
  await expect.poll(async () => flip.evaluate((el) => el.style.transform), { timeout: 2000, intervals: [16] }).toMatch(/scaleX\(-?0\.\d+\)/);
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowLeft');
  await expect(flip).toHaveAttribute('style', /scaleX\(-1\)/);
});
