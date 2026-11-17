import { test, expect } from '@playwright/test';

// Le son (séance 65) : compteurs de sons joués et de nœuds audio actifs (créés − libérés), lus par le
// diagnostic. Correction n° 1 : chaque son libère ses nœuds à sa fin ; le compteur des effets retombe à
// zéro quand plus rien ne joue, celui de la musique reste borné (quelques notes à l'avance).

test('le son ne s’accumule pas : les nœuds des pas sont libérés, la musique reste bornée', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'une fois, en taille PC');
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => window.paperCart.set('narrator.enabled', false)); // pas de petits bips de texte
  await page.keyboard.press('ArrowRight'); // premier geste : le son démarre
  await expect.poll(() => page.evaluate(() => window.paperCart.audio().state), { timeout: 5000 }).toBe('running');
  const before = await page.evaluate(() => window.paperCart.audio());
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowRight');
  const after = await page.evaluate(() => window.paperCart.audio());
  console.log('Son :', JSON.stringify({ before, after }));
  expect(after.played).toBeGreaterThan(before.played); // des pas
  expect(after.notes).toBeGreaterThan(before.notes); // la musique
  // À l'arrêt : les nœuds des pas sont libérés ; la musique ne s'accumule pas.
  await expect.poll(() => page.evaluate(() => window.paperCart.audio().sfx), { timeout: 3000 }).toBe(0);
  const m1 = (await page.evaluate(() => window.paperCart.audio())).music;
  await page.waitForTimeout(3000);
  const m2 = (await page.evaluate(() => window.paperCart.audio())).music;
  console.log('Musique, nœuds actifs :', m1, '→', m2);
  expect(m2).toBeLessThan(150);
  expect(Math.abs(m2 - m1)).toBeLessThan(80);
});
