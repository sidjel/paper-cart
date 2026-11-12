import { describe, it, expect } from 'vitest';
import { createQuickTest, stepQuickTest, startQuickTest, quickCondition, quickOrder, quickTotalSeconds, QUICK_CONDITIONS } from '../../src/core/quicktest.js';
import { rateRatio, verdict } from '../../src/ui/quicktest.js';
import { createWalker, stepWalker } from '../../src/core/movement.js';
import { compileMask } from '../../src/core/walkmask.js';
import place from '../../src/data/places/rayon-essai.json';

const mask = compileMask(place.walkMask);
const P = { maxSpeed: 520, acceleration: 10000, deceleration: 12000, depthFactor: 0.8, arrivalRadius: 4 };
const DT = 1 / 60;

describe('test rapide T0 / T1 / T2', () => {
  it('dure environ 7 minutes avec les réglages par défaut', () => {
    expect(quickTotalSeconds(createQuickTest(place.diagnostic, { warmup: 30, block: 20, settle: 2, rounds: 4 }))).toBe(430);
  });
  it('mesure chaque condition le même temps, en alternance, ordre inversé un tour sur deux', () => {
    const hero = createWalker(0, 0), ghost = createWalker(0, 0);
    const q = createQuickTest(place.diagnostic, { warmup: 1, block: 2, settle: 0.5, rounds: 4 });
    startQuickTest(q, hero, ghost);
    const measured = new Array(QUICK_CONDITIONS.length).fill(0);
    const sequence = [];
    while (q.phase !== 'done') {
      stepQuickTest(q, hero, DT);
      stepWalker(hero, { moveX: 0, moveZ: 0 }, mask, P, DT);
      if (q.measuring) {
        const c = quickCondition(q);
        measured[c]++;
        const key = `${q.round}.${q.slot}`;
        if (sequence.lastKey !== key) {
          sequence.push(c);
          sequence.lastKey = key;
        }
      }
    }
    // Même durée mesurée pour chaque condition (à un pas près par bloc).
    for (const m of measured) expect(Math.abs(m - measured[0])).toBeLessThanOrEqual(4);
    expect([...sequence]).toEqual([...quickOrder(0), ...quickOrder(1), ...quickOrder(2), ...quickOrder(3)]);
    expect(quickOrder(1)).toEqual([4, 3, 2, 1, 0]);
  });
  it('le personnage marche pendant toutes les mesures, sur l’aller-retour prévu', () => {
    const hero = createWalker(0, 0), ghost = createWalker(0, 0);
    const q = createQuickTest(place.diagnostic, { warmup: 1, block: 2, settle: 0.5, rounds: 1 });
    startQuickTest(q, hero, ghost);
    let moving = 0, total = 0;
    while (q.phase !== 'done') {
      stepQuickTest(q, hero, DT);
      stepWalker(hero, { moveX: 0, moveZ: 0 }, mask, P, DT);
      if (q.measuring) {
        total++;
        if (hero.moving) moving++;
        expect(hero.z).toBeCloseTo(place.diagnostic.a[1], 5);
      }
    }
    expect(moving / total).toBeGreaterThan(0.9);
  });
  it('marge d’incertitude : un vrai écart est démontré, un petit écart sur peu d’images ne l’est pas', () => {
    expect(verdict(rateRatio(20, 80, 200, 80))).toBe('amélioration démontrée');
    expect(verdict(rateRatio(9, 80, 11, 80))).toBe('pas de différence démontrée');
    expect(verdict(rateRatio(300, 80, 100, 80))).toBe('dégradation démontrée');
    expect(rateRatio(0, 80, 10, 80).hi).toBeLessThan(1); // zéro image lente : traité sans division par zéro
  });
});
