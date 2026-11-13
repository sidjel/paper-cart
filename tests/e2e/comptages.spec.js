import { test, expect } from '@playwright/test';
import limites from './comptages-limites.json' with { type: 'json' };

// Test des comptages : on compte ce qui ne dépend pas de la machine (le navigateur de test
// n'a pas de carte graphique, ses temps ne veulent rien dire), pendant un tour du banc d'essai.
// Le test échoue si une modification dépasse une limite du lieu (tests/e2e/comptages-limites.json).

test('comptages du rayon d’essai pendant le banc d’essai', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'mesuré une fois, en taille PC');
  test.setTimeout(120_000);
  // Compteurs installés avant le chargement du jeu.
  await page.addInitScript(() => {
    const c = { counting: false, created: 0, canvases: 0, pixelReads: 0, added: 0 };
    window.__comptages = c;
    const createElement = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...rest) {
      if (c.counting) {
        c.created++;
        if (String(tag).toLowerCase() === 'canvas') c.canvases++;
      }
      return createElement.call(this, tag, ...rest);
    };
    const NativeImage = window.Image;
    window.Image = function (...args) {
      if (c.counting) c.created++;
      return new NativeImage(...args);
    };
    window.Image.prototype = NativeImage.prototype;
    const getImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      c.pixelReads++;
      return getImageData.apply(this, args);
    };
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');

  // Éléments ajoutés à la scène pendant le jeu (doivent rester à zéro).
  await page.evaluate(() => {
    const c = window.__comptages;
    new MutationObserver((list) => {
      if (c.counting) for (const m of list) c.added += m.addedNodes.length;
    }).observe(document.getElementById('game'), { childList: true, subtree: true });
    c.counting = true;
    window.paperCart.startBench(1, 0);
  });

  // Échantillons pendant le parcours : éléments affichés, surface d'image (recouvrements).
  const sample = () =>
    page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const stage = document.querySelector('.stage');
      let area = 0, visibleImages = 0;
      for (const img of stage.querySelectorAll('img')) {
        if (img.hidden || img.closest('[hidden]') || getComputedStyle(img).display === 'none') continue;
        const layer = img.closest('.layer');
        if (layer && getComputedStyle(layer).display === 'none') continue;
        // Surface réellement affichée : l'image, coupée par l'écran et par les éléments qui la découpent
        // (overflow : par exemple les fenêtres des rayons lointains).
        const r = img.getBoundingClientRect();
        let L = Math.max(0, r.left), T = Math.max(0, r.top), R = Math.min(vw, r.right), B = Math.min(vh, r.bottom);
        for (let a = img.parentElement; a && a !== stage; a = a.parentElement) {
          if (getComputedStyle(a).overflow === 'visible') continue;
          const c = a.getBoundingClientRect();
          L = Math.max(L, c.left); T = Math.max(T, c.top); R = Math.min(R, c.right); B = Math.min(B, c.bottom);
        }
        const w = Math.max(0, R - L);
        const h = Math.max(0, B - T);
        if (w * h > 0) visibleImages++;
        area += w * h;
      }
      return {
        stageElements: stage.querySelectorAll('*').length,
        // Calques affichés (un rendu de remplacement masqué ne compte pas).
        layers: [...stage.querySelectorAll('.layer')].filter((l) => getComputedStyle(l).display !== 'none').length,
        visibleImages,
        overdraw: area / (vw * vh),
      };
    });

  const max = { stageElements: 0, layers: 0, visibleImages: 0, overdraw: 0 };
  while (!(await page.evaluate(() => window.paperCart.benchReport()))) {
    const s = await sample();
    for (const k of Object.keys(max)) max[k] = Math.max(max[k], s[k]);
    await page.waitForTimeout(400);
  }
  const c = await page.evaluate(() => window.__comptages);
  const assets = await page.evaluate(() => window.paperCart.assets());
  const mesures = {
    ...max,
    overdraw: Math.round(max.overdraw * 100) / 100,
    images: assets.images,
    megapixels: Math.round(assets.pixels / 1e4) / 100,
    elementsCreatedInPlay: c.created,
    canvasesInPlay: c.canvases,
    domNodesAddedInPlay: c.added,
    pixelReads: c.pixelReads,
  };
  console.log('Comptages mesurés :', JSON.stringify(mesures));
  test.info().annotations.push({ type: 'comptages', description: JSON.stringify(mesures) });

  const lim = limites['rayon-essai'];
  for (const [k, v] of Object.entries(lim)) {
    if (k === 'comment') continue;
    expect.soft(mesures[k], `${k} : ${mesures[k]} (limite ${v})`).toBeLessThanOrEqual(v);
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.paperCart.benchReport())).toContain('Résultat : terminé');
});
