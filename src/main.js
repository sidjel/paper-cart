// Chef d'orchestre : crée les systèmes, les relie, et fait tourner la boucle.
// Aucune règle de jeu ici : la logique vit dans core/, l'affichage dans scene/ et ui/.

import './style.css';
import { config, onConfigChange, setValue, getValue, overrides } from './config.js';
import { createStateMachine } from './core/state.js';
import { createStepper } from './core/stepper.js';
import { compileMask, clampToBounds } from './core/walkmask.js';
import { createWalker, setPath, stepWalker, faceProduct } from './core/movement.js';
import { nearestProduct, inReach, pickTapped, approachPoint, approachStep, createScan, startScan, stepScan, scanProgress } from './core/scan.js';
import { createBasket, addToBasket } from './core/cards.js';
import { createNarrator, narrate, stepNarrator, skipNarrator, stepIdle } from './core/narrator.js';
import { createNarratorUi } from './ui/narrator.js';
import narratorFile from './data/narrator.json';
import { findPath } from './core/pathfinding.js';
import { createBench, stepBench, placeAtStart } from './core/bench.js';
import { createBenchUi } from './ui/bench.js';
import { createQuickTest, stepQuickTest, startQuickTest, quickCondition, quickConditionDef, quickElapsed, quickTotalSeconds, QUICK_SUITES } from './core/quicktest.js';
import { createQuickTestUi } from './ui/quicktest.js';
import { assetStats, computeRasterScale, loadImages } from './scene/assets.js';
import { createStage } from './scene/stage.js';
import { createProjection, worldToStageX, worldToStageY, stageToWorldX, stageToWorldZ, scaleAt } from './scene/projection.js';
import { characterImageEntries, createCharacterSprite } from './scene/character.js';
import { createDebugMask } from './scene/debugMask.js';
import { createTargetMarker } from './scene/targetMarker.js';
import { createProps } from './scene/props.js';
import { actorLevel } from './scene/depth.js';
import { createDust } from './scene/dust.js';
import { createCamera, updateCamera } from './scene/camera.js';
import { createProducts } from './scene/products.js';
import { createBasketUi, createFlyingCard } from './ui/cards.js';
import { createInput } from './input/input.js';
import { createHud } from './ui/hud.js';
import { createDiagnostic } from './ui/diagnostic.js';
import { createSettingsPanel, loadSavedSettings } from './ui/settings.js';
import { createAudio } from './audio/audio.js';
import song from './data/music/supermarche.json';
import place from './data/places/rayon-essai.json';
import heroData from './data/characters/heros.json';
import catalog from './data/products.json';

const VERSION = __VERSION__;
const BASE = import.meta.env.BASE_URL;
const touch = matchMedia('(pointer: coarse)').matches;

loadSavedSettings();

const gameEl = document.getElementById('game');
const uiEl = document.getElementById('ui');
const sm = createStateMachine('loading');
const stepper = createStepper(config.loop.stepHz, config.loop.maxStepsPerFrame);

let stage, proj, mask, walker, sprite, marker, debugMask, input, props, depthRefs, dust;
// Dernière position affichée du personnage (pour placer la poussière d'un pas).
const shown = { x: 0, y: 0, scale: 1, level: 1, time: 0 };
const DUST_IMAGE = 'art/placeholder/poussiere.svg';
const DUST_SIZE = [120, 72];
const DUST_ANCHOR = [60, 68];
const intent = { moveX: 0, moveZ: 0 };
const tmpStage = { x: 0, y: 0 };
const tmpWorld = { x: 0, z: 0 };
let renderLine = '';

const audio = createAudio(config.audio, song);
const hud = createHud(uiEl, { version: VERSION, onAction: handleAction, touch, muted: config.audio.muted });

// ---------- Scanner, cartes et Panier ----------
let products = null; // produits à scanner (affichage)
let loadedImages = null;
let productState = null; // produits à scanner (logique, voir core/scan.js)
const scan = createScan();
const basket = createBasket();
const basketUi = createBasketUi(uiEl, { onOpen: () => handleAction('panier'), onClose: () => handleAction('back') });
const flyingCard = createFlyingCard(uiEl);
const tip = { x: 0, y: 0 }; // bout de la douchette sur la scène
const cardFrom = { x: 0, y: 0 };
const cardTo = { x: 0, y: 0 };
let highlighted = -1;
let pendingScan = -1; // double toucher : produit à scanner à l'arrivée du personnage

function tryScan() {
  if (!sm.is('play') || scan.active) return;
  const i = nearestProduct(productState, walker, config.scan);
  if (i < 0) say('rien_a_scanner');
  scanProduct(i);
}

// ---------- Narrateur (logique dans core/narrator.js, répliques dans data/narrator.json) ----------
// Les répliques [TEMP] s'affichent sans leur préfixe.
const narratorData = {
  triggers: narratorFile.triggers,
  lines: narratorFile.lines.map((l) => ({ ...l, text: l.text.replace(/^\[TEMP\]\s*/, '') })),
};
const narrator = createNarrator();
const narratorUi = createNarratorUi(uiEl, { onSkip: () => skipNarrator(narrator, config.narrator) });
let arrived = false;
let endOfAisleX = Infinity;

function say(trigger) {
  const line = narrate(narrator, narratorData, trigger, config.narrator);
  if (!line) return;
  narratorUi.show(line.text, config.display.reduceMotion);
  audio.play('annonce');
}

// À chaque image, en jeu ou dans le Panier (figé en pause et sous les menus).
function updateNarrator(dt) {
  const letters = stepNarrator(narrator, dt, config.narrator);
  if (!narrator.line) {
    narratorUi.hide();
    return;
  }
  const n = Math.floor(narrator.shown);
  narratorUi.setShown(n);
  const every = config.narrator.blipEvery;
  if (letters > 0 && every > 0 && n % every === 0) audio.play('blip');
}

// Moments surveillés en jeu : arrivée, inactivité, bout du rayon.
function watchNarrator(dt) {
  if (!arrived && narrator.t > 1) {
    arrived = true;
    say('arrivee');
  }
  const active = walker.moving || scan.active || pendingScan >= 0;
  if (stepIdle(narrator, dt, active, config.narrator)) say('inactivite');
  if (walker.x >= endOfAisleX) say('bout_du_rayon');
}

function scanProduct(i) {
  pendingScan = -1;
  if (i < 0) return;
  const target = productState[i];
  faceProduct(walker, target.x, target.loose ? target.z : undefined, config.scan.awayDepth); // s'arrêter, se tourner vers le produit
  marker.hide();
  startScan(scan, i);
  hud.playerMoved();
}

// Produit → plus grande taille à laquelle il est affiché (étagère : 1 ; table, caddie : scale).
function productScales() {
  const m = new Map();
  const add = (id, k) => m.set(id, Math.max(m.get(id) ?? 0, k));
  for (const it of place.shelfProducts.items) add(it.product, 1);
  for (const it of place.looseProducts?.items ?? []) add(it.product, it.scale ?? 1);
  return m;
}

function imageUrlOf(def) {
  return loadedImages.get(def.image).url;
}

// Événements du scan, émis par core/scan.js au fil du temps de jeu.
function onScanEvent(ev) {
  if (!ev) return;
  if (ev === 'bip' || ev === 'aspire') audio.play(ev);
  else if (ev === 'carte') {
    const it = products.items[scan.index];
    products.remove(scan.index);
    productState[scan.index].scanned = true;
    const card = addToBasket(basket, it.id, it.def);
    const url = imageUrlOf(it.def);
    basketUi.add(card, url);
    flyingCard.show(card, url);
    say(basket.cards.length === 1 ? 'premier_scan' : 'scan');
    // Points de départ et d'arrivée de la carte, calculés une fois.
    stage.stageToClient(shown.x, shown.y - 330 * shown.scale * heroData.scale, cardFrom);
    const r = basketUi.button.getBoundingClientRect();
    cardTo.x = r.left + r.width / 2;
    cardTo.y = r.top + r.height / 2;
    audio.play('carte');
  } else if (ev === 'fin') {
    flyingCard.hide();
    basketUi.setCount(basket.cards.length);
  }
}

// Bout de la douchette (dans l'image du personnage) → scène.
function updateTip() {
  const s = shown.scale * heroData.scale;
  const [tx, ty] = heroData.scanTip[walker.away ? 'dos' : 'face'];
  tip.x = shown.x + walker.facing * (tx - heroData.anchor[0]) * s;
  tip.y = shown.y + (ty - heroData.anchor[1]) * s;
}
const diag = createDiagnostic(uiEl, () => ({
  version: VERSION,
  state: sm.get(),
  place: place.id,
  renderLine,
  images: assetStats.images,
  pixels: assetStats.pixels,
  loadMs: assetStats.loadMs,
  slowest: [...assetStats.perImage].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, ms]) => `${n} ${ms} ms`).join(', '),
  audio: audio.describe(),
  gamepad: input?.gamepad.connected ?? false,
  overrides: overrides(),
}));
const benchUi = createBenchUi(uiEl, {
  onStart: () => startBench(config.bench.passes, config.bench.warmup),
  getContext: () => ({
    version: VERSION,
    renderLine,
    images: assetStats.images,
    pixels: assetStats.pixels,
    loadMs: assetStats.loadMs,
    slowest: [...assetStats.perImage].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([nm, ms]) => `${nm} ${ms} ms`).join(', '),
    place: place.id,
    switches: activeSwitches(),
    overrides: overrides(),
  }),
});
const quickUi = createQuickTestUi(uiEl, {
  // La campagne fixe son propre nombre de tours ; le reste vient des réglages.
  onStart: (suite) => startQuick({ ...config.quick, rounds: QUICK_SUITES[suite].rounds ?? config.quick.rounds }, suite),
  getContext: () => ({ version: VERSION, renderLine, overrides: overrides() }),
});
const diagTools = document.createElement('div');
diagTools.append(quickUi.launcher, benchUi.launcher);
const settings = createSettingsPanel(uiEl, { onClose: () => handleAction('back'), extras: { Diagnostic: diagTools } });

// ---------- Test rapide T0 / T1 / T2 ----------
// Les variantes sont appliquées en mémoire seulement (rien n'est enregistré) et annulées à la fin.
let quick = null;
let quickSavedReduce = false;

function applyVariant(variant) {
  config.display.reduceMotion = variant === 'T1' ? true : quickSavedReduce;
  // Rayon de devant : façon de le dessiner pendant la campagne (sinon, comme dans le jeu).
  const fg = { 'fg-half': 'half', 'fg-parallax1': 'parallax1' }[variant] ?? 'normal';
  stage.setLayerVariant('premier-plan', fg);
  if (variant === 'T2') stage.layers['premier-plan'].style.opacity = 0;
}

async function startQuick(params, suite = 'T012') {
  if (!sm.is('menu')) return;
  quick = createQuickTest(place.diagnostic, params, suite);
  startQuickTest(quick, walker);
  quickSavedReduce = config.display.reduceMotion;
  applyVariant(quickConditionDef(quick).variant);
  camera.ready = false;
  lastCamTime = -1;
  marker.hide();
  hud.playerMoved();
  sm.go('bench');
  await quickUi.begin(params, suite);
}

function endQuick(status) {
  if (!quick) return;
  quick = null;
  config.display.reduceMotion = quickSavedReduce;
  stage.setLayerVariant('premier-plan', 'normal');
  sm.go('play');
  quickUi.finish(status);
}

function quickStep(dt, t0) {
  const n = stepper.advance(dt / 1000);
  for (let i = 0; i < n && quick.phase !== 'done'; i++) {
    stepQuickTest(quick, walker, stepper.step);
    if (quick.changed && quick.phase === 'block') {
      quickUi.nextBlock();
      applyVariant(quickConditionDef(quick).variant);
    }
    stepWalker(walker, NO_INPUT, mask, config.walk, stepper.step);
  }
  if (quick.phase === 'done') {
    endQuick('terminé');
    return;
  }
  render();
  if (quick.measuring) quickUi.record(dt, performance.now() - t0, quickCondition(quick));
  const c = quickConditionDef(quick);
  const left = Math.ceil((quickTotalSeconds(quick) - quickElapsed(quick)) / 60);
  const what = quick.phase === 'warmup' ? 'chauffe' : `tour ${quick.round + 1}/${quick.rounds} · ${c.id}`;
  quickUi.progress(`Test rapide : ${what} · reste ≈ ${left} min`);
}

// ---------- Banc d'essai ----------
let bench = null;
const NO_INPUT = { moveX: 0, moveZ: 0 };

function activeSwitches() {
  const b = config.bench;
  return [b.noForeground && 'sans rayon de devant', b.noFarLayer && 'sans rayons lointains', b.noDust && 'sans poussière', b.noShadow && 'sans ombre', b.fixedCamera && 'caméra immobile']
    .filter(Boolean)
    .join(', ');
}

// Interrupteurs d'essai : appliqués seulement pendant le parcours, sans toucher aux réglages enregistrés.
let savedDust = true;
function applySwitches(on) {
  const b = config.bench;
  stage.layers['premier-plan'].style.display = on && b.noForeground ? 'none' : '';
  stage.layers.lointain.style.display = on && b.noFarLayer ? 'none' : '';
  sprite.shadowEl.style.display = on && b.noShadow ? 'none' : '';
  if (on) {
    savedDust = config.character.dust;
    if (b.noDust) config.character.dust = false;
  } else {
    config.character.dust = savedDust;
  }
}

function startBench(passes, warmup) {
  if (!sm.is('menu')) return;
  bench = createBench(place.bench, passes, warmup);
  placeAtStart(bench, walker);
  camera.ready = false;
  lastCamTime = -1;
  marker.hide();
  hud.playerMoved(); // l'aide aux contrôles n'a plus lieu d'être
  applySwitches(true);
  benchUi.begin();
  sm.go('bench');
}

function endBench(status) {
  if (!bench) return;
  applySwitches(false);
  benchUi.finish(status, bench);
  bench = null;
  sm.go('play');
}

function handleAction(action) {
  switch (action) {
    case 'back':
      if (quick) endQuick('annulé par le joueur (résultats partiels)');
      else if (sm.is('bench')) endBench('annulé par le joueur (résultats partiels)');
      else if (sm.is('menu')) sm.back();
      else if (sm.is('panier')) sm.go('play');
      else if (sm.is('play')) sm.go('pause');
      else if (sm.is('pause')) sm.go('play');
      break;
    case 'pause':
      if (quick) endQuick('annulé par le joueur (résultats partiels)');
      else if (sm.is('bench')) endBench('annulé par le joueur (résultats partiels)');
      else if (sm.is('play')) sm.go('pause');
      else if (sm.is('pause')) sm.go('play');
      break;
    case 'settings':
      if (sm.is('menu')) sm.back();
      else sm.go('menu');
      break;
    case 'diagnostic':
      diag.toggle();
      break;
    case 'debugMask':
      setValue('debug.showWalkMask', !config.debug.showWalkMask);
      break;
    case 'fullscreen':
      toggleFullscreen();
      break;
    case 'mute':
      setValue('audio.muted', !config.audio.muted);
      break;
    case 'action':
      tryScan();
      break;
    case 'panier':
      if (sm.is('panier')) sm.go('play');
      else if (sm.is('play') && !scan.active) sm.go('panier');
      break;
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
    return;
  }
  document.documentElement
    .requestFullscreen?.({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {});
}

sm.onChange((now, before) => {
  hud.setPaused(now === 'pause');
  audio.setState(now);
  if (now === 'menu') settings.open();
  if (before === 'menu') settings.close();
  if (now === 'panier') {
    basketUi.open();
    say('panier');
  }
  if (now === 'play' && before === 'pause') say('reprise');
  if (now === 'bench') {
    narrator.line = null; // les mesures se font sans narrateur
    narratorUi.hide();
  }
  if (before === 'panier') basketUi.close();
  if (before === 'play') input?.clear(); // pas de touche « collée » à la reprise
  if (now === 'play' || now === 'bench') stepper.reset();
});

// Un point de l'écran touché ou cliqué → un point du sol à atteindre (fonction de core/).
function onTarget(cx, cy) {
  if (!sm.is('play')) return;
  pendingScan = -1;
  stage.clientToStage(cx, cy, tmpStage);
  tmpWorld.x = stageToWorldX(proj, tmpStage.x);
  tmpWorld.z = stageToWorldZ(proj, tmpStage.y);
  walkTo(tmpWorld);
}

function walkTo(target) {
  clampToBounds(mask, target);
  // Chemin qui contourne les objets si la ligne droite est bloquée.
  const path = findPath(mask, walker.x, walker.z, target.x, target.z);
  setPath(walker, path);
  const [gx, gz] = path[path.length - 1];
  marker.showAt(worldToStageX(proj, gx), worldToStageY(proj, gz));
}

// Double toucher (ou double clic) sur un produit : le personnage va se placer et le scanne à
// l'arrivée (logique dans core/scan.js). Ailleurs : rien de plus que « aller là ».
function onDoubleTap(cx, cy) {
  if (!sm.is('play') || scan.active) return;
  stage.clientToStage(cx, cy, tmpStage);
  const i = pickTapped(productState, tmpStage.x, tmpStage.y, stageToWorldX(proj, tmpStage.x), config.input.doubleTapMargin, config.scan);
  if (i < 0) return;
  if (inReach(productState, i, walker, config.scan)) {
    scanProduct(i);
    return;
  }
  walkTo(approachPoint(productState[i], walker, config.scan, tmpWorld));
  pendingScan = i;
}

// Pendant l'approche d'un double toucher : scanner à l'arrivée, annuler si le joueur reprend la main.
function stepPendingScan() {
  if (pendingScan < 0) return;
  const r = approachStep(productState, pendingScan, walker, intent.moveX !== 0 || intent.moveZ !== 0, config.scan);
  if (r === 'scan') scanProduct(pendingScan);
  else if (r === 'cancel') pendingScan = -1;
}

function layout() {
  if (!stage) return;
  stage.layout(config.camera.zoom);
  const v = stage.view;
  renderLine = `zoom ${config.camera.zoom} · scène ×${v.scale.toFixed(3)} · visible ${Math.round(v.viewW)}×${Math.round(v.viewH)} · images ×${assetStats.rasterScale.toFixed(2)} (densité ${window.devicePixelRatio} plafonnée à ${config.display.maxPixelRatio})`;
}

const camera = createCamera();
let lastCamTime = -1;

// Une image d'animation du personnage demande un son ou un effet (un pas : bruit + poussière).
function onFrameEvent(sound, effect) {
  if (sound) audio.play(sound);
  if (effect === 'poussiere') dust.spawn(shown.x, shown.y, walker.facing, shown.scale * heroData.scale, shown.level, shown.time);
}

function render() {
  const a = stepper.alpha;
  const x = walker.prevX + (walker.x - walker.prevX) * a;
  const z = walker.prevZ + (walker.z - walker.prevZ) * a;
  const time = stepper.time + a * stepper.step; // temps de jeu lissé, figé en pause
  shown.x = worldToStageX(proj, x);
  shown.y = worldToStageY(proj, z);
  shown.scale = scaleAt(proj, z);
  shown.level = actorLevel(depthRefs, z);
  shown.time = time;
  sprite.render(shown.x, shown.y, shown.scale, walker.facing, walker.away, walker.moving, time, walker.distance, scan.active);
  sprite.setLevel(shown.level);
  dust.update(time);
  // Scanner : produit à portée mis en évidence, effets du scan, carte qui file dans le Panier.
  const reach = sm.is('play') && !scan.active ? nearestProduct(productState, walker, config.scan) : -1;
  products.setMarker(reach, time);
  if (reach !== highlighted) {
    hud.setScanAvailable(reach >= 0);
    highlighted = reach;
  }
  updateTip();
  const progress = scanProgress(scan, config.scan);
  products.update(scan, progress, tip);
  if (scan.phase === 'card') flyingCard.update(progress, cardFrom, cardTo, config.display.reduceMotion);
  // La caméra suit le milieu du corps du personnage.
  const v = stage.view;
  const camDt = lastCamTime < 0 ? 0 : Math.min(0.1, time - lastCamTime);
  lastCamTime = time;
  const camFrozen = bench && config.bench.fixedCamera && camera.ready;
  const pc = quick ? quickConditionDef(quick) : null;
  if (pc && pc.camera === 'fixed') {
    // Diagnostic : caméra fixe, centrée sur l'aller-retour.
    const mid = (place.diagnostic.a[0] + place.diagnostic.b[0]) / 2;
    camera.x = Math.min(Math.max(0, place.size[0] - v.viewW), Math.max(0, mid - v.viewW / 2));
    camera.y = 0;
    camera.ready = true;
  } else if (!camFrozen) updateCamera(camera, config.camera, shown.x, shown.y - 140 * shown.scale, walker.facing, v.viewW, v.viewH, place.size[0], place.size[1], camDt);
  stage.setCamera(camera.x, camera.y);
  if (!walker.hasTarget) marker.hide();
}

let last = -1;
function frame(now) {
  requestAnimationFrame(frame);
  const t0 = performance.now();
  const dt = last < 0 ? 0 : now - last;
  last = now;
  input.pollDevices();
  audio.update();
  const playing = sm.is('play');
  if (playing) {
    const n = stepper.advance(dt / 1000);
    for (let i = 0; i < n; i++) {
      input.read(intent);
      if (scan.active) {
        // Pendant un scan, le personnage ne bouge pas.
        intent.moveX = 0;
        intent.moveZ = 0;
      }
      stepWalker(walker, intent, mask, config.walk, stepper.step);
      stepPendingScan();
      onScanEvent(stepScan(scan, stepper.step, config.scan));
    }
    if (walker.moving) hud.playerMoved();
    const sec = Math.min(dt / 1000, 0.1);
    watchNarrator(sec);
    updateNarrator(sec);
    render();
  } else if (sm.is('panier')) {
    updateNarrator(Math.min(dt / 1000, 0.1));
  } else if (quick) {
    quickStep(dt, t0);
  } else if (sm.is('bench')) {
    // Banc d'essai : le parcours remplace les commandes du joueur.
    const n = stepper.advance(dt / 1000);
    const segBefore = bench.segStarts;
    const camBefore = camera.x;
    for (let i = 0; i < n && bench.phase !== 'done'; i++) {
      stepBench(bench, walker, mask, stepper.step);
      stepWalker(walker, NO_INPUT, mask, config.walk, stepper.step);
    }
    render();
    // Contexte de l'image, pour savoir à quel moment les images lentes arrivent.
    if (bench.measuring) benchUi.record(dt, performance.now() - t0, Math.abs(camera.x - camBefore) > 0.05, bench.segStarts !== segBefore, walker.moving);
    benchUi.progress(bench);
    if (bench.phase === 'done') endBench('terminé');
  }
  // Sous un menu ou en pause, la scène n'est pas redessinée.
  diag.frame(dt, performance.now() - t0, playing);
}

async function start() {
  const nearestZ = Math.min(...place.walkMask.area.map((pt) => pt[1]));
  const frontScale = Math.max(1, 1 - nearestZ * (place.projection.scalePerDepth ?? 0) * config.scene.depthScale);
  const rasterScale = computeRasterScale(place.size[1], config.camera.zoom, config.display.maxPixelRatio);
  assetStats.rasterScale = rasterScale;
  const entries = [
    ...Object.entries(place.images).map(([id, im]) => ({ id, url: BASE + im.src, w: im.size[0], h: im.size[1], scale: rasterScale })),
    // Le personnage est un peu plus grand tout devant : on prépare ses images à sa taille maximale.
    ...characterImageEntries(heroData, rasterScale * frontScale).map((e) => ({ ...e, url: BASE + e.url })),
    { id: BASE + DUST_IMAGE, url: BASE + DUST_IMAGE, w: DUST_SIZE[0], h: DUST_SIZE[1], scale: rasterScale * heroData.scale * config.character.dustSize },
    // Produits à scanner (préparés à leur plus grande taille d'affichage).
    ...[...productScales()].map(([id, k]) => {
      const def = catalog.products[id];
      return { id: def.image, url: BASE + def.image, w: def.size[0], h: def.size[1], scale: rasterScale * k };
    }),
  ];
  const images = await loadImages(entries);
  loadedImages = images;

  stage = createStage(gameEl, place, images, getValue);
  proj = createProjection(place.projection, config.scene);
  mask = compileMask(place.walkMask);
  walker = createWalker(place.spawn[0], place.spawn[1]);
  endOfAisleX = Math.max(...place.walkMask.area.map((pt) => pt[0])) - 150; // le narrateur remarque le bout du rayon
  marker = createTargetMarker(stage.layers.acteurs);
  props = createProps(place, images, stage.layers.acteurs, proj);
  stage.el.classList.toggle('props-layered', config.display.propLayers);
  products = createProducts(place, catalog, images, stage.layers.produits, stage.layers.acteurs, config.scan, config.display, {
    parent: stage.layers.acteurs,
    proj,
    levelOf: (id) => props.find((p) => p.id === id).el.style.zIndex,
  });
  productState = products.items.map((it) => ({ x: it.x, scanned: false, loose: !!it.loose, z: it.wz, standAt: it.standAt, y: it.y, w: it.w, h: it.h }));
  depthRefs = props.map((p) => p.depthRef);
  dust = createDust(stage.layers.acteurs, images.get(BASE + DUST_IMAGE), DUST_ANCHOR, config.character, config.display);
  sprite = createCharacterSprite(heroData, images, stage.layers.acteurs, config.character, config.display, onFrameEvent);
  debugMask = createDebugMask(stage.el, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  input = createInput({ surface: gameEl, ui: uiEl, settings: config.input, onAction: handleAction, onTarget, onDoubleTap });

  onConfigChange((key, value) => {
    if (key === 'camera.zoom') layout();
    if (key === 'debug.showWalkMask') debugMask.setVisible(value);
    if (key === 'loop.stepHz') stepper.setRate(value);
    if (key === 'display.foregroundOpacity') stage.applyOpacity();
    if (key === 'display.propLayers') stage.el.classList.toggle('props-layered', value);
    if (key.startsWith('audio.')) audio.applyVolumes();
    if (key === 'audio.muted') hud.setMuted(value);
    if (key === 'narrator.enabled' && !value) narrator.line = null;
  });
  window.addEventListener('resize', layout);
  window.visualViewport?.addEventListener('resize', layout);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sm.is('play')) sm.go('pause');
    if (document.hidden && quick) endQuick('interrompu : le jeu est passé en arrière-plan (écran éteint ?)');
    if (document.hidden && sm.is('bench')) endBench("interrompu : le jeu est passé en arrière-plan");
    audio.setHidden(document.hidden);
  });
  // Le son ne peut démarrer qu'après un premier geste du joueur.
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  layout();
  render();
  hud.ready();
  sm.go('play');
  requestAnimationFrame(frame);

  // Accès en lecture pour les tests automatiques et le débogage.
  window.paperCart = {
    version: VERSION,
    state: () => sm.get(),
    hero: () => ({ x: walker.x, z: walker.z, facing: walker.facing, away: walker.away, hasTarget: walker.hasTarget }),
    // Scanner : produit à portée, scan en cours, cartes du Panier.
    scanState: () => ({ reach: highlighted, active: scan.active, phase: scan.phase, cards: basket.cards.map((c) => c.name) }),
    narrator: () => ({ text: narrator.line?.text ?? '', shown: Math.floor(narrator.shown), visible: narratorUi.visible, t: narrator.t }),
    products: () => products.items.map((it) => ({ id: it.id, x: it.x, scanned: it.scanned })),
    // Niveaux d'affichage : personnage et objets (pour vérifier qui passe devant qui).
    levels: () => ({ hero: Number(sprite.el.style.zIndex), ...Object.fromEntries(props.map((p) => [p.id, Number(p.el.style.zIndex)])) }),
    worldToClient(x, z) {
      return stage.stageToClient(worldToStageX(proj, x), worldToStageY(proj, z), { x: 0, y: 0 });
    },
    report: () => diag.report(),
    camera: () => ({ x: camera.x, y: camera.y, viewW: stage.view.viewW }),
    // Banc d'essai pour les tests automatiques (ouvre le menu puis lance le parcours).
    startBench(passes = 1, warmup = 0) {
      if (sm.is('play')) sm.go('menu');
      startBench(passes, warmup);
    },
    benchReport: () => benchUi.lastReport,
    startQuick(warmup = 1, block = 2, settle = 0.5, rounds = 1, suite = 'T012') {
      if (sm.is('play')) sm.go('menu');
      startQuick({ warmup, block, settle, rounds }, suite);
    },
    quickReport: () => quickUi.lastReport,
    // Tests automatiques seulement : façon de dessiner le rayon de devant (voir stage.setLayerVariant).
    diagForeground: (variant) => stage.setLayerVariant('premier-plan', variant),
    assets: () => ({ images: assetStats.images, pixels: assetStats.pixels }),
    audioStarted: () => audio.started,
    // Tests automatiques : changer un réglage, exactement comme dans le panneau (il est donc enregistré).
    set: (key, value) => setValue(key, value),
  };
}

start().catch((err) => {
  console.error(err);
  hud.showError(`Le jeu n'a pas pu démarrer : ${err.message}`);
});
