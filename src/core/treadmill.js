// Logique pure du studio de test libre (salle-test) : marche sur place sur 8 directions et vitesse ralentie.
// Sortie de main.js pour respecter la séparation src/core/ (aucun DOM).

import { directionFromVector, directionToView } from './direction.js';
import { clearTarget } from './movement.js';

export const TREADMILL_SLOW_FACTOR = 0.4;

const DIR_VEC = {
  S: [0, -1],
  SE: [Math.SQRT1_2, -Math.SQRT1_2],
  E: [1, 0],
  NE: [Math.SQRT1_2, Math.SQRT1_2],
  N: [0, 1],
  NW: [-Math.SQRT1_2, Math.SQRT1_2],
  W: [-1, 0],
  SW: [-Math.SQRT1_2, -Math.SQRT1_2],
};

// Oriente le héros dans une des 8 directions sans le déplacer.
export function setTreadmillDirection(walker, dir) {
  if (!walker || !DIR_VEC[dir]) return;
  walker.dir = dir;
  walker.facing = directionToView(dir).flip;
  walker.away = dir === 'N' || dir === 'NE' || dir === 'NW';
  clearTarget(walker);
}

// Avance d'un pas sur le tapis roulant (marche sur place à vitesse réelle selon la direction).
export function stepTreadmill(walker, intent, walkCfg, { paused = false, slow = false }, dt) {
  clearTarget(walker);
  walker.prevX = walker.x;
  walker.prevZ = walker.z;
  if (intent.moveX !== 0 || intent.moveZ !== 0) {
    const dir = directionFromVector(intent.moveX, intent.moveZ);
    if (dir) setTreadmillDirection(walker, dir);
  }
  walker.moving = !paused;
  if (walker.moving) {
    const [ux, uz] = DIR_VEC[walker.dir] ?? DIR_VEC.S;
    const dirSpeed = Math.hypot(ux, uz * walkCfg.depthFactor) * walkCfg.maxSpeed;
    walker.distance += dirSpeed * (slow ? TREADMILL_SLOW_FACTOR : 1) * dt;
  }
}

// Renvoie la configuration de marche adaptée au mode ralenti (sans muter l'original).
export function treadmillWalkConfig(walkCfg, slow) {
  return slow ? { ...walkCfg, maxSpeed: walkCfg.maxSpeed * TREADMILL_SLOW_FACTOR } : walkCfg;
}
