// Chef d'orchestre : crée les systèmes, les relie, et fait tourner la boucle.
// Aucune règle de jeu ici : la logique vit dans core/, l'affichage dans scene/ et ui/.

import './style.css';
import { config, onConfigChange, setValue, getValue, overrides } from './config.js';
import { createStateMachine } from './core/state.js';
import { createStepper } from './core/stepper.js';
import { compileMask, clampToBounds } from './core/walkmask.js';
import { createWalker, setPath, stepWalker } from './core/movement.js';
import { findPath } from './core/pathfinding.js';
import { createBench, stepBench, placeAtStart } from './core/bench.js';
import { createBenchUi } from './ui/bench.js';
import { createProtocol, stepProtocol, placeForConfig, protocolConfig, totalSeconds } from './core/protocol.js';
import { createProtocolUi, F_CAMERA, F_FRAME, F_FLIP, F_DUST } from './ui/protocol.js';
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
import { createInput } from './input/input.js';
import { createHud } from './ui/hud.js';
import { createDiagnostic } from './ui/diagnostic.js';
import { createSettingsPanel, loadSavedSettings } from './ui/settings.js';
import { createAudio } from './audio/audio.js';
import song from './data/music/supermarche.json';
import place from './data/places/rayon-essai.json';
import heroData from './data/characters/heros.json';

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
const protocolUi = createProtocolUi(uiEl, {
  onStart: () => startProtocol(config.protocol.warmup, config.protocol.measure, config.protocol.repeats),
  getContext: () => ({
    version: VERSION,
    renderLine,
    overrides: overrides(),
    warmup: config.protocol.warmup,
    measure: config.protocol.measure,
    repeats: config.protocol.repeats,
    wakeLock: protocolUi.wakeLockActive ? 'oui' : 'non (pense à garder l’écran allumé)',
  }),
});
const quickUi = createQuickTestUi(uiEl, {
  // La campagne fixe son propre nombre de tours ; le reste du protocole vient des réglages.
  onStart: (suite) => startQuick({ ...config.quick, rounds: QUICK_SUITES[suite].rounds ?? config.quick.rounds }, suite),
  getContext: () => ({ version: VERSION, renderLine, overrides: overrides() }),
});
const diagTools = document.createElement('div');
diagTools.append(quickUi.launcher, benchUi.launcher, protocolUi.launcher);
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
  startQuickTest(quick, walker, ghost);
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

// ---------- Diagnostic en 4 configurations ----------
let protocol = null;
let ghost = null; // « fantôme » invisible que la caméra suit dans la configuration 3
const prevP = { phase: '', ci: 0, run: 0 };

async function startProtocol(warmup, measure, repeats) {
  if (!sm.is('menu')) return;
  protocol = createProtocol(place.diagnostic, warmup, measure, repeats);
  placeForConfig(protocol, walker, ghost);
  camera.ready = false;
  lastCamTime = -1;
  marker.hide();
  hud.playerMoved();
  prevP.phase = protocol.phase;
  prevP.ci = 0;
  prevP.run = 0;
  sm.go('bench');
  await protocolUi.begin({ warmup, measure, repeats });
}

function endProtocol(status) {
  if (!protocol) return;
  if (protocol.phase === 'measure') protocolUi.endRun(protocol.ci, protocol.run); // mesure en cours : partielle
  protocol = null;
  sm.go('play');
  protocolUi.finish(status);
}

// Après chaque pas : fin d'une mesure, début d'une mesure, nouvelle configuration.
function protocolPhaseChanged() {
  if (prevP.phase === 'measure') protocolUi.endRun(prevP.ci, prevP.run);
  if (protocol.phase === 'measure') protocolUi.startRun();
  if (protocol.phase === 'warmup') camera.ready = false; // nouvelle configuration : la caméra se replace
  prevP.phase = protocol.phase;
  prevP.ci = protocol.ci;
  prevP.run = protocol.run;
}

function protocolStep(dt, t0) {
  const n = stepper.advance(dt / 1000);
  const camBefore = camera.x;
  const framesBefore = sprite.stats.frameChanges;
  const dustBefore = dust.counter.spawns;
  for (let i = 0; i < n && protocol.phase !== 'done'; i++) {
    stepProtocol(protocol, walker, ghost, stepper.step);
    if (protocol.changed) protocolPhaseChanged();
    stepWalker(walker, NO_INPUT, mask, config.walk, stepper.step);
    stepWalker(ghost, NO_INPUT, mask, config.walk, stepper.step);
  }
  if (protocol.phase === 'done') {
    // La dernière mesure a déjà été close par protocolPhaseChanged.
    protocol = null;
    sm.go('play');
    protocolUi.finish('terminé');
    return;
  }
  render();
  if (protocol.measuring) {
    let f = 0;
    if (Math.abs(camera.x - camBefore) > 0.05) f |= F_CAMERA;
    if (sprite.stats.frameChanges !== framesBefore) f |= F_FRAME;
    if (sprite.stats.flipping) f |= F_FLIP;
    if (dust.counter.spawns !== dustBefore) f |= F_DUST;
    protocolUi.record(dt, performance.now() - t0, f);
  }
  const left = Math.max(0, totalSeconds(protocol) - (protocol.ci * (protocol.warmup + protocol.measure * protocol.repeats) + (protocol.phase === 'warmup' ? protocol.t : protocol.warmup + protocol.run * protocol.measure + protocol.t)));
  const step = protocol.phase === 'warmup' ? 'chauffe' : `mesure ${protocol.run + 1}/${protocol.repeats}`;
  protocolUi.progress(`Diagnostic : configuration ${protocol.ci + 1}/4 · ${step} · reste ≈ ${Math.ceil(left / 60)} min`);
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
      else if (protocol) endProtocol('annulé par le joueur (résultats partiels)');
      else if (sm.is('bench')) endBench('annulé par le joueur (résultats partiels)');
      else if (sm.is('menu')) sm.back();
      else if (sm.is('play')) sm.go('pause');
      else if (sm.is('pause')) sm.go('play');
      break;
    case 'pause':
      if (quick) endQuick('annulé par le joueur (résultats partiels)');
      else if (protocol) endProtocol('annulé par le joueur (résultats partiels)');
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
  if (before === 'play') input?.clear(); // pas de touche « collée » à la reprise
  if (now === 'play' || now === 'bench') stepper.reset();
});

// Un point de l'écran touché ou cliqué → un point du sol à atteindre (fonction de core/).
function onTarget(cx, cy) {
  if (!sm.is('play')) return;
  stage.clientToStage(cx, cy, tmpStage);
  tmpWorld.x = stageToWorldX(proj, tmpStage.x);
  tmpWorld.z = stageToWorldZ(proj, tmpStage.y);
  clampToBounds(mask, tmpWorld);
  // Chemin qui contourne les objets si la ligne droite est bloquée.
  const path = findPath(mask, walker.x, walker.z, tmpWorld.x, tmpWorld.z);
  setPath(walker, path);
  const [gx, gz] = path[path.length - 1];
  marker.showAt(worldToStageX(proj, gx), worldToStageY(proj, gz));
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
  sprite.render(shown.x, shown.y, shown.scale, walker.facing, walker.away, walker.moving, time, walker.distance);
  sprite.setLevel(shown.level);
  dust.update(time);
  // La caméra suit le milieu du corps du personnage.
  const v = stage.view;
  const camDt = lastCamTime < 0 ? 0 : Math.min(0.1, time - lastCamTime);
  lastCamTime = time;
  const camFrozen = bench && config.bench.fixedCamera && camera.ready;
  const pc = protocol ? protocolConfig(protocol) : quick ? quickConditionDef(quick) : null;
  if (pc && pc.camera === 'fixed') {
    // Diagnostic : caméra fixe, centrée sur l'aller-retour.
    const mid = (place.diagnostic.a[0] + place.diagnostic.b[0]) / 2;
    camera.x = Math.min(Math.max(0, place.size[0] - v.viewW), Math.max(0, mid - v.viewW / 2));
    camera.y = 0;
    camera.ready = true;
  } else if (pc && pc.camera === 'ghost') {
    // Diagnostic : la caméra suit le fantôme (même mouvement que dans la configuration 4).
    const gz = ghost.prevZ + (ghost.z - ghost.prevZ) * a;
    const gx = worldToStageX(proj, ghost.prevX + (ghost.x - ghost.prevX) * a);
    updateCamera(camera, config.camera, gx, worldToStageY(proj, gz) - 140 * scaleAt(proj, gz), ghost.facing, v.viewW, v.viewH, place.size[0], place.size[1], camDt);
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
      stepWalker(walker, intent, mask, config.walk, stepper.step);
    }
    if (walker.moving) hud.playerMoved();
    render();
  } else if (quick) {
    quickStep(dt, t0);
  } else if (protocol) {
    protocolStep(dt, t0);
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
  ];
  const images = await loadImages(entries);

  stage = createStage(gameEl, place, images, getValue);
  proj = createProjection(place.projection, config.scene);
  mask = compileMask(place.walkMask);
  walker = createWalker(place.spawn[0], place.spawn[1]);
  ghost = createWalker(place.diagnostic.a[0], place.diagnostic.a[1]);
  marker = createTargetMarker(stage.layers.acteurs);
  props = createProps(place, images, stage.layers.acteurs, proj);
  depthRefs = props.map((p) => p.depthRef);
  dust = createDust(stage.layers.acteurs, images.get(BASE + DUST_IMAGE), DUST_ANCHOR, config.character, config.display);
  sprite = createCharacterSprite(heroData, images, stage.layers.acteurs, config.character, config.display, onFrameEvent);
  debugMask = createDebugMask(stage.el, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  input = createInput({ surface: gameEl, ui: uiEl, settings: config.input, onAction: handleAction, onTarget });

  onConfigChange((key, value) => {
    if (key === 'camera.zoom') layout();
    if (key === 'debug.showWalkMask') debugMask.setVisible(value);
    if (key === 'loop.stepHz') stepper.setRate(value);
    if (key === 'display.foregroundOpacity') stage.applyOpacity();
    if (key.startsWith('audio.')) audio.applyVolumes();
    if (key === 'audio.muted') hud.setMuted(value);
  });
  window.addEventListener('resize', layout);
  window.visualViewport?.addEventListener('resize', layout);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sm.is('play')) sm.go('pause');
    if (document.hidden && quick) endQuick('interrompu : le jeu est passé en arrière-plan (écran éteint ?)');
    if (document.hidden && protocol) endProtocol('interrompu : le jeu est passé en arrière-plan (écran éteint ?)');
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
    startProtocol(warmup = 1, measure = 2, repeats = 1) {
      if (sm.is('play')) sm.go('menu');
      startProtocol(warmup, measure, repeats);
    },
    protocolReport: () => protocolUi.lastReport,
    startQuick(warmup = 1, block = 2, settle = 0.5, rounds = 1, suite = 'T012') {
      if (sm.is('play')) sm.go('menu');
      startQuick({ warmup, block, settle, rounds }, suite);
    },
    quickReport: () => quickUi.lastReport,
    // Tests automatiques seulement : façon de dessiner le rayon de devant (voir stage.setLayerVariant).
    diagForeground: (variant) => stage.setLayerVariant('premier-plan', variant),
    assets: () => ({ images: assetStats.images, pixels: assetStats.pixels }),
    audioStarted: () => audio.started,
  };
}

start().catch((err) => {
  console.error(err);
  hud.showError(`Le jeu n'a pas pu démarrer : ${err.message}`);
});
