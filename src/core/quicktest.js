// Tests rapides : plusieurs variantes mesurées dans un seul essai, en ALTERNANCE par blocs courts
// (ordre inversé un tour sur deux) : la chaleur et l'état du téléphone pèsent pareil sur toutes.
// Les variantes ne s'appliquent que pendant le test. Logique pure.
// (Les variantes F1 à F3 des rayons lointains, rejetées par les mesures de la séance 20, ont été retirées.)
//
// Situations : A = personnage en marche, caméra fixe ; B = personnage en marche, caméra mobile.

import { patrol, placeForConfig } from './protocol.js';

export const QUICK_SUITES = {
  // Test rapide T0 / T1 / T2 (séance 13).
  T012: {
    title: 'test rapide T0 / T1 / T2',
    variants: 'T0 = référence · T1 = réduire les animations (rebond, respiration, écrasements, retournement, poussière) · T2 = rayon de devant invisible',
    conditions: [
      { id: 'A-T0', variant: 'T0', camera: 'fixed' },
      { id: 'A-T1', variant: 'T1', camera: 'fixed' },
      { id: 'B-T0', variant: 'T0', camera: 'hero' },
      { id: 'B-T1', variant: 'T1', camera: 'hero' },
      { id: 'B-T2', variant: 'T2', camera: 'hero' },
    ],
    warmup: 2, // chauffe en B-T0
    comparisons: [
      ['T1 contre T0, caméra fixe (A)', 'A-T1', 'A-T0'],
      ['T1 contre T0, caméra mobile (B)', 'B-T1', 'B-T0'],
      ['T2 contre T0, caméra mobile (B)', 'B-T2', 'B-T0'],
      ['Caméra mobile contre fixe (T0)', 'B-T0', 'A-T0'],
    ],
  },
  // Campagne « rayon de devant » (séance 21) : tout en caméra mobile, une seule modification par comparaison.
  DEVANT: {
    title: 'campagne « rayon de devant » (caméra mobile)',
    rounds: 6, // assez d'images lentes pour conclure
    variants:
      'T0 = référence · T2 = rayon de devant invisible (gain maximal possible) · ' +
      'G1 = calque réduit à la taille de son image (rien ne change à l’écran) · ' +
      'G4 = comme G1, moitié de hauteur seulement · G2 = rayon de devant opaque',
    conditions: [
      { id: 'T0', variant: 'T0', camera: 'hero' },
      { id: 'T2', variant: 'T2', camera: 'hero' },
      { id: 'G1', variant: 'fg-box', camera: 'hero' },
      { id: 'G4', variant: 'fg-half', camera: 'hero' },
      { id: 'G2', variant: 'fg-opaque', camera: 'hero' },
    ],
    warmup: 0, // chauffe en T0
    comparisons: [
      ['T2 (rayon de devant invisible) contre T0', 'T2', 'T0'],
      ['G1 (calque réduit à l’image, invisible à l’œil) contre T0', 'G1', 'T0'],
      ['G4 (moitié de hauteur) contre G1', 'G4', 'G1'],
      ['G2 (opaque) contre T0', 'G2', 'T0'],
      ['G1 contre T2 (G1 récupère-t-il tout le gain ?)', 'G1', 'T2'],
    ],
  },
};
// Série T0/T1/T2 (nom gardé pour les tests).
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
