// Outils de mesure (diagnostic seulement) : diagnostic DBG, banc d'essai, test rapide T0 / T1 / T2.
// Ils ne changent rien au jeu normal (docs/ARCHITECTURE.md §7). Sortis de main.js à la séance 54.
//
// game : ce que ces outils ont le droit de voir et de faire dans le jeu :
//   { version, sm, stepper, hud, errors,
//     camera(), place(), stage(), walker(), mask(), sprite(), marker(),
//     render(), resetCamera(), renderLine(), placeNote(), audioInfo(), gamepad() }

import { config, overrides } from '../config.js';
import { assetStats } from '../scene/assets.js';
import { stepWalker } from '../core/movement.js';
import { createBench, stepBench, placeAtStart } from '../core/bench.js';
import { createQuickTest, stepQuickTest, startQuickTest, quickCondition, quickConditionDef, quickElapsed, quickTotalSeconds, QUICK_SUITES } from '../core/quicktest.js';
import { createDiagnostic } from '../ui/diagnostic.js';
import { createBenchUi } from '../ui/bench.js';
import { createQuickTestUi } from '../ui/quicktest.js';

const NO_INPUT = { moveX: 0, moveZ: 0 };
const CANCELLED = 'annulé par le joueur (résultats partiels)';

export function createMeasureTools(ui, game) {
  const { sm, stepper, hud } = game;
  const slowest = () => [...assetStats.perImage].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, ms]) => `${n} ${ms} ms`).join(', ');

  const diag = createDiagnostic(ui, () => ({
    version: game.version,
    state: sm.get(),
    place: game.placeNote(),
    renderLine: game.renderLine(),
    images: assetStats.images,
    pixels: assetStats.pixels,
    loadMs: assetStats.loadMs,
    slowest: slowest(),
    audio: game.audioInfo(),
    gamepad: game.gamepad(),
    overrides: overrides(),
    errors: game.errors,
  }));
  const benchUi = createBenchUi(ui, {
    onStart: () => startBench(config.bench.passes, config.bench.warmup),
    onStartSound: () => startBench(999, config.bench.warmup, 'son'), // s'arrête au bout de bench.soundMinutes
    getContext: () => ({
      version: game.version,
      renderLine: game.renderLine(),
      images: assetStats.images,
      pixels: assetStats.pixels,
      loadMs: assetStats.loadMs,
      slowest: slowest(),
      place: game.place().id,
      switches: activeSwitches(),
      overrides: overrides(),
      audio: game.audioInfo(),
    }),
  });
  const quickUi = createQuickTestUi(ui, {
    // La campagne fixe son propre nombre de tours ; le reste vient des réglages.
    onStart: (suite) => startQuick({ ...config.quick, rounds: QUICK_SUITES[suite].rounds ?? config.quick.rounds }, suite),
    getContext: () => ({ version: game.version, renderLine: game.renderLine(), overrides: overrides() }),
  });
  // Bloc placé dans l'onglet « Diagnostic » des réglages.
  const launcher = document.createElement('div');
  launcher.append(quickUi.launcher, benchUi.launcher);

  // ---------- Test rapide T0 / T1 / T2 ----------
  // Les variantes sont appliquées en mémoire seulement (rien n'est enregistré) et annulées à la fin.
  let quick = null;
  let quickSavedReduce = false;

  function applyVariant(variant) {
    const stage = game.stage();
    config.display.reduceMotion = variant === 'T1' ? true : quickSavedReduce;
    stage.applyOpacity(); // rayon de devant comme dans le jeu…
    if (variant === 'T2') stage.setLayerOpacity('premier-plan', 0); // … ou invisible (T2)
  }

  async function startQuick(params, suite = 'T012') {
    if (!sm.is('menu')) return;
    quick = createQuickTest(game.place().diagnostic, params, suite);
    startQuickTest(quick, game.walker());
    quickSavedReduce = config.display.reduceMotion;
    applyVariant(quickConditionDef(quick).variant);
    game.resetCamera();
    game.marker().hide();
    hud.playerMoved();
    sm.go('bench');
    await quickUi.begin(params, suite);
  }

  function endQuick(status) {
    if (!quick) return;
    quick = null;
    config.display.reduceMotion = quickSavedReduce;
    game.stage().applyOpacity();
    sm.go('play');
    quickUi.finish(status);
  }

  function quickStep(dt, t0) {
    const walker = game.walker();
    const n = stepper.advance(dt / 1000);
    for (let i = 0; i < n && quick.phase !== 'done'; i++) {
      stepQuickTest(quick, walker, stepper.step);
      if (quick.changed && quick.phase === 'block') {
        quickUi.nextBlock();
        applyVariant(quickConditionDef(quick).variant);
      }
      stepWalker(walker, NO_INPUT, game.mask(), config.walk, stepper.step);
    }
    if (quick.phase === 'done') {
      endQuick('terminé');
      return;
    }
    game.render();
    if (quick.measuring) quickUi.record(dt, performance.now() - t0, quickCondition(quick));
    const c = quickConditionDef(quick);
    const left = Math.ceil((quickTotalSeconds(quick) - quickElapsed(quick)) / 60);
    const what = quick.phase === 'warmup' ? 'chauffe' : `tour ${quick.round + 1}/${quick.rounds} · ${c.id}`;
    quickUi.progress(`Test rapide : ${what} · reste ≈ ${left} min`);
  }

  // ---------- Banc d'essai ----------
  let bench = null;

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
    const layers = game.stage().layers;
    // (un lieu peut ne pas avoir ces calques)
    if (layers['premier-plan']) layers['premier-plan'].style.display = on && b.noForeground ? 'none' : '';
    if (layers.lointain) layers.lointain.style.display = on && b.noFarLayer ? 'none' : '';
    game.sprite().shadowEl.style.display = on && b.noShadow ? 'none' : '';
    if (on) {
      savedDust = config.character.dust;
      if (b.noDust) config.character.dust = false;
    } else {
      config.character.dust = savedDust;
    }
  }

  // kind : 'son' pour l'essai son long (même parcours, rapport titré autrement).
  function startBench(passes, warmup, kind = 'images') {
    if (!sm.is('menu')) return;
    bench = createBench(game.place().bench, passes, warmup);
    bench.kind = kind;
    bench.soundT = 0;
    placeAtStart(bench, game.walker());
    game.resetCamera();
    game.marker().hide();
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

  function benchStep(dt, t0) {
    // Le parcours remplace les commandes du joueur.
    const walker = game.walker();
    const n = stepper.advance(dt / 1000);
    const segBefore = bench.segStarts;
    const camera = game.camera();
    const camBefore = camera.x;
    for (let i = 0; i < n && bench.phase !== 'done'; i++) {
      stepBench(bench, walker, game.mask(), stepper.step);
      stepWalker(walker, NO_INPUT, game.mask(), config.walk, stepper.step);
    }
    game.render();
    // Contexte de l'image, pour savoir à quel moment les images lentes arrivent.
    if (bench.measuring) benchUi.record(dt, performance.now() - t0, Math.abs(camera.x - camBefore) > 0.05, bench.segStarts !== segBefore, walker.moving);
    benchUi.progress(bench);
    if (bench.measuring && bench.kind === 'son') bench.soundT += dt / 1000;
    if (bench.phase === 'done' || (bench.kind === 'son' && bench.soundT >= config.bench.soundMinutes * 60)) endBench('terminé');
  }

  return {
    diag,
    launcher,
    startBench,
    startQuick,
    // Une image de l'état « bench » (test rapide ou banc d'essai).
    frame(dt, t0) {
      if (quick) quickStep(dt, t0);
      else if (bench) benchStep(dt, t0);
    },
    // Le joueur arrête l'essai (Échap, pause, B) : résultats partiels gardés.
    cancel() {
      if (quick) endQuick(CANCELLED);
      else endBench(CANCELLED);
    },
    // Le jeu passe en arrière-plan : l'essai est interrompu.
    interrupted() {
      if (quick) endQuick('interrompu : le jeu est passé en arrière-plan (écran éteint ?)');
      if (sm.is('bench')) endBench('interrompu : le jeu est passé en arrière-plan');
    },
    // Caméra pendant un essai : fixe (test rapide, centrée sur l'aller-retour : renvoie son x), ou sinon null.
    fixedCameraX(viewW) {
      if (!quick || quickConditionDef(quick).camera !== 'fixed') return null;
      const d = game.place().diagnostic;
      const mid = (d.a[0] + d.b[0]) / 2;
      return Math.min(Math.max(0, game.place().size[0] - viewW), Math.max(0, mid - viewW / 2));
    },
    // Banc d'essai avec l'interrupteur « caméra immobile ».
    cameraFrozen: () => !!bench && config.bench.fixedCamera && game.camera().ready,
    benchReport: () => benchUi.lastReport,
    quickReport: () => quickUi.lastReport,
  };
}
