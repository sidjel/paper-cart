// POC PixiJS v8 isolé (branche poc/pixi-v8) : Accueil (2600×1080) ↔ Rayon 1 (3600×1080) avec
// vraie transition fondu enchaîné (RenderTexture + libération VRAM des textures du lieu quitté),
// sorties marchables, héros 8 directions + Paper Flip GPU MeshPlane, banc d'essai 3 tours et
// banc dédié « 5 allers-retours » (10 transitions + mesure fuites VRAM/textures).

import { Application, Assets, Container, Rectangle, Sprite } from 'pixi.js';
import { config } from '../config.js';
import { createStepper } from '../core/stepper.js';
import { compileMask, clampToBounds } from '../core/walkmask.js';
import { findPath } from '../core/pathfinding.js';
import { createWalker, setPath, stepWalker } from '../core/movement.js';
import { createBench, placeAtStart, stepBench } from '../core/bench.js';
import { behindFactor, stepFade, foregroundOpacity } from '../core/occlusion.js';
import { cloudPose } from '../core/clouds.js';
import { birdPose } from '../core/birds.js';
import { directionToView, needsPaperFlip } from '../core/direction.js';
import { createProjection, worldToStageX, worldToStageY, stageToWorldX, stageToWorldZ, scaleAt } from '../scene/projection.js';
import { createCamera, updateCamera } from '../scene/camera.js';
import { bodyMotion, compileAnimation, frameIndex, frameSrc } from '../scene/animation.js';
import { createPixiHero } from './paperFlipMesh.js';
import accueilPlace from '../data/places/accueil.json';
import rayonPlace from '../data/places/rayon-essai.json';
import heroData from '../data/characters/heros-test.json';
import catalog from '../data/products.json';

const PLACES = {
  accueil: { data: accueilPlace, label: 'Accueil' },
  'rayon-essai': { data: rayonPlace, label: 'Rayon 1' },
};

const BASE = import.meta.env.BASE_URL;
const rootEl = document.getElementById('pixi-root');
const statsEl = document.getElementById('poc-stats');
const reportEl = document.getElementById('poc-report');
const benchBtn = document.getElementById('poc-bench');
const benchFastBtn = document.getElementById('poc-bench-fast');
const transBenchBtn = document.getElementById('poc-trans-bench');
const copyBtn = document.getElementById('poc-copy');
const btnAccueil = document.getElementById('poc-place-accueil');
const btnRayon = document.getElementById('poc-place-rayon');

const params = new URLSearchParams(location.search);
const initialPlaceId = PLACES[params.get('lieu')] ? params.get('lieu') : 'accueil';

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
}

function collectHeroUrls() {
  const urls = new Set();
  for (const v of Object.values(heroData.views)) {
    for (const anim of Object.values(v)) {
      for (const f of anim.frames ?? []) urls.add(f.src ?? f);
    }
  }
  return [...urls];
}

function collectPlaceEntries(place) {
  const entries = new Map();
  for (const [id, im] of Object.entries(place.images)) entries.set(id, BASE + im.src);
  for (const it of [...(place.shelfProducts?.items ?? []), ...(place.looseProducts?.items ?? [])]) {
    const def = catalog.products[it.product];
    if (def) entries.set(`prod:${it.product}`, BASE + def.image);
  }
  return entries;
}

function insideZone(x, z, [x1, z1, x2, z2]) {
  return x >= x1 && x <= x2 && z >= z1 && z <= z2;
}

async function boot() {
  const app = new Application();
  await app.init({
    resizeTo: rootEl,
    backgroundColor: 0x141923,
    antialias: true,
    preference: 'webgl',
    failIfMajorPerformanceCaveat: false,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  rootEl.appendChild(app.canvas);

  // Préchargement unique des sprites du héros 8 directions (conservés d'un lieu à l'autre).
  const heroUrls = collectHeroUrls();
  const heroFullUrls = heroUrls.map((u) => BASE + u);
  const heroUrlSet = new Set(heroFullUrls);
  await Assets.load(heroFullUrls);
  const heroTexMap = new Map();
  for (const u of heroUrls) heroTexMap.set(u, Assets.get(BASE + u));

  const animsByView = {};
  for (const [vn, v] of Object.entries(heroData.views)) {
    animsByView[vn] = {};
    for (const [an, def] of Object.entries(v)) {
      animsByView[vn][an] = { ...compileAnimation(def), srcs: def.frames.map(frameSrc) };
    }
  }
  const firstWalk = heroData.views.S?.walk;
  // Foulée d'un demi-cycle complet (identique à src/scene/character.js).
  const walkStride = (firstWalk?.stride ?? 40) * Math.max(2, (firstWalk?.frames?.length ?? 4) / 2);

  // Héros unique réutilisé d'un lieu à l'autre (0 recréation de MeshPlane ni de texture d'ombre).
  const hero = createPixiHero(heroData, heroTexMap, app.renderer.name !== 'canvas');

  const stageRoot = new Container();
  const dissolveOverlay = new Container();
  app.stage.addChild(stageRoot, dissolveOverlay);

  const rendererName = app.renderer.name || 'webgl';
  const stepper = createStepper(config.loop.stepHz, config.loop.maxStepsPerFrame);
  const keys = new Set();
  const intent = { moveX: 0, moveZ: 0 };
  const motion = { lift: 0, sx: 1, sy: 1 };

  let activeScene = null;
  let activePlaceUrls = new Set();
  let switching = false;
  let dissolve = null; // { sprite, tex, elapsed, duration, onDone }

  let bench = null;
  let benchDts = [];
  let benchJs = [];
  let transBench = null; // banc automatisé 5 allers-retours (10 transitions)
  let lastReport = '';
  let lastFps = 60;
  let lastJsMs = 0;

  function clearDissolve() {
    if (!dissolve) return;
    dissolveOverlay.removeChild(dissolve.sprite);
    dissolve.sprite.destroy();
    dissolve.tex.destroy(true);
    const cb = dissolve.onDone;
    dissolve = null;
    if (cb) cb();
  }

  function snapshotCurrentFrame() {
    if (!activeScene || app.screen.width < 2 || app.screen.height < 2) return null;
    app.renderer.render(app.stage);
    const frame = new Rectangle(0, 0, app.screen.width, app.screen.height);
    const tex = app.renderer.generateTexture({
      target: stageRoot,
      frame,
      resolution: app.renderer.resolution,
    });
    const sprite = new Sprite(tex);
    sprite.x = 0;
    sprite.y = 0;
    sprite.width = app.screen.width;
    sprite.height = app.screen.height;
    return { sprite, tex };
  }

  function disposeCurrentStage() {
    // Détacher le héros avant de détruire les conteneurs du lieu quitté.
    hero.shadow.removeFromParent();
    hero.liftShadow.removeFromParent();
    hero.root.removeFromParent();
    for (const child of stageRoot.removeChildren()) {
      child.destroy({ children: true, texture: false, textureSource: false });
    }
  }

  async function mountPlace(placeId, opts = {}) {
    if (switching) return null;
    const entry = PLACES[placeId] ?? PLACES.accueil;
    const place = entry.data;
    switching = true;
    const {
      withDissolve = Boolean(activeScene),
      spawn = place.spawn,
      facing = 1,
      fromExit = false,
      keepReport = false,
    } = opts;

    if (!keepReport) {
      bench = null;
      reportEl.hidden = true;
      copyBtn.hidden = true;
    }
    btnAccueil.classList.toggle('active', placeId === 'accueil');
    btnRayon.classList.toggle('active', placeId === 'rayon-essai');
    statsEl.textContent = `POC PixiJS v8 — chargement ${entry.label}…`;

    const t0 = performance.now();

    // 1. Figer l'image courante dans une RenderTexture pour le fondu enchaîné (sans garder 2 scènes vivantes).
    clearDissolve();
    const snap = withDissolve && config.places.fade > 0 ? snapshotCurrentFrame() : null;
    if (snap) dissolveOverlay.addChild(snap.sprite);

    // 2. Préparer la liste des textures du nouveau lieu et libérer celles exclusives à l'ancien lieu.
    const entries = collectPlaceEntries(place);
    const nextUrls = new Set(entries.values());
    const toUnload = [...activePlaceUrls].filter((u) => !nextUrls.has(u) && !heroUrlSet.has(u));

    // Détacher activeScene avant destruction pour que le ticker ne touche plus aux conteneurs détruits
    // pendant les await (la RenderTexture figée dans dissolveOverlay reste affichée à l'écran).
    activeScene = null;
    disposeCurrentStage();
    if (toUnload.length > 0) {
      await Assets.unload(toUnload);
    }

    // 3. Charger uniquement les textures manquantes du nouveau lieu en VRAM.
    const uniqueUrls = [...nextUrls];
    await Assets.load(uniqueUrls);
    const textures = new Map();
    for (const [k, url] of entries) textures.set(k, Assets.get(url));
    activePlaceUrls = nextUrls;
    const loadMs = Math.round(performance.now() - t0);
    const totalTextures = new Set([...uniqueUrls, ...heroFullUrls]).size;

    const layers = {};
    const parallaxLayers = [];
    const fgLayers = [];

    for (const def of place.layers) {
      const layer = new Container();
      if (def.id === 'acteurs') layer.sortableChildren = true;
      if (def.image) {
        const im = place.images[def.image];
        const s = new Sprite(textures.get(def.image));
        const pos = def.position ?? [0, 0];
        s.x = pos[0];
        s.y = pos[1];
        s.width = im.size[0];
        s.height = im.size[1];
        layer.addChild(s);
      }
      stageRoot.addChild(layer);
      layers[def.id] = layer;
      parallaxLayers.push({ layer, f: def.parallax ?? 1 });
      if (def.occluders) {
        const baseAlpha = def.opacity === 'display.hallForegroundOpacity'
          ? config.display.hallForegroundOpacity
          : config.display.foregroundOpacity;
        fgLayers.push({ layer, f: def.parallax ?? 1, occluders: def.occluders, baseAlpha, fade: 0 });
      }
    }

    const proj = createProjection(place.projection, config.scene);
    const mask = compileMask(place.walkMask);
    const acteurs = layers.acteurs;
    const produits = layers.produits ?? acteurs;

    // Nuages & oiseaux sur le calque déclaré (dehors ou lointain).
    const cloudSprites = (place.clouds?.items ?? []).map((it) => {
      const s = new Sprite(textures.get(it.image));
      s.alpha = it.opacity ?? 1;
      s.scale.set(it.scale ?? 1);
      layers[place.clouds.layer].addChild(s);
      return s;
    });
    const birdFrames = (place.birds?.frames ?? []).map((id) => textures.get(id));
    const birdSprites = (place.birds?.flock ?? []).map((b) => {
      const s = new Sprite(birdFrames[0]);
      s.anchor.set(0.5, 0.5);
      const sz = b.size ?? place.birds.size ?? [128, 96];
      s._baseW = sz[0];
      s._baseH = sz[1];
      layers[place.birds.layer].addChild(s);
      return s;
    });

    // Produits sur étagères.
    for (const it of place.shelfProducts?.items ?? []) {
      const def = catalog.products[it.product];
      const s = new Sprite(textures.get(`prod:${it.product}`));
      s.anchor.set(0.5, 1);
      s.width = def.size[0];
      s.height = def.size[1];
      s.x = it.at[0];
      s.y = it.at[1];
      produits.addChild(s);
    }

    // Props triés par profondeur — règle identique à src/scene/props.js :
    // perspectiveScale suit scaleAt(proj, z) ; sinon échelle fixe p.scale ?? 1 (sans scaleAt).
    const fadeProps = [];
    for (const p of place.props ?? []) {
      const im = place.images[p.image];
      const s = new Sprite(textures.get(p.image));
      const sc = p.perspectiveScale ? p.perspectiveScale * scaleAt(proj, p.at[1]) : (p.scale ?? 1);
      s.anchor.set(p.anchor[0] / im.size[0], p.anchor[1] / im.size[1]);
      s.width = im.size[0] * sc;
      s.height = im.size[1] * sc;
      s.x = worldToStageX(proj, p.at[0]);
      s.y = worldToStageY(proj, p.at[1]);
      s.zIndex = 1000 - p.depthRef;
      if (p.fadeZ) {
        s.alpha = 0;
        fadeProps.push({ sprite: s, z0: p.fadeZ[0], z1: p.fadeZ[1], maxOpacity: p.maxOpacity ?? 1 });
      }
      acteurs.addChild(s);
    }

    // Produits posés ailleurs (table/chariot).
    for (const it of place.looseProducts?.items ?? []) {
      const def = catalog.products[it.product];
      const s = new Sprite(textures.get(`prod:${it.product}`));
      const sc = (it.scale ?? 1) * scaleAt(proj, it.at[1]);
      s.anchor.set(0.5, 1);
      s.width = def.size[0] * sc;
      s.height = def.size[1] * sc;
      s.x = worldToStageX(proj, it.at[0]);
      s.y = worldToStageY(proj, it.at[1]) - it.lift * scaleAt(proj, it.at[1]);
      s.zIndex = 1000 - it.at[1] + 5;
      acteurs.addChild(s);
    }

    // Agent de sécurité (Accueil).
    if (place.guard) {
      const g = place.guard;
      const im = place.images[g.image];
      const s = new Sprite(textures.get(g.image));
      const sc = (g.scale ?? 1) * scaleAt(proj, g.stand[1]);
      s.anchor.set(g.anchor[0] / im.size[0], g.anchor[1] / im.size[1]);
      s.width = im.size[0] * sc;
      s.height = im.size[1] * sc;
      s.x = worldToStageX(proj, g.stand[0]);
      s.y = worldToStageY(proj, g.stand[1]);
      s.zIndex = 1000 - g.post[1];
      acteurs.addChild(s);
    }

    // Hôtesse derrière le comptoir (Accueil).
    let hotesseSprite = null;
    if (place.hotesse) {
      const h = place.hotesse;
      const im = place.images[h.image];
      const s = new Sprite(textures.get(h.image));
      s.anchor.set(h.anchor[0] / im.size[0], h.anchor[1] / im.size[1]);
      s.width = im.size[0] * (h.scale ?? 1);
      s.height = im.size[1] * (h.scale ?? 1);
      s.x = h.at[0];
      s.y = h.at[1];
      s.zIndex = 1000 - h.depthRef;
      acteurs.addChild(s);
      hotesseSprite = { sprite: s, atX: h.at[0], baseScaleX: Math.abs(s.scale.x), baseScaleY: s.scale.y };
    }

    acteurs.addChild(hero.shadow, hero.liftShadow, hero.root);

    const walker = createWalker(spawn[0], spawn[1]);
    walker.facing = facing;
    const initDir = facing < 0 ? 'W' : (fromExit ? 'E' : 'S');
    walker.dir = initDir;
    const camera = createCamera();

    activeScene = {
      placeId,
      label: entry.label,
      place,
      proj,
      mask,
      walker,
      camera,
      hero,
      parallaxLayers,
      fgLayers,
      cloudSprites,
      birdFrames,
      birdSprites,
      fadeProps,
      hotesseSprite,
      loadMs,
      unloadedCount: toUnload.length,
      totalTextures,
      viewOffX: 0,
      viewScale: 1,
      exitArmed: !fromExit, // évite un aller-retour immédiat si le point d'arrivée frôle une sortie
      shownDir: initDir,
      flipP: -1,
      flipStart: 0,
      flipDur: 0.18,
      flipFromDir: initDir,
      flipFromFlip: false,
      flipSign: 1,
      flipAngle: 180,
      animStartTime: 0,
      animStartDist: 0,
      currentAnim: null,
      wasMoving: false,
      idleStart: 0,
      stopTime: -1,
    };

    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set('lieu', placeId);
    history.replaceState(null, '', nextUrl);

    if (snap) {
      dissolve = {
        sprite: snap.sprite,
        tex: snap.tex,
        elapsed: 0,
        duration: config.places.fade,
        onDone: opts.onDissolveDone ?? null,
      };
    } else if (opts.onDissolveDone) {
      opts.onDissolveDone();
    }

    switching = false;
    return { loadMs, unloaded: toUnload.length, totalTextures };
  }

  function pickAnim(moving, dir) {
    const view = animsByView[directionToView(dir).view] ?? animsByView.S;
    return (moving && view.walk) || view.idle;
  }

  function startBenchRun(passes = 3, warmup = 2) {
    if (!activeScene?.place.bench || transBench) return;
    bench = createBench(activeScene.place.bench, passes, warmup);
    placeAtStart(bench, activeScene.walker);
    benchDts = [];
    benchJs = [];
    activeScene.camera.ready = false;
    reportEl.hidden = true;
    copyBtn.hidden = true;
  }

  function readHeapMb() {
    const m = performance.memory?.usedJSHeapSize;
    return typeof m === 'number' ? +(m / 1048576).toFixed(1) : null;
  }

  // Banc dédié « 5 allers-retours Accueil ↔ Rayon 1 » (10 transitions en fondu enchaîné) :
  // mesure les temps de chargement VRAM, les saccades pendant les fondus, et l'absence de fuite textures/mémoire.
  async function startTransitionBench(roundTrips = 5) {
    if (switching || transBench) return;
    bench = null;
    reportEl.hidden = true;
    copyBtn.hidden = true;

    if (activeScene?.placeId !== 'accueil') {
      await mountPlace('accueil', { withDissolve: false, keepReport: true });
    }
    const startCacheSize = Assets.cache?._cache?.size ?? null;
    const startHeap = readHeapMb();

    transBench = {
      totalSteps: roundTrips * 2,
      doneSteps: 0,
      loadTimes: [],
      unloadedCounts: [],
      dts: [],
      jss: [],
      startCacheSize,
      startHeap,
      startTextures: activeScene.totalTextures,
      phase: 'waiting',
    };

    const runStep = async () => {
      if (!transBench) return;
      if (transBench.doneSteps >= transBench.totalSteps) {
        const endCacheSize = Assets.cache?._cache?.size ?? null;
        const endHeap = readHeapMb();
        const loads = transBench.loadTimes;
        const dts = [...transBench.dts].sort((a, b) => a - b);
        const jss = [...transBench.jss].sort((a, b) => a - b);
        const avgLoad = loads.reduce((s, v) => s + v, 0) / Math.max(1, loads.length);
        const avgDt = dts.reduce((s, v) => s + v, 0) / Math.max(1, dts.length);
        const avgJs = jss.reduce((s, v) => s + v, 0) / Math.max(1, jss.length);
        const over20 = dts.filter((v) => v > 20).length;
        const over33 = dts.filter((v) => v > 33).length;
        const totalUnloaded = transBench.unloadedCounts.reduce((s, v) => s + v, 0);
        const cacheLine = startCacheSize !== null && endCacheSize !== null
          ? `Cache textures Pixi : ${startCacheSize} → ${endCacheSize} (delta ${endCacheSize - startCacheSize >= 0 ? '+' : ''}${endCacheSize - startCacheSize}, ${totalUnloaded} déchargements VRAM)`
          : `Textures actives : ${transBench.startTextures} → ${activeScene.totalTextures} (${totalUnloaded} déchargements VRAM)`;
        const heapLine = startHeap !== null && endHeap !== null
          ? `Mémoire JS : ${startHeap} Mo → ${endHeap} Mo`
          : null;

        lastReport = [
          `POC PixiJS v8 (${rendererName}) — Transitions Accueil ↔ Rayon 1 (${roundTrips} allers-retours = ${transBench.totalSteps} fondus enchaînés)`,
          `Temps de chargement VRAM/transition : moy ${avgLoad.toFixed(0)} ms · min ${Math.min(...loads)} ms · max ${Math.max(...loads)} ms`,
          `Détail (ms) : ${loads.join(', ')}`,
          `Fluidité pendant les fondus (${dts.length} images) : ${(1000 / Math.max(1, avgDt)).toFixed(1)} i/s · p95 ${percentile(dts, 0.95).toFixed(1)} ms · pire ${(dts.at(-1) ?? 0).toFixed(1)} ms`,
          `Saccades : > 20 ms = ${over20} (${((100 * over20) / Math.max(1, dts.length)).toFixed(2)} %) · > 33 ms = ${over33} (${((100 * over33) / Math.max(1, dts.length)).toFixed(2)} %)`,
          `Calcul JS : moy ${avgJs.toFixed(2)} ms · p95 ${percentile(jss, 0.95).toFixed(2)} ms · pire ${(jss.at(-1) ?? 0).toFixed(2)} ms`,
          cacheLine,
          ...(heapLine ? [heapLine] : []),
        ].join('\n');
        reportEl.textContent = lastReport;
        reportEl.hidden = false;
        copyBtn.hidden = false;
        transBench = null;
        return;
      }

      const nextId = activeScene.placeId === 'accueil' ? 'rayon-essai' : 'accueil';
      const res = await mountPlace(nextId, {
        withDissolve: true,
        keepReport: true,
        onDissolveDone: () => {
          if (!transBench) return;
          transBench.doneSteps++;
          setTimeout(runStep, 180);
        },
      });
      if (res && transBench) {
        transBench.loadTimes.push(res.loadMs);
        transBench.unloadedCounts.push(res.unloaded);
      }
    };

    setTimeout(runStep, 180);
  }

  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  app.canvas.addEventListener('pointerdown', (e) => {
    if (bench || transBench || switching || !activeScene) return;
    const rect = app.canvas.getBoundingClientRect();
    const s = activeScene.viewScale;
    const sx = (e.clientX - rect.left - activeScene.viewOffX) / s + activeScene.camera.x;
    const sy = (e.clientY - rect.top) / s + activeScene.camera.y;
    const target = { x: stageToWorldX(activeScene.proj, sx), z: stageToWorldZ(activeScene.proj, sy) };
    clampToBounds(activeScene.mask, target);
    setPath(activeScene.walker, findPath(activeScene.mask, activeScene.walker.x, activeScene.walker.z, target.x, target.z));
  });

  btnAccueil.addEventListener('click', () => !transBench && mountPlace('accueil'));
  btnRayon.addEventListener('click', () => !transBench && mountPlace('rayon-essai'));
  transBenchBtn.addEventListener('click', () => startTransitionBench(5));
  benchBtn.addEventListener('click', () => startBenchRun(3, 2));
  benchFastBtn.addEventListener('click', () => startBenchRun(1, 0.5));
  copyBtn.addEventListener('click', () => navigator.clipboard?.writeText(lastReport));

  function finishBench() {
    if (!activeScene || !bench) return;
    const dts = [...benchDts].sort((a, b) => a - b);
    const jss = [...benchJs].sort((a, b) => a - b);
    const avgDt = dts.reduce((s, v) => s + v, 0) / Math.max(1, dts.length);
    const avgJs = jss.reduce((s, v) => s + v, 0) / Math.max(1, jss.length);
    const over20 = dts.filter((v) => v > 20).length;
    const over33 = dts.filter((v) => v > 33).length;
    lastReport = [
      `POC PixiJS v8 (${rendererName}) — ${activeScene.label} (${bench.passes} tours, ${dts.length} images)`,
      `Chargement textures VRAM : ${activeScene.loadMs} ms (${activeScene.totalTextures} textures uniques)`,
      `Fluidité : ${(1000 / avgDt).toFixed(1)} i/s · p95 ${percentile(dts, 0.95).toFixed(1)} ms · p99 ${percentile(dts, 0.99).toFixed(1)} ms · pire ${(dts.at(-1) ?? 0).toFixed(1)} ms`,
      `Saccades : > 20 ms = ${over20} (${((100 * over20) / Math.max(1, dts.length)).toFixed(2)} %) · > 33 ms = ${over33} (${((100 * over33) / Math.max(1, dts.length)).toFixed(2)} %)`,
      `Calcul JS : moy ${avgJs.toFixed(2)} ms · p95 ${percentile(jss, 0.95).toFixed(2)} ms · pire ${(jss.at(-1) ?? 0).toFixed(2)} ms`,
    ].join('\n');
    reportEl.textContent = lastReport;
    reportEl.hidden = false;
    copyBtn.hidden = false;
    bench = null;
  }

  await mountPlace(initialPlaceId, { withDissolve: false });

  let fpsCount = 0;
  let fpsTimer = 0;
  let lastNow = performance.now();

  app.ticker.add(() => {
    const scObj = activeScene;
    if (!scObj) return;
    const tStart = performance.now();
    const dtMs = Math.min(100, tStart - lastNow);
    lastNow = tStart;
    const dtSec = dtMs / 1000;

    // Progression du fondu enchaîné (RenderTexture au-dessus du nouveau lieu).
    if (dissolve) {
      dissolve.elapsed += dtSec;
      const t = Math.min(1, dissolve.elapsed / Math.max(0.01, dissolve.duration));
      dissolve.sprite.alpha = 1 - t;
      if (t >= 1) clearDissolve();
    }

    const { place, proj, mask, walker, camera } = scObj;

    if (bench || transBench || switching) {
      intent.moveX = 0;
      intent.moveZ = 0;
    } else {
      intent.moveX = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
      intent.moveZ = (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0);
    }

    const n = stepper.advance(dtSec);
    for (let i = 0; i < n; i++) {
      if (bench) {
        stepBench(bench, walker, mask, stepper.step);
        if (bench.phase === 'done') {
          finishBench();
          break;
        }
      }
      stepWalker(walker, intent, mask, config.walk, stepper.step, scaleAt(proj, walker.z));
    }

    // Sorties marchables Accueil ↔ Rayon 1 (identiques aux zones de sortie du jeu).
    if (!bench && !transBench && !switching && !dissolve && place.exits?.items?.length) {
      const hit = place.exits.items.find((ex) => PLACES[ex.to] && insideZone(walker.x, walker.z, ex.zone));
      if (!hit) {
        scObj.exitArmed = true;
      } else if (scObj.exitArmed) {
        scObj.exitArmed = false;
        mountPlace(hit.to, { withDissolve: true, spawn: hit.arrive, facing: hit.facing ?? 1, fromExit: true });
        return;
      }
    }

    const a = stepper.alpha;
    const x = walker.prevX + (walker.x - walker.prevX) * a;
    const z = walker.prevZ + (walker.z - walker.prevZ) * a;
    const time = stepper.time + a * stepper.step;
    const sx = worldToStageX(proj, x);
    const sy = worldToStageY(proj, z);
    const sc = scaleAt(proj, z);

    const viewScale = app.screen.height / 1080;
    const viewW = app.screen.width / viewScale;
    const offX = viewW > place.size[0] ? (app.screen.width - place.size[0] * viewScale) / 2 : 0;
    scObj.viewScale = viewScale;
    scObj.viewOffX = offX;
    stageRoot.scale.set(viewScale);
    stageRoot.x = offX;

    if (viewW > place.size[0]) {
      camera.x = 0;
      camera.y = 0;
    } else {
      updateCamera(camera, config.camera, sx, sy - 140 * sc, walker.facing, viewW, 1080, place.size[0], place.size[1], Math.min(0.1, dtSec));
    }

    for (const pl of scObj.parallaxLayers) pl.layer.x = -camera.x * pl.f;

    // Occlusion dynamique des plans de premier plan.
    for (const fg of scObj.fgLayers) {
      const occ = behindFactor(sx, sy, sc, fg.occluders, camera.x * fg.f);
      fg.fade = stepFade(fg.fade, occ, 10, dtSec, false);
      fg.layer.alpha = foregroundOpacity(fg.baseAlpha, config.display.behindPlantsOpacity, fg.fade);
    }

    // Fondu continu de la brume du couloir (Accueil).
    for (const fp of scObj.fadeProps) {
      const t = Math.max(0, Math.min(1, (z - fp.z0) / Math.max(1, fp.z1 - fp.z0)));
      fp.sprite.alpha = t * fp.maxOpacity;
    }

    // Hôtesse suit le héros du regard.
    if (scObj.hotesseSprite) {
      const dir = sx < scObj.hotesseSprite.atX ? -1 : 1;
      scObj.hotesseSprite.sprite.scale.set(dir * scObj.hotesseSprite.baseScaleX, scObj.hotesseSprite.baseScaleY);
    }

    // Nuages & oiseaux.
    if (place.clouds) {
      for (let i = 0; i < scObj.cloudSprites.length; i++) {
        const p = cloudPose(place.clouds.items[i], time, place.clouds.span, false);
        scObj.cloudSprites[i].x = p.x;
        scObj.cloudSprites[i].y = p.y;
      }
    }
    if (place.birds) {
      const birdLayerDef = place.layers.find((l) => l.id === place.birds.layer);
      const bf = birdLayerDef?.parallax ?? 1;
      for (let i = 0; i < scObj.birdSprites.length; i++) {
        const b = birdPose(place.birds.flock[i], time, place.birds.span, place.birds.cycle, false);
        const sp = scObj.birdSprites[i];
        sp.x = b.x + (b.anchorToStage ? camera.x * bf - camera.x : 0);
        sp.y = b.y;
        sp.texture = scObj.birdFrames[b.frame] ?? scObj.birdFrames[0];
        const tw = Math.max(1, sp.texture.width);
        const th = Math.max(1, sp.texture.height);
        sp.scale.set(((b.dir < 0 ? -1 : 1) * sp._baseW * b.scale) / tw, (sp._baseH * b.scale) / th);
      }
    }

    // Retournement papier 2.5D GPU + animation 8 directions.
    if (walker.dir !== scObj.shownDir && scObj.flipP < 0) {
      const isMajor = needsPaperFlip(scObj.shownDir, walker.dir, config.character.flipOnFrontBack);
      const dur = isMajor ? config.character.flipDuration : config.character.turnFlipDuration;
      if (dur > 0) {
        scObj.flipFromDir = scObj.shownDir;
        scObj.flipFromFlip = directionToView(scObj.shownDir).flip < 0;
        scObj.flipAngle = hero.turnAngleDeg(scObj.shownDir, walker.dir);
        scObj.flipSign = hero.turnDirectionSign(scObj.shownDir, walker.dir);
        scObj.flipStart = time;
        scObj.flipDur = dur;
        scObj.flipP = 0;
      }
      scObj.shownDir = walker.dir;
    }
    if (scObj.flipP >= 0) {
      scObj.flipP = (time - scObj.flipStart) / scObj.flipDur;
      if (scObj.flipP >= 1) scObj.flipP = -1;
    }

    const anim = pickAnim(walker.moving, scObj.shownDir);
    if (anim !== scObj.currentAnim) {
      const keepPhase = Boolean(scObj.currentAnim?.stride > 0 && anim.stride > 0);
      scObj.currentAnim = anim;
      if (!keepPhase) {
        scObj.animStartTime = time;
        scObj.animStartDist = walker.distance;
      }
    }
    const fi = frameIndex(anim, (time - scObj.animStartTime) * 1000, walker.distance - scObj.animStartDist, config.character.walkAnimSpeed, anim.stride > 0);
    const frameSrcUrl = anim.srcs[fi] ?? anim.srcs[0];
    const toTex = heroTexMap.get(frameSrcUrl);
    const toFlip = directionToView(scObj.shownDir).flip < 0;

    if (scObj.flipP >= 0) {
      const fromAnim = pickAnim(walker.moving, scObj.flipFromDir);
      const ffi = frameIndex(fromAnim, (time - scObj.animStartTime) * 1000, walker.distance - scObj.animStartDist, config.character.walkAnimSpeed, fromAnim.stride > 0);
      const fromTex = heroTexMap.get(fromAnim.srcs[ffi] ?? fromAnim.srcs[0]) ?? toTex;
      hero.applyPaperTwist({
        p: scObj.flipP,
        fromTex,
        fromFlip: scObj.flipFromFlip,
        toTex,
        toFlip,
        turnSign: scObj.flipSign,
        angleDeg: scObj.flipAngle,
        edgeThickness: config.character.edgeThickness,
        twist: config.character.paperTwist,
        shadowAmt: config.character.flipShadow,
      });
    } else {
      hero.setTexture(toTex, toFlip ? -1 : 1);
    }

    if (walker.moving !== scObj.wasMoving) {
      if (!walker.moving) {
        scObj.stopTime = time;
        scObj.idleStart = time;
      }
      scObj.wasMoving = walker.moving;
    }
    bodyMotion(motion, config.character, walker.moving, walker.distance, walkStride / config.character.walkAnimSpeed, time - scObj.idleStart, scObj.stopTime < 0 ? -1 : time - scObj.stopTime);
    hero.setBodyMotion(motion.lift, motion.sx, motion.sy);

    const hs = sc * heroData.scale;
    hero.root.x = sx;
    hero.root.y = sy + config.character.footSink * hs;
    hero.root.scale.set(hs);
    hero.root.zIndex = 1000 - z;

    const up = config.character.bounceHeight > 0 ? motion.lift / config.character.bounceHeight : 0;
    const sk = sc * config.character.shadowSize * (1 - 0.18 * up);
    hero.shadow.x = sx;
    hero.shadow.y = sy;
    hero.shadow.width = hero.shadowBaseSize[0] * sk;
    hero.shadow.height = hero.shadowBaseSize[1] * sk;
    hero.shadow.alpha = config.character.shadowOpacity * (1 - 0.35 * up);
    hero.shadow.zIndex = hero.root.zIndex - 0.1;
    hero.liftShadow.x = sx + 14 * sc;
    hero.liftShadow.y = sy + 6 * sc;
    hero.liftShadow.zIndex = hero.root.zIndex - 0.2;

    const jsMs = performance.now() - tStart;
    lastJsMs = jsMs;
    if (bench?.measuring) {
      benchDts.push(dtMs);
      benchJs.push(jsMs);
    }
    if (transBench) {
      transBench.dts.push(dtMs);
      transBench.jss.push(jsMs);
    }
    fpsCount++;
    fpsTimer += dtMs;
    if (fpsTimer >= 500) {
      lastFps = Math.round((fpsCount * 1000) / fpsTimer);
      fpsCount = 0;
      fpsTimer = 0;
      const status = transBench
        ? `Aller-retour ${Math.min(transBench.totalSteps, transBench.doneSteps + 1)}/${transBench.totalSteps}`
        : (bench ? (bench.measuring ? `Banc ${bench.pass + 1}/${bench.passes}` : 'Chauffe…') : scObj.label);
      statsEl.textContent = `POC PixiJS v8 (${rendererName}) · ${status} · ${lastFps} i/s · JS ${lastJsMs.toFixed(2)} ms`;
    }
  });

  window.pixiPoc = {
    setPlace: (id) => mountPlace(id),
    startBench: (passes = 1, warmup = 0) => startBenchRun(passes, warmup),
    startTransitionBench: (roundTrips = 5) => startTransitionBench(roundTrips),
    report: () => lastReport,
    stats: () => ({ renderer: rendererName, place: activeScene?.placeId, loadMs: activeScene?.loadMs, textures: activeScene?.totalTextures, fps: lastFps, jsMs: lastJsMs }),
  };

  if (params.get('bench') === '1') startBenchRun(1, 0.5);
}

boot().catch((err) => {
  statsEl.textContent = `Erreur POC PixiJS v8 : ${err.message}`;
  console.error(err);
});
