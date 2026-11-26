// POC PixiJS v8 isolé (branche poc/pixi-v8) : Rayon 1 + héros 8 directions + parallaxe 3 plans +
// nuages/oiseaux + Paper Flip GPU MeshPlane + même banc d'essai (src/core/bench.js) pour comparer
// DOM/CSS vs PixiJS v8 sur des chiffres identiques (PC & Oppo Reno 2).

import { Application, Assets, Container, Sprite } from 'pixi.js';
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
import place from '../data/places/rayon-essai.json';
import heroData from '../data/characters/heros-test.json';
import catalog from '../data/products.json';

const BASE = import.meta.env.BASE_URL;
const rootEl = document.getElementById('pixi-root');
const statsEl = document.getElementById('poc-stats');
const reportEl = document.getElementById('poc-report');
const benchBtn = document.getElementById('poc-bench');
const benchFastBtn = document.getElementById('poc-bench-fast');
const copyBtn = document.getElementById('poc-copy');

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

async function boot() {
  const t0 = performance.now();
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

  // Chargement parallèle de toutes les textures Rayon 1 + produits + héros 8 directions en VRAM.
  const entries = new Map();
  for (const [id, im] of Object.entries(place.images)) entries.set(id, BASE + im.src);
  for (const it of [...(place.shelfProducts?.items ?? []), ...(place.looseProducts?.items ?? [])]) {
    const def = catalog.products[it.product];
    if (def) entries.set(`prod:${it.product}`, BASE + def.image);
  }
  for (const u of collectHeroUrls()) entries.set(`hero:${u}`, BASE + u);

  const uniqueUrls = [...new Set(entries.values())];
  await Assets.load(uniqueUrls);
  const textures = new Map();
  for (const [k, url] of entries) textures.set(k, Assets.get(url));
  const loadMs = Math.round(performance.now() - t0);

  // Scène et 3 plans parallaxe (identiques à scene/stage.js).
  const stageRoot = new Container();
  app.stage.addChild(stageRoot);

  const layerLointain = new Container();
  const layerFond = new Container();
  const layerProduits = new Container();
  const layerActeurs = new Container();
  layerActeurs.sortableChildren = true;
  const layerAvant = new Container();
  stageRoot.addChild(layerLointain, layerFond, layerProduits, layerActeurs, layerAvant);

  const loinSprite = new Sprite(textures.get('rayon-lointain'));
  loinSprite.width = 3600;
  loinSprite.height = 750;
  layerLointain.addChild(loinSprite);

  const fondSprite = new Sprite(textures.get('rayon-fond'));
  fondSprite.width = 3600;
  fondSprite.height = 1080;
  layerFond.addChild(fondSprite);

  const avantSprite = new Sprite(textures.get('rayon-avant'));
  avantSprite.y = 905;
  avantSprite.width = 4300;
  avantSprite.height = 175;
  layerAvant.addChild(avantSprite);

  // Nuages & oiseaux sur le plan lointain (logique pure réutilisée de src/core/).
  const cloudSprites = place.clouds.items.map((it) => {
    const s = new Sprite(textures.get(it.image));
    s.alpha = it.opacity ?? 1;
    s.scale.set(it.scale ?? 1);
    layerLointain.addChild(s);
    return s;
  });

  const birdFrames = place.birds.frames.map((id) => textures.get(id));
  const birdSprites = place.birds.flock.map(() => {
    const s = new Sprite(birdFrames[0]);
    s.anchor.set(0.5, 0.5);
    layerLointain.addChild(s);
    return s;
  });

  const proj = createProjection(place.projection, config.scene);
  const mask = compileMask(place.walkMask);

  // Produits sur étagères.
  for (const it of place.shelfProducts.items) {
    const def = catalog.products[it.product];
    const s = new Sprite(textures.get(`prod:${it.product}`));
    s.anchor.set(0.5, 1);
    s.width = def.size[0];
    s.height = def.size[1];
    s.x = it.at[0];
    s.y = it.at[1];
    layerProduits.addChild(s);
  }

  // Props triés par profondeur (zIndex = 1000 - depthRef).
  for (const p of place.props) {
    const im = place.images[p.image];
    const s = new Sprite(textures.get(p.image));
    const sc = (p.scale ?? 1) * scaleAt(proj, p.at[1]);
    s.anchor.set(p.anchor[0] / im.size[0], p.anchor[1] / im.size[1]);
    s.width = im.size[0] * sc;
    s.height = im.size[1] * sc;
    s.x = worldToStageX(proj, p.at[0]);
    s.y = worldToStageY(proj, p.at[1]);
    s.zIndex = 1000 - p.depthRef;
    layerActeurs.addChild(s);
  }

  // Produits posés sur table/chariot.
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
    layerActeurs.addChild(s);
  }

  // Héros 8 directions + MeshPlane GPU Paper Flip.
  const heroTexMap = new Map();
  for (const u of collectHeroUrls()) heroTexMap.set(u, textures.get(`hero:${u}`));
  const animsByView = {};
  for (const [vn, v] of Object.entries(heroData.views)) {
    animsByView[vn] = {};
    for (const [an, def] of Object.entries(v)) {
      animsByView[vn][an] = { ...compileAnimation(def), srcs: def.frames.map(frameSrc) };
    }
  }
  const hero = createPixiHero(heroData, heroTexMap, app.renderer.name !== 'canvas');
  layerActeurs.addChild(hero.shadow, hero.liftShadow, hero.root);

  const walker = createWalker(place.spawn[0], place.spawn[1]);
  const camera = createCamera();
  const stepper = createStepper(config.loop.stepHz, config.loop.maxStepsPerFrame);
  const keys = new Set();
  const intent = { moveX: 0, moveZ: 0 };
  const motion = { lift: 0, sx: 1, sy: 1 };

  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  app.canvas.addEventListener('pointerdown', (e) => {
    if (bench) return;
    const rect = app.canvas.getBoundingClientRect();
    const scale = rect.height / 1080;
    const sx = (e.clientX - rect.left) / scale + camera.x;
    const sy = (e.clientY - rect.top) / scale + camera.y;
    const target = { x: stageToWorldX(proj, sx), z: stageToWorldZ(proj, sy) };
    clampToBounds(mask, target);
    setPath(walker, findPath(mask, walker.x, walker.z, target.x, target.z));
  });

  // État d'animation & retournement papier 2.5D GPU.
  let shownDir = 'S';
  let flipP = -1;
  let flipStart = 0;
  let flipDur = 0.18;
  let flipFromDir = 'S';
  let flipFromFlip = false;
  let flipSign = 1;
  let flipAngle = 180;
  let animStartTime = 0;
  let animStartDist = 0;
  let currentAnim = null;
  let wasMoving = false;
  let idleStart = 0;
  let stopTime = -1;
  let fgFade = 0;

  function pickAnim(moving, dir) {
    const view = animsByView[directionToView(dir).view] ?? animsByView.S;
    return (moving && view.walk) || view.idle;
  }

  // Banc d'essai identique au jeu principal (src/core/bench.js).
  let bench = null;
  let benchDts = [];
  let benchJs = [];
  let lastReport = '';

  function startBenchRun(passes = 3, warmup = 2) {
    bench = createBench(place.bench, passes, warmup);
    placeAtStart(bench, walker);
    benchDts = [];
    benchJs = [];
    camera.ready = false;
    reportEl.hidden = true;
    copyBtn.hidden = true;
  }

  benchBtn.addEventListener('click', () => startBenchRun(3, 2));
  benchFastBtn.addEventListener('click', () => startBenchRun(1, 0.5));
  copyBtn.addEventListener('click', () => navigator.clipboard?.writeText(lastReport));

  const rendererName = app.renderer.name || 'webgl';
  let fpsCount = 0;
  let fpsTimer = 0;
  let lastFps = 60;
  let lastJsMs = 0;
  let lastNow = performance.now();

  function finishBench() {
    const dts = [...benchDts].sort((a, b) => a - b);
    const jss = [...benchJs].sort((a, b) => a - b);
    const avgDt = dts.reduce((s, v) => s + v, 0) / Math.max(1, dts.length);
    const avgJs = jss.reduce((s, v) => s + v, 0) / Math.max(1, jss.length);
    const over20 = dts.filter((v) => v > 20).length;
    const over33 = dts.filter((v) => v > 33).length;
    lastReport = [
      `POC PixiJS v8 (${rendererName}) — Rayon 1 (${bench.passes} tours, ${dts.length} images)`,
      `Chargement textures VRAM : ${loadMs} ms (${uniqueUrls.length} textures uniques)`,
      `Fluidité : ${(1000 / avgDt).toFixed(1)} i/s · p95 ${percentile(dts, 0.95).toFixed(1)} ms · p99 ${percentile(dts, 0.99).toFixed(1)} ms · pire ${(dts.at(-1) ?? 0).toFixed(1)} ms`,
      `Saccades : > 20 ms = ${over20} (${((100 * over20) / Math.max(1, dts.length)).toFixed(2)} %) · > 33 ms = ${over33} (${((100 * over33) / Math.max(1, dts.length)).toFixed(2)} %)`,
      `Calcul JS : moy ${avgJs.toFixed(2)} ms · p95 ${percentile(jss, 0.95).toFixed(2)} ms · pire ${(jss.at(-1) ?? 0).toFixed(2)} ms`,
    ].join('\n');
    reportEl.textContent = lastReport;
    reportEl.hidden = false;
    copyBtn.hidden = false;
    bench = null;
  }

  app.ticker.add(() => {
    const tStart = performance.now();
    const dtMs = Math.min(100, tStart - lastNow);
    lastNow = tStart;
    const dtSec = dtMs / 1000;

    if (bench) {
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

    const a = stepper.alpha;
    const x = walker.prevX + (walker.x - walker.prevX) * a;
    const z = walker.prevZ + (walker.z - walker.prevZ) * a;
    const time = stepper.time + a * stepper.step;
    const sx = worldToStageX(proj, x);
    const sy = worldToStageY(proj, z);
    const sc = scaleAt(proj, z);

    // Mise en page scène : toute la hauteur 1080 px visible.
    const viewScale = app.screen.height / 1080;
    const viewW = app.screen.width / viewScale;
    stageRoot.scale.set(viewScale);
    updateCamera(camera, config.camera, sx, sy - 140 * sc, walker.facing, viewW, 1080, place.size[0], place.size[1], Math.min(0.1, dtSec));

    layerFond.x = -camera.x;
    layerProduits.x = -camera.x;
    layerActeurs.x = -camera.x;
    layerLointain.x = -camera.x * 0.82;
    layerAvant.x = -camera.x * 1.25;

    // Occlusion dynamique du premier plan.
    const occ = behindFactor(sx, sy, sc, place.layers[4].occluders, camera.x * 1.25);
    fgFade = stepFade(fgFade, occ, 10, dtSec, false);
    layerAvant.alpha = foregroundOpacity(config.display.foregroundOpacity, config.display.behindPlantsOpacity, fgFade);

    // Nuages & oiseaux.
    for (let i = 0; i < cloudSprites.length; i++) {
      const p = cloudPose(place.clouds.items[i], time, place.clouds.span, false);
      cloudSprites[i].x = p.x;
      cloudSprites[i].y = p.y;
    }
    for (let i = 0; i < birdSprites.length; i++) {
      const b = birdPose(place.birds.flock[i], time, place.birds.span, place.birds.cycle, false);
      birdSprites[i].x = b.x + (b.anchorToStage ? camera.x * 0.82 - camera.x : 0);
      birdSprites[i].y = b.y;
      birdSprites[i].scale.set((b.dir < 0 ? -1 : 1) * b.scale, b.scale);
      birdSprites[i].texture = birdFrames[b.frame] ?? birdFrames[0];
    }

    // Retournement papier 2.5D GPU + animation 8 directions.
    if (walker.dir !== shownDir && flipP < 0) {
      const isMajor = needsPaperFlip(shownDir, walker.dir, config.character.flipOnFrontBack);
      const dur = isMajor ? config.character.flipDuration : config.character.turnFlipDuration;
      if (dur > 0) {
        flipFromDir = shownDir;
        flipFromFlip = directionToView(shownDir).flip < 0;
        flipAngle = hero.turnAngleDeg(shownDir, walker.dir);
        flipSign = hero.turnDirectionSign(shownDir, walker.dir);
        flipStart = time;
        flipDur = dur;
        flipP = 0;
      }
      shownDir = walker.dir;
    }
    if (flipP >= 0) {
      flipP = (time - flipStart) / flipDur;
      if (flipP >= 1) flipP = -1;
    }

    const anim = pickAnim(walker.moving, shownDir);
    if (anim !== currentAnim) {
      const keepPhase = Boolean(currentAnim?.stride > 0 && anim.stride > 0);
      currentAnim = anim;
      if (!keepPhase) {
        animStartTime = time;
        animStartDist = walker.distance;
      }
    }
    const fi = frameIndex(anim, (time - animStartTime) * 1000, walker.distance - animStartDist, config.character.walkAnimSpeed, anim.stride > 0);
    const frameSrcUrl = anim.srcs[fi] ?? anim.srcs[0];
    const toTex = heroTexMap.get(frameSrcUrl);
    const toFlip = directionToView(shownDir).flip < 0;

    if (flipP >= 0) {
      const fromAnim = pickAnim(walker.moving, flipFromDir);
      const ffi = frameIndex(fromAnim, (time - animStartTime) * 1000, walker.distance - animStartDist, config.character.walkAnimSpeed, fromAnim.stride > 0);
      const fromTex = heroTexMap.get(fromAnim.srcs[ffi] ?? fromAnim.srcs[0]) ?? toTex;
      hero.applyPaperTwist({
        p: flipP,
        fromTex,
        fromFlip: flipFromFlip,
        toTex,
        toFlip,
        turnSign: flipSign,
        angleDeg: flipAngle,
        edgeThickness: config.character.edgeThickness,
        twist: config.character.paperTwist,
        shadowAmt: config.character.flipShadow,
      });
    } else {
      hero.setTexture(toTex, toFlip ? -1 : 1);
    }

    if (walker.moving !== wasMoving) {
      if (!walker.moving) {
        stopTime = time;
        idleStart = time;
      }
      wasMoving = walker.moving;
    }
    const walkStride = animsByView.S.walk?.stride || 180;
    bodyMotion(motion, config.character, walker.moving, walker.distance, walkStride / config.character.walkAnimSpeed, time - idleStart, stopTime < 0 ? -1 : time - stopTime);
    hero.setBodyMotion(motion.lift, motion.sx, motion.sy);

    const hs = sc * heroData.scale;
    hero.root.x = sx;
    hero.root.y = sy + config.character.footSink * hs;
    hero.root.scale.set(hs);
    hero.root.zIndex = 1000 - z;
    hero.shadow.x = sx;
    hero.shadow.y = sy;
    hero.shadow.scale.set(sc * config.character.shadowSize);
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
    fpsCount++;
    fpsTimer += dtMs;
    if (fpsTimer >= 500) {
      lastFps = Math.round((fpsCount * 1000) / fpsTimer);
      fpsCount = 0;
      fpsTimer = 0;
      const status = bench ? (bench.measuring ? `Banc tour ${bench.pass + 1}/${bench.passes}` : 'Banc chauffe…') : 'Libre (ZQSD / clic)';
      statsEl.textContent = `POC PixiJS v8 (${rendererName}) · ${lastFps} i/s · JS ${lastJsMs.toFixed(2)} ms · ${uniqueUrls.length} textures (${loadMs} ms) · ${status}`;
    }
  });

  window.pixiPoc = {
    startBench: (passes = 1, warmup = 0) => startBenchRun(passes, warmup),
    report: () => lastReport,
    stats: () => ({ renderer: rendererName, loadMs, textures: uniqueUrls.length, fps: lastFps, jsMs: lastJsMs }),
  };

  if (new URLSearchParams(location.search).get('bench') === '1') startBenchRun(1, 0.5);
}

boot().catch((err) => {
  statsEl.textContent = `Erreur POC PixiJS v8 : ${err.message}`;
  console.error(err);
});
