import { describe, it, expect } from 'vitest';
import { directionFromVector, directionToView, needsPaperFlip } from '../../src/core/direction.js';
import { createWalker, stepWalker, faceProduct, faceScreen } from '../../src/core/movement.js';
import { compileMask } from '../../src/core/walkmask.js';

describe('orientation sur 8 directions (core/direction.js)', () => {
  it('reconnaît exactement les 8 secteurs depuis un vecteur (dx, dz)', () => {
    expect(directionFromVector(1, 0)).toBe('E');
    expect(directionFromVector(1, 1)).toBe('NE');
    expect(directionFromVector(0, 1)).toBe('N');
    expect(directionFromVector(-1, 1)).toBe('NW');
    expect(directionFromVector(-1, 0)).toBe('W');
    expect(directionFromVector(-1, -1)).toBe('SW');
    expect(directionFromVector(0, -1)).toBe('S');
    expect(directionFromVector(1, -1)).toBe('SE');
  });

  it('conserve la direction actuelle dans la zone morte', () => {
    expect(directionFromVector(0, 0, 'NE')).toBe('NE');
    expect(directionFromVector(0.05, -0.05, 'W')).toBe('W');
  });

  it('associe les 8 directions aux 5 vues dessinées + miroir horizontal pour la gauche', () => {
    expect(directionToView('S')).toEqual({ view: 'S', flip: 1 });
    expect(directionToView('SE')).toEqual({ view: 'SE', flip: 1 });
    expect(directionToView('E')).toEqual({ view: 'E', flip: 1 });
    expect(directionToView('NE')).toEqual({ view: 'NE', flip: 1 });
    expect(directionToView('N')).toEqual({ view: 'N', flip: 1 });
    expect(directionToView('SW')).toEqual({ view: 'SE', flip: -1 });
    expect(directionToView('W')).toEqual({ view: 'E', flip: -1 });
    expect(directionToView('NW')).toEqual({ view: 'NE', flip: -1 });
  });

  it('déclenche le pivot de la feuille en cas de demi-tour gauche ↔ droite, pas sur un virage progressif', () => {
    expect(needsPaperFlip('E', 'W', false)).toBe(true);
    expect(needsPaperFlip('SE', 'SW', false)).toBe(true);
    expect(needsPaperFlip('NE', 'NW', false)).toBe(true);
    expect(needsPaperFlip('E', 'SE', false)).toBe(false);
    expect(needsPaperFlip('SE', 'S', false)).toBe(false);
    expect(needsPaperFlip('S', 'N', false)).toBe(false);
    expect(needsPaperFlip('S', 'N', true)).toBe(true);
    expect(needsPaperFlip('E', 'E', true)).toBe(false);
  });

  it('met à jour walker.dir pendant la marche, le scan et les apartés', () => {
    const mask = compileMask({ area: [[0, 0], [1000, 0], [1000, 500], [0, 500]], obstacles: [] });
    const p = { maxSpeed: 500, acceleration: 10000, deceleration: 10000, depthFactor: 0.8, arrivalRadius: 4 };
    const w = createWalker(500, 250);
    expect(w.dir).toBe('S');

    stepWalker(w, { moveX: -1, moveZ: 1 }, mask, p, 1 / 60);
    expect(w.dir).toBe('NW');

    stepWalker(w, { moveX: 1, moveZ: -1 }, mask, p, 1 / 60);
    expect(w.dir).toBe('SE');

    faceProduct(w, w.x, undefined);
    expect(w.dir).toBe('N');

    faceProduct(w, w.x + 120, undefined);
    expect(w.dir).toBe('NE');

    faceScreen(w);
    expect(w.dir).toBe('S');
  });

  it('applique une hystérésis angulaire près des frontières de secteur (±7°)', () => {
    const rad = (deg) => (deg * Math.PI) / 180;
    // Depuis E (0°), la frontière brute vers NE est à 22,5° : à 26°, on reste sur E.
    expect(directionFromVector(Math.cos(rad(26)), Math.sin(rad(26)), 'E')).toBe('E');
    // Au-delà de 29,5° (ex. 32°), on bascule franchement sur NE.
    expect(directionFromVector(Math.cos(rad(32)), Math.sin(rad(32)), 'E')).toBe('NE');
    // Une fois en NE (45°), revenir légèrement sous 22,5° (ex. 19°) ne fait pas re-basculer vers E.
    expect(directionFromVector(Math.cos(rad(19)), Math.sin(rad(19)), 'NE')).toBe('NE');
    // Revenir franchement vers E (ex. 12°) re-bascule vers E.
    expect(directionFromVector(Math.cos(rad(12)), Math.sin(rad(12)), 'NE')).toBe('E');
  });
});
