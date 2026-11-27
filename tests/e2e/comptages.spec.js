import { test, expect } from '@playwright/test';
import limites from './comptages-limites.json' with { type: 'json' };

// Test des comptages (PixiJS v8) : on mesure des grandeurs indépendantes de la machine (le navigateur
// headless de test n'a pas de carte graphique), pendant un tour du banc d'essai.
// Le test échoue si une modification dépasse une limite du lieu (tests/e2e/comptages-limites.json).

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
      if (c.counting) c.pixelReads++;
      return getImageData.apply(this, args);
    };
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  await page.goto(`./?lieu=${lieu}`);
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.waitForTimeout(500);

  // Éléments ajoutés à #game pendant le jeu (doivent rester à zéro).
  await page.evaluate(() => {
    const c = window.__comptages;
    new MutationObserver((list) => {
      if (c.counting) for (const m of list) c.added += m.addedNodes.length;
    }).observe(document.getElementById('game'), { childList: true, subtree: true });
    c.counting = true;
    window.paperCart.startBench(1, 0);
  });

  // Échantillons du graphe de scène PixiJS pendant le parcours.
  const sample = () =>
    page.evaluate(() => {
      const sc = window.paperCart.scene();
      return {
        stageNodes: sc.stageNodes,
        layers: sc.layers.length,
        ambientNodes: sc.ambientCount,
        visibleSprites: sc.visibleSprites,
        renderTextures: sc.renderTextures,
      };
    });

  const max = { stageNodes: 0, layers: 0, ambientNodes: 0, visibleSprites: 0, renderTextures: 0 };
  while (!(await page.evaluate(() => window.paperCart.benchReport()))) {
    const s = await sample();
    for (const k of Object.keys(max)) max[k] = Math.max(max[k], s[k]);
    await page.waitForTimeout(400);
  }
  const c = await page.evaluate(() => window.__comptages);
  const assets = await page.evaluate(() => window.paperCart.assets());
  const mesures = {
    ...max,
    images: assets.images,
    megapixels: Math.round(assets.pixels / 1e4) / 100,
    elementsCreatedInPlay: c.created,
    canvasesInPlay: c.canvases,
    domNodesAddedInPlay: c.added,
    pixelReads: c.pixelReads,
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

// Mémoire après les changements de lieu : après 5 allers-retours rayon ↔ accueil (avec et sans échec
// réseau simulé), les textures, pixels, RenderTextures, nœuds DOM, écouteurs et mémoire JS reviennent
// à leur niveau de départ.
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
  try {
    const measure = async () => {
      await cdp.send('HeapProfiler.collectGarbage');
      await cdp.send('HeapProfiler.collectGarbage');
      const dom = await cdp.send('Memory.getDOMCounters');
      const heap = await cdp.send('Runtime.getHeapUsage');
      const assets = await page.evaluate(() => window.paperCart.assets());
      const sc = await page.evaluate(() => window.paperCart.scene());
      return {
        nodes: dom.nodes,
        listeners: dom.jsEventListeners,
        heapMb: heap.usedSize / 1048576,
        images: assets.images,
        pixels: assets.pixels,
        timings: assets.timings,
        renderTextures: sc.renderTextures,
        stageNodes: sc.stageNodes,
      };
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
    expect(end.timings).toBe(start.timings);
    expect(end.renderTextures).toBe(0);
    expect(end.stageNodes).toBe(start.stageNodes);
    expect(end.listeners).toBeLessThanOrEqual(start.listeners + 5);
    expect(end.nodes).toBeLessThanOrEqual(start.nodes + 30);
    expect(end.heapMb).toBeLessThanOrEqual(start.heapMb * 1.15 + 1);
    expect(errors).toEqual([]);
  } finally {
    await cdp.detach().catch(() => {});
  }
});

// Hall : les changements de pose (héros 8 directions, agent idle ↔ stop) passent par poses.js
// (simple échange de référence Texture sur un Sprite déjà monté) sans créer de nœud PixiJS,
// de <canvas>, ni de lecture pixel.
test('hall : les changements de pose (héros, agent) ne créent aucun nœud ni canevas', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'mesuré une fois, en taille PC');
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const c = { on: false, canvases: 0, pixelReads: 0, added: 0 };
    window.__hallPoses = c;
    const ce = Document.prototype.createElement;
    Document.prototype.createElement = function (tag, ...r) {
      if (c.on && String(tag).toLowerCase() === 'canvas') c.canvases++;
      return ce.call(this, tag, ...r);
    };
    const gid = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (...a) {
      if (c.on) c.pixelReads++;
      return gid.apply(this, a);
    };
  });
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.markSaid('arrivee');
    for (const [k, v] of [['narrator.speed', 400], ['narrator.timedMin', 1], ['narrator.timedPerChar', 0.005]]) window.paperCart.set(k, v);
  });
  await page.waitForTimeout(2500); // l'agent va à sa place
  const nodesBefore = await page.evaluate(() => {
    const c = window.__hallPoses;
    new MutationObserver((list) => {
      if (c.on) for (const m of list) c.added += m.addedNodes.length;
    }).observe(document.getElementById('game'), { childList: true, subtree: true });
    c.on = true;
    return window.paperCart.scene().stageNodes;
  });
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
  const after = await page.evaluate(() => ({
    stageNodes: window.paperCart.scene().stageNodes,
    renderTextures: window.paperCart.scene().renderTextures,
    gameCanvases: document.querySelectorAll('#game canvas').length,
    ...window.__hallPoses,
  }));
  expect([...poseSeen].sort()).toEqual(['idle', 'stop']); // l'agent a bien changé de pose
  expect(after.stageNodes).toBe(nodesBefore);
  expect(after.renderTextures).toBe(0);
  expect(after.gameCanvases).toBe(1);
  expect(after.canvases).toBe(0);
  expect(after.pixelReads).toBe(0);
  expect(after.added).toBe(0);
});

// Pendant un scan (séance 63) : la carte qui vole est préparée une fois (remplie à chaque scan), et le
// texte du haut-parleur ne crée plus de morceaux de texte à chaque lettre. Seule reste la petite carte
// ajoutée au Panier (dans le panneau caché) : un élément et son contenu.
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

// Rien n'apparaît à froid au début de la partie (séance 68). Une fois la scène dévoilée, plus aucun
// calque DOM (#ui / #game) n'est créé ni retiré pendant 6 s, alors que le haut-parleur fait son annonce.
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

// Fin de l'intro (séance 68) : son écran noir est retiré sous l'écran noir des lieux (.place-fade),
// déjà plein, qui s'efface ensuite comme après un changement de lieu.
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
