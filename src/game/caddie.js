// Le caddie jouable (A8, étape 1/3), branché sur le jeu : la règle est dans core/caddie.js.
// Une seule image, créée au chargement ; comme le héros, elle passe sur le calque des acteurs du lieu
// affiché (mount), et n'est montrée que dans le lieu où le caddie se trouve (le changement se fait dans
// le noir d'un changement de lieu). Rangée en profondeur comme un personnage ; avec le héros, le plus
// proche passe devant.
//
// game : { walker(), place() → id du lieu affiché }

import { config } from '../config.js';
import { createCaddie, takeCaddie, parkCaddie, nearCaddie, leaveCaddie, stepCaddie } from '../core/caddie.js';
import { worldToStageX, worldToStageY, scaleAt } from '../scene/projection.js';
import { actorLevel } from '../scene/depth.js';

export const CADDIE_IMAGE = 'art/placeholder/caddie-vide.svg';
export const CADDIE_SIZE = [335, 250];
const ANCHOR = [212, 230]; // point du sol sous le caddie, dans l'image (comme le caddie du décor)

// image : { url, w, h } (images communes, préparées au chargement).
export function createCaddieWiring(game, image, parent) {
  let state = null; // pas de caddie tant que le héros n'en a pas
  const el = new Image();
  el.src = image.url;
  el.className = 'caddie';
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
    // Le héros reçoit un caddie (point de départ de test, en attendant le comptoir) : il le suit.
    give() {
      const w = game.walker();
      state = createCaddie(game.place(), w.x - config.caddie.follow, w.z);
      takeCaddie(state, w);
      // Avant le dévoilement de la scène (point de départ) : il apparaît dans le noir.
      shownHere = true;
      el.hidden = false;
    },
    // Un lieu vient d'être construit : le caddie s'y montre seulement s'il y est.
    attach(pr) {
      proj = pr;
      shownHere = state !== null && state.place === game.place();
      if (el.hidden === shownHere) el.hidden = !shownHere;
    },
    // On quitte le lieu : le caddie reste là où il est, garé.
    leaving() {
      if (state) leaveCaddie(state);
    },
    // Bouton d'action : 'garer', 'reprendre' ou '' (rien à faire avec le caddie ici).
    action() {
      if (!state || !nearCaddie(state, game.walker(), game.place(), config.caddie.range)) return '';
      return state.following ? 'garer' : 'reprendre';
    },
    toggle() {
      const a = this.action();
      if (a === 'garer') parkCaddie(state);
      else if (a === 'reprendre') takeCaddie(state, game.walker());
      return a;
    },
    step(dt) {
      if (state && shownHere) stepCaddie(state, game.walker(), config.caddie, dt);
    },
    // Le héros est-il plus proche que le caddie (il passe alors devant lui, dans une même bande) ?
    heroNearer(z) {
      return shownHere && z <= state.z + 1;
    },
    render(alpha, refs) {
      if (!shownHere) return;
      const x = state.prevX + (state.x - state.prevX) * alpha;
      const z = state.prevZ + (state.z - state.prevZ) * alpha;
      const s = scaleAt(proj, z) * config.caddie.size;
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
