import { describe, it, expect } from 'vitest';
import { compileMask, isWalkable, pointInPolygon } from '../../src/core/walkmask.js';
import { createStepper } from '../../src/core/stepper.js';
import { createStateMachine } from '../../src/core/state.js';
import { config, setValue, sanitize, overrides, applyOverrides, resetAll } from '../../src/config.js';
import place from '../../src/data/places/rayon-essai.json';

describe('zone de marche', () => {
  const mask = compileMask({
    area: [[0, 0], [100, 0], [100, 100], [0, 100]],
    obstacles: [{ points: [[40, 40], [60, 40], [60, 60], [40, 60]] }],
  });
  it('dedans, dehors, dans un obstacle', () => {
    expect(isWalkable(mask, 10, 10)).toBe(true);
    expect(isWalkable(mask, 150, 10)).toBe(false);
    expect(isWalkable(mask, 50, 50)).toBe(false);
  });
  it('polygone concave', () => {
    const L = compileMask({ area: [[0, 0], [100, 0], [100, 30], [30, 30], [30, 100], [0, 100]] }).area;
    expect(pointInPolygon(L, 10, 90)).toBe(true);
    expect(pointInPolygon(L, 80, 80)).toBe(false);
  });
  it('le point de départ du rayon d’essai est dans la zone', () => {
    const m = compileMask(place.walkMask);
    expect(isWalkable(m, place.spawn[0], place.spawn[1])).toBe(true);
  });
});

describe('boucle à pas fixe', () => {
  it('joue le bon nombre de pas et garde le reste', () => {
    const s = createStepper(60, 5);
    expect(s.advance(1 / 60)).toBe(1);
    expect(s.advance(0.5 / 60)).toBe(0);
    expect(s.alpha).toBeCloseTo(0.5);
    expect(s.advance(0.5 / 60)).toBe(1);
  });
  it('abandonne un trop grand retard', () => {
    const s = createStepper(60, 5);
    expect(s.advance(2)).toBe(5);
    expect(s.acc).toBe(0);
  });
});

describe('machine à états', () => {
  it('suit les transitions permises seulement', () => {
    const sm = createStateMachine();
    expect(sm.go('pause')).toBe(false);
    expect(sm.go('play')).toBe(true);
    expect(sm.go('pause')).toBe(true);
    expect(sm.go('menu')).toBe(true);
    expect(sm.back()).toBe(true);
    expect(sm.get()).toBe('pause');
    expect(sm.go('loading')).toBe(false);
  });
  it('prévient les auditeurs', () => {
    const sm = createStateMachine();
    const seen = [];
    sm.onChange((now, before) => seen.push(`${before}>${now}`));
    sm.go('play');
    expect(seen).toEqual(['loading>play']);
  });
});

describe('réglages', () => {
  it('borne les valeurs et refuse les invalides', () => {
    expect(sanitize('walk.maxSpeed', 99999)).toBe(1200);
    expect(sanitize('walk.maxSpeed', 'abc')).toBeUndefined();
    expect(sanitize('audio.latency', 'enorme')).toBeUndefined();
    expect(sanitize('inconnu.truc', 1)).toBeUndefined();
  });
  it('ne garde que les écarts aux valeurs par défaut', () => {
    resetAll();
    setValue('walk.maxSpeed', 600);
    expect(overrides()).toEqual({ 'walk.maxSpeed': 600 });
    resetAll();
    applyOverrides({ 'walk.acceleration': 1000, 'nimporte.quoi': 3 });
    expect(config.walk.acceleration).toBe(1000);
    resetAll();
    expect(overrides()).toEqual({});
  });
});

import { WALK_PRESETS, getDefault } from '../../src/config.js';
describe('profil de marche par défaut', () => {
  it('les valeurs par défaut sont celles du profil « Paper Mario »', () => {
    const pm = WALK_PRESETS.find((p) => p.name === 'Paper Mario');
    for (const [k, v] of Object.entries(pm.values)) expect(getDefault(k)).toBe(v);
  });
});
