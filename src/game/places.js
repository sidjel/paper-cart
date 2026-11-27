// Le gestionnaire de lieux (docs/ARCHITECTURE.md §11) sous PixiJS v8 : charger un lieu, l'afficher,
// le quitter, et passer de l'un à l'autre par fondu enchaîné (RenderTexture dans dissolveLayer).
// - Les textures communes (héros, poussière, produits, chariot) restent chargées ; celles du lieu sont libérées en partant.
// - Le héros, sa poussière, le chariot et le repère au sol passent d'un lieu à l'autre via renderer.backstage.
// - Le monde se souvient : l'état de chaque lieu est créé à la première visite, retrouvé ensuite (core/world.js).

import { config } from '../config.js';
import { compileMask } from '../core/walkmask.js';
import { clearTarget } from '../core/movement.js';
import { enterPlace, buildProducts, buildPickups } from '../core/world.js';
import { createPile } from '../core/pile.js';
import { exitAt, edgeBounds, edgeTouched, createEdgeWalk, stepEdgeWalk, createTransition, stepTransition, placeReady, transitionDissolve, showWait, shouldPrefetch, neighborImageUrls } from '../core/places.js';
import { assetStats, computeRasterScale, loadImages, releaseImages } from '../scene/assets.js';
import { createProjection, scaleAt, worldToStageY } from '../scene/projection.js';
import { createPlaceView } from '../scene/placeView.js';
import { quality } from '../scene/quality.js';

export function createPlaces(ui, renderer, game) {
  let place = null;
  let proj = null; // projection du lieu actif (pour l'échelle du héros selon z)
  let view = null; // vue PixiJS du lieu affiché (scene/placeView.js)
  let images = null;
  const backstage = renderer.backstage; // conteneur PixiJS hors scène pour les acteurs persistants

  // Pré-téléchargement réseau silencieux des lieux voisins (cache HTTP seulement, sans décodage ni texture).
  const prefetched = new Set();
  let prefetchTimer = 0;
  let prefetchCtrl = null;

  function cancelPrefetch() {
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
      prefetchTimer = 0;
    }
    if (prefetchCtrl) {
      prefetchCtrl.abort();
      prefetchCtrl = null;
    }
  }

  function schedulePrefetch() {
    cancelPrefetch();
    if (typeof fetch !== 'function') return;
    if (!shouldPrefetch(config.display.profile, !!navigator.connection?.saveData)) return;
    const urls = neighborImageUrls(place, game.places, game.base).filter((u) => !prefetched.has(u));
    if (!urls.length) return;
    const delayMs = Math.max(0, (config.places.prefetchDelay ?? 2.5) * 1000);
    prefetchTimer = setTimeout(async () => {
      prefetchTimer = 0;
      if (!view || transition || !game.sm.is('play') || game.isScanning?.()) return;
      const ctrl = new AbortController();
      prefetchCtrl = ctrl;
      for (const url of urls) {
        if (ctrl.signal.aborted) break;
        try {
          const res = await fetch(url, { priority: 'low', signal: ctrl.signal });
          if (res.ok) {
            await res.arrayBuffer();
            prefetched.add(url);
          }
        } catch {
          // Annulé ou hors-ligne : la transition normale reste fonctionnelle.
        }
      }
      if (prefetchCtrl === ctrl) prefetchCtrl = null;
    }, delayMs);
  }

  async function preparePlace(id) {
    const nextPlace = game.places[id];
    const rasterScale = computeRasterScale(nextPlace.viewHeight ?? nextPlace.size[1], config.camera.zoom, quality().pixelRatio);
    assetStats.rasterScale = rasterScale;
    assetStats.perImage.length = 0;
    const nextImages = await loadImages(
      Object.entries(nextPlace.images).map(([key, im]) => ({ id: key, url: game.base + im.src, w: im.size[0], h: im.size[1], scale: rasterScale })),
    );
    const nextProj = createProjection(nextPlace.projection, config.scene);
    const mask = compileMask(nextPlace.walkMask);
    const back = Math.max(...nextPlace.walkMask.area.map((pt) => pt[1]));
    const here = enterPlace(game.world, nextPlace.id, () => ({
      products: buildProducts(nextPlace, game.catalog, (z) => worldToStageY(nextProj, z)),
      pickups: buildPickups(nextPlace, back, (z) => worldToStageY(nextProj, z)),
      pile: nextPlace.pile ? createPile() : null,
    }));
    const nextView = createPlaceView(renderer, nextPlace, nextImages, game.commonImages(), here, nextProj, config, game.getValue);
    return { place: nextPlace, images: nextImages, proj: nextProj, mask, here, view: nextView };
  }

  function mountPrepared(built) {
    place = built.place;
    proj = built.proj;
    images = built.images;
    view = built.view;
    for (const a of game.actors()) a.mount(view.stage.layers.acteurs);
    game.onLoaded({ place, proj: built.proj, mask: built.mask, here: built.here, view });
    schedulePrefetch();
  }

  async function load(id) {
    mountPrepared(await preparePlace(id));
  }

  function unload() {
    cancelPrefetch();
    edgeWalk = null;
    if (!view) return;
    game.onLeaving();
    for (const a of game.actors()) a.mount(backstage);
    view.destroy();
    view = null;
    releaseImages(images);
    images = null;
  }

  // ---------- Changement de lieu : fondu enchaîné GPU (RenderTexture) ----------
  // Un seul calque DOM .place-fade dans #ui pour le relais noir d'intro/erreur et le signe d'attente (.place-wait).
  const fadeEl = document.createElement('div');
  fadeEl.className = 'place-fade';
  fadeEl.hidden = true;

  const waitEl = document.createElement('div');
  waitEl.className = 'place-wait';
  waitEl.hidden = true;
  waitEl.setAttribute('role', 'status');
  waitEl.setAttribute('aria-label', 'Chargement');
  waitEl.innerHTML = '<span></span><span></span><span></span>';
  fadeEl.appendChild(waitEl);
  ui.appendChild(fadeEl);

  let transition = null;
  let edgeWalk = null;
  let lastMs = 0;
  let revealT = -1;
  let revealFade = 0.25;

  function resetFx() {
    renderer.clearDissolve();
    fadeEl.classList.remove('paper-fx');
    fadeEl.style.transform = '';
  }

  let leftFrom = null;
  let ignoredExit = null;
  const errorEl = document.createElement('div');
  errorEl.className = 'place-error';
  errorEl.hidden = true;
  errorEl.setAttribute('role', 'alertdialog');
  errorEl.innerHTML = '<p>[TEMP] Impossible de charger ce lieu.</p><button>Réessayer</button>';
  ui.appendChild(errorEl);
  const retryBtn = errorEl.querySelector('button');
  retryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    retry();
  });

  function paintFade(tr) {
    fadeEl.style.opacity = '1';
    fadeEl.style.transform = '';
    const fadeCfg = config.display.reduceMotion ? { fade: 0 } : config.places;
    const oldOpacity = transitionDissolve(tr, fadeCfg);
    renderer.setDissolveAlpha(oldOpacity);
    renderer.render();
  }

  function leaveBy(exit, fromOverride = null, unloadFirst = false) {
    cancelPrefetch();
    edgeWalk = null;
    const w = game.walker();
    leftFrom = fromOverride ?? { id: place.id, x: w.x, z: w.z, facing: w.facing };
    transition = createTransition(exit);
    transition.unloadFirst = unloadFirst;
    fadeEl.classList.add('paper-fx');
    paintFade(transition);
    fadeEl.hidden = false;
    game.onTransitionStart?.();
    game.sm.go('transition');
  }

  function putHero(x, z, facing) {
    const walker = game.walker();
    walker.x = walker.prevX = x;
    walker.z = walker.prevZ = z;
    walker.vx = walker.vz = 0;
    walker.facing = facing ?? walker.facing;
    walker.away = false;
    clearTarget(walker);
  }

  function arriveHero(exit) {
    if (exit.arriveEdge && proj) {
      const z = exit.arrive[1];
      const b = edgeBounds(exit.arriveEdge, place.size[0], scaleAt(proj, z));
      putHero(b.outX, z, exit.facing);
      ignoredExit = exitAt(place.exits?.items ?? [], b.outX, z);
      edgeWalk = createEdgeWalk('in', b.inX, b.outX, null);
    } else {
      putHero(exit.arrive[0], exit.arrive[1], exit.facing);
      edgeWalk = null;
    }
  }

  async function change(exit) {
    const t0 = performance.now();
    const keepOld = !transition?.unloadFirst && view;
    if (keepOld) {
      // Capture exacte de l'écran (worldRoot à l'identité) dans une RenderTexture, puis destruction
      // immédiate de l'ancien lieu et libération de ses textures avant le chargement du nouveau lieu
      // (pic VRAM = 1 seul lieu + 1 RenderTexture, et le héros reste visible à l'écran pendant le chargement).
      cancelPrefetch();
      renderer.captureSnapshot();
      renderer.setDissolveAlpha(1);
      renderer.render();
      unload();
    } else {
      renderer.clearDissolve();
      unload();
    }
    try {
      await load(exit.to);
      arriveHero(exit);
      game.onArrived();
    } catch (err) {
      game.logError(`lieu « ${exit.to} » non chargé : ${err?.message ?? err}`);
      unload();
      if (await backToStart(exit)) {
        game.onLoadFailed();
      } else {
        renderer.clearDissolve();
        errorEl.hidden = false;
      }
    }
    if (view) game.render();
    else renderer.render();
    lastMs = Math.round(performance.now() - t0);
    placeReady(transition);
  }

  async function backToStart(exit) {
    try {
      await load(leftFrom.id);
      putHero(leftFrom.x, leftFrom.z, leftFrom.facing);
      ignoredExit = exit;
      return true;
    } catch (err) {
      game.logError(`lieu « ${leftFrom.id} » non rechargé : ${err?.message ?? err}`);
      unload();
      return false;
    }
  }

  let retrying = false;
  async function retry() {
    if (errorEl.hidden || retrying) return;
    retrying = true;
    retryBtn.disabled = true;
    resetFx();
    fadeEl.style.opacity = '1';
    fadeEl.hidden = false;
    const ok = await backToStart(null);
    retrying = false;
    retryBtn.disabled = false;
    if (ok) {
      game.render();
      errorEl.hidden = true;
      game.sm.go('play');
      revealT = 0;
      revealFade = config.places.fade;
    } else {
      fadeEl.hidden = true;
      retryBtn.focus({ preventScroll: true });
    }
  }

  return {
    backstage,
    load,
    get busy() {
      return transition !== null;
    },
    get autoWalking() {
      return edgeWalk !== null;
    },
    get ready() {
      return view !== null;
    },
    lastTransitionMs: () => lastMs,
    stepEdge(intent, dt) {
      if (!edgeWalk) return;
      const walker = game.walker();
      const res = stepEdgeWalk(edgeWalk, walker.x, dt);
      if (!res) return;
      if (res.done) {
        const finished = edgeWalk;
        edgeWalk = null;
        if (finished.kind === 'out') {
          intent.moveX = 0;
          intent.moveZ = 0;
          leaveBy(finished.exit, finished.from);
        }
        return;
      }
      clearTarget(walker);
      intent.moveX = res.moveX;
      intent.moveZ = res.moveZ;
    },
    watchExits() {
      if (transition || edgeWalk || !game.canLeave()) return;
      const walker = game.walker();
      const exit = exitAt(place.exits?.items ?? [], walker.x, walker.z);
      const scale = proj ? scaleAt(proj, walker.z) : 1;
      const touched = exit && edgeTouched(exit, walker.x, place.size[0], scale);
      if (exit === ignoredExit && touched) return;
      if (!touched) {
        ignoredExit = null;
        return;
      }
      ignoredExit = null;
      if (!game.places[exit.to]) return;
      if (exit.edge) {
        const { outX } = edgeBounds(exit.edge, place.size[0], scale);
        clearTarget(walker);
        edgeWalk = createEdgeWalk('out', outX, walker.x, exit);
        edgeWalk.from = { id: place.id, x: walker.x, z: walker.z, facing: walker.facing };
      } else {
        leaveBy(exit);
      }
    },
    update(dt) {
      if (stepTransition(transition, dt, config.places) === 'load') change(transition.exit);
      paintFade(transition);
      const wait = showWait(transition, config.places);
      if (waitEl.hidden === wait) {
        waitEl.hidden = !wait;
        waitEl.classList.toggle('still', config.display.reduceMotion);
      }
      if (transition.phase === 'done') {
        transition = null;
        fadeEl.hidden = true;
        resetFx();
        renderer.render();
        game.sm.go(view ? 'play' : 'erreur');
        if (!view) retryBtn.focus({ preventScroll: true });
      }
    },
    reveal(fade) {
      revealT = 0;
      revealFade = fade;
      resetFx();
      fadeEl.hidden = false;
      fadeEl.style.opacity = '1';
    },
    revealStep(dt) {
      if (revealT < 0) return;
      revealT += dt;
      const o = revealFade <= 0 ? 0 : 1 - revealT / revealFade;
      if (o <= 0) {
        revealT = -1;
        fadeEl.hidden = true;
        fadeEl.style.opacity = '0';
      } else fadeEl.style.opacity = String(o);
    },
    useExit(id, unloadFirst = false) {
      const exit = (place.exits?.items ?? []).find((e) => !id || e.id === id);
      if (!exit || transition || !game.sm.is('play')) return false;
      leaveBy(exit, null, unloadFirst);
      return true;
    },
    retry,
    async reload() {
      const id = place.id;
      unload();
      await load(id);
      game.render();
    },
  };
}
