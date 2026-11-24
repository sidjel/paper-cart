import { describe, it, expect } from 'vitest';
import { birdPose, createCrowCalls, resetCrowCalls, stepCrowCalls } from '../../src/core/birds.js';

const SPAN = [-140, 2540];
const CYCLE = [0, 1, 2, 3, 5, 4, 2, 1];

describe('vol et marche des oiseaux origami (src/core/birds.js)', () => {
  it('avance de gauche à droite quand dir = 1 et boucle dans span', () => {
    const bird = { y: 200, scale: 0.4, speed: 100, dir: 1, bob: 8, flap: 6, phase: 0.25 };
    const p0 = birdPose(bird, 0, SPAN, CYCLE, false);
    const p1 = birdPose(bird, 1, SPAN, CYCLE, false);
    expect(p1.x - p0.x).toBeCloseTo(100, 5);
    expect(p1.dir).toBe(1);
    expect(p1.scale).toBe(0.4);
    expect(p1.anchorToStage).toBe(false);

    for (const t of [0, 5, 25, 120, 999.7]) {
      const p = birdPose(bird, t, SPAN, CYCLE, false);
      expect(p.x).toBeGreaterThanOrEqual(SPAN[0]);
      expect(p.x).toBeLessThanOrEqual(SPAN[1]);
      expect(CYCLE).toContain(p.frame);
    }
  });

  it('avance de droite à gauche quand dir = -1', () => {
    const bird = { y: 120, scale: 0.3, speed: 50, dir: -1, bob: 5, flap: 8, phase: 0.5 };
    const p0 = birdPose(bird, 0, SPAN, CYCLE, false);
    const p1 = birdPose(bird, 2, SPAN, CYCLE, false);
    expect(p0.x - p1.x).toBeCloseTo(100, 5);
    expect(p1.dir).toBe(-1);
  });

  it('fige la position et la pose quand reduceMotion est activé', () => {
    const bird = { y: 180, scale: 0.35, speed: 80, dir: 1, bob: 10, flap: 7, phase: 0.4 };
    const p0 = birdPose(bird, 0, SPAN, CYCLE, true);
    const pLater = birdPose(bird, 14.3, SPAN, CYCLE, true);
    expect(pLater).toEqual(p0);
    expect(p0.y).toBe(180);
    expect(p0.frame).toBe(CYCLE[0]);
  });

  it('marche de façon irrégulière par à-coups avec micro-pauses, retournement et bornage dans walkSpan', () => {
    const walker = { mode: 'walk', y: 107, scale: 0.72, speed: 34, walkSpan: [800, 1000], pause: 1, flap: 6.4, bob: 2.2, phase: 0, cycle: [6, 7] };
    const p0 = birdPose(walker, 0, SPAN, CYCLE, false);
    expect(p0.x).toBeCloseTo(800, 5);
    expect(p0.dir).toBe(1);
    expect(p0.anchorToStage).toBe(true);

    // Échantillonne sur un cycle complet : vérifie bornage, les deux sens, les phases d'arrêt net et de mouvement par à-coups
    let sawRight = false;
    let sawLeft = false;
    let pauseSamples = 0;
    let moveSamples = 0;
    let prevX = p0.x;
    for (let t = 0.05; t <= 25; t += 0.1) {
      const p = birdPose(walker, t, SPAN, CYCLE, false);
      expect(p.x).toBeGreaterThanOrEqual(800);
      expect(p.x).toBeLessThanOrEqual(1000);
      expect([6, 7]).toContain(p.frame);
      if (p.dir === 1) sawRight = true;
      if (p.dir === -1) sawLeft = true;
      if (Math.abs(p.x - prevX) < 1e-6) {
        pauseSamples++;
        expect(p.frame).toBe(6); // posé calme pendant les micro-pauses
      } else {
        moveSamples++;
      }
      prevX = p.x;
    }
    expect(sawRight).toBe(true);
    expect(sawLeft).toBe(true);
    expect(pauseSamples).toBeGreaterThan(10); // vrais micro-arrêts irréguliers
    expect(moveSamples).toBeGreaterThan(10); // vrais à-coups de marche

    // reduceMotion fige sur place
    const pFrozenA = birdPose(walker, 0, SPAN, CYCLE, true);
    const pFrozenB = birdPose(walker, 7.5, SPAN, CYCLE, true);
    expect(pFrozenB).toEqual(pFrozenA);
    expect(pFrozenA.y).toBe(107);
    expect(pFrozenA.frame).toBe(6);
  });

  it('suit la courbe d’un rebord en pente quand walkPoints est fourni', () => {
    const walker = {
      mode: 'walk',
      y: 100,
      scale: 0.68,
      speed: 34,
      walkSpan: [975, 1285],
      walkPoints: [[975, 94], [1100, 74], [1285, 89]],
      pause: 1,
      flap: 6.4,
      bob: 0,
      phase: 0,
      cycle: [6, 7],
    };
    const pStart = birdPose(walker, 0, SPAN, CYCLE, true);
    expect(pStart.x).toBeCloseTo(975, 5);
    expect(pStart.y).toBeCloseTo(94, 5);
    // Vérifie qu'en avançant le long de la crête, y monte vers 74 puis redescend vers 89
    let minY = Infinity;
    for (let t = 0; t <= 20; t += 0.2) {
      const p = birdPose(walker, t, SPAN, CYCLE, false);
      expect(p.y).toBeGreaterThanOrEqual(73.9);
      expect(p.y).toBeLessThanOrEqual(94.1);
      minY = Math.min(minY, p.y);
    }
    expect(minY).toBeLessThan(78);
  });

  it('rythme les cris de corbeaux de façon déterministe et repart à zéro au changement de lieu', () => {
    const c = createCrowCalls([3, 5]);
    expect(stepCrowCalls(c, 2)).toBe(false);
    expect(stepCrowCalls(c, 1)).toBe(true);
    expect(stepCrowCalls(c, 4)).toBe(false);
    expect(stepCrowCalls(c, 1)).toBe(true);
    resetCrowCalls(c);
    expect(c.timer).toBe(3);
    expect(c.idx).toBe(0);
  });
});
