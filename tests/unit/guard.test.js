import { describe, it, expect } from 'vitest';
import { createGuard, nearestGate, stepGuard } from '../../src/core/guard.js';
import accueil from '../../src/data/places/accueil.json';

const g = { post: [560, 210], gates: [710, 850, 990], zone: [620, 1080], watchZ: 60, holdZ: 130, standZ: 235, releaseZ: 20 };
const hero = (x, z, extra = {}) => ({ x, z, tx: 0, tz: 0, ...extra });
const still = { moveX: 0, moveZ: 0 };
const up = { moveX: 0, moveZ: 1 };
const right = { moveX: 1, moveZ: 0 };
const run = (s, h, sec, input = still, speed = 700) => {
  let ev = null;
  for (let t = 0; t < sec; t += 1 / 60) ev = stepGuard(s, g, h, input, speed, 1 / 60) ?? ev;
  return ev;
};

describe('agent de sécurité', () => {
  it('le portique le plus proche', () => {
    expect(nearestGate(g.gates, 600)).toBe(0);
    expect(nearestGate(g.gates, 900)).toBe(1);
    expect(nearestGate(g.gates, 2000)).toBe(2);
  });

  it('reste à son poste tant que le héros est loin des portiques', () => {
    const s = createGuard(g);
    run(s, hero(1500, 240), 1);
    run(s, hero(850, 10), 1);
    expect([s.x, s.z]).toEqual(g.post);
  });

  it('va devant le portique que le héros approche, et le suit', () => {
    const s = createGuard(g);
    const h = hero(980, 100);
    run(s, h, 2);
    expect([s.x, s.z]).toEqual([990, 235]);
    h.x = 700;
    run(s, h, 2);
    expect(s.x).toBe(710);
  });

  it('prévient quand le héros pousse contre les portiques, une fois par approche', () => {
    const s = createGuard(g);
    const h = hero(850, 125);
    expect(run(s, h, 0.1, up)).toBe('blocked');
    expect(run(s, h, 1, up)).toBe(null);
    // Il s'éloigne, puis revient : nouvel avertissement.
    h.z = 10;
    run(s, h, 0.1);
    h.z = 125;
    expect(run(s, h, 0.1, up)).toBe('blocked');
  });

  it('au doigt : viser un point des portiques compte comme une tentative', () => {
    const s = createGuard(g);
    expect(run(s, hero(850, 126, { tx: 850, tz: 126 }), 0.1)).toBe('blocked');
  });

  it('longer les portiques vers le présentoir ne déclenche rien', () => {
    const s = createGuard(g);
    expect(run(s, hero(800, 126, { tx: 1352, tz: 240 }), 0.5)).toBe(null);
    expect(run(s, hero(800, 126), 0.5, right)).toBe(null);
  });

  it('retourne à son poste quand le héros s’éloigne', () => {
    const s = createGuard(g);
    const h = hero(850, 120);
    run(s, h, 2);
    h.z = 10;
    run(s, h, 2);
    expect([s.x, s.z]).toEqual(g.post);
  });

  it('le hall a un agent ; les portiques sont un obstacle qui commence à holdZ, sur la largeur de la zone', () => {
    const d = accueil.guard;
    expect(d).toBeTruthy();
    for (const x of d.gates) expect(x > d.zone[0] && x < d.zone[1]).toBe(true);
    const o = accueil.walkMask.obstacles.find((ob) => ob.name.startsWith('Portiques'));
    const xs = o.points.map((p) => p[0]);
    const zs = o.points.map((p) => p[1]);
    expect([Math.min(...xs), Math.max(...xs)]).toEqual(d.zone);
    expect(Math.min(...zs)).toBe(d.holdZ);
    expect(d.releaseZ).toBeLessThan(d.watchZ);
    expect(d.watchZ).toBeLessThan(d.holdZ);
    expect(accueil.images[d.image]).toBeTruthy();
  });
});
