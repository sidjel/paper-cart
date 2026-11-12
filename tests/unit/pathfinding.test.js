import { describe, it, expect } from 'vitest';
import { findPath, segmentClear, nearestWalkable } from '../../src/core/pathfinding.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import { createWalker, setPath, stepWalker } from '../../src/core/movement.js';
import place from '../../src/data/places/rayon-essai.json';

const mask = compileMask(place.walkMask);
const P = { maxSpeed: 480, acceleration: 3600, deceleration: 4800, depthFactor: 0.8, arrivalRadius: 4 };

function checkPath(sx, sz, path) {
  let [x, z] = [sx, sz];
  for (const [nx, nz] of path) {
    expect(segmentClear(mask, x, z, nx, nz)).toBe(true);
    [x, z] = [nx, nz];
  }
}

describe('contourner les objets (toucher pour aller)', () => {
  it('ligne droite quand rien ne gêne', () => {
    expect(findPath(mask, 300, 60, 500, 80)).toEqual([[500, 80]]);
  });
  it('contourne le présentoir pour aller derrière', () => {
    const path = findPath(mask, 750, 40, 750, 215);
    expect(path.length).toBeGreaterThan(1);
    expect(path[path.length - 1]).toEqual([750, 215]);
    checkPath(750, 40, path);
  });
  it('contourne le caddie', () => {
    const path = findPath(mask, 1417, 60, 1417, 200);
    expect(path.length).toBeGreaterThan(1);
    checkPath(1417, 60, path);
  });
  it('un point touché sur un objet est ramené juste à côté', () => {
    const [x, z] = nearestWalkable(mask, 750, 140);
    expect(isWalkable(mask, x, z)).toBe(true);
    expect(Math.hypot(x - 750, z - 140)).toBeLessThan(60);
  });
  it('le personnage suit le chemin jusqu’au bout', () => {
    const w = createWalker(750, 40);
    setPath(w, findPath(mask, 750, 40, 750, 215));
    for (let i = 0; i < 600 && w.hasTarget; i++) stepWalker(w, { moveX: 0, moveZ: 0 }, mask, P, 1 / 60);
    expect(w.hasTarget).toBe(false);
    expect(Math.hypot(w.x - 750, w.z - 215)).toBeLessThan(5);
  });
});
