// Pile de cartons (A8), branchée sur le jeu sous PixiJS v8 : la règle est dans core/pile.js,
// l'état dans le lieu (core/world.js). Son dessin est un prop (scene/props.js) : on ne fait que
// le pencher via setRotation (vacillement puis chute autour de son point d'ancrage).

import { config } from '../config.js';
import { stepPile, wobble } from '../core/pile.js';

const EMPTY = new Float64Array(0); // obstacle retiré (créé une fois)
const FALL_ANGLE = 82; // angle de la pile tombée (degrés)

export function createPileWiring(game) {
  let data = null;
  let state = null;
  let prop = null;
  let hidesProp = null;
  let mask = null;
  let k = -1;
  let pickups = null;
  let shown = NaN;

  function clearObstacle() {
    if (k >= 0) mask.obstacles[k] = EMPTY;
  }
  function hideTaken() {
    const it = pickups.find((p) => p.id === data.hides);
    if (state.down && it?.scanned && hidesProp) hidesProp.setVisible(false);
  }

  return {
    attach(place, view, here, m) {
      data = place.pile ?? null;
      state = data ? here.pile : null;
      shown = NaN;
      if (!state) return;
      mask = m;
      pickups = here.pickups;
      prop = view.props.find((p) => p.id === data.prop);
      hidesProp = view.props.find((p) => p.id === data.hidesProp) ?? null;
      k = place.walkMask.obstacles.findIndex((o) => o.name === data.obstacle);
      if (state.down) {
        state.fall = 1;
        clearObstacle();
        hideTaken();
      }
    },
    step(walker, intent, chariot, dt) {
      if (!state) return;
      const e = stepPile(state, mask.obstacles[k], walker, intent, chariot, config.chariot.offset + config.chariot.front, config.pile, dt);
      if (e === 'pousse') game.onPush();
      if (e !== 'tombe') return;
      if (config.display.reduceMotion) state.fall = 1;
      clearObstacle();
      const it = pickups.find((p) => p.id === data.hides);
      if (it && !game.owns(it.id)) it.scanned = false;
      game.onFall();
    },
    taken(id) {
      if (state && id === data.hides) hideTaken();
    },
    render(time) {
      if (!state || !prop) return;
      const t = state.fall;
      const ease = 1 - (1 - t) * (1 - t);
      const still = config.display.reduceMotion;
      const a = state.down ? state.dir * FALL_ANGLE * ease : still ? 0 : wobble(state, config.pile) * config.pile.wobble * Math.sin(time * 24);
      if (a === shown) return;
      shown = a;
      prop.setRotation(a);
    },
    info: () => (state ? { down: state.down, push: state.push } : null),
  };
}
