// Agent de sécurité du hall (A6), branché sur le jeu : la règle est dans core/guard.js, la boîte et ses
// deux poses (repos, geste d'arrêt) sont construites avec le lieu (scene/placeView.js), rangée en
// profondeur avec les objets du décor. Ici : avancer à chaque pas ; la première fois, l'agent interpelle
// le héros (figé le temps de la bulle) ; ensuite, s'il force, « Stop ! » et le héros fait demi-tour de
// quelques pas ; placer la boîte et dire où est la tête de l'agent (pour sa bulle).
//
// Quand l'agent l'interpelle, le héros sursaute : « !! » et gouttes de sueur au-dessus de sa tête
// (élément créé une fois, au chargement, dans l'interface).
//
// game : { ui, onWarn(), onStop(), talking() → l'agent parle, back(dx) → demi-tour de dx vers la droite,
//          heroHead() → haut de la tête du héros, en pixels d'écran }

import { config } from '../config.js';
import { createGuard, stepGuard } from '../core/guard.js';
import { worldToStageX, worldToStageY, scaleAt } from '../scene/projection.js';

const BACK_TIME = 0.6; // pendant le demi-tour, les commandes attendent (s)
const HEAD = 290; // haut de la tête de l'agent, au-dessus de ses pieds (px de l'image)
const SURPRISE_TIME = 1.4; // durée du « !! » du héros (s)
const SURPRISE_SVG =
  '<svg viewBox="0 0 90 70" width="90" height="70" aria-hidden="true">' +
  '<g stroke="#4a4236" stroke-width="3" stroke-linejoin="round">' +
  '<path d="M20 6 l10 -2 l-2 38 l-7 1 z" fill="#e9c24a"/><circle cx="25" cy="54" r="5" fill="#e9c24a"/>' +
  '<path d="M44 2 l11 1 l-6 40 l-7 0 z" fill="#d0503f"/><circle cx="45" cy="54" r="5" fill="#d0503f"/>' +
  '<path d="M70 26 q6 8 0 12 q-6 -4 0 -12 z M80 40 q5 7 0 10 q-5 -3 0 -10 z" fill="#8fc0e6" stroke-width="2.4"/>' +
  '</g></svg>';

export function createGuardWiring(game) {
  let data = null;
  let state = null;
  let view = null; // { box, idle, stop }
  let proj = null;
  let pose = 'idle';
  let backT = 0;
  const head = { x: 0, y: 0 };
  const surprise = document.createElement('div');
  surprise.className = 'hero-surprise';
  surprise.hidden = true;
  surprise.innerHTML = SURPRISE_SVG;
  game.ui.appendChild(surprise);
  let surpriseT = 0;
  function setSurprise(t) {
    surpriseT = t;
    if (surprise.hidden !== t <= 0) surprise.hidden = t <= 0;
  }

  return {
    // Un lieu vient d'être construit : avec ou sans agent.
    attach(place, v, pr) {
      data = place.guard ?? null;
      state = data ? createGuard(data) : null;
      view = v.guard;
      proj = pr;
      pose = 'idle';
      backT = 0;
      setSurprise(0);
    },
    // Les commandes du joueur attendent : l'agent parle, ou repousse le héros.
    holding: () => state !== null && (backT > 0 || game.talking()),
    step(walker, intent, dt) {
      if (!state) return;
      backT = Math.max(0, backT - dt);
      if (surpriseT > 0) setSurprise(surpriseT - dt);
      const e = stepGuard(state, data, walker, intent, config.guard.speed, dt);
      if (e === 'warn') {
        game.onWarn();
        setSurprise(SURPRISE_TIME);
      }
      else if (e === 'stop') {
        game.onStop();
        game.back(data.backDist);
        backT = BACK_TIME;
      }
    },
    // alpha : part du pas en cours (affichage lissé).
    render(alpha) {
      if (!state) return;
      if (surpriseT > 0) {
        const h = game.heroHead();
        surprise.style.transform = `translate3d(${h.x - 30}px, ${h.y - 70}px, 0)`;
      }
      const x = state.prevX + (state.x - state.prevX) * alpha;
      const s = scaleAt(proj, state.z) * data.scale;
      const fx = worldToStageX(proj, x);
      const fy = worldToStageY(proj, state.z);
      head.x = fx;
      head.y = fy - HEAD * s;
      const p = state.stopT > 0 || game.talking() ? 'stop' : 'idle';
      if (p !== pose) {
        view.idle.hidden = p !== 'idle';
        view.stop.hidden = p !== 'stop';
        pose = p;
      }
      view.box.style.transform = `translate3d(${fx - data.anchor[0]}px, ${fy - data.anchor[1]}px, 0) scale(${s})`;
    },
    head: () => head, // en coordonnées de la scène
    info: () => (state ? { x: state.x, z: state.z, warned: state.warned, pose } : null),
  };
}
