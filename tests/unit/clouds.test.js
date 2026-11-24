import { describe, it, expect } from 'vitest';
import { cloudPose } from '../../src/core/clouds.js';

const SPAN = [-200, 3800];

describe('nuages origami dérivants (src/core/clouds.js)', () => {
  it('avance lentement dans le ciel et boucle dans span', () => {
    const c = { y: 60, scale: 0.9, speed: 12, dir: 1, phase: 0.1, bob: 2 };
    const p0 = cloudPose(c, 0, SPAN, false);
    const p10 = cloudPose(c, 10, SPAN, false);
    expect(p10.x - p0.x).toBeCloseTo(120, 5);
    expect(p10.scale).toBe(0.9);
    for (const t of [0, 30, 150, 999]) {
      const p = cloudPose(c, t, SPAN, false);
      expect(p.x).toBeGreaterThanOrEqual(SPAN[0]);
      expect(p.x).toBeLessThanOrEqual(SPAN[1]);
    }
  });

  it('se fige proprement quand reduceMotion est activé', () => {
    const c = { y: 72, scale: 0.85, speed: 14, dir: 1, phase: 0.4, bob: 3 };
    const p0 = cloudPose(c, 0, SPAN, true);
    const pLater = cloudPose(c, 42, SPAN, true);
    expect(pLater).toEqual(p0);
    expect(p0.y).toBe(72);
  });
});
