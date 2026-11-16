// Agent de sécurité du hall (A6), branché sur le jeu : la règle est dans core/guard.js, l'image
// est construite avec le lieu (scene/placeView.js). Ici : avancer à chaque pas, prévenir le
// haut-parleur quand le héros bute sur les portiques, et placer l'image (devant ou derrière le héros
// selon la profondeur).
// Limite connue : dans un lieu avec des objets du décor, l'ordre avec eux serait approximatif.
//
// game : { onBlocked() }

import { config } from '../config.js';
import { createGuard, stepGuard } from '../core/guard.js';
import { worldToStageX, worldToStageY, scaleAt } from '../scene/projection.js';
import { actorLevel } from '../scene/depth.js';

export function createGuardWiring(game) {
  let data = null;
  let state = null;
  let el = null;
  let proj = null;
  let refs = [];

  return {
    // Un lieu vient d'être construit : avec ou sans agent.
    attach(place, view, pr) {
      data = place.guard ?? null;
      state = data ? createGuard(data) : null;
      el = view.guard;
      proj = pr;
      refs = view.depthRefs;
    },
    step(walker, intent, dt) {
      if (state && stepGuard(state, data, walker, intent, config.guard.speed, dt) === 'blocked') game.onBlocked();
    },
    // alpha : part du pas en cours (affichage lissé) ; heroZ, heroLevel : où le héros est affiché.
    render(alpha, heroZ, heroLevel) {
      if (!state) return;
      const x = state.prevX + (state.x - state.prevX) * alpha;
      const z = state.prevZ + (state.z - state.prevZ) * alpha;
      const s = scaleAt(proj, z) * data.scale;
      const sx = worldToStageX(proj, x) - data.anchor[0];
      const sy = worldToStageY(proj, z) - data.anchor[1];
      el.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${s * state.facing}, ${s})`;
      // Même niveau que le héros : juste en dessous de lui s'il est plus au fond, juste au-dessus sinon
      // (les niveaux pairs servent aux objets du décor ; le hall n'en a pas). Sans rien déplacer dans la page.
      const level = actorLevel(refs, z);
      el.style.zIndex = level !== heroLevel ? level : z > heroZ ? level - 1 : level + 1;
    },
    info: () => (state ? { x: state.x, z: state.z, gate: state.gate } : null),
  };
}
