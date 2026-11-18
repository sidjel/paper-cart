// Le chariot jouable (A8, étape 1/3), branché sur le jeu : la règle est dans core/chariot.js.
// Une seule image, créée au chargement ; comme le héros, elle passe sur le calque des acteurs du lieu
// affiché (mount), et n'est montrée que dans le lieu où le chariot se trouve (le changement se fait dans
// le noir d'un changement de lieu). Rangée en profondeur comme un personnage ; avec le héros, le plus
// proche passe devant.
//
// game : { walker(), place() → id du lieu affiché }

import { config } from '../config.js';
import { createChariot, takeChariot, parkChariot, nearChariot, leaveChariot, stepChariot } from '../core/chariot.js';
import { worldToStageX, worldToStageY, scaleAt } from '../scene/projection.js';
import { actorLevel } from '../scene/depth.js';

export const CHARIOT_IMAGE = 'art/placeholder/chariot-vide.svg';
export const CHARIOT_SIZE = [335, 250];
const ANCHOR = [212, 230]; // point du sol sous le chariot, dans l'image (comme le chariot du décor)

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

  return {
    // Passe sur le calque des acteurs du lieu affiché.
    mount(to) {
      to.appendChild(el);
    },
    get owned() {
      return state !== null;
    },
    // Le héros reçoit un chariot (point de départ de test, en attendant le comptoir) : il le suit.
    give() {
      const w = game.walker();
      state = createChariot(game.place(), w.x - config.chariot.follow, w.z);
      takeChariot(state, w);
      // Avant le dévoilement de la scène (point de départ) : il apparaît dans le noir.
      shownHere = true;
      el.hidden = false;
    },
    // Un lieu vient d'être construit : le chariot s'y montre seulement s'il y est.
    attach(pr) {
      proj = pr;
      shownHere = state !== null && state.place === game.place();
      if (el.hidden === shownHere) el.hidden = !shownHere;
    },
    // On quitte le lieu : le chariot reste là où il est, garé.
    leaving() {
      if (state) leaveChariot(state);
    },
    // Bouton d'action : 'garer', 'reprendre' ou '' (rien à faire avec le chariot ici).
    action() {
      if (!state || !nearChariot(state, game.walker(), game.place(), config.chariot.range)) return '';
      return state.following ? 'garer' : 'reprendre';
    },
    toggle() {
      const a = this.action();
      if (a === 'garer') parkChariot(state);
      else if (a === 'reprendre') takeChariot(state, game.walker());
      return a;
    },
    step(dt) {
      if (state && shownHere) stepChariot(state, game.walker(), config.chariot, dt);
    },
    // Le héros est-il plus proche que le chariot (il passe alors devant lui, dans une même bande) ?
    heroNearer(z) {
      return shownHere && z <= state.z + 1;
    },
    render(alpha, refs) {
      if (!shownHere) return;
      const x = state.prevX + (state.x - state.prevX) * alpha;
      const z = state.prevZ + (state.z - state.prevZ) * alpha;
      const s = scaleAt(proj, z) * config.chariot.size;
      const fx = worldToStageX(proj, x);
      const fy = worldToStageY(proj, z);
      // L'image a sa poignée à droite : on la retourne quand il roule vers la droite (poignée côté héros).
      el.style.transform = `translate3d(${fx - ANCHOR[0]}px, ${fy - ANCHOR[1]}px, 0) scale(${s * -state.facing}, ${s})`;
      const level = actorLevel(refs, z, z < game.walker().z - 1); // à égalité, le héros passe devant
      if (level !== lastLevel) {
        el.style.zIndex = level;
        lastLevel = level;
      }
    },
    info: () => (state ? { place: state.place, x: state.x, z: state.z, following: state.following } : null),
  };
}
