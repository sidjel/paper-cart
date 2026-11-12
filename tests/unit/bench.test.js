import { describe, it, expect } from 'vitest';
import { createBench, stepBench, placeAtStart } from '../../src/core/bench.js';
import { createWalker, stepWalker } from '../../src/core/movement.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import { createStateMachine } from '../../src/core/state.js';
import place from '../../src/data/places/rayon-essai.json';

const mask = compileMask(place.walkMask);
const P = { maxSpeed: 520, acceleration: 10000, deceleration: 12000, depthFactor: 0.8, arrivalRadius: 4 };
const none = { moveX: 0, moveZ: 0 };
const DT = 1 / 60;

function run(b, w, maxSteps) {
  const trace = [];
  for (let i = 0; i < maxSteps && b.phase !== 'done'; i++) {
    stepBench(b, w, mask, DT);
    stepWalker(w, none, mask, P, DT);
    if (b.measuring) trace.push(w.x, w.z);
  }
  return trace;
}

describe('banc d’essai', () => {
  it('chaque point du parcours est praticable', () => {
    expect(isWalkable(mask, ...place.bench.start)).toBe(true);
    for (const s of place.bench.route) if (s.to) expect(isWalkable(mask, ...s.to)).toBe(true);
  });
  it('fait la chauffe, puis les tours demandés, puis s’arrête', () => {
    const w = createWalker(0, 0);
    const b = createBench(place.bench, 2, 1);
    placeAtStart(b, w);
    run(b, w, 60 * 200);
    expect(b.phase).toBe('done');
    expect(b.pass).toBe(2);
  });
  it('toujours exactement le même trajet', () => {
    const go = () => {
      const w = createWalker(0, 0);
      const b = createBench(place.bench, 1, 0.5);
      placeAtStart(b, w);
      return run(b, w, 60 * 200);
    };
    const a = go();
    expect(a.length).toBeGreaterThan(600);
    expect(go()).toEqual(a);
  });
  it('chaque point est vraiment atteint (aucun abandon)', () => {
    const w = createWalker(0, 0);
    const b = createBench(place.bench, 1, 0);
    placeAtStart(b, w);
    let lastSeg = -1;
    for (let i = 0; i < 60 * 200 && b.phase !== 'done'; i++) {
      if (b.seg !== lastSeg && lastSeg >= 0 && place.bench.route[lastSeg].to) {
        const [x, z] = place.bench.route[lastSeg].to;
        expect(Math.hypot(w.x - x, w.z - z)).toBeLessThan(6);
      }
      lastSeg = b.seg;
      stepBench(b, w, mask, DT);
      stepWalker(w, none, mask, P, DT);
    }
  });
  it('l’état « banc d’essai » se lance depuis le menu et revient au jeu', () => {
    const sm = createStateMachine('menu');
    expect(sm.go('bench')).toBe(true);
    expect(sm.go('pause')).toBe(false);
    expect(sm.go('play')).toBe(true);
  });
});
