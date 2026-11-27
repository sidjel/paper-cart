// POC PixiJS v8 isolé (branche poc/pixi-v8) : Accueil (2600×1080) & Rayon 1 (3600×1080) + héros
// 8 directions + parallaxe multi-plans + nuages/oiseaux + props/agent/hôtesse + Paper Flip GPU MeshPlane
// + même banc d'essai (src/core/bench.js) pour comparer DOM/CSS vs PixiJS v8 sur PC et smartphone.

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
const copyBtn = document.getElementById('poc-copy');
const btnAccueil = document.getElementById('poc-place-accueil');
const btnRayon = document.getElementById('poc-place-rayon');
const domLink = document.getElementById('poc-dom-link');

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

  // Préchargement unique des sprites du héros 8 directions.
  const heroUrls = collectHeroUrls();
  await Assets.load(heroUrls.map((u) => BASE + u));
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

  const stageRoot = new Container();
  app.stage.addChild(stageRoot);

  const rendererName = app.renderer.name || 'webgl';
  const stepper = createStepper(config.loop.stepHz, config.loop.maxStepsPerFrame);
  const keys = new Set();
  const intent = { moveX: 0, moveZ: 0 };
  const motion = { lift: 0, sx: 1, sy: 1 };

  let activeScene = null;
  let bench = null;
  let benchDts = [];
  let benchJs = [];
  let lastReport = '';
  let lastFps = 60;
  let lastJsMs = 0;

  async function mountPlace(placeId) {
    const entry = PLACES[placeId] ?? PLACES.accueil;
    const place = entry.data;
    bench = null;
    reportEl.hidden = true;
    copyBtn.hidden = true;
    btnAccueil.classList.toggle('active', placeId === 'accueil');
    btnRayon.classList.toggle('active', placeId === 'rayon-essai');
    domLink.href = `./?lieu=${placeId}`;
    statsEl.textContent = `POC PixiJS v8 — chargement ${entry.label}…`;

    const t0 = performance.now();
    const entries = collectPlaceEntries(place);
    const uniqueUrls = [...new Set(entries.values())];
    await Assets.load(uniqueUrls);
    const textures = new Map();
    for (const [k, url] of entries) textures.set(k, Assets.get(url));
    const loadMs = Math.round(performance.now() - t0);
    const totalTextures = new Set([...uniqueUrls, ...heroUrls.map((u) => BASE + u)]).size;

    stageRoot.removeChildren();
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

    // Props triés par profondeur (portiques, plante/paniers, brume couloir, présentoirs, chariot…).
    const fadeProps = [];
    for (const p of place.props ?? []) {
      const im = place.images[p.image];
      const s = new Sprite(textures.get(p.image));
      const sc = p.perspectiveScale ? p.perspectiveScale * scaleAt(proj, p.at[1]) : (p.scale ?? 1) * scaleAt(proj, p.at[1]);
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

    // Agent de sécurité (Accueil)
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

    // Hôtesse derrière le comptoir (Accueil)
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

    const hero = createPixiHero(heroData, heroTexMap, app.renderer.name !== 'canvas');
    acteurs.addChild(hero.shadow, hero.liftShadow, hero.root);

    const walker = createWalker(place.spawn[0], place.spawn[1]);
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
      totalTextures,
      viewOffX: 0,
      viewScale: 1,
      shownDir: 'S',
      flipP: -1,
      flipStart: 0,
      flipDur: 0.18,
      flipFromDir: 'S',
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
  }

  function pickAnim(moving, dir) {
    const view = animsByView[directionToView(dir).view] ?? animsByView.S;
    return (moving && view.walk) || view.idle;
  }

  function startBenchRun(passes = 3, warmup = 2) {
    if (!activeScene?.place.bench) return;
    bench = createBench(activeScene.place.bench, passes, warmup);
    placeAtStart(bench, activeScene.walker);
    benchDts = [];
    benchJs = [];
    activeScene.camera.ready = false;
    reportEl.hidden = true;
    copyBtn.hidden = true;
  }

  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  app.canvas.addEventListener('pointerdown', (e) => {
    if (bench || !activeScene) return;
    const rect = app.canvas.getBoundingClientRect();
    const s = activeScene.viewScale;
    const sx = (e.clientX - rect.left - activeScene.viewOffX) / s + activeScene.camera.x;
    const sy = (e.clientY - rect.top) / s + activeScene.camera.y;
    const target = { x: stageToWorldX(activeScene.proj, sx), z: stageToWorldZ(activeScene.proj, sy) };
    clampToBounds(activeScene.mask, target);
    setPath(activeScene.walker, findPath(activeScene.mask, activeScene.walker.x, activeScene.walker.z, target.x, target.z));
  });

  btnAccueil.addEventListener('click', () => mountPlace('accueil'));
  btnRayon.addEventListener('click', () => mountPlace('rayon-essai'));
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

  await mountPlace(initialPlaceId);

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

    const { place, proj, mask, walker, camera, hero } = scObj;

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
    fpsCount++;
    fpsTimer += dtMs;
    if (fpsTimer >= 500) {
      lastFps = Math.round((fpsCount * 1000) / fpsTimer);
      fpsCount = 0;
      fpsTimer = 0;
      const status = bench ? (bench.measuring ? `Banc ${bench.pass + 1}/${bench.passes}` : 'Chauffe…') : scObj.label;
      statsEl.textContent = `POC PixiJS v8 (${rendererName}) · ${status} · ${lastFps} i/s · JS ${lastJsMs.toFixed(2)} ms`;
    }
  });

  window.pixiPoc = {
    setPlace: (id) => mountPlace(id),
    startBench: (passes = 1, warmup = 0) => startBenchRun(passes, warmup),
    report: () => lastReport,
    stats: () => ({ renderer: rendererName, place: activeScene?.placeId, loadMs: activeScene?.loadMs, textures: activeScene?.totalTextures, fps: lastFps, jsMs: lastJsMs }),
  };

  if (params.get('bench') === '1') startBenchRun(1, 0.5);
}

boot().catch((err) => {
  statsEl.textContent = `Erreur POC PixiJS v8 : ${err.message}`;
  console.error(err);
});
