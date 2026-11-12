// Chef d'orchestre : crée les systèmes, les relie, et fait tourner la boucle.
// Aucune règle de jeu ici : la logique vit dans core/, l'affichage dans scene/ et ui/.

import './style.css';
import { config, onConfigChange, setValue, overrides } from './config.js';
import { createStateMachine } from './core/state.js';
import { createStepper } from './core/stepper.js';
import { compileMask, clampToBounds } from './core/walkmask.js';
import { createWalker, setTarget, stepWalker } from './core/movement.js';
import { assetStats, computeRasterScale, loadImages } from './scene/assets.js';
import { createStage } from './scene/stage.js';
import { createProjection, worldToStageX, worldToStageY, stageToWorldX, stageToWorldZ, scaleAt } from './scene/projection.js';
import { characterImageEntries, createCharacterSprite } from './scene/character.js';
import { createDebugMask } from './scene/debugMask.js';
import { createTargetMarker } from './scene/targetMarker.js';
import { createProps } from './scene/props.js';
import { actorLevel } from './scene/depth.js';
import { createInput } from './input/input.js';
import { createHud } from './ui/hud.js';
import { createDiagnostic } from './ui/diagnostic.js';
import { createSettingsPanel, loadSavedSettings } from './ui/settings.js';
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

let stage, proj, mask, walker, sprite, marker, debugMask, input, props, depthRefs;
const intent = { moveX: 0, moveZ: 0 };
const tmpStage = { x: 0, y: 0 };
const tmpWorld = { x: 0, z: 0 };
let renderLine = '';

const hud = createHud(uiEl, { version: VERSION, onAction: handleAction, touch });
const diag = createDiagnostic(uiEl, () => ({
  version: VERSION,
  state: sm.get(),
  place: place.id,
  renderLine,
  images: assetStats.images,
  pixels: assetStats.pixels,
  loadMs: assetStats.loadMs,
  gamepad: input?.gamepad.connected ?? false,
  overrides: overrides(),
}));
const settings = createSettingsPanel(uiEl, { onClose: () => handleAction('back') });

function handleAction(action) {
  switch (action) {
    case 'back':
      if (sm.is('menu')) sm.back();
      else if (sm.is('play')) sm.go('pause');
      else if (sm.is('pause')) sm.go('play');
      break;
    case 'pause':
      if (sm.is('play')) sm.go('pause');
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
  if (now === 'menu') settings.open();
  if (before === 'menu') settings.close();
  if (before === 'play') input?.clear(); // pas de touche « collée » à la reprise
  if (now === 'play') stepper.reset();
});

// Un point de l'écran touché ou cliqué → un point du sol à atteindre (fonction de core/).
function onTarget(cx, cy) {
  if (!sm.is('play')) return;
  stage.clientToStage(cx, cy, tmpStage);
  tmpWorld.x = stageToWorldX(proj, tmpStage.x);
  tmpWorld.z = stageToWorldZ(proj, tmpStage.y);
  clampToBounds(mask, tmpWorld);
  setTarget(walker, tmpWorld.x, tmpWorld.z);
  marker.showAt(worldToStageX(proj, tmpWorld.x), worldToStageY(proj, tmpWorld.z));
}

function layout() {
  if (!stage) return;
  stage.layout(config.display.fitMode);
  const mode = config.display.fitMode === 'fit' ? 'tout montrer' : 'remplir';
  renderLine = `${mode} · scène ×${stage.view.scale.toFixed(3)} · images ×${assetStats.rasterScale.toFixed(2)} (densité ${window.devicePixelRatio} plafonnée à ${config.display.maxPixelRatio})`;
}

function render() {
  const a = stepper.alpha;
  const x = walker.prevX + (walker.x - walker.prevX) * a;
  const z = walker.prevZ + (walker.z - walker.prevZ) * a;
  const time = stepper.time + a * stepper.step; // temps de jeu lissé, figé en pause
  sprite.render(worldToStageX(proj, x), worldToStageY(proj, z), scaleAt(proj, z), walker.facing, walker.away, walker.moving, time, walker.distance);
  sprite.setLevel(actorLevel(depthRefs, z));
  if (!walker.hasTarget) marker.hide();
}

let last = -1;
function frame(now) {
  requestAnimationFrame(frame);
  const t0 = performance.now();
  const dt = last < 0 ? 0 : now - last;
  last = now;
  input.pollDevices();
  const playing = sm.is('play');
  if (playing) {
    const n = stepper.advance(dt / 1000);
    for (let i = 0; i < n; i++) {
      input.read(intent);
      stepWalker(walker, intent, mask, config.walk, stepper.step);
    }
    if (walker.moving) hud.playerMoved();
    render();
  }
  // Sous un menu ou en pause, la scène n'est pas redessinée.
  diag.frame(dt, performance.now() - t0, playing);
}

async function start() {
  const rasterScale = computeRasterScale(place.size[0], place.size[1], config.display.maxPixelRatio);
  assetStats.rasterScale = rasterScale;
  const entries = [
    ...Object.entries(place.images).map(([id, im]) => ({ id, url: BASE + im.src, w: im.size[0], h: im.size[1], scale: rasterScale })),
    ...characterImageEntries(heroData, rasterScale).map((e) => ({ ...e, url: BASE + e.url })),
  ];
  const images = await loadImages(entries);

  stage = createStage(gameEl, place, images);
  proj = createProjection(place.projection);
  mask = compileMask(place.walkMask);
  walker = createWalker(place.spawn[0], place.spawn[1]);
  marker = createTargetMarker(stage.layers.acteurs);
  props = createProps(place, images, stage.layers.acteurs, proj);
  depthRefs = props.map((p) => p.depthRef);
  sprite = createCharacterSprite(heroData, images, stage.layers.acteurs, config.character, config.display);
  debugMask = createDebugMask(stage.el, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  input = createInput({ surface: gameEl, ui: uiEl, settings: config.input, onAction: handleAction, onTarget });

  onConfigChange((key, value) => {
    if (key === 'display.fitMode') layout();
    if (key === 'debug.showWalkMask') debugMask.setVisible(value);
    if (key === 'loop.stepHz') stepper.setRate(value);
  });
  window.addEventListener('resize', layout);
  window.visualViewport?.addEventListener('resize', layout);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sm.is('play')) sm.go('pause');
  });

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
      const r = gameEl.getBoundingClientRect();
      const v = stage.view;
      return { x: r.left + v.offX + worldToStageX(proj, x) * v.scale, y: r.top + v.offY + worldToStageY(proj, z) * v.scale };
    },
    report: () => diag.report(),
  };
}

start().catch((err) => {
  console.error(err);
  hud.showError(`Le jeu n'a pas pu démarrer : ${err.message}`);
});
