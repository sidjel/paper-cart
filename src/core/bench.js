// Banc d'essai : le personnage parcourt tout seul le lieu, toujours de la même façon
// (même trajet, mêmes arrêts), pour mesurer la fluidité. Logique pure, sans affichage.
//
// Le parcours est décrit dans les données du lieu (place.bench) :
//   { "start": [x, z], "route": [ { "to": [x, z] }, { "wait": secondes }, … ] }
// Le parcours revient à son point de départ : on peut le répéter plusieurs fois.

import { findPath } from './pathfinding.js';
import { setPath, clearTarget } from './movement.js';

const SEGMENT_TIMEOUT = 20; // s : sécurité si un point n'est jamais atteint

// passes : nombre de tours mesurés ; warmup : secondes de chauffe (non mesurées) avant le premier tour.
export function createBench(def, passes, warmup) {
  return {
    def,
    passes,
    warmup,
    phase: 'warmup', // 'warmup' → 'run' → 'done'
    time: 0, // temps écoulé dans la phase (s)
    pass: 0,
    seg: -1,
    segTime: 0,
    measuring: false,
    segStarts: 0,
  };
}

// Place le personnage au départ du parcours, arrêté, tourné vers la droite, de face.
export function placeAtStart(b, w) {
  const [x, z] = b.def.start;
  w.x = w.prevX = x;
  w.z = w.prevZ = z;
  w.vx = w.vz = 0;
  w.facing = 1;
  w.away = false;
  clearTarget(w);
}

function startSegment(b, w, mask) {
  b.segTime = 0;
  b.segStarts++; // compteur : l'interface voit qu'un chemin vient d'être calculé
  const s = b.def.route[b.seg];
  if (s.to) setPath(w, findPath(mask, w.x, w.z, s.to[0], s.to[1]));
}

// Un pas de logique du banc (à appeler avant stepWalker, avec une intention vide).
export function stepBench(b, w, mask, dt) {
  if (b.phase === 'done') return;
  b.time += dt;
  if (b.phase === 'warmup' && b.time >= b.warmup) {
    // Fin de la chauffe : on repart du début, et on mesure.
    b.phase = 'run';
    b.time = 0;
    b.seg = -1;
    placeAtStart(b, w);
  }
  b.measuring = b.phase === 'run';
  const route = b.def.route;
  if (b.seg >= 0) {
    b.segTime += dt;
    const s = route[b.seg];
    const finished = s.wait !== undefined ? b.segTime >= s.wait : !w.hasTarget || b.segTime > SEGMENT_TIMEOUT;
    if (!finished) return;
  }
  b.seg++;
  if (b.seg >= route.length) {
    b.seg = 0;
    if (b.phase === 'run') {
      b.pass++;
      if (b.pass >= b.passes) {
        b.phase = 'done';
        b.measuring = false;
        clearTarget(w);
        return;
      }
    }
  }
  startSegment(b, w, mask);
}
