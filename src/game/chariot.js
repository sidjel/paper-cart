// Le chariot (A8), branché sur le jeu : la règle est dans core/chariot.js.
// Une seule image, créée au chargement ; comme le héros, elle passe sur le calque des acteurs du lieu
// affiché (mount), et n'est montrée que dans le lieu où le chariot se trouve (le changement se fait dans
// le noir d'un changement de lieu). En papier comme le héros : quand il se retourne, la feuille pivote
// autour du héros (largeur qui passe par une tranche fine). Rangé en profondeur comme un personnage ;
// à égalité avec le héros (poussé), le héros passe devant.
//
// game : { walker(), place() → id du lieu affiché, onTurn() → il grince }

import { config } from '../config.js';
import { createChariot, pushChariot, releaseChariot, nearChariot, arriveChariot, pushWalk, bump, stepChariot } from '../core/chariot.js';
import { worldToStageX, worldToStageY, scaleAt } from '../scene/projection.js';
import { actorLevel } from '../scene/depth.js';

export const CHARIOT_IMAGE = 'art/placeholder/chariot-vide.svg';
export const CHARIOT_SIZE = [335, 250];
const ANCHOR = [167, 230]; // milieu du chariot, au sol (dans l'image) : la feuille pivote sur ce point

// image : { url, w, h } (images communes, préparées au chargement).
export function createChariotWiring(game, image, parent) {
  let state = null; // pas de chariot tant que le héros n'en a pas
  const el = new Image();
  el.src = image.url;
  el.className = 'chariot';
  el.width = image.w;
  el.height = image.h;
  el.alt = '';
  el.draggable = false;
  el.hidden = true;
  el.style.transformOrigin = `${ANCHOR[0]}px ${ANCHOR[1]}px`;
  parent.appendChild(el);
  let proj = null;
  let shownHere = false;
  let lastLevel = -1;
  const show = () => {
    shownHere = state !== null && state.place === game.place();
    if (el.hidden === shownHere) el.hidden = !shownHere;
  };

  return {
    // Passe sur le calque des acteurs du lieu affiché.
    mount(to) {
      to.appendChild(el);
    },
    get pushing() {
      return state !== null && state.pushed && shownHere;
    },
    // Le héros reçoit un chariot (point de départ de test, en attendant le comptoir) : il le pousse.
    // Avant le dévoilement de la scène : il apparaît dans le noir.
    give() {
      const w = game.walker();
      state = createChariot(game.place(), w.x + config.chariot.offset, w.z);
      pushChariot(state, w);
      show();
    },
    // Un lieu vient d'être construit.
    attach(pr) {
      proj = pr;
      show();
    },
    // Le héros vient d'être posé dans le nouveau lieu : poussé, le chariot arrive avec lui.
    arrived() {
      if (state) arriveChariot(state, game.place(), game.walker(), config.chariot);
      show();
    },
    // Bouton d'action : 'lacher', 'pousser' ou '' (rien à faire avec le chariot ici).
    action() {
      if (!state || !nearChariot(state, game.walker(), game.place(), config.chariot.range)) return '';
      return state.pushed ? 'lacher' : 'pousser';
    },
    toggle() {
      const a = this.action();
      if (a === 'lacher') releaseChariot(state);
      else if (a === 'pousser') {
        pushChariot(state, game.walker());
        game.onTurn();
      }
      return a;
    },
    // Réglages de marche du héros : plus lourds quand il pousse.
    walk: (walk) => (state?.pushed && shownHere ? pushWalk(walk, config.chariot) : walk),
    // Après le pas du héros : le chariot bute contre le décor, puis suit.
    step(mask, dt) {
      if (!state || !shownHere) return;
      bump(state, game.walker(), mask, config.chariot);
      if (stepChariot(state, game.walker(), config.chariot, dt) === 'tourne') game.onTurn();
    },
    // Le héros est-il plus proche que le chariot (il passe alors devant lui, dans une même bande) ?
    heroNearer(z) {
      return shownHere && z <= state.z + 1;
    },
    render(alpha, refs) {
      if (!shownHere) return;
      const x = state.prevX + (state.x - state.prevX) * alpha;
      const z = state.prevZ + (state.z - state.prevZ) * alpha;
      const side = state.prevSide + (state.side - state.prevSide) * alpha;
      const s = scaleAt(proj, z) * config.chariot.size;
      const fx = worldToStageX(proj, x);
      const fy = worldToStageY(proj, z);
      // Poignée vers le héros (l'image l'a à gauche) ; en se retournant, la feuille passe par sa tranche.
      const sx = Math.sign(side || 1) * Math.max(Math.abs(side), config.character.edgeThickness);
      el.style.transform = `translate3d(${fx - ANCHOR[0]}px, ${fy - ANCHOR[1]}px, 0) scale(${s * sx}, ${s})`;
      const level = actorLevel(refs, z, z < game.walker().z - 1); // à égalité, le héros passe devant
      if (level !== lastLevel) {
        el.style.zIndex = level;
        lastLevel = level;
      }
    },
    info: () => (state ? { place: state.place, x: state.x, z: state.z, pushed: state.pushed, side: state.side } : null),
  };
}
