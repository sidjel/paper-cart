import { describe, it, expect } from 'vitest';
import { createPile, stepPile, wobble } from '../../src/core/pile.js';
import { compileMask } from '../../src/core/walkmask.js';

const P = { reach: 30, handTime: 1.5, ramSpeed: 250, fallTime: 0.4 };
const DT = 1 / 60;
// Une pile au fond (z 150 à 264), entre x 800 et 1000.
const mask = compileMask({ area: [[0, -200], [2000, -200], [2000, 264], [0, 264]], obstacles: [{ points: [[800, 150], [1000, 150], [1000, 270], [800, 270]] }] });
const poly = mask.obstacles[0];

describe('pile de cartons (A8)', () => {
  it('à la main : il faut pousser un moment ; elle vacille, puis tombe', () => {
    const pile = createPile();
    const hero = { x: 900, z: 135, facing: 1 };
    const intent = { moveX: 0, moveZ: 1 }; // vers le fond, contre la pile
    const events = [];
    for (let t = 0; t < 1.4; t += DT) events.push(stepPile(pile, poly, hero, intent, null, 120, P, DT));
    expect(pile.down).toBe(false);
    expect(events.filter((e) => e === 'pousse')).toHaveLength(1);
    expect(wobble(pile, P)).toBeGreaterThan(0.8);
    for (let t = 0; t < 0.2; t += DT) events.push(stepPile(pile, poly, hero, intent, null, 120, P, DT));
    expect(pile.down).toBe(true);
    expect(events.filter((e) => e === 'tombe')).toHaveLength(1);
  });

  it('lâcher avant la fin : elle se remet d’aplomb ; loin de la pile, rien', () => {
    const pile = createPile();
    const hero = { x: 900, z: 135, facing: 1 };
    for (let t = 0; t < 1; t += DT) stepPile(pile, poly, hero, { moveX: 0, moveZ: 1 }, null, 120, P, DT);
    for (let t = 0; t < 1; t += DT) stepPile(pile, poly, hero, { moveX: 0, moveZ: 0 }, null, 120, P, DT);
    expect(pile.push).toBe(0);
    const far = { x: 300, z: 135, facing: 1 };
    for (let t = 0; t < 3; t += DT) stepPile(pile, poly, far, { moveX: 0, moveZ: 1 }, null, 120, P, DT);
    expect(pile.down).toBe(false);
  });

  it('le chariot poussé avec élan la renverse d’un coup, du côté où il va ; doucement, il faut pousser', () => {
    const pile = createPile();
    const hero = { x: 660, z: 200, facing: 1 }; // l'avant du chariot (120 devant le héros) touche la pile
    expect(stepPile(pile, poly, hero, { moveX: 1, moveZ: 0 }, { pushed: true, impact: 300, bumped: true }, 120, P, DT)).toBe('tombe');
    expect(pile.dir).toBe(1);
    const slow = createPile();
    stepPile(slow, poly, hero, { moveX: 1, moveZ: 0 }, { pushed: true, impact: 100, bumped: true }, 120, P, DT);
    expect(slow.down).toBe(false);
    for (let t = 0; t < 1.6; t += DT) stepPile(slow, poly, hero, { moveX: 1, moveZ: 0 }, { pushed: true, impact: 0, bumped: true }, 120, P, DT);
    expect(slow.down).toBe(true);
  });

  it('tombée, elle finit sa chute en fallTime secondes', () => {
    const pile = createPile();
    stepPile(pile, poly, { x: 660, z: 200, facing: 1 }, { moveX: 1, moveZ: 0 }, { pushed: true, impact: 300, bumped: true }, 120, P, DT);
    for (let t = 0; t < 0.5; t += DT) stepPile(pile, poly, { x: 0, z: 0, facing: 1 }, { moveX: 0, moveZ: 0 }, null, 120, P, DT);
    expect(pile.fall).toBe(1);
  });
});
