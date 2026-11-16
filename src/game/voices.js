// Les voix du jeu, côté assemblage : le haut-parleur, les pensées et les apartés du héros, la rencontre avec
// le joueur (marche, voile, choix du nom) et le tournis. La logique est dans core/narrator.js et core/dizzy.js,
// les répliques dans data/narrator.json, l'affichage dans ui/ ; ici on les relie au jeu.
// Sorti de main.js à la séance 54.
//
// game : { sm, audio, hud, shown (position affichée du héros), heroScale, headHeight, vibrate(force),
//          place(), stage(), proj(), walker(), camera(), speakerWaves(),
//          heroBusy() (scan ou approche en cours), hasScanette(), aisleEndX(), walkTo(point), hideMarker() }

import { config, setValue } from '../config.js';
import narratorFile from '../data/narrator.json';
import playerFile from '../data/joueur.json';
import { createNarrator, narrate, stepNarrator, skipNarrator, silenceNarrator, stepIdle, nearestSpeaker, waitingAnswer, waitingTap, answer, inScene, endLine, approach, waitingName, answerName } from '../core/narrator.js';
import { playerName, fillName, OTHER, MAX_NAME } from '../core/names.js';
import { createDizzy, stepDizzy, dizzyActive } from '../core/dizzy.js';
import { clearTarget, faceScreen } from '../core/movement.js';
import { stageToWorldX } from '../scene/projection.js';
import { createNarratorUi } from '../ui/narrator.js';
import { createAsideFx } from '../ui/aside.js';
import { createNamePicker } from '../ui/namePicker.js';
import { createDizzyStars } from '../ui/dizzyStars.js';

const ease = (p) => p * p * (3 - 2 * p);

export function createVoices(ui, game) {
  const { sm, audio, hud, shown } = game;

  // Les [TEMP] s'affichent sans préfixe, avec des espaces insécables à la française (jamais un « ? » seul
  // en début de ligne). Le nom du joueur (« mon Épaisseur », ou celui choisi) remplace ses repères.
  const frenchSpaces = (t) => t.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');
  let who = playerName(playerFile.names, config.player.name, config.player.customName);
  const clean = (t) => frenchSpaces(fillName((t ?? '').replace(/^\[TEMP\]\s*/, ''), who));
  const cleanLine = (l) => ({
    ...l,
    text: clean(l.text),
    choices: l.choices?.map((c) => ({ ...c, text: clean(c.text), reply: clean(c.reply) })),
    steps: l.steps?.map(cleanLine), // conversation : chaque réplique
  });
  const data = { triggers: narratorFile.triggers, lines: narratorFile.lines.map(cleanLine) };
  const narrator = createNarrator();
  const narratorUi = createNarratorUi(ui, { onSkip: () => skipNarrator(narrator, data, config.narrator), onChoose: (k) => answer(narrator, k, config.narrator) });
  // Effet des mots du joueur (l'écran qui parle) ; « réduire les animations » : aucun.
  function applyScreenFx() {
    narratorUi.setScreenFx(config.display.reduceMotion ? 'aucun' : config.narrator.screenFx);
  }
  applyScreenFx();
  // Pendant la rencontre, le héros propose au joueur de choisir son nom (changeable ensuite dans les options).
  const namePicker = createNamePicker(ui, {
    names: playerFile.names,
    other: OTHER,
    maxLength: MAX_NAME,
    onPick(id, custom, label) {
      if (id === OTHER) setValue('player.customName', custom);
      setValue('player.name', id); // enregistré, et les répliques sont refaites avec ce nom
      namePicker.hide();
      answerName(narrator, data, label, config.narrator);
    },
  });
  let choiceFocus = 0; // réponse mise en avant (clavier, manette)
  let arrived = false;
  let voiceLine = null; // réplique affichée
  let speaker = null; // [x, y] du haut-parleur d'où sort l'annonce en cours
  let hudLeft = Infinity; // bord gauche des boutons du haut (la bande ne passe pas dessous)
  const mouth = { x: 0, y: 0 };
  let playerActed = false; // une touche, un toucher ou un bouton depuis la dernière image (inactivité)
  // Aparté : un moment rare et marquant (tête de face, zoom, bandes « cinéma », musique baissée).
  const asideFx = createAsideFx(ui);
  let asideP = 0; // avancement de la mise en scène (0 à 1), en temps de jeu
  const head = { x: 0, y: 0 };

  // Aparté ou conversation (le héros tourné vers le joueur, rien ne l'interrompt).
  const heroAside = () => narrator.line !== null && (narrator.voice === 'heros' || inScene(narrator));

  // Un moment du jeu : renvoie true si une voix prend la parole.
  function say(trigger) {
    return narrate(narrator, data, trigger, config.narrator) !== null;
  }

  // Une réplique commence : bande ou bulle, son, et pour un aparté le héros se tourne vers l'écran
  // (s'il est à l'arrêt et ne scanne pas).
  function voiceStarted() {
    const walker = game.walker();
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
    if (hero && !reply && !thought) game.vibrate('fort');
    if (glance && sm.is('play') && narrator.asideOk) faceScreen(walker); // petit regard caméra, sans texte
    if (narrator.voice === 'epaisseur') audio.play('froissement'); // le joueur répond (sans voix : ses pensées)
    // L'annonce sort du haut-parleur le plus proche du personnage (le même jusqu'à la fin de la réplique).
    const sp = game.place().speakers?.items ?? [];
    speaker = hero || sp.length === 0 ? null : sp[nearestSpeaker(sp, walker.x)];
    if (speaker) game.speakerWaves().show(speaker[0], speaker[1]);
    else game.speakerWaves().hide();
    hudLeft = hud.bar.getBoundingClientRect().left; // lu une fois par réplique
    if (hero && !thought && voiceLine.walk === undefined && sm.is('play') && !walker.moving && !walker.hasTarget && !game.heroBusy()) faceScreen(walker);
  }

  // Conversation : le héros s'avance vers le milieu de l'écran (un peu en avant), en plusieurs fois.
  // part : part du chemin depuis l'endroit où la conversation a commencé (1 = arrivé).
  const sceneFrom = { x: 0, z: 0 };
  const sceneMeet = { x: 0, z: 0 };
  const sceneTo = { x: 0, z: 0 };
  let sceneWalkT = -1; // temps de jeu au début de la marche en cours (-1 : pas de marche)
  function startSceneWalk(part) {
    const walker = game.walker();
    if (narrator.scene.i === 0) {
      // Première marche : point de départ, et point de rencontre au milieu de l'image actuelle.
      sceneFrom.x = walker.x;
      sceneFrom.z = walker.z;
      sceneMeet.x = stageToWorldX(game.proj(), game.camera().x + game.stage().view.viewW / 2);
      sceneMeet.z = config.narrator.meetZ;
    }
    sceneTo.x = sceneFrom.x + (sceneMeet.x - sceneFrom.x) * part;
    sceneTo.z = sceneFrom.z + (sceneMeet.z - sceneFrom.z) * part;
    game.walkTo(sceneTo);
    game.hideMarker(); // une marche du héros, pas un ordre du joueur
    sceneWalkT = narrator.t;
  }

  // Fin d'une marche de conversation : arrivé (ou bloqué trop longtemps).
  function watchSceneWalk() {
    if (sceneWalkT < 0 || narrator.line?.walk === undefined) return;
    const walker = game.walker();
    const late = narrator.t - sceneWalkT > config.narrator.walkTimeout;
    if ((narrator.t - sceneWalkT > 0.1 && !walker.hasTarget && !walker.moving) || late) {
      if (late) clearTarget(walker);
      sceneWalkT = -1;
      endLine(narrator, data, config.narrator);
    }
  }

  // Le tournis : étoiles autour de la tête, pendant leur durée et tant qu'il s'en plaint.
  const dizzy = createDizzy();
  const dizzyStars = createDizzyStars(ui);
  const starHead = { x: 0, y: 0 };
  function updateStars() {
    const on = dizzyActive(dizzy, narrator.t) || narrator.line?.trigger === 'tournis';
    if (!on) {
      if (dizzyStars.visible) dizzyStars.hide();
      return;
    }
    const stage = game.stage();
    const k = shown.scale * game.heroScale;
    stage.stageToClient(shown.x, shown.y - (game.headHeight - 30) * k, starHead);
    dizzyStars.show(starHead.x, starHead.y, k * stage.view.scale * 1.5, config.display.reduceMotion);
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
    const veilGoal = inScene(narrator) && data.triggers[narrator.scene.line.trigger]?.veil ? 1 : 0;
    const vs = dt / Math.max(0.05, config.narrator.veilTime);
    veilP = approach(veilP, veilGoal, vs);
    asideFx.setVeil(veilP, config.narrator.veilBlur, still);
    // Pendant une conversation avec le joueur, l'interface (boutons, Panier, version) s'efface.
    const sceneOn = inScene(narrator);
    if (sceneOn !== sceneMode) {
      sceneMode = sceneOn;
      ui.classList.toggle('scene-mode', sceneOn);
    }
    game.stage().setZoom(still ? 1 : 1 + (config.narrator.asideZoom - 1) * ease(asideP));
    audio.setFrozen(asideP > 0);
  }

  // À chaque image, en jeu ou dans le Panier (figé en pause et sous les menus).
  function update(dt) {
    watchSceneWalk();
    const letters = stepNarrator(narrator, data, dt, config.narrator);
    if (narrator.line !== voiceLine) {
      voiceLine = narrator.line;
      if (voiceLine) voiceStarted();
      else {
        narratorUi.hide();
        game.speakerWaves().hide();
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
      game.stage().stageToClient(shown.x, shown.y - game.headHeight * shown.scale * game.heroScale, head);
      narratorUi.placeBubble(head.x, head.y);
    } else if (narrator.voice === 'agent') {
      const g = game.guardHead(); // l'agent de sécurité : bulle au-dessus de sa tête
      game.stage().stageToClient(g.x, g.y, head);
      narratorUi.placeBubble(head.x, head.y);
    } else if (speaker) {
      game.stage().stageToClient(speaker[0], speaker[1], mouth);
      narratorUi.placeBand(mouth.x, mouth.y + 18, hudLeft);
      game.speakerWaves().pulse(narrator.t, config.display.reduceMotion);
    } else narratorUi.placeBand(ui.clientWidth / 2, 0, hudLeft); // lieu sans haut-parleur : en haut
  }

  // Moments surveillés en jeu : arrivée, inactivité, tournis, bout du rayon, rappel de la Scanette.
  function watch(dt) {
    const walker = game.walker();
    if (!arrived && narrator.t > 1) {
      arrived = true;
      say('arrivee');
    }
    // Un aparté seulement si le héros est disponible : à l'arrêt, sans scanner ni se diriger quelque part.
    narrator.asideOk = !walker.moving && !walker.hasTarget && !game.heroBusy();
    const active = walker.moving || game.heroBusy() || playerActed;
    playerActed = false;
    if (stepIdle(narrator, dt, active, config.narrator)) say('inactivite') || say('aparte_inactivite');
    // Le tournis : trop de demi-tours, trop vite → étoiles, et il s'en plaint dès qu'il s'arrête.
    if (stepDizzy(dizzy, narrator.t, walker.facing, walker.moving, config.dizzy) && !inScene(narrator)) say('tournis');
    if (walker.x >= game.aisleEndX()) say('bout_du_rayon');
    // S'éloigner du présentoir sans Scanette (point fixé par les données du lieu) : le haut-parleur le rappelle.
    if (!game.hasScanette() && walker.x > (game.place().accueil?.remindAfterX ?? Infinity)) say('consigne_scanette');
  }

  return {
    narrator, // (lecture : historique, tests)
    namePicker,
    say,
    heroAside,
    update,
    watch,
    updateAside,
    updateStars,
    applyScreenFx,
    get asideP() {
      return asideP;
    },
    inScene: () => inScene(narrator),
    waitingAnswer: () => waitingAnswer(narrator),
    // Le héros s'avance tout seul (marche d'une conversation) : on ne l'arrête pas.
    walking: () => narrator.line?.walk !== undefined,
    // Expression du héros tourné vers le joueur ('' sinon). moving : il marche.
    emotion: (moving) => (heroAside() || (narrator.voice === 'regard' && !moving) ? narrator.line?.emotion ?? '' : ''),
    // Le joueur a fait quelque chose (pour l'inactivité).
    acted() {
      playerActed = true;
    },
    // Toucher, Entrée : la réplique passe (texte entier, puis suivante).
    skip: () => skipNarrator(narrator, data, config.narrator),
    answer: (k) => answer(narrator, k, config.narrator),
    answerFocused: () => answer(narrator, choiceFocus, config.narrator),
    focusChoice(k) {
      choiceFocus = k;
      narratorUi.focusChoice(k);
    },
    // Hors du jeu (Panier, menus), le héros ne prend pas la parole : un moment important attend le retour.
    leftGame() {
      narrator.asideOk = false;
    },
    // Banc d'essai : les mesures se font sans voix ni mise en scène.
    reset() {
      silenceNarrator(narrator);
      voiceLine = null;
      narratorUi.hide();
      game.speakerWaves().hide();
      asideP = 0;
      asideFx.set(0, 0, true);
      game.stage().setZoom(1);
      audio.setFrozen(false);
    },
    // Réglages : le narrateur (ou les apartés) coupés en cours de partie.
    silence(onlyAsides = false) {
      if (!onlyAsides || narrator.voice === 'heros') silenceNarrator(narrator);
    },
    // Nom changé dans les options : les répliques sont refaites (les prochaines l'emploient).
    applyPlayerName() {
      who = playerName(playerFile.names, config.player.name, config.player.customName);
      data.lines = narratorFile.lines.map(cleanLine);
    },
    // Le héros vient d'arriver dans un autre lieu : une annonce en cours continue, elle sort du
    // haut-parleur de ce lieu (ou du haut de l'écran).
    arrivedInPlace() {
      if (!voiceLine || !speaker) return;
      const sp = game.place().speakers?.items ?? [];
      speaker = sp.length ? sp[nearestSpeaker(sp, game.walker().x)] : null;
      if (speaker) game.speakerWaves().show(speaker[0], speaker[1]);
    },
    // Tests et points de départ.
    markSaid(trigger) {
      narrator.done[trigger] = true;
    },
    skipArrival() {
      arrived = true;
    },
    info: () => ({ text: narrator.line?.text ?? '', voice: narrator.voice, trust: narrator.trust, waiting: waitingAnswer(narrator), shown: Math.floor(narrator.shown), visible: narratorUi.visible, shownVoice: narratorUi.voice, t: narrator.t }),
    dizzyInfo: () => ({ count: dizzy.count, times: dizzy.times.length }),
  };
}
