// Chef d'orchestre : crée les systèmes, les relie, et fait tourner la boucle.
// Aucune règle de jeu ici : la logique vit dans core/, l'affichage dans scene/ et ui/.

import './style.css';
import { config, onConfigChange, setValue, getValue } from './config.js';
import { createStateMachine } from './core/state.js';
import { createStepper } from './core/stepper.js';
import { clampToBounds } from './core/walkmask.js';
import { createWalker, setPath, stepWalker, clearTarget, faceProduct } from './core/movement.js';
import { nearestProduct, inReach, pickTapped, approachPoint, approachStep, createScan, startScan, stepScan, scanProgress } from './core/scan.js';
import { createBasket, addToBasket, removeFromBasket } from './core/cards.js';
import objectsFile from './data/objects.json';
import { createGear, takeItem, capacity, scanBlocked } from './core/gear.js';
import { createConfirm } from './ui/confirm.js';
import { createTitleScreen } from './ui/title.js';
import { createPlayerOptions } from './ui/playerOptions.js';
import { createIntro, stepIntro, lineOpacity, blackOpacity, skipLine, skipAll } from './core/intro.js';
import { createIntroUi } from './ui/intro.js';
import introFile from './data/intro.json';
import { findPath } from './core/pathfinding.js';
import { createWorld, planSwap, applySwap, swapEntry } from './core/world.js';
import { focusOwner, heroFree, inGame } from './core/focus.js';
import { assetStats, computeRasterScale, loadImages } from './scene/assets.js';
import { createPlaces } from './game/places.js';
import { createGuardWiring } from './game/guard.js';
import { quality } from './scene/quality.js';
import { createVoices } from './game/voices.js';
import { worldToStageX, worldToStageY, stageToWorldX, stageToWorldZ, scaleAt } from './scene/projection.js';
import { characterImageEntries, createCharacterSprite } from './scene/character.js';
import { createTargetMarker } from './scene/targetMarker.js';
import { actorLevel } from './scene/depth.js';
import { createDust } from './scene/dust.js';
import { createCamera, updateCamera } from './scene/camera.js';
import { createBasketUi, createFlyingCard } from './ui/cards.js';
import { createInput } from './input/input.js';
import { createHud } from './ui/hud.js';
import { createJournal } from './ui/journal.js';
import { createSettingsPanel, loadSavedSettings } from './ui/settings.js';
import { createMeasureTools } from './debug/measure.js';
import { createDepartTools, startPlaceId, departButtons } from './debug/departs.js';
import { createAudio } from './audio/audio.js';
import song from './data/music/supermarche.json';
import rayonEssai from './data/places/rayon-essai.json';
import accueilPlace from './data/places/accueil.json';
import rayon2 from './data/places/rayon-2.json';
import heroData from './data/characters/heros.json';
import catalog from './data/products.json';

// Les lieux du jeu (données). Le lieu affiché change avec loadPlace / unloadPlace (plus bas).
const PLACES = { [rayonEssai.id]: rayonEssai, [accueilPlace.id]: accueilPlace, [rayon2.id]: rayon2 };
let place = PLACES[startPlaceId(Object.keys(PLACES), accueilPlace.id)]; // la partie commence dans le hall d'accueil
const VERSION = __VERSION__;
const BASE = import.meta.env.BASE_URL;
const touch = matchMedia('(pointer: coarse)').matches;

loadSavedSettings();

const gameEl = document.getElementById('game');
const uiEl = document.getElementById('ui');
const sm = createStateMachine('loading');
// Erreurs survenues sur l'appareil (les 5 dernières), recopiées dans le rapport du diagnostic :
// utile quand un problème n'arrive que sur le vrai téléphone.
const errorLog = [];
function logError(msg) {
  errorLog.push(`${new Date().toLocaleTimeString('fr-FR')} ${msg}`.slice(0, 200));
  if (errorLog.length > 5) errorLog.shift();
}
window.addEventListener('error', (e) => logError(e.message || String(e.error)));
window.addEventListener('unhandledrejection', (e) => logError(`promesse : ${e.reason?.message ?? e.reason}`));
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
// Historique des dialogues (Pause → Dialogues), pour relire une réplique passée trop vite.
const journal = createJournal(hud.pauseCard, config.narrator.logMax, { onFirstButton: () => hud.focusResume() });

// ---------- Scanner, cartes et Panier ----------
let products = null; // produits à scanner (affichage)
let loadedImages = null;
let productState = null; // produits du lieu (état du monde, core/world.js ; lus par core/scan.js)
const world = createWorld(); // ce dont le jeu se souvient, lieu par lieu
const scan = createScan();
const basket = createBasket();
let flips = 0; // cartes retournées (bruitage ; compté pour les tests)
const basketUi = createBasketUi(uiEl, { onOpen: () => handleAction('panier'), onClose: () => handleAction('back'), onFlip: () => {
    flips++;
    audio.play('retourne');
  }, objects: objectsFile.objects, base: BASE });
basketUi.setReduceMotion(() => config.display.reduceMotion);
const flyingCard = createFlyingCard(uiEl);
const confirm = createConfirm(uiEl);
// Filtre « écran cathodique » : un calque par-dessus tout (lignes de balayage, bords sombres), sans clic.
const crt = document.createElement('div');
crt.className = 'crt';
crt.hidden = true;
uiEl.appendChild(crt);
// Accessibilité : taille du texte, luminosité et contraste (un filtre seulement s'ils ne valent pas 1).
const TEXT_SCALE = { petite: 0.85, normale: 1, grande: 1.2, 'tres-grande': 1.4 };
function applyAccess() {
  document.documentElement.style.setProperty('--ts', TEXT_SCALE[config.access.textSize] ?? 1);
  document.documentElement.style.setProperty('--narrator-alpha', config.display.narratorAlpha);
  const { brightness: b, contrast: c } = config.access;
  gameEl.style.filter = b === 1 && c === 1 ? '' : `brightness(${b}) contrast(${c})`;
}
applyAccess();

// Vibrations (option) : téléphone et manette. kind : 'leger' (prise, carte) ou 'fort' (aparté).
function vibrate(kind) {
  if (!config.access.vibration) return;
  const strong = kind === 'fort';
  try {
    navigator.vibrate?.(strong ? [40, 60, 40] : 25);
  } catch {
    /* refus du navigateur : rien */
  }
  input?.gamepad.rumble(strong ? 220 : 90, strong ? 0.6 : 0.2, strong ? 0.4 : 0.5);
}

function applyCrt() {
  crt.hidden = !config.display.crt;
  crt.style.opacity = config.display.crtStrength;
}
applyCrt();
// Écran titre (après le chargement) : Commencer, Options. Sur téléphone, Commencer passe en plein écran
// paysage (le jeu ne doit pas démarrer à la verticale).
const titleUi = createTitleScreen(uiEl, {
  departs: config.debug.devMode ? departButtons() : null, // mode dev : « Départ » sur l'écran titre
  image: `${BASE}art/placeholder/titre/titre.svg`,
  onStart: () => startGame(true),
  onOptions: () => sm.go('options'),
});
// Options du joueur (écran titre) : assorties au titre, sans réglages de développement.
const playerOptions = createPlayerOptions(uiEl, { onClose: () => handleAction('back') });
function startGame(fromPlayer) {
  if (sm.is('menu') && titleUi.visible) sm.back(); // les Options étaient ouvertes : on les ferme d'abord
  if (!sm.is('title')) return;
  titleUi.hide();
  // Intro (texte blanc sur fond noir) seulement quand le joueur touche « Commencer ».
  if (fromPlayer && config.intro.enabled) startIntro();
  else sm.go('play');
  // Ensuite seulement : plein écran (et paysage sur téléphone), si l'option est active.
  if (fromPlayer && wantsFullscreen()) {
    try {
      enterLandscape();
    } catch (err) {
      logError(`plein écran : ${err.message}`);
    }
  }
}
// ---------- Intro ----------
const introLines = introFile.lines.map((l) => ({ ...l, text: l.text.replace(/^\[TEMP\]\s*/, '').replace(/ ([?!:;»])/g, '\u00a0$1') }));
let introRun = null;
const introUi = createIntroUi(uiEl, {
  onNext: () => introRun && skipLine(introRun),
  onSkip: () => introRun && skipAll(introRun),
});
function startIntro() {
  introRun = createIntro(introLines);
  introUi.show();
  audio.setFrozen(true); // pas de musique de magasin pendant l'intro
  sm.go('intro');
}
// À chaque image, pendant l'intro puis pendant le fondu final (le jeu est déjà lancé derrière).
function updateIntro(dt) {
  if (!introRun) return;
  const started = stepIntro(introRun, dt, config.intro);
  if (started >= 0 && introLines[started].sound) audio.play(introLines[started].sound);
  const line = introRun.phase === 'line' ? introLines[introRun.i] : null;
  introUi.set(line, introRun.phase === 'line' ? introRun.i : -1, lineOpacity(introRun, config.intro), blackOpacity(introRun, config.intro));
  if (introRun.phase === 'end' && sm.is('intro')) {
    audio.stopRain();
    audio.setFrozen(false);
    sm.go('play'); // la partie commence derrière le noir qui s'efface
  }
  if (introRun.done) {
    introUi.hide();
    introRun = null;
  }
}

const tip = { x: 0, y: 0 }; // bout de la Scanette sur la scène
const cardFrom = { x: 0, y: 0 };
const cardTo = { x: 0, y: 0 };
let highlighted = -1;
let pendingScan = -1; // double toucher : produit (ou objet à prendre) visé, à l'arrivée du personnage
let pendingList = null; // productState ou pickupState
// Ce que le héros porte (A5a) : Scanette et panier, pris au présentoir de l'accueil (core/gear.js).
const gear = createGear();
let pickupState = null; // objets à prendre, visés comme les produits posés ailleurs
let pickupReach = -1;
const BLOCKED_LINE = { sans_scanette: 'sans_scanette', sans_panier: 'sans_panier', plein: 'panier_plein' };

// Action (Entrée, Espace, A, bouton) : prendre ce qui est à portée au présentoir, sinon scanner.
function tryScan() {
  if (!sm.is('play') || scan.active) return;
  const k = nearestProduct(pickupState, walker, config.scan);
  if (k >= 0) {
    takePickup(k);
    return;
  }
  const i = nearestProduct(productState, walker, config.scan);
  if (i < 0) say('rien_a_scanner') || say('aparte_vide'); // le haut-parleur d'abord, sinon le héros
  else tryScanProduct(i);
}

// Scanner seulement avec une Scanette et de la place dans le panier (sinon, le haut-parleur explique).
function tryScanProduct(i) {
  pendingScan = -1;
  const why = scanBlocked(gear, basket.cards.length, config.carry);
  if (why === 'plein') chooseCardToDrop(i);
  else if (why) say(BLOCKED_LINE[why]);
  else scanProduct(i);
}

// Panier plein (choix B de l'auteur) : on repose une carte pour faire de la place, puis on scanne ;
// ou on annule. [TEMP] La carte reposée est abandonnée.
// D'abord une fenêtre « Échanger une carte ? Oui / Non » ; oui : on choisit la carte à reposer.
// Le produit de la carte reposée prend la place du produit qu'on vient de scanner (échange).
let dropFor = -1;
let panierMode = 'consult'; // 'consult' : on regarde ; 'confirm' : la question ; 'choose' : choisir la carte
let pendingSwap = null; // { from: produit reposé, to: produit scanné }
function chooseCardToDrop(i) {
  dropFor = i;
  panierMode = 'confirm';
  sm.go('panier');
  vibrate('leger');
  confirm.ask(`Ton panier est plein. Échanger une carte contre ce produit ?`, (yes) => {
    if (!yes) {
      panierMode = 'consult';
      sm.go('play');
      say('panier_plein'); // la question d'abord ; le haut-parleur ne commente qu'un refus
      return;
    }
    panierMode = 'choose';
    basketUi.open((uid) => {
      const dropped = removeFromBasket(basket, uid);
      basketUi.remove(uid);
      basketUi.setCount(basket.cards.length);
      const target = dropFor;
      dropFor = -1;
      const swap = planSwap(dropped, place.id, target); // règle : core/world.js
      if (swap?.product) swap.spare = products.reserve(swapEntry(productState, target, swap.product, catalog.products[swap.product])); // image décodée d'avance
      if (swap) pendingSwap = swap;
      panierMode = 'consult';
      sm.go('play');
      scanProduct(target);
    });
  });
}

// Prendre une Scanette ou un panier au présentoir.
function takePickup(k) {
  pendingScan = -1;
  const it = pickupState[k];
  faceProduct(walker, it.x, it.z, config.scan.awayDepth);
  if (!takeItem(gear, pickupState, k)) return;
  sprite.setHeld(it.id, true);
  if (it.id === 'panier') basketUi.setCapacity(capacity(gear, config.carry));
  basketUi.addObject(it.id);
  audio.play('prise');
  vibrate('leger');
  say(`prise_${it.id}`);
  marker.hide();
  hud.playerMoved();
}

// ---------- Voix (src/game/voices.js) : haut-parleur, pensées, apartés, rencontre, tournis ----------
let endOfAisleX = Infinity;
let speakerWaves = null; // ondes sous le haut-parleur qui parle (propres au lieu affiché)
let storeTime = 0; // temps du magasin (figé pendant un aparté)
const HEAD_HEIGHT = 330; // hauteur de la tête du héros au-dessus de ses pieds (px du dessin)
const voices = createVoices(uiEl, {
  sm,
  audio,
  hud,
  shown,
  heroScale: heroData.scale,
  headHeight: HEAD_HEIGHT,
  vibrate: (kind) => vibrate(kind),
  place: () => place,
  stage: () => stage,
  proj: () => proj,
  walker: () => walker,
  camera: () => camera,
  speakerWaves: () => speakerWaves,
  heroBusy: () => scan.active || pendingScan >= 0,
  hasScanette: () => gear.scanette,
  aisleEndX: () => endOfAisleX,
  walkTo: (pt) => walkTo(pt),
  hideMarker: () => marker.hide(),
  guardHead: () => guard.head(),
});
const say = voices.say;
// Agent de sécurité du hall (src/game/guard.js) : il barre les portiques de sortie.
const guardHeadPt = { x: 0, y: 0 };
const guard = createGuardWiring({
  ui: uiEl,
  heroHead() {
    stage.stageToClient(shown.x, shown.y - HEAD_HEIGHT * shown.scale * heroData.scale, guardHeadPt);
    return guardHeadPt;
  },
  // L'agent interpelle le héros : il s'arrête, le temps de la bulle.
  onWarn() {
    clearTarget(walker);
    say('agent_sortie');
  },
  talking: () => voices.narrator.line !== null && voices.narrator.voice === 'agent',
  // Ensuite, il force : « Stop ! », et le héros fait demi-tour de quelques pas.
  onStop() {
    clearTarget(walker);
    say('agent_stop');
  },
  back: (dx) => setPath(walker, [[walker.x + dx, walker.z]]),
});
const heroAside = voices.heroAside;

function scanProduct(i) {
  pendingScan = -1;
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
  for (const pl of Object.values(PLACES)) {
    for (const it of pl.shelfProducts?.items ?? []) add(it.product, 1);
    for (const it of pl.looseProducts?.items ?? []) add(it.product, it.scale ?? 1);
  }
  return m;
}

// Prendre tout ce qui est au présentoir (Scanette, panier), sans marcher : tests et points de départ.
function equipAll() {
  for (const id of Object.keys(gear)) {
    gear[id] = true;
    sprite.setHeld(id, true);
    basketUi.addObject(id);
  }
  markTaken();
  basketUi.setCapacity(capacity(gear, config.carry));
}

// Ce que le héros porte déjà n'est plus à prendre au présentoir du lieu affiché.
function markTaken() {
  for (const it of pickupState) if (gear[it.id]) it.scanned = true;
}

// Donner une carte sans scanner (points de départ pour tester) : le produit quitte l'étagère, sans effet.
function giveCard(i) {
  const it = productState[i];
  it.scanned = true;
  products.remove(i);
  basketUi.add(addToBasket(basket, it.id, it.def, i, place.id), imageUrlOf(it.def));
}

function imageUrlOf(def) {
  return loadedImages.get(def.image).url;
}

// Événements du scan, émis par core/scan.js au fil du temps de jeu.
function onScanEvent(ev) {
  if (!ev) return;
  if (ev === 'bip' || ev === 'aspire') audio.play(ev);
  else if (ev === 'carte') {
    const it = productState[scan.index];
    it.scanned = true;
    products.remove(scan.index);
    // Échange : le produit reposé apparaît à la place de celui qu'on vient de scanner (core/world.js).
    const moved = applySwap(pendingSwap, productState, scan.index, catalog);
    if (moved >= 0) {
      if (pendingSwap.spare >= 0) products.adopt(moved, pendingSwap.spare); // produit venu d'un autre lieu
      pendingSwap = null;
      products.sync(moved);
    }
    const card = addToBasket(basket, it.id, it.def, scan.index, place.id);
    const url = imageUrlOf(it.def);
    basketUi.add(card, url);
    flyingCard.show(card, url);
    say(basket.cards.length === 1 ? 'premier_scan' : 'scan');
    if (basket.cards.length === 1) say('rencontre'); // la première rencontre attend que le héros soit libre
    vibrate('leger');
    // Points de départ et d'arrivée de la carte, calculés une fois.
    stage.stageToClient(shown.x, shown.y - HEAD_HEIGHT * shown.scale * heroData.scale, cardFrom);
    const r = basketUi.button.getBoundingClientRect();
    cardTo.x = r.left + r.width / 2;
    cardTo.y = r.top + r.height / 2;
    audio.play('carte');
  } else if (ev === 'fin') {
    flyingCard.hide();
    basketUi.setCount(basket.cards.length);
  }
}

// Bout de la Scanette (dans l'image du personnage) → scène.
function updateTip() {
  const s = shown.scale * heroData.scale;
  const [tx, ty] = heroData.scanTip[walker.away ? 'dos' : 'face'];
  tip.x = shown.x + walker.facing * (tx - heroData.anchor[0]) * s;
  tip.y = shown.y + (ty - heroData.anchor[1] + config.character.footSink) * s;
}
// ---------- Outils de mesure et points de départ (src/debug/) ----------
const measure = createMeasureTools(uiEl, {
  version: VERSION,
  sm,
  stepper,
  hud,
  camera: () => camera,
  errors: errorLog,
  place: () => place,
  stage: () => stage,
  walker: () => walker,
  mask: () => mask,
  sprite: () => sprite,
  marker: () => marker,
  render: () => render(),
  resetCamera() {
    camera.ready = false;
    lastCamTime = -1;
  },
  renderLine: () => renderLine,
  placeNote: () => `${place.id}${places.lastTransitionMs() ? ` (dernier changement de lieu : ${places.lastTransitionMs()} ms dans le noir)` : ''}`,
  audioInfo() {
    const c = audio.counters();
    const top = Object.entries(c.byName).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([n, k]) => `${n} ${k}`).join(', ');
    const states = c.states.length ? ` · changements d'état : ${c.states.join(', ')}` : '';
    return `${audio.describe()} · sons joués ${c.played} · notes ${c.notes} · nœuds actifs : effets ${c.sfx}, musique ${c.music} · les plus joués : ${top || 'aucun'} · derniers sons : ${c.recent.join(', ') || 'aucun'} · horloge du son ${c.clock} s · musique : ${c.song} · sons courts préparés ${c.prepared ? 'oui' : 'non'} · sons coupés (famille pleine) ${c.cut} · reprises au geste ${c.resumed}${states}`;
  },
  gamepad: () => input?.gamepad.connected ?? false,
});
const diag = measure.diag;
const departs = createDepartTools({
  sm,
  equipAll: () => equipAll(),
  markSaid: (t) => voices.markSaid(t),
  skipArrival: () => voices.skipArrival(),
  products: () => productState,
  capacity: () => capacity(gear, config.carry),
  giveCard,
  refreshCount() {
    if (basket.cards.length) basketUi.setCount(basket.cards.length);
  },
});
const settings = createSettingsPanel(uiEl, { onClose: () => handleAction('back'), extras: { Diagnostic: measure.launcher, Départ: departs.el } });

// Qui a la main ? (core/focus.js) : une seule règle de priorité pour toutes les commandes.
function owner() {
  return focusOwner(sm.get(), {
    confirm: confirm.open,
    card: basketUi.detailOpen,
    name: voices.namePicker.visible,
    choice: voices.waitingAnswer(),
    scene: heroAside(),
  });
}

function handleAction(action) {
  voices.acted();
  const who = owner();
  const dir = action === 'up' || action === 'left' ? -1 : 1;
  switch (action) {
    case 'back':
      if (who === 'intro') skipAll(introRun);
      else if (who === 'bench') measure.cancel();
      else if (who === 'menu') sm.back();
      else if (who === 'options') sm.go('title');
      else if (who === 'confirm') confirm.no();
      else if (who === 'card') basketUi.closeDetail(); // d'abord la grande carte
      else if (who === 'panier' || who === 'pause') sm.go('play');
      else if (inGame(who)) sm.go('pause');
      break;
    case 'pause':
      if (who === 'bench') measure.cancel();
      else if (who === 'pause') sm.go('play');
      else if (inGame(who)) sm.go('pause');
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
    case 'landscape':
      enterLandscape();
      break;
    case 'up':
    case 'down':
      if (who === 'options') playerOptions.move(dir);
      else if (who === 'pause') journal.move(dir);
      else if (who === 'name') voices.namePicker.move(dir);
      else if (who === 'panier') basketUi.move(dir);
      break;
    case 'action':
      if (who === 'intro') skipLine(introRun);
      else if (who === 'pause') {
        // Manette (A) : le bouton mis en avant de l'écran Pause (Reprendre ou Dialogues).
        const el = document.activeElement;
        if (el?.tagName === 'BUTTON' && hud.pauseCard.contains(el)) el.click();
      } else if (who === 'options') playerOptions.press();
      else if (who === 'title') titleUi.press();
      else if (who === 'confirm') confirm.yes(); // manette : A = oui
      else if (who === 'card' || who === 'panier') basketUi.press(); // la carte mise en avant (ou retourner la grande)
      else if (who === 'name') voices.namePicker.press();
      else if (who === 'choice') voices.answerFocused();
      else if (who === 'scene') voices.skip();
      else if (who === 'play') tryScan();
      else if (who === 'erreur') places.retry(); // manette (A), Entrée : « Réessayer »
      break;
    case 'choice1':
    case 'choice2':
      if (who === 'choice') voices.answer(action === 'choice1' ? 0 : 1);
      break;
    case 'left':
    case 'right':
      if (who === 'options') playerOptions.adjust(dir);
      else if (who === 'title') titleUi.move(dir);
      else if (who === 'confirm') confirm.focus(action === 'right');
      else if (who === 'card' || who === 'panier') basketUi.switchTab();
      else if (who === 'name') voices.namePicker.move(dir);
      else if (who === 'choice') {
        voices.focusChoice(action === 'left' ? 0 : 1);
      }
      break;
    case 'panier':
      if (sm.is('panier')) sm.go('play');
      // Pas de Panier pendant un aparté ou une conversation (rien ne les interrompt).
      else if (heroFree(who) && !scan.active && gear.panier) sm.go('panier');
      break;
  }
}

// Plein écran et paysage (téléphone) : seulement après un geste du joueur ; le verrouillage de
// l'orientation n'est possible qu'en plein écran (Chrome Android) ; refus ignorés sans bruit.
function enterLandscape() {
  const lock = () => {
    if (touch) screen.orientation?.lock?.('landscape')?.catch?.(() => {});
  };
  if (document.fullscreenElement) lock();
  else {
    const p = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    p?.then?.(lock)?.catch?.((err) => logError(`plein écran refusé : ${err?.message ?? err}`));
  }
}

// Option « Plein écran » : automatique (téléphone oui, PC non), oui ou non.
function wantsFullscreen() {
  const m = config.display.fullscreenMode;
  return m === 'oui' || (m === 'auto' && touch);
}

function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.()?.catch?.(() => {});
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
  // Hors du jeu (Panier, menus), le héros ne prend pas la parole : un moment important attend le retour.
  if (now !== 'play') voices.leftGame();
  if (now === 'pause') journal.prepare(voices.narrator.log);
  hud.setPaused(now === 'pause');
  audio.setState(now);
  if (now === 'menu') settings.open();
  if (before === 'menu') settings.close();
  if (now === 'title') titleUi.show();
  if (now === 'options') playerOptions.open();
  if (before === 'options') playerOptions.close();
  if (now === 'panier' && panierMode === 'consult') {
    basketUi.open();
    say('panier');
  }
  if (before === 'panier') {
    if (confirm.open) confirm.no(); // Échap pendant la question : non
    panierMode = 'consult';
  }
  if (now === 'play' && before === 'pause') say('reprise');
  if (now === 'play' && before === 'panier') say('aparte_panier');
  if (now === 'bench') voices.reset(); // les mesures se font sans voix ni mise en scène
  if (before === 'panier') basketUi.close();
  if (before === 'play') input?.clear(); // pas de touche « collée » à la reprise
  if (now === 'play' || now === 'bench') stepper.reset();
});

// Un point de l'écran touché ou cliqué → un point du sol à atteindre (fonction de core/).
function onTarget(cx, cy) {
  dragPending = false;
  if (!sm.is('play')) return;
  voices.acted();
  if (scan.active) return; // pendant une action (scan), le héros ne se déplace pas
  if (guard.holding()) return; // l'agent de sécurité parle (ou le héros fait demi-tour) : il ne bouge pas
  if (heroAside()) {
    voices.skip(); // toucher : la réplique passe
    return;
  }
  pendingScan = -1;
  stage.clientToStage(cx, cy, tmpStage);
  tmpWorld.x = stageToWorldX(proj, tmpStage.x);
  tmpWorld.z = stageToWorldZ(proj, tmpStage.y);
  walkTo(tmpWorld);
}

// Doigt qui glisse en restant appuyé : on retient seulement le dernier point ; le chemin est calculé
// au plus une fois par image (dans la boucle), et non à chaque mouvement du doigt.
let pathCount = 0; // chemins calculés (pour les tests)
let dragPending = false;
let dragX = 0;
let dragY = 0;
function onDrag(cx, cy) {
  dragPending = true;
  dragX = cx;
  dragY = cy;
}

function walkTo(target) {
  clampToBounds(mask, target);
  // Chemin qui contourne les objets si la ligne droite est bloquée.
  pathCount++;
  const path = findPath(mask, walker.x, walker.z, target.x, target.z);
  setPath(walker, path);
  const [gx, gz] = path[path.length - 1];
  marker.showAt(worldToStageX(proj, gx), worldToStageY(proj, gz));
}

// Double toucher (ou double clic) sur un produit : le personnage va se placer et le scanne à
// l'arrivée (logique dans core/scan.js). Ailleurs : rien de plus que « aller là ».
function onDoubleTap(cx, cy) {
  if (!sm.is('play') || scan.active || heroAside() || guard.holding()) return;
  stage.clientToStage(cx, cy, tmpStage);
  const wx = stageToWorldX(proj, tmpStage.x);
  const margin = config.input.doubleTapMargin;
  // D'abord le présentoir de l'accueil (si l'on touche une Scanette ou un panier pas encore pris).
  let list = pickupState;
  let i = pickTapped(pickupState, tmpStage.x, tmpStage.y, wx, margin, config.scan);
  if (i < 0) {
    list = productState;
    i = pickTapped(productState, tmpStage.x, tmpStage.y, wx, margin, config.scan);
  }
  if (i < 0) return;
  if (inReach(list, i, walker, config.scan)) {
    arrive(list, i);
    return;
  }
  walkTo(approachPoint(list[i], walker, config.scan, tmpWorld));
  pendingScan = i;
  pendingList = list;
}

// Pendant l'approche d'un double toucher : scanner à l'arrivée, annuler si le joueur reprend la main.
function stepPendingScan() {
  if (pendingScan < 0) return;
  const r = approachStep(pendingList, pendingScan, walker, intent.moveX !== 0 || intent.moveZ !== 0, config.scan);
  if (r === 'scan') arrive(pendingList, pendingScan);
  else if (r === 'cancel') pendingScan = -1;
}

// Arrivé devant ce qu'on visait : le prendre (présentoir) ou le scanner (produit).
function arrive(list, i) {
  if (list === pickupState) takePickup(i);
  else tryScanProduct(i);
}

function layout() {
  if (!stage) return;
  stage.layout(config.camera.zoom);
  const v = stage.view;
  renderLine = `zoom ${config.camera.zoom} · scène ×${v.scale.toFixed(3)} · visible ${Math.round(v.viewW)}×${Math.round(v.viewH)} · images ×${assetStats.rasterScale.toFixed(2)} (densité ${window.devicePixelRatio} plafonnée à ${quality().pixelRatio}) · profil ${config.display.profile}`;
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
  const emotion = voices.emotion(walker.moving);
  sprite.render(shown.x, shown.y, shown.scale, walker.facing, walker.away, walker.moving, time, walker.distance, scan.active, emotion);
  sprite.setLevel(shown.level);
  guard.render(a);
  dust.update(time);
  // Scanner : produit à portée mis en évidence, effets du scan, carte qui file dans le Panier.
  // Au présentoir, ce qu'on peut prendre passe avant les produits.
  const free = sm.is('play') && !scan.active && !heroAside(); // pendant une conversation : ni repère ni bouton « Scanner »
  const pk = free ? nearestProduct(pickupState, walker, config.scan) : -1;
  const reach = free && pk < 0 ? nearestProduct(productState, walker, config.scan) : -1;
  const asideP = voices.asideP;
  if (asideP === 0) storeTime = time; // pendant un aparté, le temps du magasin est figé
  if (pk >= 0) products.markAt(1000 + pk, pickupState[pk].x, pickupState[pk].y - pickupState[pk].h, storeTime);
  else products.setMarker(reach, storeTime);
  if (reach !== highlighted || pk !== pickupReach) {
    hud.setAction(pk >= 0 ? 'prendre' : reach >= 0 ? 'scanner' : '');
    highlighted = reach;
    pickupReach = pk;
  }
  updateTip();
  const progress = scanProgress(scan, config.scan);
  products.update(scan, progress, tip);
  if (scan.phase === 'card') flyingCard.update(progress, cardFrom, cardTo, config.display.reduceMotion);
  // La caméra suit le milieu du corps du personnage.
  const v = stage.view;
  const camDt = lastCamTime < 0 ? 0 : Math.min(0.1, time - lastCamTime);
  lastCamTime = time;
  const fixedX = measure.fixedCameraX(v.viewW);
  if (fixedX !== null) {
    // Test rapide : caméra fixe, centrée sur l'aller-retour.
    camera.x = fixedX;
    camera.y = 0;
    camera.ready = true;
  } else if (voices.inScene() && asideP === 0) {
    // Conversation, avant la mise en scène : la caméra ne bouge plus, le héros s'avance au milieu de l'image.
  } else if (asideP > 0) {
    // Aparté : la caméra se centre sur le héros (le zoom resserre l'image autour de lui).
    const k = 1 - Math.exp(-12 * camDt);
    const gx = Math.min(Math.max(0, place.size[0] - v.viewW), Math.max(0, shown.x - v.viewW / 2));
    const gy = Math.min(Math.max(0, place.size[1] - v.viewH), Math.max(0, shown.y - 170 * shown.scale - v.viewH * 0.5));
    camera.x += (gx - camera.x) * k;
    camera.y += (gy - camera.y) * k;
  } else if (!measure.cameraFrozen()) updateCamera(camera, config.camera, shown.x, shown.y - 140 * shown.scale, walker.facing, v.viewW, v.viewH, place.size[0], place.size[1], camDt);
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
  if (places.busy) {
    places.update(Math.min(dt / 1000, 0.1)); // changement de lieu : seul le fondu avance, rien ne bouge
    return;
  }
  if (!places.ready) return;
  const playing = sm.is('play');
  if (playing) {
    if (dragPending) onTarget(dragX, dragY);
    const n = stepper.advance(dt / 1000);
    for (let i = 0; i < n; i++) {
      input.read(intent);
      if (scan.active || heroAside()) {
        // Pendant un scan ou un aparté, le personnage ne bouge pas (ni au clavier, ni vers un point touché),
        // sauf la marche d'une conversation (il s'avance tout seul).
        intent.moveX = 0;
        intent.moveZ = 0;
        if (!voices.walking()) clearTarget(walker);
      }
      if (guard.holding()) {
        // L'agent parle, ou repousse le héros : les commandes attendent.
        intent.moveX = 0;
        intent.moveZ = 0;
      }
      stepWalker(walker, intent, mask, config.walk, stepper.step);
      guard.step(walker, intent, stepper.step);
      stepPendingScan();
      onScanEvent(stepScan(scan, stepper.step, config.scan));
    }
    if (walker.moving) hud.playerMoved();
    places.watchExits();
    const sec = Math.min(dt / 1000, 0.1);
    updateIntro(sec); // fondu final de l'intro, s'il est en cours
    voices.watch(sec);
    voices.update(sec);
    voices.updateAside(sec);
    render();
    voices.updateStars();
  } else if (sm.is('intro')) {
    updateIntro(Math.min(dt / 1000, 0.1));
  } else if (sm.is('panier')) {
    voices.update(Math.min(dt / 1000, 0.1));
  } else if (sm.is('bench')) {
    measure.frame(dt, t0); // banc d'essai ou test rapide : le parcours remplace les commandes du joueur
  }
  // Sous un menu ou en pause, la scène n'est pas redessinée.
  diag.frame(dt, performance.now() - t0, playing);
}

// ---------- Lieux (src/game/places.js) : charger, afficher, quitter, changer de lieu ----------
const places = createPlaces(uiEl, gameEl, {
  places: PLACES,
  base: BASE,
  sm,
  world,
  catalog,
  getValue,
  commonImages: () => loadedImages,
  actors: () => [marker, dust, sprite],
  walker: () => walker,
  // On ne quitte un lieu que héros libre : ni scan, ni aparté, ni approche en cours.
  canLeave: () => !scan.active && !heroAside() && pendingScan < 0,
  // Un lieu vient d'être construit : le jeu s'y branche.
  onLoaded({ place: pl, proj: pr, mask: mk, here, view }) {
    place = pl;
    proj = pr;
    mask = mk;
    endOfAisleX = place.aisleEndX ?? Infinity; // le narrateur remarque le bout du rayon (donnée du lieu)
    productState = here.products;
    pickupState = here.pickups;
    markTaken();
    guard.attach(place, view, proj);
    ({ stage, props, depthRefs, products, speakerWaves, debugMask } = view);
    highlighted = -2; // le bouton d'action est recalculé
    pickupReach = -2;
    pendingScan = -1;
    camera.ready = false;
    lastCamTime = -1;
    layout();
  },
  onLeaving() {
    marker.hide();
    stage = null;
  },
  // Le héros vient d'être posé dans le nouveau lieu (une annonce en cours change de haut-parleur).
  onArrived: () => voices.arrivedInPlace(),
  logError,
  onLoadFailed: () => say('lieu_inaccessible'),
  render: () => render(),
});

async function start() {
  const nearestZ = Math.min(...place.walkMask.area.map((pt) => pt[1]));
  const frontScale = Math.max(1, 1 - nearestZ * (place.projection.scalePerDepth ?? 0) * config.scene.depthScale);
  const rasterScale = computeRasterScale(place.size[1], config.camera.zoom, quality().pixelRatio);
  // Images communes à tous les lieux.
  loadedImages = await loadImages([
    // Le personnage est un peu plus grand tout devant : on prépare ses images à sa taille maximale.
    ...characterImageEntries(heroData, rasterScale * frontScale).map((e) => ({ ...e, url: BASE + e.url })),
    { id: BASE + DUST_IMAGE, url: BASE + DUST_IMAGE, w: DUST_SIZE[0], h: DUST_SIZE[1], scale: rasterScale * heroData.scale * config.character.dustSize },
    // Produits à scanner (préparés à leur plus grande taille d'affichage).
    ...[...productScales()].map(([id, k]) => {
      const def = catalog.products[id];
      return { id: def.image, url: BASE + def.image, w: def.size[0], h: def.size[1], scale: rasterScale * k };
    }),
  ]);
  walker = createWalker(place.spawn[0], place.spawn[1]);
  marker = createTargetMarker(places.backstage);
  dust = createDust(places.backstage, loadedImages.get(BASE + DUST_IMAGE), DUST_ANCHOR, config.character, config.display);
  sprite = createCharacterSprite(heroData, loadedImages, places.backstage, config.character, config.display, onFrameEvent);
  await places.load(place.id);
  input = createInput({ surface: gameEl, ui: uiEl, settings: config.input, onAction: handleAction, onTarget, onDoubleTap, onDrag });

  onConfigChange((key, value) => {
    if (key === 'camera.zoom') layout();
    if (key === 'debug.showWalkMask') debugMask?.setVisible(value);
    if (key === 'loop.stepHz') stepper.setRate(value);
    if (key === 'display.foregroundOpacity' || key === 'display.hallForegroundOpacity') stage?.applyOpacity();
    if (key === 'display.fullscreenMode') {
      // Le choix se fait d'un geste (dans le panneau) : on peut entrer en plein écran tout de suite.
      if (value === 'oui') enterLandscape();
      else if (value === 'non') exitFullscreen();
    }
    if (key === 'display.crt' || key === 'display.crtStrength') applyCrt();
    if (key.startsWith('access.') || key === 'display.narratorAlpha') applyAccess();
    if (key === 'narrator.screenFx' || key === 'display.reduceMotion') voices.applyScreenFx();
    if (key === 'display.reduceMotion') stage?.el.classList.toggle('still', value);
    if (key === 'display.hallRain') stage?.el.classList.toggle('no-rain', !quality().rain);
    if (key.startsWith('player.')) voices.applyPlayerName();
    if (key === 'display.propLayers') stage?.el.classList.toggle('props-layered', value);
    if (key.startsWith('audio.')) audio.applyVolumes();
    if (key === 'audio.muted') hud.setMuted(value);
    if (key === 'carry.panier') basketUi.setCapacity(capacity(gear, config.carry));
    if (key === 'narrator.enabled' && !value) voices.silence();
    if (key === 'narrator.asides' && !value) voices.silence(true);
  });
  window.addEventListener('resize', layout);
  window.visualViewport?.addEventListener('resize', layout);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sm.is('play')) sm.go('pause');
    if (document.hidden) measure.interrupted();
    audio.setHidden(document.hidden);
  });
  // Le son ne peut démarrer qu'après un premier geste du joueur.
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  layout();
  render();
  hud.ready();
  sm.go('title');
  const depart = departs.requested();
  if (depart) {
    titleUi.hide();
    departs.apply(depart);
  }
  requestAnimationFrame(frame);

  // Accès en lecture pour les tests automatiques et le débogage.
  window.paperCart = {
    version: VERSION,
    state: () => sm.get(),
    guard: () => guard.info(),
    hero: () => ({ x: walker.x, z: walker.z, facing: walker.facing, away: walker.away, hasTarget: walker.hasTarget }),
    // Scanner : produit à portée, scan en cours, cartes du Panier.
    scanState: () => ({ reach: highlighted, pickup: pickupReach, active: scan.active, phase: scan.phase, cards: basket.cards.map((c) => c.name), gear: { ...gear } }),
    // Tests automatiques : le héros prend tout au présentoir (Scanette et panier), sans s'y rendre.
    // Tests : un moment « once » considéré comme déjà dit (ex. la première rencontre, pour les tests du scanner).
    markSaid: (trigger) => voices.markSaid(trigger),
    flips: () => flips,
    place: () => place.id,
    useExit: (id) => places.useExit(id),
    lastTransitionMs: () => places.lastTransitionMs(),
    paths: () => pathCount,
    reloadPlace: () => places.reload(),
    journal: () => voices.narrator.log.map((e) => `${e.voice}: ${e.text}`),
    equip: () => equipAll(),
    // Tests automatiques : quitter l'écran titre comme si l'on touchait « Commencer » (sans plein écran).
    startGame: () => startGame(false),
    narrator: () => voices.info(),
    products: () => productState.map((it) => ({ id: it.id, x: it.x, scanned: it.scanned })),
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
      measure.startBench(passes, warmup);
    },
    benchReport: () => measure.benchReport(),
    startQuick(warmup = 1, block = 2, settle = 0.5, rounds = 1, suite = 'T012') {
      if (sm.is('play')) sm.go('menu');
      measure.startQuick({ warmup, block, settle, rounds }, suite);
    },
    quickReport: () => measure.quickReport(),
    errors: () => [...errorLog],
    audio: () => audio.counters(),
    assets: () => ({ images: assetStats.images, pixels: assetStats.pixels, timings: assetStats.perImage.length }),
    audioStarted: () => audio.started,
    // Tests automatiques : changer un réglage, exactement comme dans le panneau (il est donc enregistré).
    set: (key, value) => setValue(key, value),
  };
}

start().catch((err) => {
  console.error(err);
  hud.showError(`Le jeu n'a pas pu démarrer : ${err.message}`);
});
