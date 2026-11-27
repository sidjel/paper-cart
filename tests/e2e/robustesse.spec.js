import { test, expect } from '@playwright/test';

// Robustesse des changements de lieu (séance 62) : une image du lieu d'arrivée qui ne se charge pas ne
// bloque jamais le jeu. On bloque volontairement la requête de l'image.
// (Le navigateur signale lui-même la requête bloquée dans la console : seules les erreurs non rattrapées
// du jeu comptent ici.)

let pageErrors;
test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) pageErrors.push(m.text());
  });
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.markSaid('arrivee');
    window.paperCart.set('narrator.enabled', false);
    window.paperCart.set('narrator.enabled', true);
  });
});
test.afterEach(() => expect(pageErrors, 'aucune erreur non rattrapée').toEqual([]));

const said = (page) => page.evaluate(() => window.paperCart.journal().join(' '));

test('le rayon ne se charge pas : retour au hall, là où le héros est sorti ; le haut-parleur prévient ; le jeu reste jouable', async ({ page }) => {
  await page.route('**/rayon-fond.*', (r) => r.abort());
  const before = await page.evaluate(() => window.paperCart.hero());
  expect(await page.evaluate(() => window.paperCart.useExit('vers-rayon'))).toBe(true);
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'accueil', null, { timeout: 15000 });
  const after = await page.evaluate(() => window.paperCart.hero());
  expect([after.x, after.z]).toEqual([before.x, before.z]);
  await expect.poll(() => said(page), { timeout: 5000 }).toMatch(/momentanément inaccessible/);
  expect(await page.evaluate(() => window.paperCart.errors().join(' '))).toMatch(/rayon-essai/); // noté pour le diagnostic
  // Toujours jouable : il marche.
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.hero())).x, { timeout: 6000 }).toBeGreaterThan(after.x + 50);
  await page.keyboard.up('ArrowRight');
  // L'image revient : le rayon s'ouvre normalement.
  await page.unroute('**/rayon-fond.*');
  await page.evaluate(() => window.paperCart.useExit('vers-rayon'));
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'rayon-essai', null, { timeout: 15000 });
});

test('même le hall ne se recharge pas : écran « Réessayer », qui ramène au jeu', async ({ page }) => {
  await page.route('**/rayon-fond.*', (r) => r.abort());
  await page.route('**/accueil-fond.*', (r) => r.abort());
  await page.evaluate(() => window.paperCart.useExit('vers-rayon', true)); // simule un déchargement préalable sans lieu de repli
  await page.waitForFunction(() => window.paperCart.state() === 'erreur', null, { timeout: 15000 });
  await expect(page.locator('.place-error')).toBeVisible();
  await page.screenshot({ path: 'test-results/captures/robustesse-erreur.png' });
  await page.unroute('**/accueil-fond.*');
  // Relais (docs/ARCHITECTURE.md §11, séance 70) : au moment où l'écran d'erreur est retiré, l'écran noir
  // des lieux est déjà là, plein, dessous ; ensuite il s'efface et disparaît.
  await page.evaluate(() => {
    const err = document.querySelector('.place-error');
    const fade = document.querySelector('.place-fade');
    window.__relay = null;
    new MutationObserver(() => {
      if (err.hidden && !window.__relay) window.__relay = { fadeShown: !fade.hidden, opacity: fade.style.opacity };
    }).observe(err, { attributes: true, attributeFilter: ['hidden'] });
  });
  await page.locator('.place-error button').dblclick(); // un double appui ne lance qu'un essai
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'accueil', null, { timeout: 15000 });
  await expect(page.locator('.place-error')).toBeHidden();
  expect(await page.evaluate(() => window.__relay)).toEqual({ fadeShown: true, opacity: '1' });
  await expect(page.locator('.place-fade')).toBeHidden(); // puis la scène se dévoile, le noir est retiré
});

test('un chargement lent : un signe d’attente apparaît dans le noir, puis le lieu s’ouvre', async ({ page }) => {
  await page.route('**/rayon-fond.*', async (r) => {
    await new Promise((res) => setTimeout(res, 1200)); // réseau lent (dans le test seulement)
    await r.continue();
  });
  await page.evaluate(() => window.paperCart.useExit('vers-rayon'));
  await expect(page.locator('.place-wait')).toBeVisible({ timeout: 3000 });
  await page.screenshot({ path: 'test-results/captures/robustesse-attente.png' });
  await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.place() === 'rayon-essai', null, { timeout: 15000 });
  await expect(page.locator('.place-wait')).toBeHidden();
});
