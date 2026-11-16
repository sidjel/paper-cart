import { describe, it, expect } from 'vitest';
import { barrierX, createGuard, stepGuard } from '../../src/core/guard.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import accueil from '../../src/data/places/accueil.json';

const g = {
  post: [760, 60],
  barrier: { x0: 852, slope: 0.1333 },
  offset: 95,
  zRange: [-120, 240],
  watch: 420,
  warn: 200,
  touch: 70,
  release: 520,
  pushEvery: 1.2,
  stopTime: 0.8,
};
const hero = (x, z, extra = {}) => ({ x, z, hasTarget: false, tx: 0, ...extra });
const still = { moveX: 0, moveZ: 0 };
const left = { moveX: -1, moveZ: 0 };
const run = (s, h, sec, input = still) => {
  const evs = [];
  for (let t = 0; t < sec; t += 1 / 60) {
    const e = stepGuard(s, g, h, input, 700, 1 / 60);
    if (e) evs.push(e);
  }
  return evs;
};

describe('agent de sécurité', () => {
  it('reste à son poste tant que le héros est loin de la barrière', () => {
    const s = createGuard(g);
    run(s, hero(2000, 200), 1);
    expect([s.x, s.z]).toEqual(g.post);
  });

  it('longe la barrière pour se mettre en face du héros', () => {
    const s = createGuard(g);
    const h = hero(1100, 200);
    run(s, h, 2);
    expect(s.z).toBe(200);
    expect(s.x).toBeCloseTo(barrierX(g, 200) - g.offset, 5);
    h.z = -170; // plus bas que la barrière : il s'arrête au bout
    run(s, h, 2);
    expect(s.z).toBe(-120);
  });

  it('interpelle le héros qui va vers la gauche près de la barrière, une fois par approche', () => {
    const s = createGuard(g);
    const h = hero(1000, 40);
    expect(run(s, h, 0.5)).toEqual([]); // immobile : rien
    expect(run(s, h, 0.1, left)).toEqual(['warn']);
    h.x = 2000; // il s'éloigne…
    run(s, h, 0.1);
    h.x = 1000; // … et revient : nouvelle interpellation
    expect(run(s, h, 0.1, left)).toEqual(['warn']);
  });

  it('au doigt : viser un point à gauche compte aussi', () => {
    const s = createGuard(g);
    expect(run(s, hero(1000, 40, { hasTarget: true, tx: 700 }), 0.1)).toEqual(['warn']);
  });

  it('repousse le héros qui force contre la barrière, pas plus d’une fois toutes les pushEvery secondes', () => {
    const s = createGuard(g);
    const h = hero(barrierX(g, 40) + 50, 40);
    expect(run(s, h, 0.01, left)).toEqual(['warn']); // (dans le jeu, le héros est figé pendant la bulle)
    expect(run(s, h, 1, left)).toEqual(['push']);
    expect(run(s, h, 1.3, left)).toEqual(['push']);
    stepGuard(s, g, h, still, 700, 1 / 60);
    expect(run(s, h, 1.2, still)).toEqual([]); // il ne force plus : rien
    s.pushCool = 0;
    stepGuard(s, g, h, left, 700, 1 / 60);
    expect(s.stopT).toBeGreaterThan(0); // geste d'arrêt
  });

  it('retourne à son poste quand le héros s’éloigne', () => {
    const s = createGuard(g);
    const h = hero(1000, 200);
    run(s, h, 2);
    h.x = 2000;
    run(s, h, 2);
    expect([s.x, s.z]).toEqual(g.post);
  });

  it('le hall : la barrière de portiques ferme la gauche, l’agent est derrière, le héros commence à droite', () => {
    const d = accueil.guard;
    const mask = compileMask(accueil.walkMask);
    for (const p of accueil.props.filter((q) => q.id.startsWith('portique'))) {
      expect(Math.abs(p.at[0] - barrierX(d, p.at[1]))).toBeLessThanOrEqual(1); // les portiques sont sur la barrière
      expect(isWalkable(mask, p.at[0] - 40, p.at[1])).toBe(false); // à gauche : hors d'atteinte
    }
    for (const z of [-190, 0, 260]) expect(isWalkable(mask, barrierX(d, z) + 20, z)).toBe(false);
    expect(d.post[0]).toBeLessThan(barrierX(d, d.post[1]));
    expect(accueil.spawn[0]).toBeGreaterThan(barrierX(d, accueil.spawn[1]));
    expect(isWalkable(mask, ...accueil.spawn)).toBe(true);
    expect(accueil.images[d.image] && accueil.images[d.stopImage]).toBeTruthy();
  });
});
