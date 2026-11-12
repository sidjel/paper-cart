import { describe, it, expect } from 'vitest';
import { createWalker, setTarget, stepWalker } from '../../src/core/movement.js';
import { compileMask } from '../../src/core/walkmask.js';

const P = { maxSpeed: 480, acceleration: 3600, deceleration: 4800, depthFactor: 0.8, arrivalRadius: 4 };
const DT = 1 / 60;
// Rectangle de 0 à 1000 × 0 à 300, avec un obstacle carré au milieu.
const mask = compileMask({
  area: [[0, 0], [1000, 0], [1000, 300], [0, 300]],
  obstacles: [{ points: [[400, 100], [600, 100], [600, 300], [400, 300]] }],
});
const none = { moveX: 0, moveZ: 0 };

function run(w, input, steps) {
  for (let i = 0; i < steps; i++) stepWalker(w, input, mask, P, DT);
}

describe('déplacement par direction', () => {
  it('accélère jusqu’à la vitesse max sans la dépasser', () => {
    const w = createWalker(100, 50);
    stepWalker(w, { moveX: 1, moveZ: 0 }, mask, P, DT);
    expect(w.vx).toBeCloseTo(P.acceleration * DT);
    run(w, { moveX: 1, moveZ: 0 }, 60);
    expect(w.vx).toBeCloseTo(P.maxSpeed);
  });

  it('freine jusqu’à l’arrêt quand on lâche', () => {
    const w = createWalker(100, 50);
    run(w, { moveX: 1, moveZ: 0 }, 30);
    run(w, none, 30);
    expect(w.vx).toBe(0);
    expect(w.moving).toBe(false);
  });

  it('va moins vite vers le fond (facteur de profondeur)', () => {
    const w = createWalker(100, 20);
    run(w, { moveX: 0, moveZ: 1 }, 40);
    expect(w.vz).toBeCloseTo(P.maxSpeed * P.depthFactor);
  });

  it('la diagonale n’est pas plus rapide', () => {
    const w = createWalker(100, 20);
    run(w, { moveX: 1, moveZ: 1 }, 6);
    run(w, { moveX: 1, moveZ: 1 }, 30);
    expect(Math.hypot(w.vx, w.vz / P.depthFactor)).toBeLessThanOrEqual(P.maxSpeed + 1e-6);
  });

  it('glisse le long d’un obstacle au lieu de s’arrêter net', () => {
    const w = createWalker(380, 250);
    run(w, { moveX: 1, moveZ: -0.4 }, 30);
    expect(w.x).toBeLessThan(400); // n’entre pas dans l’obstacle…
    expect(w.z).toBeLessThan(200); // …mais continue de glisser vers l’avant
  });

  it('ne sort jamais de la zone de marche', () => {
    const w = createWalker(50, 50);
    run(w, { moveX: -1, moveZ: -1 }, 120);
    expect(w.x).toBeGreaterThanOrEqual(0);
    expect(w.z).toBeGreaterThanOrEqual(0);
  });

  it('se tourne selon la direction voulue', () => {
    const w = createWalker(200, 50);
    run(w, { moveX: -1, moveZ: 0 }, 2);
    expect(w.facing).toBe(-1);
    run(w, { moveX: 0, moveZ: 1 }, 2);
    expect(w.away).toBe(true);
    expect(w.facing).toBe(-1); // garde le côté
  });

  it('de dos, aller sur le côté le remet de face (on voit son visage)', () => {
    const w = createWalker(200, 50);
    run(w, { moveX: 0, moveZ: 1 }, 2);
    expect(w.away).toBe(true);
    run(w, { moveX: 1, moveZ: 0 }, 2);
    expect(w.away).toBe(false);
    expect(w.facing).toBe(1);
  });

  it('en diagonale vers le fond, il reste de dos', () => {
    const w = createWalker(200, 50);
    run(w, { moveX: 1, moveZ: 1 }, 2);
    expect(w.away).toBe(true);
  });
});

describe('déplacement vers un point', () => {
  it('arrive pile au point sans le dépasser', () => {
    const w = createWalker(100, 50);
    setTarget(w, 300, 60);
    let maxX = 0;
    for (let i = 0; i < 120; i++) {
      stepWalker(w, none, mask, P, DT);
      maxX = Math.max(maxX, w.x);
    }
    expect(w.hasTarget).toBe(false);
    expect(Math.abs(w.x - 300)).toBeLessThanOrEqual(P.arrivalRadius);
    expect(maxX).toBeLessThanOrEqual(300 + 1e-9);
    expect(w.vx).toBe(0);
  });

  it('s’arrête contre un obstacle (pas de recherche de chemin)', () => {
    const w = createWalker(300, 200);
    setTarget(w, 700, 200); // derrière l’obstacle
    run(w, none, 240);
    expect(w.hasTarget).toBe(false);
    expect(w.x).toBeLessThan(400);
  });

  it('une direction annule le point visé', () => {
    const w = createWalker(100, 50);
    setTarget(w, 900, 50);
    stepWalker(w, { moveX: 0, moveZ: 1 }, mask, P, DT);
    expect(w.hasTarget).toBe(false);
  });
});
