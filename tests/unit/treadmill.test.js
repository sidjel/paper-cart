import { describe, it, expect } from 'vitest';
import { createWalker } from '../../src/core/movement.js';
import { setTreadmillDirection, stepTreadmill, treadmillWalkConfig, TREADMILL_SLOW_FACTOR } from '../../src/core/treadmill.js';

const WALK = { maxSpeed: 500, depthFactor: 0.8 };

describe('studio de test libre (core/treadmill.js)', () => {
  it('oriente le héros sur les 8 directions sans le déplacer', () => {
    const w = createWalker(100, 50);
    setTreadmillDirection(w, 'NW');
    expect(w.dir).toBe('NW');
    expect(w.facing).toBe(-1);
    expect(w.away).toBe(true);
    expect([w.x, w.z]).toEqual([100, 50]);
  });

  it('avance la distance sur place à la vitesse réelle et respecte ralenti et pause', () => {
    const w = createWalker(100, 50);
    setTreadmillDirection(w, 'E');
    stepTreadmill(w, { moveX: 0, moveZ: 0 }, WALK, { paused: false, slow: false }, 0.5);
    expect(w.moving).toBe(true);
    expect(w.distance).toBeCloseTo(250);
    expect([w.x, w.z]).toEqual([100, 50]);

    const beforeSlow = w.distance;
    stepTreadmill(w, { moveX: 0, moveZ: 0 }, WALK, { paused: false, slow: true }, 0.5);
    expect(w.distance - beforeSlow).toBeCloseTo(250 * TREADMILL_SLOW_FACTOR);

    const beforePause = w.distance;
    stepTreadmill(w, { moveX: 0, moveZ: 0 }, WALK, { paused: true, slow: false }, 0.5);
    expect(w.moving).toBe(false);
    expect(w.distance).toBe(beforePause);
  });

  it('treadmillWalkConfig applique le facteur ralenti sans muter l’original', () => {
    const slow = treadmillWalkConfig(WALK, true);
    expect(slow.maxSpeed).toBeCloseTo(500 * TREADMILL_SLOW_FACTOR);
    expect(WALK.maxSpeed).toBe(500);
    expect(treadmillWalkConfig(WALK, false)).toBe(WALK);
  });
});
