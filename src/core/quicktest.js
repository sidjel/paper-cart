// Test rapide T0 / T1 / T2 : un seul essai d'environ 7 minutes, exploitable.
// Les variantes sont mesurées en ALTERNANCE par blocs courts (et dans un ordre inversé un tour
// sur deux) : la chaleur et l'état du téléphone pèsent pareil sur toutes. Logique pure.
//
// Situations : A = personnage en marche, caméra fixe ; B = personnage en marche, caméra mobile.
// Deux séries, même protocole :
// - T0/T1/T2 : T0 = référence ; T1 = « réduire les animations » ; T2 = rayon de devant invisible ;
// - T3 : rayons lointains, ancien rendu (bande entière) contre nouveau (limités aux ouvertures).

import { patrol, placeForConfig } from './protocol.js';

export const QUICK_SUITES = {
  T012: {
    title: 'test rapide T0 / T1 / T2',
    variants: 'T0 = référence · T1 = réduire les animations (rebond, respiration, écrasements, retournement, poussière) · T2 = rayon de devant invisible',
    conditions: [
      { id: 'A-T0', scenario: 'A', variant: 'T0', camera: 'fixed' },
      { id: 'A-T1', scenario: 'A', variant: 'T1', camera: 'fixed' },
      { id: 'B-T0', scenario: 'B', variant: 'T0', camera: 'hero' },
      { id: 'B-T1', scenario: 'B', variant: 'T1', camera: 'hero' },
      { id: 'B-T2', scenario: 'B', variant: 'T2', camera: 'hero' },
    ],
    warmup: 2, // chauffe en B-T0 : la situation la plus chargée
    comparisons: [
      ['T1 contre T0, caméra fixe (A)', 'A-T1', 'A-T0'],
      ['T1 contre T0, caméra mobile (B)', 'B-T1', 'B-T0'],
      ['T2 contre T0, caméra mobile (B)', 'B-T2', 'B-T0'],
      ['Caméra mobile contre fixe (T0)', 'B-T0', 'A-T0'],
    ],
  },
  T3: {
    title: 'test T3 — rayons lointains : ancien contre nouveau',
    variants: 'ancien = rayons lointains dessinés en bande entière (avant) · nouveau = rayons lointains limités aux deux ouvertures (après) ; tout le reste identique',
    conditions: [
      { id: 'A-ancien', scenario: 'A', variant: 'far-full', camera: 'fixed' },
      { id: 'A-nouveau', scenario: 'A', variant: 'far-windows', camera: 'fixed' },
      { id: 'B-ancien', scenario: 'B', variant: 'far-full', camera: 'hero' },
      { id: 'B-nouveau', scenario: 'B', variant: 'far-windows', camera: 'hero' },
    ],
    warmup: 2, // chauffe en B-ancien
    comparisons: [
      ['Nouveau contre ancien, caméra mobile (B)', 'B-nouveau', 'B-ancien'],
      ['Nouveau contre ancien, caméra fixe (A, contrôle)', 'A-nouveau', 'A-ancien'],
      ['Caméra mobile contre fixe (ancien)', 'B-ancien', 'A-ancien'],
    ],
  },
};
// Série T0/T1/T2 (nom gardé pour la lisibilité des tests).
export const QUICK_CONDITIONS = QUICK_SUITES.T012.conditions;

// p : { warmup, block, settle, rounds } en secondes (settle : début de bloc ignoré après un changement).
export function createQuickTest(def, p, suite = 'T012') {
  return { def, ...p, suite: QUICK_SUITES[suite], suiteId: suite, phase: 'warmup', t: 0, round: 0, slot: 0, measuring: false, changed: true };
}

// Ordre des conditions dans un tour : normal un tour sur deux, inversé sinon.
export function quickOrder(round, count = QUICK_CONDITIONS.length) {
  const o = Array.from({ length: count }, (_, i) => i);
  return round % 2 === 0 ? o : o.reverse();
}

export function quickCondition(q) {
  if (q.phase !== 'block') return q.suite.warmup;
  return quickOrder(q.round, q.suite.conditions.length)[q.slot];
}

export function quickConditionDef(q) {
  return q.suite.conditions[quickCondition(q)];
}

export function quickTotalSeconds(q) {
  return q.warmup + q.rounds * q.suite.conditions.length * q.block;
}

export function quickElapsed(q) {
  if (q.phase === 'warmup') return q.t;
  if (q.phase === 'done') return quickTotalSeconds(q);
  return q.warmup + (q.round * q.suite.conditions.length + q.slot) * q.block + q.t;
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
    if (++q.slot >= q.suite.conditions.length) {
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
