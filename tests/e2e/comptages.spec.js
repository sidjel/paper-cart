import { test, expect } from '@playwright/test';
import limites from './comptages-limites.json' with { type: 'json' };

// Test des comptages : on compte ce qui ne dépend pas de la machine (le navigateur de test
// n'a pas de carte graphique, ses temps ne veulent rien dire), pendant un tour du banc d'essai.
// Le test échoue si une modification dépasse une limite du lieu (tests/e2e/comptages-limites.json).
// Un lieu sans limites inscrites (le hall, séance 56) est seulement mesuré : les valeurs sont proposées
// à l'auteur, qui décide des limites.

for (const lieu of ['rayon-essai', 'accueil', 'rayon-2'])
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
        ambientLayers: stage.querySelectorAll('.cloud, .bird').length,
        visibleImages,
        overdraw: area / (vw * vh),
      };
    });

  const max = { stageElements: 0, layers: 0, ambientLayers: 0, visibleImages: 0, overdraw: 0 };
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
// Après 5 allers-retours rayon ↔ accueil, les éléments de page, les écouteurs d'événements, les images
// chargées et la mémoire JavaScript reviennent à leur niveau de départ (petite marge). Séance 62 : aussi
// avec un chargement qui échoue au milieu (l'image du hall bloquée une fois : retour au rayon).
for (const withFailure of [false, true])
test(`mémoire : 5 allers-retours rayon ↔ accueil${withFailure ? ', avec un échec de chargement au milieu' : ''}, rien ne s’accumule`, async ({ page }, info) => {
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
    return { nodes: dom.nodes, listeners: dom.jsEventListeners, heapMb: heap.usedSize / 1048576, images: assets.images, pixels: assets.pixels, timings: assets.timings };
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
    if (withFailure && k === 2) {
      // L'image du hall ne se charge pas : retour au rayon, là où le héros est sorti.
      await page.route('**/accueil-fond.*', (r) => r.abort());
      await page.evaluate(() => window.paperCart.useExit());
      await page.waitForFunction(() => window.paperCart.state() === 'play' && window.paperCart.journal().some((l) => l.includes('momentanément inaccessible')), null, { timeout: 15_000 });
      expect(await page.evaluate(() => window.paperCart.place())).toBe('rayon-essai');
      await page.unroute('**/accueil-fond.*');
    }
    await travel('accueil');
    await travel('rayon-essai');
  }
  await page.waitForTimeout(500);
  const end = await measure();
  console.log(`Mémoire après 5 allers-retours${withFailure ? ' (avec un échec)' : ''} :`, JSON.stringify({ start, end }));
  test.info().annotations.push({ type: 'mémoire', description: JSON.stringify({ start, end }) });
  expect(end.images).toBe(start.images);
  expect(end.pixels).toBe(start.pixels);
  expect(end.timings).toBe(start.timings); // l'historique des temps d'image ne grossit plus (séance 62)
  expect(end.listeners).toBeLessThanOrEqual(start.listeners + 5);
  expect(end.nodes).toBeLessThanOrEqual(start.nodes + 30); // séance 53 : une fuite de +58 éléments par changement de lieu a été trouvée ainsi
  expect(end.heapMb).toBeLessThanOrEqual(start.heapMb * 1.15 + 1);
  expect(errors).toEqual([]);
});

// Clignotement sur téléphone (séances 59 à 61). Règle (docs/ARCHITECTURE.md §4) : un personnage ou un
// objet animé = un seul calque, sur son conteneur ; ses poses à l'intérieur, sans calque propre.
// Pendant la scène de l'agent (le héros marche, l'agent lève le bras puis le baisse, « Stop ! »), aucun
// changement de pose ne crée de calque ni n'en change, pour le héros comme pour l'agent ; les portiques
// gardent leur calque fixe (séance 27).
test('hall : les changements de pose (héros, agent) ne créent ni ne changent aucun calque', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'mesuré une fois, en taille PC');
  test.setTimeout(60_000);
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.markSaid('arrivee');
    for (const [k, v] of [['narrator.speed', 400], ['narrator.timedMin', 1], ['narrator.timedPerChar', 0.005]]) window.paperCart.set(k, v);
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const ids = async (sel) => {
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
    return Promise.all(nodeIds.map(async (nodeId) => (await cdp.send('DOM.describeNode', { nodeId })).node.backendNodeId));
  };
  const containers = new Set([...(await ids('.guard')), ...(await ids('.actor')), ...(await ids('.prop'))]);
  const poses = new Set([...(await ids('.guard-pose')), ...(await ids('.actor-frame'))]);
  expect(containers.size).toBe(8); // l'agent, le héros, les 3 portiques, la plante, les paniers rouges et la brume du couloir
  expect(poses.size).toBeGreaterThan(10); // 2 poses de l'agent, les images du héros
  let sig = null;
  let changes = 0;
  let poseLayers = 0;
  let tracking = false;
  cdp.on('LayerTree.layerTreeDidChange', (e) => {
    if (!e.layers) return;
    const s = e.layers.filter((l) => containers.has(l.backendNodeId)).map((l) => l.backendNodeId).sort().join(',');
    if (tracking && s !== sig) changes++;
    sig = s;
    if (tracking) poseLayers += e.layers.filter((l) => poses.has(l.backendNodeId)).length;
  });
  await cdp.send('LayerTree.enable');
  await page.waitForTimeout(2500); // l'agent va à sa place
  tracking = true;
  const poseSeen = new Set();
  const watchPose = async () => poseSeen.add((await page.evaluate(() => window.paperCart.guard())).pose);
  await page.keyboard.down('ArrowLeft');
  for (let k = 0; k < 60 && !(await page.evaluate(() => window.paperCart.journal().some((l) => /Stop\s?!/.test(l)))); k++) {
    await watchPose();
    await page.waitForTimeout(150);
  }
  for (let k = 0; k < 15; k++) {
    await watchPose();
    await page.waitForTimeout(150);
  }
  await page.keyboard.up('ArrowLeft');
  for (const k of ['ArrowUp', 'ArrowDown']) {
    await page.keyboard.down(k);
    await page.waitForTimeout(700);
    await page.keyboard.up(k);
  }
  expect([...poseSeen].sort()).toEqual(['idle', 'stop']); // l'agent a bien changé de pose
  console.log('Hall : changements de calque', changes, ', calques de pose', poseLayers);
  expect(changes).toBe(0);
  expect(poseLayers).toBe(0);
});

// Pendant un scan (séance 63) : la carte qui vole est préparée une fois (remplie à chaque scan), et le
// texte du haut-parleur ne crée plus de morceaux de texte à chaque lettre. Seule reste la petite carte
// ajoutée au Panier (dans le panneau caché) : un élément et son contenu. Écart connu, accepté pour
// l'instant (correction plus risquée : la liste du Panier, ses onglets et le choix au clavier).
test('un scan ne crée que la petite carte du Panier', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'mesuré une fois, en taille PC');
  await page.addInitScript(() => {
    const c = (window.__scan = { on: false, created: 0, added: {} });
    const ce = Document.prototype.createElement;
    Document.prototype.createElement = function (t, ...r) {
      if (c.on) c.created++;
      return ce.call(this, t, ...r);
    };
  });
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.equip();
    window.paperCart.markSaid('rencontre');
  });
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.scanState().reach === 0, null, { timeout: 8000 });
  await page.keyboard.up('ArrowRight');
  await page.evaluate(() => {
    const c = window.__scan;
    new MutationObserver((list) => {
      if (!c.on) return;
      for (const m of list) {
        const where = m.target.nodeType === 1 ? m.target.className || m.target.tagName : 'texte';
        for (const n of m.addedNodes) c.added[where] = (c.added[where] ?? 0) + 1;
      }
    }).observe(document.body, { childList: true, subtree: true });
    c.on = true;
  });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.paperCart.journal().length > 0, null, { timeout: 8000 }); // le haut-parleur commente
  await page.waitForTimeout(2500);
  const c = await page.evaluate(() => window.__scan);
  console.log('Pendant un scan :', JSON.stringify(c));
  expect(c.created).toBe(1); // la petite carte du Panier
  expect(c.added).toEqual({ 'panier-grid': 1 });
});

// Rien n'apparaît à froid au début de la partie (séance 68 : le héros et la bande du haut-parleur
// clignotaient sur le téléphone). Une fois la scène dévoilée, plus aucun calque n'est créé ni retiré pendant
// 6 s, alors que le haut-parleur fait son annonce d'arrivée et que le héros cligne des yeux.
test('début de partie : après l’apparition du hall, aucun calque créé ni retiré (annonce comprise)', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  test.setTimeout(40_000);
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('DOM.getDocument', { depth: -1 });
  await cdp.send('LayerTree.enable');
  let tracking = false;
  let prev = null;
  const changes = [];
  cdp.on('LayerTree.layerTreeDidChange', (e) => {
    if (!e.layers) return;
    const cur = new Set(e.layers.map((l) => l.backendNodeId || l.layerId));
    if (tracking && prev) {
      for (const id of cur) if (!prev.has(id)) changes.push(['+', id]);
      for (const id of prev) if (!cur.has(id)) changes.push(['-', id]);
    }
    prev = cur;
  });
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart.state() === 'play');
  await page.waitForTimeout(700); // noir tenu puis effacé : la scène est dévoilée
  tracking = true;
  await page.waitForFunction(() => window.paperCart.journal().length > 0, null, { timeout: 8000 }); // l'annonce d'arrivée
  await page.waitForTimeout(5000);
  const names = [];
  for (const [k, id] of changes) {
    try {
      const d = (await cdp.send('DOM.describeNode', { backendNodeId: id })).node;
      const a = d.attributes ?? [];
      names.push(`${k}${d.localName}.${a[a.indexOf('class') + 1] ?? ''}`);
    } catch {
      names.push(`${k}?`);
    }
  }
  console.log('Calques créés ou retirés après l’apparition :', names.length, names.join(' '));
  expect(names).toEqual([]);
});

// Fin de l'intro (séance 68, cause prouvée par l'auteur : intro désactivée, plus de clignotement). Son écran
// noir est retiré sous l'écran noir des lieux, déjà plein, qui s'efface ensuite comme après un changement de
// lieu. Pendant tout ce passage, rien d'autre ne gagne ni ne perd son calque.
test('fin de l’intro : l’écran noir des lieux prend le relais ; rien d’autre ne change de calque', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  test.setTimeout(60_000);
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('DOM.getDocument', { depth: -1 });
  await cdp.send('LayerTree.enable');
  let tracking = false;
  let prev = null;
  const changes = [];
  cdp.on('LayerTree.layerTreeDidChange', (e) => {
    if (!e.layers) return;
    const cur = new Set(e.layers.map((l) => l.backendNodeId || l.layerId));
    if (tracking && prev) {
      for (const id of cur) if (!prev.has(id)) changes.push(['+', id]);
      for (const id of prev) if (!cur.has(id)) changes.push(['-', id]);
    }
    prev = cur;
  });
  await page.locator('.title-button', { hasText: 'Commencer' }).click();
  await page.waitForFunction(() => window.paperCart.state() === 'intro');
  await page.waitForTimeout(1500);
  tracking = true; // avant la fin de l'intro
  await page.keyboard.press('Escape'); // passer l'intro
  await page.waitForFunction(() => window.paperCart.state() === 'play', null, { timeout: 30000 });
  expect(await page.locator('.place-fade').isVisible()).toBe(true); // le relais : l'écran noir des lieux
  await page.waitForTimeout(5000); // fondu fini, annonce d'arrivée, clignement des yeux
  const names = [];
  for (const [k, id] of changes) {
    try {
      const d = (await cdp.send('DOM.describeNode', { backendNodeId: id })).node;
      const a = d.attributes ?? [];
      names.push(`${k}${d.localName}.${(a[a.indexOf('class') + 1] ?? '').split(' ')[0]}`);
    } catch {
      names.push(`${k}?`);
    }
  }
  console.log('Fin de l’intro, calques :', names.join(' '));
  const allowed = new Set(['+div.place-fade', '-div.intro', '-div.place-fade']);
  expect(names.filter((n) => !allowed.has(n))).toEqual([]);
  await expect(page.locator('.place-fade')).toBeHidden();
});
