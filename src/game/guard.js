// Agent de sécurité du hall (A6, refait séance 57), branché sur le jeu : la règle est dans
// core/guard.js, les images (repos, geste d'arrêt) sont construites avec le lieu (scene/placeView.js).
// Ici : avancer à chaque pas ; quand l'agent interpelle le héros, le jeu le fige le temps de la bulle ;
// quand il force, un petit pas forcé vers la droite ; placer l'image (devant ou derrière le héros et les
// portiques selon la profondeur), et dire où est sa tête (pour sa bulle).
//
// Quand l'agent l'interpelle, le héros sursaute : « !! » et gouttes de sueur au-dessus de sa tête
// (élément créé une fois, au chargement, dans l'interface).
//
// game : { ui, onWarn(), talking() → l'agent parle, push(dx) → pas forcé vers la droite,
//          heroHead() → haut de la tête du héros, en pixels d'écran }

import { config } from '../config.js';
import { createGuard, stepGuard } from '../core/guard.js';
import { worldToStageX, worldToStageY, scaleAt } from '../scene/projection.js';
import { actorLevel } from '../scene/depth.js';

const PUSH_TIME = 0.35; // pendant le pas forcé, les commandes attendent (s)
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
  let imgs = null;
  let proj = null;
  let refs = [];
  let pose = 'idle';
  let pushT = 0;
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
    attach(place, view, pr) {
      data = place.guard ?? null;
      state = data ? createGuard(data) : null;
      imgs = view.guard;
      proj = pr;
      refs = view.depthRefs;
      pose = 'idle';
      pushT = 0;
      setSurprise(0);
    },
    // Les commandes du joueur attendent : l'agent parle, ou repousse le héros.
    holding: () => state !== null && (pushT > 0 || game.talking()),
    step(walker, intent, dt) {
      if (!state) return;
      pushT = Math.max(0, pushT - dt);
      if (surpriseT > 0) setSurprise(surpriseT - dt);
      const e = stepGuard(state, data, walker, intent, config.guard.speed, dt);
      if (e === 'warn') {
        game.onWarn();
        setSurprise(SURPRISE_TIME);
      }
      else if (e === 'push') {
        game.push(data.pushDist);
        pushT = PUSH_TIME;
      }
    },
    // alpha : part du pas en cours (affichage lissé) ; heroZ, heroLevel : où le héros est affiché.
    render(alpha, heroZ, heroLevel) {
      if (!state) return;
      if (surpriseT > 0) {
        const h = game.heroHead();
        surprise.style.transform = `translate3d(${h.x - 30}px, ${h.y - 70}px, 0)`;
      }
      const x = state.prevX + (state.x - state.prevX) * alpha;
      const z = state.prevZ + (state.z - state.prevZ) * alpha;
      const s = scaleAt(proj, z) * data.scale;
      const fx = worldToStageX(proj, x);
      const fy = worldToStageY(proj, z);
      head.x = fx;
      head.y = fy - HEAD * s;
      const p = state.stopT > 0 || game.talking() ? 'stop' : 'idle';
      if (p !== pose) {
        imgs.idle.hidden = p !== 'idle';
        imgs.stop.hidden = p !== 'stop';
        pose = p;
      }
      const el = imgs[pose];
      el.style.transform = `translate3d(${fx - data.anchor[0]}px, ${fy - data.anchor[1]}px, 0) scale(${s})`;
      // Même niveau que le héros : juste en dessous de lui s'il est plus au fond, juste au-dessus sinon.
      // Sans rien déplacer dans la page.
      const level = actorLevel(refs, z);
      el.style.zIndex = level !== heroLevel ? level : z > heroZ ? level - 1 : level + 1;
    },
    head: () => head, // en coordonnées de la scène
    info: () => (state ? { x: state.x, z: state.z, warned: state.warned, pose } : null),
  };
}
