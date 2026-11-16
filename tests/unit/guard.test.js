import { describe, it, expect } from 'vitest';
import { barrierX, createGuard, stepGuard } from '../../src/core/guard.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import accueil from '../../src/data/places/accueil.json';

const g = {
  post: [450, 45],
  stand: [700, 45],
  startDelay: 1,
  barrier: { x0: 880, slope: 0.65 },
  warn: 200,
  touch: 70,
  stopEvery: 1.5,
  stopTime: 0.8,
};
const hero = (x, z, extra = {}) => ({ x, z, hasTarget: false, tx: 0, ...extra });
const still = { moveX: 0, moveZ: 0 };
const left = { moveX: -1, moveZ: 0 };
const run = (s, h, sec, input = still) => {
  const evs = [];
  for (let k = 0; k < Math.round(sec * 60); k++) {
    const e = stepGuard(s, g, h, input, 300, 1 / 60);
    if (e) evs.push(e);
  }
  return evs;
};

describe('agent de sécurité', () => {
  it('au début, va une seule fois de son poste à sa place, à la même profondeur, puis ne bouge plus', () => {
    const s = createGuard(g);
    const h = hero(2000, 200);
    run(s, h, 0.9);
    expect([s.x, s.z]).toEqual(g.post); // il attend un peu
    run(s, h, 2);
    expect([s.x, s.z]).toEqual(g.stand);
    h.x = 1000;
    h.z = -100;
    run(s, h, 2, left);
    expect([s.x, s.z]).toEqual(g.stand); // il ne suit pas le héros
  });

  it('la première fois que le héros va vers la gauche près de la barrière : il l’interpelle', () => {
    const s = createGuard(g);
    const h = hero(1050, 40);
    expect(run(s, h, 0.5)).toEqual([]); // immobile : rien
    expect(run(s, h, 1 / 60, left)).toEqual(['warn']);
  });

  it('au doigt : viser un point à gauche compte aussi', () => {
    const s = createGuard(g);
    expect(run(s, hero(1050, 40, { hasTarget: true, tx: 700 }), 0.1)).toEqual(['warn']);
  });

  it('ensuite, s’il force contre la barrière : « Stop ! », au plus une fois toutes les stopEvery secondes', () => {
    const s = createGuard(g);
    const h = hero(barrierX(g, 40) + 50, 40);
    expect(run(s, h, 1 / 60, left)).toEqual(['warn']);
    expect(run(s, h, 1 / 60, left)).toEqual(['stop']);
    expect(s.stopT).toBeGreaterThan(0); // geste d'arrêt
    expect(run(s, h, 1.4, left)).toEqual([]); // trop tôt
    expect(run(s, h, 0.2, left)).toEqual(['stop']);
    expect(run(s, h, 3)).toEqual([]); // il ne force plus : rien
  });

  it('loin de la barrière, aller à gauche ne déclenche rien', () => {
    const s = createGuard(g);
    expect(run(s, hero(1800, 40), 0.5, left)).toEqual([]);
  });

  it('le hall : la barrière ferme la gauche, l’agent est derrière, en retrait, le héros commence à droite', () => {
    const d = accueil.guard;
    const mask = compileMask(accueil.walkMask);
    for (const p of accueil.props.filter((q) => q.id.startsWith('portique'))) {
      expect(Math.abs(p.at[0] - barrierX(d, p.at[1]))).toBeLessThanOrEqual(1); // les portiques sont sur la barrière
      expect(isWalkable(mask, p.at[0] - 40, p.at[1])).toBe(false); // à gauche : hors d'atteinte
    }
    for (const z of [-190, 0, 260]) expect(isWalkable(mask, barrierX(d, z) + 20, z)).toBe(false);
    expect(d.post[1]).toBe(d.stand[1]); // il ne change pas de profondeur
    expect(barrierX(d, d.stand[1]) - d.stand[0]).toBeGreaterThanOrEqual(180); // en retrait de la barrière
    expect(accueil.spawn[0]).toBeGreaterThan(barrierX(d, accueil.spawn[1]));
    expect(isWalkable(mask, ...accueil.spawn)).toBe(true);
    expect(accueil.images[d.image] && accueil.images[d.stopImage]).toBeTruthy();
  });
});
