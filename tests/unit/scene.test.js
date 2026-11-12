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

import { compileSong } from '../../src/audio/music.js';
import song from '../../src/data/music/supermarche.json';

describe('musique et sons (données)', () => {
  it('la partition se transforme en événements triés, dans la boucle', () => {
    const s = compileSong(song);
    expect(s.loopBeats).toBe(32);
    for (let i = 1; i < s.events.length; i++) expect(s.events[i].beat).toBeGreaterThanOrEqual(s.events[i - 1].beat);
    expect(s.events.every((e) => e.beat < s.loopBeats)).toBe(true);
  });
  it('les pas sonnent quand un pied se pose (images 1 et 3 de la marche)', () => {
    const a = compileAnimation(hero.views.face.walk);
    expect(a.sounds).toEqual(['pas', null, 'pas', null]);
  });
});

describe('zone de marche jusqu’en bas de l’écran', () => {
  it('on peut descendre derrière le rayon du premier plan', () => {
    const m = compileMask(place.walkMask);
    expect(isWalkable(m, 960, -140)).toBe(true);
    expect(isWalkable(m, 960, -160)).toBe(false);
  });
});

describe('poussière et profil par défaut', () => {
  it('les images où un pied se pose font un bruit de pas et de la poussière', () => {
    const a = compileAnimation(hero.views.dos.walk);
    expect(a.effects).toEqual(['poussiere', null, 'poussiere', null]);
  });
});

import { bodyMotion } from '../../src/scene/animation.js';
import { createProjection, scaleAt } from '../../src/scene/projection.js';

describe('profondeur et corps vivant', () => {
  const P = { bounceHeight: 7, walkSquash: 0.05, breathAmount: 0.02, breathRate: 0.5, stopSquash: 0.1, stopDuration: 0.2 };
  const out = { lift: 0, sx: 1, sy: 1 };
  it('plus petit au fond, plus grand devant', () => {
    const proj = createProjection(place.projection, { depthScale: 1 });
    expect(scaleAt(proj, 0)).toBe(1);
    expect(scaleAt(proj, 250)).toBeLessThan(0.8);
    expect(scaleAt(proj, -150)).toBeGreaterThan(1.1);
    expect(scaleAt(createProjection(place.projection, { depthScale: 0 }), 250)).toBe(1);
  });
  it('rebondit au milieu d’un pas, touche le sol au début', () => {
    bodyMotion(out, P, true, 0, 80, 0, -1);
    expect(out.lift).toBeCloseTo(0);
    expect(out.sy).toBeLessThan(1); // écrasé au contact
    bodyMotion(out, P, true, 40, 80, 0, -1);
    expect(out.lift).toBeCloseTo(7);
  });
  it('respire à l’arrêt, sans quitter le sol', () => {
    bodyMotion(out, P, false, 0, 80, 0.5, -1); // un quart de respiration
    expect(out.lift).toBe(0);
    expect(out.sy).toBeCloseTo(1.02);
  });
  it('s’écrase un instant en s’arrêtant', () => {
    bodyMotion(out, P, false, 0, 80, 0, 0.05);
    expect(out.sy).toBeLessThan(1);
    bodyMotion(out, P, false, 0, 80, 0, 0.5);
    expect(out.sy).toBeCloseTo(1);
  });
});
