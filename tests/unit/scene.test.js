import { describe, it, expect } from 'vitest';
import { compileAnimation, frameIndex, flipWidth } from '../../src/scene/animation.js';
import { propLevels, actorLevel } from '../../src/scene/depth.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import { createWalker, stepWalker } from '../../src/core/movement.js';
import place from '../../src/data/places/rayon-essai.json';
import hero from '../../src/data/characters/heros.json';

describe('animations décrites dans les données', () => {
  it('une seule image reste affichée', () => {
    const a = compileAnimation({ frames: ['a.svg'] });
    expect(frameIndex(a, 5000, 300)).toBe(0);
  });
  it('durées par image (clignement)', () => {
    const a = compileAnimation({ frames: [{ src: 'ouvert', ms: 1000 }, { src: 'ferme', ms: 100 }] });
    expect(frameIndex(a, 500, 0)).toBe(0);
    expect(frameIndex(a, 1050, 0)).toBe(1);
    expect(frameIndex(a, 1150, 0)).toBe(0); // le cycle recommence
  });
  it('images par seconde', () => {
    const a = compileAnimation({ fps: 10, frames: ['1', '2', '3'] });
    expect(frameIndex(a, 150, 0)).toBe(1);
    expect(frameIndex(a, 350, 0)).toBe(0);
  });
  it('pas synchronisés avec la distance parcourue', () => {
    const a = compileAnimation({ stride: 40, frames: ['1', '2', '3', '4'] });
    expect(frameIndex(a, 0, 39)).toBe(0);
    expect(frameIndex(a, 0, 85)).toBe(2);
    expect(frameIndex(a, 0, 85, 2)).toBe(0); // vitesse ×2 : 170 px → image 4 → boucle
  });
  it('le héros a ses images de marche et de clignement', () => {
    expect(hero.views.face.walk.frames.length).toBe(4);
    expect(hero.views.dos.walk.frames.length).toBe(4);
    expect(JSON.stringify(hero.views.face.idle)).toContain('cligne');
  });
});

describe('retournement de la feuille', () => {
  it('pleine au début et à la fin, tranche au milieu', () => {
    expect(flipWidth(0, 0.06)).toBeCloseTo(1);
    expect(flipWidth(1, 0.06)).toBeCloseTo(1);
    expect(flipWidth(0.5, 0.06)).toBeCloseTo(0.06);
    expect(flipWidth(0.25, 0)).toBeLessThan(1);
  });
});

describe('ordre d’affichage selon la profondeur', () => {
  const refs = [140, 127];
  it('les objets lointains sont dessinés en premier', () => {
    expect(propLevels(refs)).toEqual([2, 4]);
  });
  it('le personnage passe devant ou derrière selon sa profondeur', () => {
    expect(actorLevel(refs, 50)).toBe(5); // devant les deux
    expect(actorLevel(refs, 130)).toBe(3); // derrière le caddie, devant le présentoir
    expect(actorLevel(refs, 200)).toBe(1); // derrière les deux
  });
});

describe('rayon d’essai : on peut passer derrière les objets', () => {
  const m = compileMask(place.walkMask);
  it('couloir derrière le présentoir et derrière le caddie', () => {
    expect(isWalkable(m, 750, 215)).toBe(true);
    expect(isWalkable(m, 1417, 200)).toBe(true);
  });
  it('les objets eux-mêmes bloquent', () => {
    expect(isWalkable(m, 750, 140)).toBe(false);
    expect(isWalkable(m, 1417, 127)).toBe(false);
  });
  it('chaque point de référence de profondeur est dans l’emprise de son objet', () => {
    for (const p of place.props) expect(isWalkable(m, p.at[0], p.depthRef)).toBe(false);
  });
});

describe('distance parcourue', () => {
  it('s’accumule en marchant, pas à l’arrêt', () => {
    const m = compileMask(place.walkMask);
    const w = createWalker(300, 60);
    const P = { maxSpeed: 480, acceleration: 3600, deceleration: 4800, depthFactor: 0.8, arrivalRadius: 4 };
    for (let i = 0; i < 30; i++) stepWalker(w, { moveX: 1, moveZ: 0 }, m, P, 1 / 60);
    expect(w.distance).toBeCloseTo(w.x - 300, 6);
    const d = w.distance;
    for (let i = 0; i < 60; i++) stepWalker(w, { moveX: 0, moveZ: 0 }, m, P, 1 / 60);
    for (let i = 0; i < 10; i++) stepWalker(w, { moveX: 0, moveZ: 0 }, m, P, 1 / 60);
    expect(w.distance).toBeGreaterThan(d);
    const still = w.distance;
    stepWalker(w, { moveX: 0, moveZ: 0 }, m, P, 1 / 60);
    expect(w.distance).toBe(still);
  });
});
