import { describe, it, expect } from 'vitest';
import { createChariot, pushChariot, releaseChariot, nearChariot, arriveChariot, pushWalk, bump, stepChariot, noteBump, wheelDrift } from '../../src/core/chariot.js';
import { compileMask } from '../../src/core/walkmask.js';

const P = { offset: 120, flipTime: 0.25, speed: 0.8, weight: 0.4 };
const DT = 1 / 60;

describe('chariot poussé (A8)', () => {
  it('pris, il passe devant le héros, du côté où il regarde ; lâché, il ne bouge plus', () => {
    const c = createChariot('rayon', 220, 50);
    const hero = { x: 100, z: 50, facing: -1 };
    pushChariot(c, hero);
    expect(hero.facing).toBe(1); // il se tourne vers le chariot
    hero.x = 150;
    stepChariot(c, hero, P, DT);
    expect([c.x, c.z]).toEqual([270, 50]);
    releaseChariot(c);
    hero.x = 400;
    stepChariot(c, hero, P, DT);
    expect(c.x).toBe(270);
  });

  it('demi-tour : il se retourne comme une feuille (côté de 1 à -1 en passant par 0), et grince une fois', () => {
    const c = createChariot('rayon', 220, 50);
    const hero = { x: 100, z: 50, facing: 1 };
    pushChariot(c, hero);
    hero.facing = -1;
    const events = [];
    const sides = [];
    for (let t = 0; t < 0.4; t += DT) {
      events.push(stepChariot(c, hero, P, DT));
      sides.push(c.side);
    }
    expect(events.filter((e) => e === 'tourne')).toHaveLength(1);
    expect(sides.some((s) => Math.abs(s) < 0.2)).toBe(true);
    expect(c.side).toBe(-1);
    expect(c.x).toBe(100 - P.offset);
  });

  it('lourd : le héros pousse moins vite, démarre et freine plus lentement', () => {
    const walk = { maxSpeed: 500, acceleration: 10000, deceleration: 12000, depthFactor: 0.8 };
    const w = pushWalk(walk, P);
    expect(w.maxSpeed).toBe(400);
    expect(w.acceleration).toBe(4000);
    expect(w.deceleration).toBe(4800);
    expect(w.depthFactor).toBe(0.8);
    expect(walk.maxSpeed).toBe(500); // les réglages de marche ne changent pas
  });

  it('il bute contre le décor : le héros ne peut pas l’enfoncer dans un mur', () => {
    const mask = compileMask({ area: [[0, 0], [500, 0], [500, 300], [0, 300]], obstacles: [] });
    const c = createChariot('rayon', 420, 50);
    const hero = { x: 300, z: 50, facing: 1, prevX: 300, prevZ: 50, vx: 300 };
    pushChariot(c, hero);
    hero.x = 390; // le chariot serait à 510, hors de la zone
    expect(bump(c, hero, mask, P)).toBe(true);
    expect(hero.x).toBe(300);
    expect(hero.vx).toBe(0);
    hero.x = 350;
    hero.prevX = 350;
    expect(bump(c, hero, mask, P)).toBe(false);
  });

  it('poussé, il passe la porte avec le héros ; lâché, il reste dans sa pièce', () => {
    const c = createChariot('rayon', 220, 50);
    const hero = { x: 100, z: 50, facing: 1 };
    expect(nearChariot(c, hero, 'rayon', 150)).toBe(true);
    expect(nearChariot(c, hero, 'hall', 150)).toBe(false);
    pushChariot(c, hero);
    arriveChariot(c, 'hall', { x: 600, z: 80, facing: -1 }, P);
    expect([c.place, c.x, c.z, c.side]).toEqual(['hall', 480, 80, -1]);
    releaseChariot(c);
    arriveChariot(c, 'rayon', { x: 100, z: 50, facing: 1 }, P);
    expect(c.place).toBe('hall');
  });

  it('cogner trois fois en peu de temps fait réagir le haut-parleur (une fois)', () => {
    const c = createChariot('rayon', 0, 0);
    const p = { bumpCount: 3, bumpWindow: 4 };
    const events = [];
    for (let k = 0; k < 3; k++) {
      events.push(noteBump(c, true, p, 0.1), noteBump(c, true, p, 0.1), noteBump(c, false, p, 0.3));
    }
    expect(events.filter((e) => e === 'cogne')).toHaveLength(1);
    // Trop espacés : rien.
    const slow = createChariot('rayon', 0, 0);
    const ev2 = [];
    for (let k = 0; k < 3; k++) ev2.push(noteBump(slow, true, p, 0.1), noteBump(slow, false, p, 3));
    expect(ev2).not.toContain('cogne');
  });

  it('la roue folle tire vers le fond quand il pousse de côté ; rien à l’arrêt, rien si elle est réparée', () => {
    const mask = compileMask({ area: [[0, 0], [1000, 0], [1000, 300], [0, 300]], obstacles: [] });
    const c = createChariot('rayon', 220, 50);
    const hero = { x: 100, z: 50, facing: 1, vx: 400 };
    pushChariot(c, hero);
    wheelDrift(c, hero, mask, { drift: 20, offset: 120 }, 400, 1);
    expect(hero.z).toBeCloseTo(70);
    hero.vx = 0;
    wheelDrift(c, hero, mask, { drift: 20, offset: 120 }, 400, 1);
    expect(hero.z).toBeCloseTo(70);
    hero.vx = 400;
    wheelDrift(c, hero, mask, { drift: 0, offset: 120 }, 400, 1);
    expect(hero.z).toBeCloseTo(70);
    hero.z = 295; // au bord de la zone : la roue ne l'en fait pas sortir
    wheelDrift(c, hero, mask, { drift: 20, offset: 120 }, 400, 1);
    expect(hero.z).toBe(295);
  });
});
