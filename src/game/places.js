// Le gestionnaire de lieux (docs/ARCHITECTURE.md §11) : charger un lieu, l'afficher, le quitter, et passer
// de l'un à l'autre par un fondu au noir géré par la machine à états. Sorti de main.js à la séance 54.
// - Les images communes (héros, poussière, produits) restent chargées ; celles du lieu sont libérées en partant.
// - Le héros, sa poussière et le repère au sol passent d'un lieu à l'autre (ils attendent en coulisse).
// - Le monde se souvient : l'état de chaque lieu est créé à la première visite, retrouvé ensuite (core/world.js).
//
// game : { places (données des lieux), base, sm, world, catalog, getValue,
//          commonImages(), actors() → [repère, poussière, héros], walker(), canLeave(),
//          onLoaded({ place, proj, mask, here, view }), onLeaving(), onArrived(), render() }

import { config } from '../config.js';
import { compileMask } from '../core/walkmask.js';
import { clearTarget } from '../core/movement.js';
import { enterPlace, buildProducts, buildPickups } from '../core/world.js';
import { exitAt, createTransition, stepTransition, placeReady, transitionBlack } from '../core/places.js';
import { assetStats, computeRasterScale, loadImages, releaseImages } from '../scene/assets.js';
import { createProjection, worldToStageY } from '../scene/projection.js';
import { createPlaceView } from '../scene/placeView.js';

export function createPlaces(ui, container, game) {
  let place = null;
  let view = null; // vue du lieu affiché (scene/placeView.js)
  let images = null;
  const backstage = document.createElement('div'); // où attendent le héros, la poussière et le repère hors d'un lieu

  async function load(id) {
    place = game.places[id];
    const rasterScale = computeRasterScale(place.size[1], config.camera.zoom, config.display.maxPixelRatio);
    assetStats.rasterScale = rasterScale;
    // Décodées avant l'affichage. L'historique des temps d'image repart de zéro à chaque lieu (il ne grossit plus).
    assetStats.perImage.length = 0;
    images = await loadImages(Object.entries(place.images).map(([key, im]) => ({ id: key, url: game.base + im.src, w: im.size[0], h: im.size[1], scale: rasterScale })));
    const proj = createProjection(place.projection, config.scene);
    const mask = compileMask(place.walkMask);
    // État du lieu : créé à la première visite, retrouvé ensuite (le monde se souvient).
    const back = Math.max(...place.walkMask.area.map((pt) => pt[1]));
    const here = enterPlace(game.world, place.id, () => ({
      products: buildProducts(place, game.catalog, (z) => worldToStageY(proj, z)),
      pickups: buildPickups(place, back),
    }));
    view = createPlaceView(container, place, images, game.commonImages(), here, proj, config, game.getValue);
    // Le héros, sa poussière et le repère rejoignent le calque des acteurs de ce lieu.
    for (const a of game.actors()) a.mount(view.stage.layers.acteurs);
    game.onLoaded({ place, proj, mask, here, view });
  }

  function unload() {
    if (!view) return;
    game.onLeaving();
    for (const a of game.actors()) a.mount(backstage);
    view.destroy();
    view = null;
    releaseImages(images);
  }

  // ---------- Changement de lieu : fondu au noir géré par la machine à états ----------
  // En jeu, héros libre : entrer dans une zone de sortie lance le fondu. Dans le noir, on quitte le lieu
  // (images libérées), on charge le suivant, on y pose le héros ; puis le noir s'efface et le jeu reprend.
  const fadeEl = document.createElement('div');
  fadeEl.className = 'place-fade';
  fadeEl.hidden = true;
  ui.appendChild(fadeEl);
  let transition = null;
  let lastMs = 0; // durée du dernier changement de lieu dans le noir (pour le diagnostic)

  function leaveBy(exit) {
    transition = createTransition(exit);
    fadeEl.hidden = false;
    game.sm.go('transition');
  }

  async function change(exit) {
    const t0 = performance.now();
    unload();
    await load(exit.to);
    const walker = game.walker();
    walker.x = walker.prevX = exit.arrive[0];
    walker.z = walker.prevZ = exit.arrive[1];
    walker.vx = walker.vz = 0;
    walker.facing = exit.facing ?? walker.facing;
    walker.away = false;
    clearTarget(walker);
    game.onArrived();
    game.render();
    lastMs = Math.round(performance.now() - t0);
    placeReady(transition);
  }

  return {
    backstage,
    load,
    // Un changement de lieu est en cours (fondu) : rien d'autre ne bouge.
    get busy() {
      return transition !== null;
    },
    // Un lieu est affiché.
    get ready() {
      return view !== null;
    },
    lastTransitionMs: () => lastMs,
    // À chaque image de jeu : le héros entre-t-il dans une sortie ?
    watchExits() {
      if (transition || !game.canLeave()) return;
      const walker = game.walker();
      const exit = exitAt(place.exits?.items ?? [], walker.x, walker.z);
      if (exit && game.places[exit.to]) leaveBy(exit);
    },
    // À chaque image pendant le changement de lieu : seul le fondu avance.
    update(dt) {
      if (stepTransition(transition, dt, config.places) === 'load') change(transition.exit);
      fadeEl.style.opacity = transitionBlack(transition, config.places);
      if (transition.phase === 'done') {
        transition = null;
        fadeEl.hidden = true;
        game.sm.go('play');
      }
    },
    // Tests : prendre une sortie du lieu (comme si le héros y entrait), sans marcher jusque-là.
    useExit(id) {
      const exit = (place.exits?.items ?? []).find((e) => !id || e.id === id);
      if (!exit || transition || !game.sm.is('play')) return false;
      leaveBy(exit);
      return true;
    },
    // Tests : quitter le lieu puis y revenir (vue détruite, images libérées, tout reconstruit).
    async reload() {
      const id = place.id;
      unload();
      await load(id);
      game.render();
    },
  };
}
