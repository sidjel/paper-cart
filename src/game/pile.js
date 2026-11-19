// Pile de cartons (A8), branchée sur le jeu : la règle est dans core/pile.js, l'état (debout, tombée) dans
// l'état du lieu (le monde se souvient). Son dessin est un objet du décor (scene/props.js) : on ne fait que
// le pencher (vacillement, puis chute autour de son pied), en transform seulement, sans changer de calque.
// Tombée, elle ne bloque plus le passage (son obstacle est vidé) et l'objet qu'elle cachait se prend.
//
// game : { onPush() → le héros commence à pousser, onFall() → elle tombe }

import { config } from '../config.js';
import { stepPile, wobble } from '../core/pile.js';

const EMPTY = new Float64Array(0); // obstacle retiré (créé une fois)
const FALL_ANGLE = 82; // angle de la pile tombée (degrés)

export function createPileWiring(game) {
  let data = null;
  let state = null; // état du lieu (core/pile.js), ou null sans pile
  let el = null;
  let hidesEl = null;
  let base = '';
  let mask = null;
  let k = -1;
  let pickups = null;
  let shown = NaN;

  function clearObstacle() {
    if (k >= 0) mask.obstacles[k] = EMPTY;
  }
  function hideTaken() {
    const it = pickups.find((p) => p.id === data.hides);
    if (state.down && it?.scanned && hidesEl && !hidesEl.hidden) hidesEl.hidden = true; // pris
  }

  return {
    // Un lieu vient d'être construit : avec ou sans pile.
    attach(place, view, here, m) {
      data = place.pile ?? null;
      state = data ? here.pile : null;
      shown = NaN;
      if (!state) return;
      mask = m;
      pickups = here.pickups;
      const def = place.props.find((p) => p.id === data.prop);
      el = view.props.find((p) => p.id === data.prop).el;
      hidesEl = view.props.find((p) => p.id === data.hidesProp)?.el ?? null;
      base = el.style.transform;
      el.style.transformOrigin = `${def.anchor[0]}px ${def.anchor[1]}px`;
      k = place.walkMask.obstacles.findIndex((o) => o.name === data.obstacle);
      if (state.down) {
        state.fall = 1;
        clearObstacle();
        hideTaken();
      }
    },
    // Après le pas du héros et du chariot. chariot : état du chariot poussé ici (ou null).
    step(walker, intent, chariot, dt) {
      if (!state) return;
      const e = stepPile(state, mask.obstacles[k], walker, intent, chariot, config.chariot.offset + config.chariot.front, config.pile, dt);
      if (e === 'pousse') game.onPush();
      if (e !== 'tombe') return;
      if (config.display.reduceMotion) state.fall = 1; // « réduire les animations » : elle est tombée d'un coup
      clearObstacle();
      const it = pickups.find((p) => p.id === data.hides);
      if (it && !game.owns(it.id)) it.scanned = false; // ce qu'elle cachait se prend maintenant
      game.onFall();
    },
    // L'objet caché vient d'être pris : son dessin quitte le sol.
    taken(id) {
      if (state && id === data.hides) hideTaken();
    },
    // time : temps de jeu (vacillement).
    render(time) {
      if (!state) return;
      const t = state.fall;
      const ease = 1 - (1 - t) * (1 - t);
      const still = config.display.reduceMotion;
      const a = state.down ? state.dir * FALL_ANGLE * ease : still ? 0 : wobble(state, config.pile) * config.pile.wobble * Math.sin(time * 24);
      if (a === shown) return;
      shown = a;
      el.style.transform = `${base} rotate(${a.toFixed(2)}deg)`;
    },
    info: () => (state ? { down: state.down, push: state.push } : null),
  };
}
