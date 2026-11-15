// Chef d'orchestre : crée les systèmes, les relie, et fait tourner la boucle.
// Aucune règle de jeu ici : la logique vit dans core/, l'affichage dans scene/ et ui/.

import './style.css';
import { config, onConfigChange, setValue, getValue, overrides } from './config.js';
import { createStateMachine } from './core/state.js';
import { createStepper } from './core/stepper.js';
import { compileMask, clampToBounds } from './core/walkmask.js';
import { createWalker, setPath, stepWalker, clearTarget, faceProduct, faceScreen } from './core/movement.js';
import { nearestProduct, inReach, pickTapped, approachPoint, approachStep, createScan, startScan, stepScan, scanProgress } from './core/scan.js';
import { createBasket, addToBasket, removeFromBasket } from './core/cards.js';
import objectsFile from './data/objects.json';
import { createGear, takeItem, capacity, scanBlocked } from './core/gear.js';
import { createNarrator, narrate, stepNarrator, skipNarrator, silenceNarrator, stepIdle, nearestSpeaker, waitingAnswer, waitingTap, answer, inScene, endLine, approach, waitingName, answerName } from './core/narrator.js';
import { createSpeakerWaves } from './scene/speakers.js';
import { createNarratorUi } from './ui/narrator.js';
import { createAsideFx } from './ui/aside.js';
import { createConfirm } from './ui/confirm.js';
import { createTitleScreen } from './ui/title.js';
import { createPlayerOptions } from './ui/playerOptions.js';
import { createIntro, stepIntro, lineOpacity, blackOpacity, skipLine, skipAll } from './core/intro.js';
import { createIntroUi } from './ui/intro.js';
import introFile from './data/intro.json';
import narratorFile from './data/narrator.json';
import playerFile from './data/joueur.json';
import { playerName, fillName, OTHER, MAX_NAME } from './core/names.js';
import { createNamePicker } from './ui/namePicker.js';
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
import { createJournal } from './ui/journal.js';
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
let productState = null; // produits à scanner (logique, voir core/scan.js)
const scan = createScan();
const basket = createBasket();
const basketUi = createBasketUi(uiEl, { onOpen: () => handleAction('panier'), onClose: () => handleAction('back'), objects: objectsFile.objects, base: BASE });
const flyingCard = createFlyingCard(uiEl);
const confirm = createConfirm(uiEl);
// Filtre « écran cathodique » : un calque par-dessus tout (lignes de balayage, bords sombres), sans clic.
const crt = document.createElement('div');
crt.className = 'crt';
crt.hidden = true;
uiEl.appendChild(crt);
// Accessibilité : taille du texte, luminosité et contraste (un filtre seulement s'ils ne valent pas 1).
const TEXT_SCALE = { petite: 0.85, normale: 1, grande: 1.2, 'tres-grande': 1.4 };
// Effet des mots du joueur (l'écran qui parle) ; « réduire les animations » : aucun.
function applyScreenFx() {
  narratorUi.setScreenFx(config.display.reduceMotion ? 'aucun' : config.narrator.screenFx);
}

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
      if (dropped && dropped.slot >= 0) pendingSwap = { from: dropped.slot, to: target };
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

// ---------- Voix : haut-parleur et apartés du héros ----------
// Logique dans core/narrator.js, répliques dans data/narrator.json. Les [TEMP] s'affichent sans préfixe,
// avec des espaces insécables à la française (jamais un « ? » seul en début de ligne).
const frenchSpaces = (t) => t.replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
// Le nom du joueur (« mon Épaisseur », ou celui choisi dans les options) remplace ses repères.
let who = playerName(playerFile.names, config.player.name, config.player.customName);
const clean = (t) => frenchSpaces(fillName((t ?? '').replace(/^\[TEMP\]\s*/, ''), who));
const cleanLine = (l) => ({
  ...l,
  text: clean(l.text),
  choices: l.choices?.map((c) => ({ ...c, text: clean(c.text), reply: clean(c.reply) })),
  steps: l.steps?.map(cleanLine), // conversation : chaque réplique
});
const narratorData = { triggers: narratorFile.triggers, lines: narratorFile.lines.map(cleanLine) };
// Nom changé dans les options : les répliques sont refaites (les prochaines l'emploient).
function applyPlayerName() {
  who = playerName(playerFile.names, config.player.name, config.player.customName);
  narratorData.lines = narratorFile.lines.map(cleanLine);
}
const narrator = createNarrator();
const narratorUi = createNarratorUi(uiEl, { onSkip: () => skipNarrator(narrator, narratorData, config.narrator), onChoose: (k) => answer(narrator, k, config.narrator) });
applyScreenFx();
// Pendant la rencontre, le héros propose au joueur de choisir son nom (changeable ensuite dans les options).
const namePicker = createNamePicker(uiEl, {
  names: playerFile.names,
  other: OTHER,
  maxLength: MAX_NAME,
  onPick(id, custom, label) {
    if (id === OTHER) setValue('player.customName', custom);
    setValue('player.name', id); // enregistré, et les répliques sont refaites avec ce nom
    namePicker.hide();
    answerName(narrator, narratorData, label, config.narrator);
  },
});
let choiceFocus = 0; // réponse mise en avant (clavier, manette)
let arrived = false;
let endOfAisleX = Infinity;
const CONSIGNE_X = 900; // s'éloigner de l'accueil sans Scanette : le haut-parleur le rappelle
let voiceLine = null; // réplique affichée
let speakerWaves = null; // ondes sous le haut-parleur qui parle
let speaker = null; // [x, y] du haut-parleur d'où sort l'annonce en cours
let hudLeft = Infinity; // bord gauche des boutons du haut (la bande ne passe pas dessous)
const mouth = { x: 0, y: 0 };
let playerActed = false;
// Aparté : un moment rare et marquant (tête de face, zoom, bandes « cinéma », musique baissée).
const asideFx = createAsideFx(uiEl);
let asideP = 0; // avancement de la mise en scène (0 à 1), en temps de jeu
let storeTime = 0; // temps du magasin (figé pendant un aparté)
// Aparté ou conversation (le héros tourné vers le joueur, rien ne l'interrompt).
const heroAside = () => narrator.line !== null && (narrator.voice === 'heros' || inScene(narrator));
const ease = (p) => p * p * (3 - 2 * p); // une touche, un toucher ou un bouton depuis la dernière image (inactivité)
const head = { x: 0, y: 0 };
const HEAD_HEIGHT = 330; // hauteur de la tête du héros au-dessus de ses pieds (px du dessin)

// Un moment du jeu : renvoie true si une voix prend la parole.
function say(trigger) {
  return narrate(narrator, narratorData, trigger, config.narrator) !== null;
}

// Une réplique commence : bande ou bulle, son, et pour un aparté le héros se tourne vers l'écran
// (s'il est à l'arrêt et ne scanne pas).
function voiceStarted() {
  const scene = inScene(narrator);
  const hero = narrator.voice === 'heros' || scene; // conversation : héros, joueur, regard, marche
  const glance = narrator.voice === 'regard';
  const thought = narrator.voice === 'pensee';
  // Conversation : le son d'aparté au premier regard vers le joueur ; aparté : à son début seulement
  // (le héros répond à la réponse du joueur : l'aparté continue).
  const reply = scene ? !glance : hero && asideP > 0;
  if (voiceLine.walk !== undefined) startSceneWalk(voiceLine.walk);
  narratorUi.show(voiceLine.text, narrator.voice, config.display.reduceMotion, voiceLine.choices?.map((c) => c.text) ?? null);
  choiceFocus = 0;
  if (thought) audio.play('froissement');
  else if (!reply && (!glance || scene)) audio.play(hero ? 'aparte' : 'annonce');
  if (hero && !reply && !thought) vibrate('fort');
  if (glance && sm.is('play') && narrator.asideOk) faceScreen(walker); // petit regard caméra, sans texte
  if (narrator.voice === 'epaisseur') audio.play('froissement'); // le joueur répond (sans voix : ses pensées)
  // L'annonce sort du haut-parleur le plus proche du personnage (le même jusqu'à la fin de la réplique).
  const sp = place.speakers?.items ?? [];
  speaker = hero || sp.length === 0 ? null : sp[nearestSpeaker(sp, walker.x)];
  if (speaker) speakerWaves.show(speaker[0], speaker[1]);
  else speakerWaves.hide();
  hudLeft = hud.bar.getBoundingClientRect().left; // lu une fois par réplique
  if (hero && !thought && voiceLine.walk === undefined && sm.is('play') && !walker.moving && !walker.hasTarget && !scan.active && pendingScan < 0) faceScreen(walker);
}

// Conversation : le héros s'avance vers le milieu de l'écran (un peu en avant), en plusieurs fois.
// part : part du chemin depuis l'endroit où la conversation a commencé (1 = arrivé).
const sceneFrom = { x: 0, z: 0 };
const sceneMeet = { x: 0, z: 0 };
let sceneWalkT = -1; // temps de jeu au début de la marche en cours (-1 : pas de marche)
function startSceneWalk(part) {
  if (narrator.scene.i === 0) {
    // Première marche : point de départ, et point de rencontre au milieu de l'image actuelle.
    sceneFrom.x = walker.x;
    sceneFrom.z = walker.z;
    const v = stage.view;
    sceneMeet.x = stageToWorldX(proj, camera.x + v.viewW / 2);
    sceneMeet.z = config.narrator.meetZ;
  }
  tmpWorld.x = sceneFrom.x + (sceneMeet.x - sceneFrom.x) * part;
  tmpWorld.z = sceneFrom.z + (sceneMeet.z - sceneFrom.z) * part;
  walkTo(tmpWorld);
  marker.hide(); // une marche du héros, pas un ordre du joueur
  sceneWalkT = narrator.t;
}

// Fin d'une marche de conversation : arrivé (ou bloqué trop longtemps).
function watchSceneWalk() {
  if (sceneWalkT < 0 || narrator.line?.walk === undefined) return;
  const late = narrator.t - sceneWalkT > config.narrator.walkTimeout;
  if ((narrator.t - sceneWalkT > 0.1 && !walker.hasTarget && !walker.moving) || late) {
    if (late) clearTarget(walker);
    sceneWalkT = -1;
    endLine(narrator, narratorData, config.narrator);
  }
}

// Mise en scène de l'aparté : avance vers 1 pendant l'aparté, revient à 0 après (temps de jeu).
let veilP = 0; // voile d'une rencontre importante (0 à 1)
let sceneMode = false; // interface effacée (conversation en cours)
function updateAside(dt) {
  // Pendant une marche ou une pensée de la conversation, pas encore de mise en scène (ni zoom).
  const goal = heroAside() && narrator.voice !== 'pensee' && narrator.voice !== 'marche' ? 1 : 0;
  const step = dt / Math.max(0.05, config.narrator.asideZoomTime);
  asideP = approach(asideP, goal, step);
  const still = config.display.reduceMotion;
  asideFx.set(asideP, config.narrator.asideDim, still);
  const veilGoal = inScene(narrator) && narratorData.triggers[narrator.scene.line.trigger]?.veil ? 1 : 0;
  const vs = dt / Math.max(0.05, config.narrator.veilTime);
  veilP = approach(veilP, veilGoal, vs);
  asideFx.setVeil(veilP, config.narrator.veilBlur, still);
  // Pendant une conversation avec le joueur, l'interface (boutons, Panier, version) s'efface.
  const sceneOn = inScene(narrator);
  if (sceneOn !== sceneMode) {
    sceneMode = sceneOn;
    uiEl.classList.toggle('scene-mode', sceneOn);
  }
  stage.setZoom(still ? 1 : 1 + (config.narrator.asideZoom - 1) * ease(asideP));
  audio.setFrozen(asideP > 0);
}

// À chaque image, en jeu ou dans le Panier (figé en pause et sous les menus).
function updateNarrator(dt) {
  watchSceneWalk();
  const letters = stepNarrator(narrator, narratorData, dt, config.narrator);
  if (narrator.line !== voiceLine) {
    voiceLine = narrator.line;
    if (voiceLine) voiceStarted();
    else {
      narratorUi.hide();
      speakerWaves.hide();
      speaker = null;
    }
  }
  if (!voiceLine) return;
  const n = Math.floor(narrator.shown);
  narratorUi.setShown(n);
  if (waitingAnswer(narrator)) narratorUi.choicesReady(choiceFocus);
  narratorUi.setWaiting(waitingTap(narrator));
  const asking = waitingName(narrator);
  if (asking !== namePicker.visible) {
    if (asking) namePicker.show(config.player.name, config.player.customName);
    else namePicker.hide();
  }
  const hero = narrator.voice === 'heros' || narrator.voice === 'pensee'; // bulle au-dessus du héros
  const player = narrator.voice === 'epaisseur'; // le joueur : l'écran parle, en bas, sans petits bips
  const every = config.narrator.blipEvery;
  if (letters > 0 && every > 0 && n % every === 0 && !player) audio.play(hero ? 'blipHeros' : 'blip');
  if (player) {
    // (centré en bas par la feuille de style)
  } else if (hero) {
    stage.stageToClient(shown.x, shown.y - HEAD_HEIGHT * shown.scale * heroData.scale, head);
    narratorUi.placeBubble(head.x, head.y);
  } else if (speaker) {
    stage.stageToClient(speaker[0], speaker[1], mouth);
    narratorUi.placeBand(mouth.x, mouth.y + 18, hudLeft);
    speakerWaves.pulse(narrator.t, config.display.reduceMotion);
  } else narratorUi.placeBand(uiEl.clientWidth / 2, 0, hudLeft); // lieu sans haut-parleur : en haut
}

// Moments surveillés en jeu : arrivée, inactivité, bout du rayon.
function watchNarrator(dt) {
  if (!arrived && narrator.t > 1) {
    arrived = true;
    say('arrivee');
  }
  // Un aparté seulement si le héros est disponible : à l'arrêt, sans scanner ni se diriger quelque part.
  narrator.asideOk = !walker.moving && !walker.hasTarget && !scan.active && pendingScan < 0;
  const active = walker.moving || scan.active || pendingScan >= 0 || playerActed;
  playerActed = false;
  if (stepIdle(narrator, dt, active, config.narrator)) say('inactivite') || say('aparte_inactivite');
  if (walker.x >= endOfAisleX) say('bout_du_rayon');
  if (!gear.scanette && walker.x > CONSIGNE_X) say('consigne_scanette');
}

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
    if (pendingSwap && pendingSwap.to === scan.index) {
      // Échange : le produit reposé apparaît à la place de celui qu'on vient de scanner.
      const { from, to } = pendingSwap;
      pendingSwap = null;
      products.moveTo(from, to);
      const m = products.items[from];
      Object.assign(productState[from], { x: m.x, z: m.wz, loose: !!m.loose, standAt: m.standAt, y: m.y, w: m.w, h: m.h, scanned: false });
    }
    const card = addToBasket(basket, it.id, it.def, scan.index);
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
  errors: errorLog,
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
  stage.applyOpacity(); // rayon de devant comme dans le jeu…
  if (variant === 'T2') stage.layers['premier-plan'].style.opacity = 0; // … ou invisible (T2)
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
  stage.applyOpacity();
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
  playerActed = true;
  switch (action) {
    case 'back':
      if (sm.is('intro')) skipAll(introRun);
      else if (quick) endQuick('annulé par le joueur (résultats partiels)');
      else if (sm.is('bench')) endBench('annulé par le joueur (résultats partiels)');
      else if (sm.is('menu')) sm.back();
      else if (sm.is('options')) sm.go('title');
      else if (sm.is('panier')) {
        if (confirm.open) confirm.no();
        else sm.go('play');
      }
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
    case 'landscape':
      enterLandscape();
      break;
    case 'up':
    case 'down':
      if (sm.is('options')) playerOptions.move(action === 'up' ? -1 : 1);
      else if (sm.is('pause')) journal.move(action === 'up' ? -1 : 1);
      else if (namePicker.visible) namePicker.move(action === 'up' ? -1 : 1);
      break;
    case 'action':
      if (sm.is('intro')) skipLine(introRun);
      else if (sm.is('pause')) {
        // Manette (A) : le bouton mis en avant de l'écran Pause (Reprendre ou Dialogues).
        const el = document.activeElement;
        if (el?.tagName === 'BUTTON' && hud.pauseCard.contains(el)) el.click();
      }
      else if (sm.is('options')) playerOptions.press();
      else if (sm.is('title')) titleUi.press();
      else if (confirm.open) confirm.yes(); // manette : A = oui
      else if (namePicker.visible) namePicker.press();
      else if (waitingAnswer(narrator)) answer(narrator, choiceFocus, config.narrator);
      else if (heroAside()) skipNarrator(narrator, narratorData, config.narrator);
      else tryScan();
      break;
    case 'choice1':
    case 'choice2':
      if (waitingAnswer(narrator)) answer(narrator, action === 'choice1' ? 0 : 1, config.narrator);
      break;
    case 'left':
    case 'right':
      if (sm.is('options')) playerOptions.adjust(action === 'left' ? -1 : 1);
      else if (sm.is('title')) titleUi.move(action === 'left' ? -1 : 1);
      else if (confirm.open) confirm.focus(action === 'right');
      else if (sm.is('panier')) basketUi.switchTab();
      else if (namePicker.visible) namePicker.move(action === 'left' ? -1 : 1);
      else if (waitingAnswer(narrator)) {
        choiceFocus = action === 'left' ? 0 : 1;
        narratorUi.focusChoice(choiceFocus);
      }
      break;
    case 'panier':
      if (sm.is('panier')) sm.go('play');
      else if (sm.is('play') && !scan.active && gear.panier) sm.go('panier');
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
  if (now === 'pause') journal.prepare(narrator.log);
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
  if (now === 'bench') {
    silenceNarrator(narrator); // les mesures se font sans voix
    voiceLine = null;
    narratorUi.hide();
    speakerWaves.hide();
    asideP = 0;
    asideFx.set(0, 0, true);
    stage.setZoom(1);
    audio.setFrozen(false);
  }
  if (before === 'panier') basketUi.close();
  if (before === 'play') input?.clear(); // pas de touche « collée » à la reprise
  if (now === 'play' || now === 'bench') stepper.reset();
});

// Un point de l'écran touché ou cliqué → un point du sol à atteindre (fonction de core/).
function onTarget(cx, cy) {
  if (!sm.is('play')) return;
  playerActed = true;
  if (scan.active) return; // pendant une action (scan), le héros ne se déplace pas
  if (heroAside()) {
    skipNarrator(narrator, narratorData, config.narrator); // toucher : la réplique passe
    return;
  }
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
  if (!sm.is('play') || scan.active || heroAside()) return;
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
  const looking = heroAside() || (narrator.voice === 'regard' && !walker.moving);
  const emotion = looking ? narrator.line?.emotion ?? '' : '';
  sprite.render(shown.x, shown.y, shown.scale, walker.facing, walker.away, walker.moving, time, walker.distance, scan.active, emotion);
  sprite.setLevel(shown.level);
  dust.update(time);
  // Scanner : produit à portée mis en évidence, effets du scan, carte qui file dans le Panier.
  // Au présentoir, ce qu'on peut prendre passe avant les produits.
  const free = sm.is('play') && !scan.active && !heroAside(); // pendant une conversation : ni repère ni bouton « Scanner »
  const pk = free ? nearestProduct(pickupState, walker, config.scan) : -1;
  const reach = free && pk < 0 ? nearestProduct(productState, walker, config.scan) : -1;
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
  const camFrozen = bench && config.bench.fixedCamera && camera.ready;
  const pc = quick ? quickConditionDef(quick) : null;
  if (pc && pc.camera === 'fixed') {
    // Diagnostic : caméra fixe, centrée sur l'aller-retour.
    const mid = (place.diagnostic.a[0] + place.diagnostic.b[0]) / 2;
    camera.x = Math.min(Math.max(0, place.size[0] - v.viewW), Math.max(0, mid - v.viewW / 2));
    camera.y = 0;
    camera.ready = true;
  } else if (inScene(narrator) && asideP === 0) {
    // Conversation, avant la mise en scène : la caméra ne bouge plus, le héros s'avance au milieu de l'image.
  } else if (asideP > 0) {
    // Aparté : la caméra se centre sur le héros (le zoom resserre l'image autour de lui).
    const k = 1 - Math.exp(-12 * camDt);
    const gx = Math.min(Math.max(0, place.size[0] - v.viewW), Math.max(0, shown.x - v.viewW / 2));
    const gy = Math.min(Math.max(0, place.size[1] - v.viewH), Math.max(0, shown.y - 170 * shown.scale - v.viewH * 0.5));
    camera.x += (gx - camera.x) * k;
    camera.y += (gy - camera.y) * k;
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
      if (scan.active || heroAside()) {
        // Pendant un scan ou un aparté, le personnage ne bouge pas (ni au clavier, ni vers un point touché),
        // sauf la marche d'une conversation (il s'avance tout seul).
        intent.moveX = 0;
        intent.moveZ = 0;
        if (narrator.line?.walk === undefined) clearTarget(walker);
      }
      stepWalker(walker, intent, mask, config.walk, stepper.step);
      stepPendingScan();
      onScanEvent(stepScan(scan, stepper.step, config.scan));
    }
    if (walker.moving) hud.playerMoved();
    const sec = Math.min(dt / 1000, 0.1);
    updateIntro(sec); // fondu final de l'intro, s'il est en cours
    watchNarrator(sec);
    updateNarrator(sec);
    updateAside(sec);
    render();
  } else if (sm.is('intro')) {
    updateIntro(Math.min(dt / 1000, 0.1));
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
  speakerWaves = createSpeakerWaves(stage.layers.acteurs);
  products = createProducts(place, catalog, images, stage.layers.produits, stage.layers.acteurs, config.scan, config.display, {
    parent: stage.layers.acteurs,
    proj,
    levelOf: (id) => props.find((p) => p.id === id).el.style.zIndex,
  });
  productState = products.items.map((it) => ({ x: it.x, scanned: false, loose: !!it.loose, z: it.wz, standAt: it.standAt, y: it.y, w: it.w, h: it.h }));
  // Présentoir de l'accueil : au fond, contre l'étagère ; on s'y présente de face.
  const back = Math.max(...place.walkMask.area.map((pt) => pt[1]));
  pickupState = (place.accueil?.items ?? []).map((it) => ({
    id: it.id, x: it.at[0], z: back, loose: true, scanned: false, standAt: [[it.at[0], back - 20]], y: it.at[1] + it.h, w: it.w, h: it.h,
  }));
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
    if (key === 'display.fullscreenMode') {
      // Le choix se fait d'un geste (dans le panneau) : on peut entrer en plein écran tout de suite.
      if (value === 'oui') enterLandscape();
      else if (value === 'non') exitFullscreen();
    }
    if (key === 'display.crt' || key === 'display.crtStrength') applyCrt();
    if (key.startsWith('access.') || key === 'display.narratorAlpha') applyAccess();
    if (key === 'narrator.screenFx' || key === 'display.reduceMotion') applyScreenFx();
    if (key.startsWith('player.')) applyPlayerName();
    if (key === 'display.propLayers') stage.el.classList.toggle('props-layered', value);
    if (key.startsWith('audio.')) audio.applyVolumes();
    if (key === 'audio.muted') hud.setMuted(value);
    if (key === 'carry.panier') basketUi.setCapacity(capacity(gear, config.carry));
    if (key === 'narrator.enabled' && !value) silenceNarrator(narrator);
    if (key === 'narrator.asides' && !value && narrator.voice === 'heros') silenceNarrator(narrator);
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
  sm.go('title');
  requestAnimationFrame(frame);

  // Accès en lecture pour les tests automatiques et le débogage.
  window.paperCart = {
    version: VERSION,
    state: () => sm.get(),
    hero: () => ({ x: walker.x, z: walker.z, facing: walker.facing, away: walker.away, hasTarget: walker.hasTarget }),
    // Scanner : produit à portée, scan en cours, cartes du Panier.
    scanState: () => ({ reach: highlighted, pickup: pickupReach, active: scan.active, phase: scan.phase, cards: basket.cards.map((c) => c.name), gear: { ...gear } }),
    // Tests automatiques : le héros prend tout au présentoir (Scanette et panier), sans s'y rendre.
    // Tests : un moment « once » considéré comme déjà dit (ex. la première rencontre, pour les tests du scanner).
    markSaid(trigger) {
      narrator.done[trigger] = true;
    },
    journal: () => narrator.log.map((e) => `${e.voice}: ${e.text}`),
    equip() {
      pickupState.forEach((it, k) => {
        if (takeItem(gear, pickupState, k)) {
          sprite.setHeld(it.id, true);
          basketUi.addObject(it.id);
        }
      });
      basketUi.setCapacity(capacity(gear, config.carry));
    },
    // Tests automatiques : quitter l'écran titre comme si l'on touchait « Commencer » (sans plein écran).
    startGame: () => startGame(false),
    narrator: () => ({ text: narrator.line?.text ?? '', voice: narrator.voice, trust: narrator.trust, waiting: waitingAnswer(narrator), shown: Math.floor(narrator.shown), visible: narratorUi.visible, shownVoice: narratorUi.voice, t: narrator.t }),
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
