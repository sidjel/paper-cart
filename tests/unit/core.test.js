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
  // Séance 64 (règle « Boucle de jeu », docs/ARCHITECTURE.md §3) : un écran à 90, 120 ou 144 Hz ne change
  // pas la vitesse du jeu, et le mouvement affiché reste régulier (interpolation entre deux pas).
  for (const hz of [60, 90, 120, 144]) {
    it(`écran à ${hz} Hz : même distance par seconde, et pas d'à-coups d'une image à l'autre`, () => {
      const s = createStepper(60, 5);
      const speed = 300; // px/s, mouvement constant
      let prev = 0;
      let cur = 0;
      const shown = [];
      for (let f = 0; f < hz * 2; f++) {
        const n = s.advance(1 / hz);
        for (let k = 0; k < n; k++) {
          prev = cur;
          cur += speed * s.step;
        }
        shown.push(prev + (cur - prev) * s.alpha); // ce que l'écran affiche
      }
      // Même distance en 2 s, quelle que soit la fréquence (à un pas près : l'affichage a un pas de retard).
      expect(shown[shown.length - 1]).toBeGreaterThan(speed * 2 - speed / 60 - 1);
      expect(shown[shown.length - 1]).toBeLessThanOrEqual(speed * 2);
      // Chaque image avance de la même longueur (sans interpolation, à 144 Hz : 0, 5, 0, 5…).
      const steps = shown.slice(hz).map((x, i) => x - shown[hz + i - 1]);
      for (const d of steps) expect(d).toBeCloseTo(speed / hz, 6);
    });
  }
  it('un appareil qui rame (images de 100 ms) : le jeu ralentit un peu au lieu de se figer ou de sauter', () => {
    const s = createStepper(60, 5);
    let steps = 0;
    for (let f = 0; f < 10; f++) steps += s.advance(0.1); // 1 s réelle
    expect(steps).toBe(50); // 5 pas par image au plus : 50 pas joués au lieu de 60
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

describe('valeurs par défaut demandées par l’auteur', () => {
  it('le joystick virtuel est désactivé par défaut (séance 8)', () => {
    expect(getDefault('input.virtualJoystick')).toBe(false);
  });
});
