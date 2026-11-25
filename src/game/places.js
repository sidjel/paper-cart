// Le gestionnaire de lieux (docs/ARCHITECTURE.md §11) : charger un lieu, l'afficher, le quitter, et passer
// de l'un à l'autre par un fondu au noir géré par la machine à états. Sorti de main.js à la séance 54.
// - Les images communes (héros, poussière, produits) restent chargées ; celles du lieu sont libérées en partant.
// - Le héros, sa poussière et le repère au sol passent d'un lieu à l'autre (ils attendent en coulisse).
// - Le monde se souvient : l'état de chaque lieu est créé à la première visite, retrouvé ensuite (core/world.js).
//
// game : { places (données des lieux), base, sm, world, catalog, getValue,
//          commonImages(), actors() → [repère, poussière, héros], walker(), canLeave(),
//          onLoaded({ place, proj, mask, here, view }), onLeaving(), onArrived(), render(),
//          logError(texte) → diagnostic (F3), onLoadFailed() → le haut-parleur prévient }

import { config } from '../config.js';
import { compileMask } from '../core/walkmask.js';
import { clearTarget } from '../core/movement.js';
import { enterPlace, buildProducts, buildPickups } from '../core/world.js';
import { createPile } from '../core/pile.js';
import { exitAt, createTransition, stepTransition, placeReady, isCrossDissolve, transitionBlack, transitionDirection, transitionWipe, transitionFlip, transitionFlaps, transitionStrips, transitionDissolve, showWait, shouldPrefetch, neighborImageUrls } from '../core/places.js';
import { assetStats, computeRasterScale, loadImages, releaseImages } from '../scene/assets.js';
import { createProjection, worldToStageY } from '../scene/projection.js';
import { createPlaceView } from '../scene/placeView.js';
import { quality } from '../scene/quality.js';

export function createPlaces(ui, container, game) {
  let place = null;
  let view = null; // vue du lieu affiché (scene/placeView.js)
  let images = null;
  const backstage = document.createElement('div'); // où attendent le héros, la poussière et le repère hors d'un lieu
  // Pré-téléchargement réseau silencieux des lieux voisins (cache HTTP seulement, sans décodage ni calque).
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
    const rasterScale = computeRasterScale(nextPlace.viewHeight ?? nextPlace.size[1], config.camera.zoom, quality().pixelRatio); // profil de qualité
    assetStats.rasterScale = rasterScale;
    // Décodées avant l'affichage. L'historique des temps d'image repart de zéro à chaque lieu (il ne grossit plus).
    assetStats.perImage.length = 0;
    const nextImages = await loadImages(
      Object.entries(nextPlace.images).map(([key, im]) => ({ id: key, url: game.base + im.src, w: im.size[0], h: im.size[1], scale: rasterScale })),
    );
    const proj = createProjection(nextPlace.projection, config.scene);
    const mask = compileMask(nextPlace.walkMask);
    // État du lieu : créé à la première visite, retrouvé ensuite (le monde se souvient).
    const back = Math.max(...nextPlace.walkMask.area.map((pt) => pt[1]));
    const here = enterPlace(game.world, nextPlace.id, () => ({
      products: buildProducts(nextPlace, game.catalog, (z) => worldToStageY(proj, z)),
      pickups: buildPickups(nextPlace, back, (z) => worldToStageY(proj, z)),
      pile: nextPlace.pile ? createPile() : null, // pile de cartons (A8) : debout ou tombée
    }));
    const nextView = createPlaceView(container, nextPlace, nextImages, game.commonImages(), here, proj, config, game.getValue);
    return { place: nextPlace, images: nextImages, proj, mask, here, view: nextView };
  }

  function mountPrepared(built) {
    place = built.place;
    images = built.images;
    view = built.view;
    // Le héros, sa poussière et le repère rejoignent le calque des acteurs de ce lieu.
    for (const a of game.actors()) a.mount(view.stage.layers.acteurs);
    game.onLoaded({ place, proj: built.proj, mask: built.mask, here: built.here, view });
    schedulePrefetch();
  }

  async function load(id) {
    mountPrepared(await preparePlace(id));
  }

  function unload() {
    cancelPrefetch();
    if (!view) return;
    game.onLeaving();
    for (const a of game.actors()) a.mount(backstage);
    view.destroy();
    view = null;
    releaseImages(images);
  }

  // ---------- Changement de lieu : transition papier origami gérée par la machine à états ----------
  // Un seul calque .place-fade pour tout le jeu : noir en relais d'intro/erreur (enfants cachés = 0 calque
  // en plus), et transition origami (3A retournement, 3B double-volet, lignes→cartes bleues, ou 2A volet) entre lieux.
  const fadeEl = document.createElement('div');
  fadeEl.className = 'place-fade';
  fadeEl.hidden = true;
  const artUrl = `${game.base}art/ui/transition-origami.webp`;
  fadeEl.style.setProperty('--transition-img', `url("${artUrl}")`);
  // Préchargement silencieux de l'illustration de transition pour éviter tout flash au premier passage.
  if (typeof Image === 'function') {
    const pre = new Image();
    pre.src = artUrl;
  }
  const sheetEl = document.createElement('div');
  sheetEl.className = 'place-sheet';
  sheetEl.hidden = true;
  fadeEl.appendChild(sheetEl);

  const flapsEl = document.createElement('div');
  flapsEl.className = 'place-flaps';
  flapsEl.hidden = true;
  const flapA = document.createElement('div');
  flapA.className = 'place-flap place-flap-a';
  const flapB = document.createElement('div');
  flapB.className = 'place-flap place-flap-b';
  flapsEl.append(flapA, flapB);
  fadeEl.appendChild(flapsEl);

  const STRIP_COUNT = 6;
  const stripsEl = document.createElement('div');
  stripsEl.className = 'place-strips';
  stripsEl.hidden = true;
  const stripEls = [];
  for (let i = 0; i < STRIP_COUNT; i++) {
    const s = document.createElement('div');
    s.className = 'place-strip';
    s.style.setProperty('--i', String(i));
    stripsEl.appendChild(s);
    stripEls.push(s);
  }
  fadeEl.appendChild(stripsEl);

  const mistEl = document.createElement('div');
  mistEl.className = 'place-mist';
  mistEl.hidden = true;
  fadeEl.appendChild(mistEl);

  // Signe d'attente (trois points de papier qui sautillent), si le chargement dure : jamais d'écran muet.
  const waitEl = document.createElement('div');
  waitEl.className = 'place-wait';
  waitEl.hidden = true;
  waitEl.setAttribute('role', 'status');
  waitEl.setAttribute('aria-label', 'Chargement');
  waitEl.innerHTML = '<span></span><span></span><span></span>';
  fadeEl.appendChild(waitEl);
  ui.appendChild(fadeEl);
  let transition = null;
  let dissolving = null; // { view, images } : ancien lieu en cours de fondu enchaîné, libéré dès la fin
  let lastMs = 0; // durée du dernier changement de lieu dans le noir (pour le diagnostic)
  let revealT = -1; // dévoilement du début de partie (voir reveal), -1 : aucun
  let revealFade = 0.25;

  function discardDissolving() {
    if (!dissolving) return;
    dissolving.view.destroy();
    releaseImages(dissolving.images);
    dissolving = null;
  }

  function resetFx() {
    discardDissolving();
    fadeEl.classList.remove('paper-fx');
    fadeEl.style.transform = '';
    sheetEl.hidden = true;
    sheetEl.style.transform = '';
    sheetEl.style.opacity = '';
    sheetEl.classList.remove('edge');
    flapsEl.hidden = true;
    stripsEl.hidden = true;
    mistEl.hidden = true;
    mistEl.style.opacity = '0';
  }

  // Un chargement qui échoue ne bloque jamais le jeu (séance 62) : on recharge le lieu de départ et le
  // héros revient là où il est sorti (cette sortie est ignorée tant qu'il n'en est pas ressorti), le
  // haut-parleur prévient. Si même ce rechargement échoue : un écran d'erreur avec « Réessayer ».
  // Dans tous les cas, l'état « transition » se termine.
  let leftFrom = null; // { id, x, z, facing } : où était le héros en partant
  let ignoredExit = null; // sortie d'où l'on vient de revenir après un échec
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
    if (isCrossDissolve(tr.style)) {
      sheetEl.hidden = true;
      flapsEl.hidden = true;
      stripsEl.hidden = true;
      const { oldOpacity, mistOpacity } = transitionDissolve(tr, config.places);
      if (dissolving) dissolving.view.stage.el.style.opacity = String(oldOpacity);
      mistEl.hidden = mistOpacity <= 0;
      if (!mistEl.hidden) mistEl.style.opacity = String(mistOpacity);
      return;
    }
    mistEl.hidden = true;
    if (config.display.reduceMotion || config.places.fade <= 0) {
      sheetEl.hidden = false;
      flapsEl.hidden = true;
      stripsEl.hidden = true;
      sheetEl.classList.remove('edge');
      sheetEl.style.transform = '';
      sheetEl.style.opacity = String(transitionBlack(tr, config.places));
      return;
    }
    if (tr.style === 'double') {
      sheetEl.hidden = true;
      stripsEl.hidden = true;
      flapsEl.hidden = false;
      const { axis, a, b } = transitionFlaps(tr, config.places, tr.dir);
      flapsEl.classList.toggle('axis-x', axis === 'x');
      flapsEl.classList.toggle('axis-y', axis === 'y');
      flapA.style.transform = axis === 'x' ? `scaleX(${a})` : `scaleY(${a})`;
      flapB.style.transform = axis === 'x' ? `scaleX(${b})` : `scaleY(${b})`;
    } else if (tr.style === 'strips') {
      sheetEl.hidden = true;
      flapsEl.hidden = true;
      stripsEl.hidden = false;
      const { axis, items } = transitionStrips(tr, config.places, tr.dir, STRIP_COUNT);
      stripsEl.classList.toggle('axis-x', axis === 'x');
      stripsEl.classList.toggle('axis-y', axis === 'y');
      for (let i = 0; i < STRIP_COUNT; i++) {
        const it = items[i];
        const el = stripEls[i];
        el.style.transform = axis === 'x' ? `translate3d(${it.t}%, 0, 0) scaleY(${it.s})` : `translate3d(0, ${it.t}%, 0) scaleX(${it.s})`;
        el.style.opacity = String(it.opacity);
        el.classList.toggle('as-white', it.white);
      }
    } else if (tr.style === 'wipe') {
      flapsEl.hidden = true;
      stripsEl.hidden = true;
      sheetEl.hidden = false;
      sheetEl.classList.remove('edge');
      const { x, y } = transitionWipe(tr, config.places, tr.dir);
      sheetEl.style.opacity = '1';
      sheetEl.style.transform = `translate3d(${x}%, ${y}%, 0)`;
    } else {
      // 'flip' (3A par défaut) : feuille origami avec liseré blanc qui se retourne en scaleX/scaleY.
      flapsEl.hidden = true;
      stripsEl.hidden = true;
      sheetEl.hidden = false;
      const { x, y, sx, sy, edge } = transitionFlip(tr, config.places, tr.dir);
      sheetEl.style.opacity = '1';
      sheetEl.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${sx}, ${sy})`;
      sheetEl.classList.toggle('edge', edge);
    }
  }

  function leaveBy(exit) {
    cancelPrefetch();
    const w = game.walker();
    leftFrom = { id: place.id, x: w.x, z: w.z, facing: w.facing };
    transition = createTransition(exit, transitionDirection(exit, place), config.places.style);
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

  async function change(exit) {
    const t0 = performance.now();
    const keepOld = isCrossDissolve(transition?.style) && view;
    if (keepOld) {
      // En fondu enchaîné / brume, le héros reste visible dans l'ancien décor pendant tout le chargement
      // du lieu suivant (aucune disparition à vide avant la bascule).
      cancelPrefetch();
      const oldView = view;
      const oldImages = images;
      oldView.stage.el.classList.add('stage-dissolve');
      oldView.stage.el.style.opacity = '1';
      try {
        const built = await preparePlace(exit.to);
        game.onLeaving();
        dissolving = { view: oldView, images: oldImages };
        view = null;
        images = null;
        mountPrepared(built);
        putHero(exit.arrive[0], exit.arrive[1], exit.facing);
        game.onArrived();
      } catch (err) {
        game.logError(`lieu « ${exit.to} » non chargé : ${err?.message ?? err}`);
        oldView.stage.el.classList.remove('stage-dissolve');
        oldView.stage.el.style.opacity = '';
        ignoredExit = exit;
        game.onLoadFailed();
      }
    } else {
      unload();
      try {
        await load(exit.to);
        putHero(exit.arrive[0], exit.arrive[1], exit.facing);
        game.onArrived();
      } catch (err) {
        game.logError(`lieu « ${exit.to} » non chargé : ${err?.message ?? err}`);
        discardDissolving();
        unload(); // ce qui a pu être construit avant l'échec
        if (await backToStart(exit)) game.onLoadFailed();
        else errorEl.hidden = false;
      }
    }
    if (view) game.render();
    lastMs = Math.round(performance.now() - t0);
    placeReady(transition);
  }

  // Recharger le lieu de départ et y remettre le héros. Renvoie false si cela échoue aussi.
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

  // « Réessayer » (écran d'erreur) : on retente le lieu de départ. L'écran d'erreur passe le relais à
  // l'écran de fondu (docs/ARCHITECTURE.md §11) : le noir des lieux, plein, est remis dessous dès l'appui ;
  // l'écran d'erreur reste devant pendant le chargement (signe d'attente si cela dure), n'est retiré que
  // le lieu prêt, sur le noir déjà plein, puis la scène se dévoile comme après un changement de lieu.
  let retrying = false;
  async function retry() {
    if (errorEl.hidden || retrying) return; // un seul essai à la fois (double appui)
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
      errorEl.hidden = true; // dessous, le noir est déjà plein : rien ne clignote
      game.sm.go('play');
      revealT = 0; // la scène se dévoile depuis le noir (revealStep, à chaque image de jeu)
      revealFade = config.places.fade;
    } else {
      fadeEl.hidden = true; // toujours sous l'écran d'erreur : invisible
      retryBtn.focus({ preventScroll: true });
    }
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
      if (exit === ignoredExit) return; // revenu par là après un échec : il doit d'abord en ressortir
      ignoredExit = null;
      if (exit && game.places[exit.to]) leaveBy(exit);
    },
    // À chaque image pendant le changement de lieu : seul le volet papier avance.
    update(dt) {
      if (stepTransition(transition, dt, config.places) === 'load') change(transition.exit);
      paintFade(transition);
      const wait = showWait(transition, config.places);
      if (waitEl.hidden === wait) {
        waitEl.hidden = !wait;
        waitEl.classList.toggle('still', config.display.reduceMotion); // « réduire les animations » : points immobiles
      }
      if (transition.phase === 'done') {
        transition = null;
        fadeEl.hidden = true;
        resetFx();
        game.sm.go(view ? 'play' : 'erreur'); // sans lieu : l'écran d'erreur attend « Réessayer »
        if (!view) retryBtn.focus({ preventScroll: true });
      }
    },
    // Début de partie (séance 68) : la scène se dévoile depuis le noir, avec l'écran noir des changements de
    // lieu (sa propre couche dès le départ, effacé par son opacité, retiré une fois transparent : il ne fait
    // pas clignoter). L'intro lui passe le relais (son propre écran noir, retiré, faisait clignoter le héros
    // et la bande du haut-parleur : test de l'auteur, intro désactivée). fade : durée de l'effacement (s).
    reveal(fade) {
      revealT = 0;
      revealFade = fade;
      resetFx();
      fadeEl.hidden = false;
      fadeEl.style.opacity = '1';
    },
    // À chaque image de jeu.
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
    // Tests : prendre une sortie du lieu (comme si le héros y entrait), sans marcher jusque-là.
    useExit(id) {
      const exit = (place.exits?.items ?? []).find((e) => !id || e.id === id);
      if (!exit || transition || !game.sm.is('play')) return false;
      leaveBy(exit);
      return true;
    },
    retry,
    // Tests : quitter le lieu puis y revenir (vue détruite, images libérées, tout reconstruit).
    async reload() {
      const id = place.id;
      unload();
      await load(id);
      game.render();
    },
  };
}
