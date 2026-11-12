import { describe, it, expect } from 'vitest';
import { createProtocol, stepProtocol, placeForConfig, protocolConfig, totalSeconds, PROTOCOL_CONFIGS } from '../../src/core/protocol.js';
import { createWalker, stepWalker } from '../../src/core/movement.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import { segmentClear } from '../../src/core/pathfinding.js';
import place from '../../src/data/places/rayon-essai.json';

const mask = compileMask(place.walkMask);
const P = { maxSpeed: 520, acceleration: 10000, deceleration: 12000, depthFactor: 0.8, arrivalRadius: 4 };
const none = { moveX: 0, moveZ: 0 };
const DT = 1 / 60;
const d = place.diagnostic;

function simulate(warmup, measure, repeats) {
  const hero = createWalker(0, 0), ghost = createWalker(0, 0);
  const p = createProtocol(d, warmup, measure, repeats);
  placeForConfig(p, hero, ghost);
  const log = [];
  let steps = 0;
  while (p.phase !== 'done' && steps < 60 * 3000) {
    stepProtocol(p, hero, ghost, DT);
    stepWalker(hero, none, mask, P, DT);
    stepWalker(ghost, none, mask, P, DT);
    if (p.measuring) log.push({ ci: p.ci, run: p.run, hx: hero.x, hz: hero.z, hm: hero.moving, gm: ghost.moving });
    steps++;
  }
  return { p, log, steps };
}

describe('diagnostic en 4 configurations', () => {
  it('les points de l’aller-retour sont praticables et reliés en ligne droite, sans obstacle', () => {
    for (const pt of [d.a, d.b, d.idle]) expect(isWalkable(mask, ...pt)).toBe(true);
    expect(segmentClear(mask, ...d.a, ...d.b)).toBe(true);
    expect(d.a[1]).toBe(d.b[1]); // même profondeur
  });
  it('enchaîne chauffe puis mesures pour chaque configuration, dans l’ordre', () => {
    const { p, log, steps } = simulate(2, 3, 2);
    expect(p.phase).toBe('done');
    expect(Math.abs(steps - totalSeconds(p) * 60)).toBeLessThan(totalSeconds(p) * 60 * 0.01); // à un pas près par phase
    const seen = [...new Set(log.map((l) => `${l.ci}.${l.run}`))];
    expect(seen).toEqual(['0.0', '0.1', '1.0', '1.1', '2.0', '2.1', '3.0', '3.1']);
  });
  it('chaque configuration fait bouger ce qu’elle doit, et seulement cela', () => {
    const { log } = simulate(2, 4, 1);
    const part = (ci) => log.filter((l) => l.ci === ci);
    const moves = (rows, k) => rows.filter((r) => r[k]).length / rows.length;
    // 1 : rien ne bouge
    expect(moves(part(0), 'hm')).toBe(0);
    expect(moves(part(0), 'gm')).toBe(0);
    // 2 : le personnage marche, pas de fantôme
    expect(moves(part(1), 'hm')).toBeGreaterThan(0.9);
    expect(moves(part(1), 'gm')).toBe(0);
    // 3 : le personnage est immobile, le fantôme (que suit la caméra) marche
    expect(moves(part(2), 'hm')).toBe(0);
    expect(moves(part(2), 'gm')).toBeGreaterThan(0.9);
    // 4 : le personnage marche
    expect(moves(part(3), 'hm')).toBeGreaterThan(0.9);
  });
  it('le personnage reste sur l’aller-retour prévu', () => {
    const { log } = simulate(1, 5, 1);
    for (const l of log.filter((x) => x.ci === 1 || x.ci === 3)) {
      expect(l.hx).toBeGreaterThanOrEqual(d.a[0] - 1);
      expect(l.hx).toBeLessThanOrEqual(d.b[0] + 1);
      expect(l.hz).toBeCloseTo(d.a[1], 5);
    }
  });
  it('les 4 configurations correspondent à la demande', () => {
    expect(PROTOCOL_CONFIGS.map((c) => [c.walk, c.camera !== 'fixed'])).toEqual([[false, false], [true, false], [false, true], [true, true]]);
    expect(protocolConfig(createProtocol(d, 60, 60, 3)).id).toBe(1);
    expect(totalSeconds(createProtocol(d, 60, 60, 3))).toBe(960); // 16 minutes
  });
});
