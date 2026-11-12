// Test rapide T0 / T1 / T2 : un seul essai d'environ 7 minutes, exploitable.
// Les variantes sont mesurées en ALTERNANCE par blocs courts (et dans un ordre inversé un tour
// sur deux) : la chaleur et l'état du téléphone pèsent pareil sur toutes. Logique pure.
//
// Situations : A = personnage en marche, caméra fixe ; B = personnage en marche, caméra mobile.
// Variantes : T0 = référence ; T1 = « réduire les animations » ; T2 = rayon de devant invisible.

import { patrol, placeForConfig } from './protocol.js';

export const QUICK_CONDITIONS = [
  { id: 'A-T0', scenario: 'A', variant: 'T0', camera: 'fixed' },
  { id: 'A-T1', scenario: 'A', variant: 'T1', camera: 'fixed' },
  { id: 'B-T0', scenario: 'B', variant: 'T0', camera: 'hero' },
  { id: 'B-T1', scenario: 'B', variant: 'T1', camera: 'hero' },
  { id: 'B-T2', scenario: 'B', variant: 'T2', camera: 'hero' },
];
const WARMUP_CONDITION = 2; // chauffe en B-T0 : la situation la plus chargée

// p : { warmup, block, settle, rounds } en secondes (settle : début de bloc ignoré après un changement).
export function createQuickTest(def, p) {
  return { def, ...p, phase: 'warmup', t: 0, round: 0, slot: 0, measuring: false, changed: true };
}

// Ordre des conditions dans un tour : normal un tour sur deux, inversé sinon.
export function quickOrder(round) {
  const o = QUICK_CONDITIONS.map((_, i) => i);
  return round % 2 === 0 ? o : o.reverse();
}

export function quickCondition(q) {
  if (q.phase !== 'block') return WARMUP_CONDITION;
  return quickOrder(q.round)[q.slot];
}

export function quickTotalSeconds(q) {
  return q.warmup + q.rounds * QUICK_CONDITIONS.length * q.block;
}

export function quickElapsed(q) {
  if (q.phase === 'warmup') return q.t;
  if (q.phase === 'done') return quickTotalSeconds(q);
  return q.warmup + (q.round * QUICK_CONDITIONS.length + q.slot) * q.block + q.t;
}

export function startQuickTest(q, hero, ghost) {
  // Même point de départ que le diagnostic complet (aller-retour en ligne droite).
  placeForConfig({ def: q.def, ci: 1 }, hero, ghost);
}

export function stepQuickTest(q, hero, dt) {
  q.changed = false;
  if (q.phase === 'done') return;
  q.t += dt;
  if (q.phase === 'warmup' && q.t >= q.warmup) {
    q.phase = 'block';
    q.t = 0;
    q.changed = true;
  } else if (q.phase === 'block' && q.t >= q.block) {
    q.t = 0;
    q.changed = true;
    if (++q.slot >= QUICK_CONDITIONS.length) {
      q.slot = 0;
      if (++q.round >= q.rounds) {
        q.phase = 'done';
        q.measuring = false;
        return;
      }
    }
  }
  q.measuring = q.phase === 'block' && q.t >= q.settle;
  patrol(hero, q.def);
}
