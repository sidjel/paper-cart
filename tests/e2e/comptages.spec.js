import { test, expect } from '@playwright/test';
import limites from './comptages-limites.json' with { type: 'json' };

// Test des comptages : on compte ce qui ne dépend pas de la machine (le navigateur de test
// n'a pas de carte graphique, ses temps ne veulent rien dire), pendant un tour du banc d'essai.
// Le test échoue si une modification dépasse une limite du lieu (tests/e2e/comptages-limites.json).
// Un lieu sans limites inscrites (le hall, séance 56) est seulement mesuré : les valeurs sont proposées
// à l'auteur, qui décide des limites.

for (const lieu of ['rayon-essai', 'accueil'])
test(`comptages du lieu « ${lieu} » pendant le banc d’essai`, async ({ page }, info) => {
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
  await page.goto(`./?lieu=${lieu}`);
  // Écran titre : « Commencer » (sauf pour les tests de l'écran titre lui-même).
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');

  // Objets du décor qui changent de calque pendant le parcours (cause de clignotements sur
  // téléphone : l'objet est redessiné à chaque bascule). Lu dans l'organisation des calques du moteur.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '.prop' });
  const propIds = new Set();
  for (const nodeId of nodeIds) propIds.add((await cdp.send('DOM.describeNode', { nodeId })).node.backendNodeId);
  let propLayerSig = null;
  let propLayerSwitches = 0;
  let tracking = false; // le premier relevé du moteur peut être incomplet : on part d'un état établi
  cdp.on('LayerTree.layerTreeDidChange', (e) => {
    if (!e.layers) return;
    const sig = e.layers.filter((l) => propIds.has(l.backendNodeId)).map((l) => l.backendNodeId).sort().join(',');
    if (tracking && sig !== propLayerSig) propLayerSwitches++;
    propLayerSig = sig;
  });
  await cdp.send('LayerTree.enable');
  await page.waitForTimeout(1000);
  tracking = true;

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
        const r = img.getBoundingClientRect();
        const w = Math.max(0, Math.min(vw, r.right) - Math.max(0, r.left));
        const h = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top));
        if (w * h > 0) visibleImages++;
        area += w * h;
      }
      return {
        stageElements: stage.querySelectorAll('*').length,
        layers: stage.querySelectorAll('.layer').length,
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
    propLayerSwitches,
  };
  console.log(`Comptages mesurés (${lieu}) :`, JSON.stringify(mesures));
  test.info().annotations.push({ type: 'comptages', description: JSON.stringify(mesures) });

  const lim = limites[lieu] ?? {};
  for (const [k, v] of Object.entries(lim)) {
    if (k === 'comment') continue;
    expect.soft(mesures[k], `${k} : ${mesures[k]} (limite ${v})`).toBeLessThanOrEqual(v);
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.paperCart.benchReport())).toContain('Résultat : terminé');
});

// Mémoire après les changements de lieu : des comptages (pas des temps), fiables sans carte graphique.
// Après 5 allers-retours rayon ↔ accueil, les éléments de page, les écouteurs d'événements et la mémoire
// JavaScript reviennent à leur niveau de départ (petite marge).
test('mémoire : 5 allers-retours rayon ↔ accueil, rien ne s’accumule', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'mesuré une fois, en taille PC');
  test.setTimeout(90_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?depart=3-cartes');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  const measure = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.collectGarbage');
    const dom = await cdp.send('Memory.getDOMCounters');
    const heap = await cdp.send('Runtime.getHeapUsage');
    const assets = await page.evaluate(() => window.paperCart.assets());
    return { nodes: dom.nodes, listeners: dom.jsEventListeners, heapMb: heap.usedSize / 1048576, images: assets.images, pixels: assets.pixels };
  };
  const travel = async (to) => {
    await page.evaluate(() => window.paperCart.useExit());
    await page.waitForFunction((p) => window.paperCart.place() === p && window.paperCart.state() === 'play', to, { timeout: 15_000 });
  };
  // Un premier aller-retour pour amorcer (ce qui est créé une seule fois, à la première visite).
  await travel('accueil');
  await travel('rayon-essai');
  await page.waitForTimeout(500);
  const start = await measure();
  for (let k = 0; k < 5; k++) {
    await travel('accueil');
    await travel('rayon-essai');
  }
  await page.waitForTimeout(500);
  const end = await measure();
  console.log('Mémoire après 5 allers-retours :', JSON.stringify({ start, end }));
  test.info().annotations.push({ type: 'mémoire', description: JSON.stringify({ start, end }) });
  expect(end.images).toBe(start.images);
  expect(end.pixels).toBe(start.pixels);
  expect(end.listeners).toBeLessThanOrEqual(start.listeners + 5);
  expect(end.nodes).toBeLessThanOrEqual(start.nodes + 30); // séance 53 : une fuite de +58 éléments par changement de lieu a été trouvée ainsi
  expect(end.heapMb).toBeLessThanOrEqual(start.heapMb * 1.15 + 1);
  expect(errors).toEqual([]);
});

// Clignotement sur téléphone (séance 59) : un élément qui gagne ou perd son calque graphique est
// redessiné. Pendant la scène de l'agent (interpellation, « Stop ! », poses), ni l'agent ni les
// portiques ne doivent gagner ou perdre leur calque, ni être redessinés (séance 60 : l'agent était
// redessiné à chaque changement de pose, quand sa bulle s'ouvrait et se fermait).
test('hall : l’agent et les portiques gardent leur calque pendant la scène de l’agent', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'mesuré une fois, en taille PC');
  test.setTimeout(60_000);
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.markSaid('arrivee');
    for (const [k, v] of [['narrator.speed', 400], ['narrator.hold', 0.4], ['narrator.holdPerChar', 0]]) window.paperCart.set(k, v);
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const watched = new Set();
  for (const sel of ['.guard', '.guard-pose', '.prop']) {
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
    for (const nodeId of nodeIds) watched.add((await cdp.send('DOM.describeNode', { nodeId })).node.backendNodeId);
  }
  expect(watched.size).toBe(7); // l'agent (boîte et deux poses) et les 4 portiques
  let sig = null;
  let switches = 0;
  let tracking = false;
  cdp.on('LayerTree.layerTreeDidChange', (e) => {
    if (!e.layers) return;
    const s = e.layers.filter((l) => watched.has(l.backendNodeId)).map((l) => l.backendNodeId).sort().join(',');
    if (tracking && s !== sig) switches++;
    sig = s;
  });
  const layerOf = new Map(); // calque → élément
  let repaints = 0;
  cdp.on('LayerTree.layerTreeDidChange', (e) => {
    for (const l of e.layers ?? []) if (watched.has(l.backendNodeId)) layerOf.set(l.layerId, l.backendNodeId);
  });
  cdp.on('LayerTree.layerPainted', (e) => {
    if (tracking && layerOf.has(e.layerId)) repaints++;
  });
  await cdp.send('LayerTree.enable');
  await page.waitForTimeout(2500); // l'agent va à sa place
  tracking = true;
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.journal().some((l) => /Stop\s?!/.test(l)), null, { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowLeft');
  for (const k of ['ArrowUp', 'ArrowDown']) {
    await page.keyboard.down(k);
    await page.waitForTimeout(700);
    await page.keyboard.up(k);
  }
  console.log('Hall, agent et portiques : changements de calque', switches, ', redessins', repaints);
  expect(switches).toBe(0);
  expect(repaints).toBe(0);
});
