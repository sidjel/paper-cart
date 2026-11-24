import { test, expect } from '@playwright/test';

// Points de départ (tests rapides) : ⚙ → Départ, ou lien ?depart=<id>.

const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
});
test.afterEach(async () => {
  expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]);
});

test('lien ?depart=panier-plein : en jeu tout de suite, équipé, 6 cartes, sans annonce d’arrivée', async ({ page }, info) => {
  await page.goto('./?depart=panier-plein');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await expect(page.locator('.title-screen')).toBeHidden();
  const s = await page.evaluate(() => window.paperCart.scanState());
  expect(s.gear).toEqual({ scanette: true, panier: true });
  expect(s.cards.length).toBe(6);
  await expect(page.locator('.panier-count')).toHaveText('6/6');
  expect((await page.evaluate(() => window.paperCart.products())).filter((p) => p.scanned).length).toBe(6);
  await page.waitForTimeout(2500);
  expect((await page.evaluate(() => window.paperCart.narrator())).text).toBe(''); // pas d'arrivée ni de pensées
  // Le Panier s'ouvre avec ses 6 cartes, dont des non alimentaires (les filtres ont de quoi trier).
  if (info.project.name === 'telephone') await page.locator('.panier-button').tap();
  else await page.keyboard.press('KeyI');
  await expect(page.locator('.panier .card-mini')).toHaveCount(6);
  await expect(page.locator('.panier .card-mini[data-category="non-alimentaire"]')).not.toHaveCount(0);
  await page.screenshot({ path: `test-results/captures/depart-${info.project.name}-panier-plein.png` });
});

test('lien ?depart=equipe : équipé, panier vide ; un lien inconnu donne le début normal', async ({ page }) => {
  await page.goto('./?depart=equipe');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  expect((await page.evaluate(() => window.paperCart.scanState())).gear).toEqual({ scanette: true, panier: true });
  await expect(page.locator('.panier-count')).toHaveText('0/6');
  await page.goto('./?depart=nimporte');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
});

test('⚙ → Départ : choisir « 3 cartes » recharge le jeu à ce point', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.goto('./?depart=libre');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.keyboard.press('F2');
  const panel = page.locator('.settings');
  await panel.locator('.settings-tab', { hasText: 'Départ' }).click();
  await expect(panel.locator('.depart-tools button.current')).toContainText('rencontre déjà faite');
  await page.screenshot({ path: `test-results/captures/depart-${info.project.name}-menu.png` });
  await Promise.all([page.waitForURL(/depart=3-cartes/), panel.locator('.depart-tools button', { hasText: '3 cartes' }).click()]);
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await expect(page.locator('.panier-count')).toHaveText('3/6');
});

test('lieux : quitter le lieu et y revenir — le monde se souvient, rien ne s’accumule', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'une fois suffit');
  await page.goto('./?depart=3-cartes');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  const count = () => page.evaluate(() => ({
    images: window.paperCart.assets().images,
    pixels: window.paperCart.assets().pixels,
    stages: document.querySelectorAll('.stage').length,
    elements: document.querySelectorAll('#game *').length,
    scanned: window.paperCart.products().filter((p) => p.scanned).length,
  }));
  const before = await count();
  expect(before.scanned).toBe(3);
  for (let k = 0; k < 3; k++) await page.evaluate(() => window.paperCart.reloadPlace());
  expect(await count()).toEqual(before); // mêmes images en mémoire, même nombre d'éléments, mêmes produits scannés
  await expect(page.locator('.product:visible')).toHaveCount(await page.evaluate(() => window.paperCart.products().length) - 3);
  await expect(page.locator('.actor-frame:visible')).toHaveCount(1); // le héros est toujours là
  // Et le jeu continue : il marche, puis scanne.
  const x0 = (await page.evaluate(() => window.paperCart.hero())).x;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  expect((await page.evaluate(() => window.paperCart.hero())).x).toBeGreaterThan(x0 + 50);
  await page.screenshot({ path: `test-results/captures/lieu-recharge-${info.project.name}.png` });
});

test('A6 : du rayon à l’accueil et retour — fondu, le rayon se souvient, la mémoire ne grimpe pas', async ({ page }, info) => {
  await page.goto('./?depart=3-cartes');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  const place = () => page.evaluate(() => window.paperCart.place());
  const go = async (key, to) => {
    await page.keyboard.down(key);
    await expect.poll(place, { timeout: 15000 }).toBe(to);
    await page.keyboard.up(key);
    await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play'); // le fondu est fini
    await expect(page.locator('.place-fade')).toBeHidden();
  };
  const assets = () => page.evaluate(() => window.paperCart.assets());
  const before = await assets();
  // Tout à gauche du rayon : fondu (court par défaut : 0,06 s), puis l'accueil.
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.state() === 'transition' && !document.querySelector('.place-fade').hidden, null, { timeout: 15000 });
  await page.keyboard.up('ArrowLeft');
  await expect.poll(place).toBe('accueil');
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
  await expect(page.locator('.stage')).toHaveCount(1);
  await expect(page.locator('.actor-frame:visible')).toHaveCount(1);
  await expect(page.locator('.panier-count')).toHaveText('3/6'); // les cartes suivent le héros
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/captures/a6-${info.project.name}-accueil.png` });
  // Retour au rayon par la droite du hall : les produits scannés le sont toujours.
  await go('ArrowRight', 'rayon-essai');
  expect((await page.evaluate(() => window.paperCart.products())).filter((p) => p.scanned).length).toBe(3);
  // Deux allers-retours de plus : mêmes images en mémoire qu'au début.
  for (let k = 0; k < 2; k++) {
    await go('ArrowLeft', 'accueil');
    await go('ArrowRight', 'rayon-essai');
  }
  expect(await assets()).toEqual(before);
  await page.screenshot({ path: `test-results/captures/a6-${info.project.name}-retour.png` });
});
