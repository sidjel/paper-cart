import { describe, it, expect } from 'vitest';
import { createChariot, takeChariot, parkChariot, nearChariot, leaveChariot, stepChariot } from '../../src/core/chariot.js';

const P = { follow: 60, ease: 12 };
const DT = 1 / 60;

// Le héros marche de (x0, z) vers la droite à 200 px/s pendant `sec` secondes ; le chariot suit.
function walk(c, hero, vx, vz, sec) {
  for (let t = 0; t < sec; t += DT) {
    hero.x += vx * DT;
    hero.z += vz * DT;
    stepChariot(c, hero, P, DT);
  }
}

describe('chariot (A8)', () => {
  it('garé, il ne bouge pas quand le héros s’éloigne', () => {
    const c = createChariot('rayon', 100, 50);
    const hero = { x: 120, z: 50 };
    walk(c, hero, 200, 0, 1);
    expect([c.x, c.z]).toEqual([100, 50]);
  });

  it('repris, il suit le héros à la distance voulue, derrière lui', () => {
    const c = createChariot('rayon', 100, 50);
    const hero = { x: 130, z: 50 };
    takeChariot(c, hero);
    walk(c, hero, 200, 0, 2);
    expect(hero.x - c.x).toBeGreaterThan(P.follow - 10);
    expect(hero.x - c.x).toBeLessThan(P.follow + 25);
    expect(c.facing).toBe(1);
  });

  it('il reprend le chemin du héros : après un virage, il passe par le coin (jamais en diagonale)', () => {
    const c = createChariot('rayon', 0, 0);
    const hero = { x: 20, z: 0 };
    takeChariot(c, hero);
    walk(c, hero, 200, 0, 1); // vers la droite jusqu'à x ≈ 220
    let maxZWhileLeft = 0;
    for (let t = 0; t < 1; t += DT) {
      hero.z += 200 * DT; // puis vers le fond
      stepChariot(c, hero, P, DT);
      if (c.x < 180) maxZWhileLeft = Math.max(maxZWhileLeft, c.z);
    }
    expect(maxZWhileLeft).toBeLessThan(15); // tant qu'il n'est pas au coin, il reste sur la première ligne
    expect(Math.abs(c.x - hero.x)).toBeLessThan(15); // ensuite, il monte derrière le héros
  });

  it('demi-tour du héros : le chariot le laisse passer (aucune collision) et se retrouve derrière lui', () => {
    const c = createChariot('rayon', 0, 0);
    const hero = { x: 20, z: 0 };
    takeChariot(c, hero);
    walk(c, hero, 200, 0, 1);
    walk(c, hero, -200, 0, 1.5);
    expect(c.x).toBeGreaterThan(hero.x + P.follow - 15);
    expect(c.facing).toBe(-1);
  });

  it('garer, reprendre : seulement à côté, et dans le même lieu ; en partant, il reste garé', () => {
    const c = createChariot('rayon', 100, 50);
    expect(nearChariot(c, { x: 150, z: 50 }, 'rayon', 80)).toBe(true);
    expect(nearChariot(c, { x: 300, z: 50 }, 'rayon', 80)).toBe(false);
    expect(nearChariot(c, { x: 150, z: 50 }, 'accueil', 80)).toBe(false);
    takeChariot(c, { x: 150, z: 50 });
    leaveChariot(c);
    expect(c.following).toBe(false);
    takeChariot(c, { x: 150, z: 50 });
    parkChariot(c);
    expect(c.following).toBe(false);
  });
});
