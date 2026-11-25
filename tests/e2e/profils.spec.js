import { test, expect } from '@playwright/test';

// Profils de qualité (séance 66) : Léger plafonne la densité des images à 1, coupe la poussière et fige
// les plans lointains ; Fin (par défaut pour l'instant) garde tout comme avant.

const start = async (page) => {
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
};

test('profil Léger : images moins denses, sans erreur', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'densité de pixels du téléphone simulé');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await start(page);
  const fin = await page.evaluate(() => window.paperCart.assets().pixels);
  await page.evaluate(() => window.paperCart.set('display.profile', 'leger'));
  await start(page); // le profil s'applique au chargement
  const leger = await page.evaluate(() => window.paperCart.assets().pixels);
  console.log('Pixels d’images : Fin', fin, '· Léger', leger);
  expect(leger).toBeLessThan(fin * 0.5);
  await page.screenshot({ path: `test-results/captures/profil-leger-${info.project.name}.png` });
  await page.evaluate(() => window.paperCart.set('display.profile', 'fin'));
  expect(errors).toEqual([]);
});
