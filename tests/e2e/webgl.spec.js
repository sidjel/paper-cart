import { test, expect } from '@playwright/test';
import { watchConsole } from './helpers.js';

// Suite dédiée au moteur WebGL de PixiJS v8 (démarrage, fondu RenderTexture, retournement 2.5D,
// zéro erreur console). Toutes les attentes reposent sur l'état du jeu (indépendantes des i/s
// même en WebGL logiciel à ~4 i/s sur le runner CI).
// Ne réussit jamais en silence si WebGL est absent : échec obligatoire en CI, saut explicite en local.

function requireWebGL(sc) {
  if (sc.isWebGL) return;
  if (process.env.CI) {
    expect(sc.isWebGL, 'WebGL doit être actif sur le runner CI (jamais de repli Canvas silencieux)').toBe(true);
  }
  test.skip(true, 'WebGL indisponible dans ce navigateur local (repli Canvas : saut explicite)');
}

async function detectGpuRenderer(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#game canvas');
    const gl = c?.getContext?.('webgl2') || c?.getContext?.('webgl');
    if (!gl) return 'aucun';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return (ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || 'WebGL';
  });
}

const errors = [];
test.beforeEach(({ page }) => {
  errors.length = 0;
  watchConsole(page, errors);
});
test.afterEach(() => {
  expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]);
});

test('WebGL : démarrage dans l’accueil puis le rayon sans erreur', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'title', null, { timeout: 20_000 });
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play', null, { timeout: 20_000 });
  await expect(page.locator('#game canvas')).toHaveCount(1);
  await expect(page.locator('#game canvas')).toBeVisible();

  const sc = await page.evaluate(() => window.paperCart.scene());
  const gpu = await detectGpuRenderer(page);
  console.log(`WebGL démarrage (accueil) : renderer=${sc.renderer}, isWebGL=${sc.isWebGL}, gpu=${gpu}, stageNodes=${sc.stageNodes}`);
  requireWebGL(sc);
  expect(sc.hasStage).toBe(true);
  expect(sc.hero.visible).toBe(true);
  expect(sc.layers).toContain('fond');
  expect(sc.renderTextures).toBe(0);
});

test('WebGL : changement de lieu accueil ↔ rayon (RenderTexture fondu, zéro fuite)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./?depart=3-cartes');
  await page.waitForFunction(() => window.paperCart?.state() === 'play', null, { timeout: 20_000 });
  const sc0 = await page.evaluate(() => window.paperCart.scene());
  requireWebGL(sc0);
  const before = await page.evaluate(() => window.paperCart.assets());

  expect(await page.evaluate(() => window.paperCart.useExit('vers-accueil'))).toBe(true);
  await page.waitForFunction(() => window.paperCart.place() === 'accueil' && window.paperCart.state() === 'play', null, { timeout: 25_000 });
  const inHall = await page.evaluate(() => window.paperCart.scene());
  expect(inHall.hasStage).toBe(true);
  expect(inHall.hero.visible).toBe(true);
  expect(inHall.renderTextures).toBe(0);

  expect(await page.evaluate(() => window.paperCart.useExit('vers-rayon'))).toBe(true);
  await page.waitForFunction(() => window.paperCart.place() === 'rayon-essai' && window.paperCart.state() === 'play', null, { timeout: 25_000 });
  const back = await page.evaluate(() => window.paperCart.scene());
  expect(back.hero.visible).toBe(true);
  expect(back.renderTextures).toBe(0);
  expect(await page.evaluate(() => window.paperCart.assets())).toEqual(before);
});

test('WebGL : retournement 2.5D de la feuille sans erreur console', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title', null, { timeout: 20_000 });
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play', null, { timeout: 20_000 });
  await page.evaluate(() => {
    window.paperCart.markSaid('arrivee');
    window.paperCart.markSaid('rencontre');
  });

  // Vérifie la présence réelle de WebGL et des 2 MeshPlane 2.5D (77 nœuds vs 75 en Canvas).
  const sc0 = await page.evaluate(() => window.paperCart.scene());
  requireWebGL(sc0);
  expect(sc0.stageNodes).toBeGreaterThanOrEqual(77);

  // Marcher vers la droite jusqu'à orientation E (et fin d'un éventuel pivot initial), puis demi-tour vers W.
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.paperCart.hero().dir), { timeout: 10_000 }).toBe('E');
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.paperCart.scene().hero.flipping), { timeout: 10_000 }).toBe(false);

  await page.evaluate(() => {
    window.__flip25dSeen = false;
    window.__flipStop = false;
    const watch = () => {
      if (window.paperCart?.scene?.().hero?.flipping) window.__flip25dSeen = true;
      if (!window.__flipStop) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });

  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.paperCart.hero().dir), { timeout: 10_000 }).toBe('W');
  await expect.poll(() => page.evaluate(() => window.__flip25dSeen), { timeout: 10_000 }).toBe(true);
  await page.keyboard.up('ArrowLeft');
  await page.evaluate(() => { window.__flipStop = true; });
  await expect.poll(() => page.evaluate(() => window.paperCart.scene().hero.flipping), { timeout: 10_000 }).toBe(false);
  expect(await page.evaluate(() => window.paperCart.scene().hero.flipScaleX)).toBeLessThan(-0.9);
});
