import { test, expect } from '@playwright/test';

// Le son (séance 65) : compteurs de sons joués et de nœuds audio actifs (créés − libérés), lus par le
// diagnostic. Avant correction, rien n'est libéré : le compteur des effets grandit à chaque pas.

test('les compteurs du son avancent quand le héros marche (sons joués, nœuds créés)', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'une fois, en taille PC');
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
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
  expect(after.sfx).toBeGreaterThan(0);
});
