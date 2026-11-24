import { describe, it, expect } from 'vitest';
import { behindFactor, stepFade, foregroundOpacity } from '../../src/core/occlusion.js';

const OCCLUDERS = [
  [0, 615, 690, 1080],
  [1685, 600, 2860, 1080],
];

describe('occlusion devant le héros (plantes du premier plan)', () => {
  it('retourne 0 au centre du hall, entre les deux massifs de plantes', () => {
    expect(behindFactor(1200, 950, 1, OCCLUDERS, 0)).toBe(0);
    expect(behindFactor(1200, 950, 1, null, 0)).toBe(0);
    expect(behindFactor(1200, 950, 1, [], 0)).toBe(0);
  });

  it('augmente progressivement au bord des plantes puis atteint 1 complètement derrière', () => {
    const bord = behindFactor(1685, 950, 1, OCCLUDERS, 0);
    expect(bord).toBeGreaterThan(0);
    expect(bord).toBeLessThanOrEqual(1);
    const dedans = behindFactor(1850, 950, 1, OCCLUDERS, 0);
    expect(dedans).toBe(1);
  });

  it('tient compte du décalage de parallaxe horizontal du premier plan', () => {
    // Héros à x=1620, devant x1=1685 : sans parallaxe, juste en dehors (1620+55=1675 < 1685) -> 0
    expect(behindFactor(1620, 950, 1, OCCLUDERS, 0)).toBe(0);
    // Avec parallaxDx = -120, le massif commence à 1565 -> recouvre le héros
    expect(behindFactor(1620, 950, 1, OCCLUDERS, -120)).toBeGreaterThan(0.5);
  });

  it('lisse la transition et devient instantané avec reduceMotion', () => {
    const mid = stepFade(0, 1, 10, 0.05, false);
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(1);
    expect(stepFade(0, 1, 10, 0.05, true)).toBe(1);
    expect(stepFade(0.998, 1, 10, 0.016, false)).toBe(1);
  });

  it('calcule l’opacité du premier plan (1A) entre base et transparence', () => {
    expect(foregroundOpacity(1, 0.45, 0)).toBe(1);
    expect(foregroundOpacity(1, 0.45, 1)).toBeCloseTo(0.45, 5);
    expect(foregroundOpacity(1, 0.45, 0.5)).toBeCloseTo(0.725, 5);
    expect(foregroundOpacity(0.8, 0.4, -0.5)).toBe(0.8);
    expect(foregroundOpacity(0.8, 0.4, 1.5)).toBeCloseTo(0.4, 5);
  });
});
