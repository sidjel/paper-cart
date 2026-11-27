import { describe, it, expect } from 'vitest';
import { compileAnimation, frameIndex, flipEffects, flipWidth } from '../../src/scene/animation.js';
import { flipElasticScale, flipProgress, minWidthForAngle, shouldUsePaperFlip25d, turnAngleDeg, turnDirectionSign } from '../../src/scene/paperFlip.js';
import { propLevels, actorLevel } from '../../src/scene/depth.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import { createWalker, stepWalker } from '../../src/core/movement.js';
import place from '../../src/data/places/rayon-essai.json';
import accueil from '../../src/data/places/accueil.json';
import hero from '../../src/data/characters/heros-test.json';

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
  it('le héros origami 8 directions a ses images de marche (16 par vue) et de clignement', () => {
    for (const v of ['S', 'SE', 'E', 'NE', 'N']) {
      expect(hero.views[v].walk.frames.length).toBe(16);
    }
    expect(JSON.stringify(hero.views.S.idle)).toContain('blink');
  });
});

describe('retournement de la feuille', () => {
  it('pleine au début et à la fin, tranche au milieu', () => {
    expect(flipWidth(0, 0.06)).toBeCloseTo(1);
    expect(flipWidth(1, 0.06)).toBeCloseTo(1);
    expect(flipWidth(0.5, 0.06)).toBeCloseTo(0.06);
    expect(flipWidth(0.25, 0)).toBeLessThan(1);
    expect(flipWidth(0.25, 0.25)).toBeGreaterThan(flipWidth(0.25, 0.06)); // épaisseur de tranche perceptible
    expect(flipWidth(0.8, 0.06)).toBeGreaterThan(0.8); // réouverture vive avec léger snap cartonné
  });
  it('effets papier du retournement : soulèvement, ombrage en fermeture et éclat à la réouverture', () => {
    const out = { lift: 0, brightness: 1 };
    flipEffects(out, 0.5);
    expect(out.lift).toBeCloseTo(3.5);
    expect(out.brightness).toBeLessThan(1);
    flipEffects(out, 0.75);
    expect(out.brightness).toBeGreaterThan(1.1);
    flipEffects(out, 1);
    expect(out.lift).toBeCloseTo(0);
    expect(out.brightness).toBeCloseTo(1);
  });
  it('courbe 2.5D du retournement (anticipation, accélération au milieu, rebond cartonné et sens)', () => {
    expect(flipProgress(0)).toBeCloseTo(0);
    expect(flipProgress(0.5)).toBeCloseTo(0.5);
    expect(flipProgress(1)).toBeCloseTo(1);
    expect(flipProgress(0.2)).toBeLessThan(0.2); // anticipation au démarrage
    expect(flipElasticScale(0)).toBeCloseTo(0);
    expect(flipElasticScale(0.08)).toBeGreaterThan(0); // légère anticipation
    expect(flipElasticScale(0.8)).toBeGreaterThan(0.03); // rebond cartonné à la réouverture
    expect(flipElasticScale(1)).toBeCloseTo(0);
    expect(turnDirectionSign('E', 'SE')).toBe(-1);
    expect(turnDirectionSign('E', 'NE')).toBe(1);
    expect(turnAngleDeg('E', 'SE')).toBe(45);
    expect(turnAngleDeg('E', 'S')).toBe(90);
    expect(turnAngleDeg('N', 'SW')).toBe(135);
    expect(turnAngleDeg('E', 'W')).toBe(180);
    // Largeur minimale adaptée à l'angle réel : 45° > 90° > 135° > 180°
    expect(minWidthForAngle(45, 0.08)).toBeGreaterThan(minWidthForAngle(90, 0.08));
    expect(minWidthForAngle(90, 0.08)).toBeGreaterThan(minWidthForAngle(135, 0.08));
    expect(minWidthForAngle(135, 0.08)).toBeGreaterThan(minWidthForAngle(180, 0.08));
    // Auto (choix 2A) : 2.5D GPU active sur PC et smartphone dès que WebGL est actif, sauf profil Léger ou repli Canvas
    expect(shouldUsePaperFlip25d('auto', true, 'fin')).toBe(true);
    expect(shouldUsePaperFlip25d('auto', true, 'normal')).toBe(true);
    expect(shouldUsePaperFlip25d('auto', true, 'leger')).toBe(false);
    expect(shouldUsePaperFlip25d('auto', false, 'fin')).toBe(false);
    expect(shouldUsePaperFlip25d('oui', true, 'leger')).toBe(true);
    expect(shouldUsePaperFlip25d('oui', false, 'fin')).toBe(false);
    expect(shouldUsePaperFlip25d('non', true, 'fin')).toBe(false);
  });
});

describe('ordre d’affichage selon la profondeur', () => {
  const refs = [140, 127];
  it('les objets lointains sont dessinés en premier', () => {
    expect(propLevels(refs)).toEqual([3, 6]);
  });
  it('le personnage passe devant ou derrière selon sa profondeur', () => {
    expect(actorLevel(refs, 50)).toBe(7); // devant les deux
    expect(actorLevel(refs, 50, true)).toBe(8); // le plus proche des deux personnages, dans la même bande
    expect(actorLevel(refs, 130)).toBe(4); // derrière le chariot, devant le présentoir
    expect(actorLevel(refs, 200)).toBe(1); // derrière les deux
  });
});

describe('rayon d’essai : on peut passer derrière les objets', () => {
  const m = compileMask(place.walkMask);
  it('couloir derrière le présentoir et derrière le chariot', () => {
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

describe('sons et effets de pas (données)', () => {
  it('les pas sonnent quand un pied se pose (images 1 et 9 de la marche de face)', () => {
    const a = compileAnimation(hero.views.S.walk);
    expect(a.sounds.filter(Boolean)).toEqual(['pas', 'pas']);
    expect(a.sounds[0]).toBe('pas');
    expect(a.sounds[8]).toBe('pas');
  });
});

describe('zone de marche jusqu’en bas de l’écran', () => {
  it('on peut descendre derrière le rayon du premier plan', () => {
    const m = compileMask(place.walkMask);
    expect(isWalkable(m, 960, -670)).toBe(true);
    expect(isWalkable(m, 960, -690)).toBe(false);
    expect(isWalkable(m, 960, 260)).toBe(true); // jusqu'au pied de l'étagère du fond
  });
});

describe('poussière et profil par défaut', () => {
  it('les images où un pied se pose font un bruit de pas et de la poussière', () => {
    for (const v of ['S', 'SE', 'E', 'NE', 'N']) {
      const a = compileAnimation(hero.views[v].walk);
      expect(a.effects.filter((e) => e === 'poussiere').length).toBe(2);
      expect(a.sounds.filter((s) => s === 'pas').length).toBe(2);
    }
  });

  it('cohérence et synchronisation de phase des cycles de marche sur les 5 vues (8 directions)', () => {
    const views = ['S', 'SE', 'E', 'NE', 'N'].map((v) => ({ v, a: compileAnimation(hero.views[v].walk) }));
    const refCount = views[0].a.count;
    const refStride = views[0].a.stride;
    for (const { a } of views) {
      expect(a.count).toBe(refCount);
      expect(a.stride).toBe(refStride);
      const contacts = a.sounds.map((s, idx) => (s === 'pas' ? idx : -1)).filter((idx) => idx >= 0);
      expect(contacts.length).toBe(2);
      expect(contacts[1] - contacts[0]).toBe(refCount / 2);
      // Avec syncPhase=true, la distance 0 et le demi-cycle tombent exactement sur un contact au sol pour toutes les vues.
      const i0 = frameIndex(a, 0, 0, 1, true);
      const iHalf = frameIndex(a, 0, (refCount / 2) * refStride, 1, true);
      expect(a.sounds[i0]).toBe('pas');
      expect(a.sounds[iHalf]).toBe('pas');
    }
  });
});

import { bodyMotion } from '../../src/scene/animation.js';
import { createProjection, scaleAt } from '../../src/scene/projection.js';
import { createTargetMarker } from '../../src/scene/targetMarker.js';
import { Container } from 'pixi.js';

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
  it('perspective à point de fuite réel (accueil) : taille juste au comptoir, réduit au fond de l’allée, plafonné devant', () => {
    const proj = createProjection(accueil.projection, { depthScale: 1 });
    expect(scaleAt(proj, 206)).toBeCloseTo(0.90, 2); // devant le comptoir : tête à hauteur du haut de l'écran PC
    expect(scaleAt(proj, 375)).toBeLessThan(0.45); // au fond de l'allée : à hauteur des rayons du fond
    expect(scaleAt(proj, -72)).toBeLessThanOrEqual(accueil.projection.maxScale);
  });
  it('rayon 1 : le mur biais à gauche (sous le panneau Accueil) n’est pas praticable, et le sol descend derrière le Plan 1', () => {
    const m = compileMask(place.walkMask);
    expect(isWalkable(m, 50, 255)).toBe(false); // plinthe bleue du mur gauche
    expect(isWalkable(m, 50, 210)).toBe(true); // carrelage devant le mur gauche
    expect(isWalkable(m, 550, 260)).toBe(true); // pied des étagères
    expect(isWalkable(m, 1500, -670)).toBe(true); // tout devant contre la gondole Plan 1 (seule la tête dépasse)
    expect(scaleAt(createProjection(place.projection, { depthScale: 1 }), -680)).toBeGreaterThan(1.7);
    expect(scaleAt(createProjection(place.projection, { depthScale: 1 }), -680)).toBeLessThanOrEqual(2.0);
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

describe('repère au sol (scene/targetMarker.js)', () => {
  it('s’efface en fondu en 0,25 s, ou immédiatement au changement de lieu / remontage', () => {
    const a = new Container();
    const b = new Container();
    const marker = createTargetMarker(a);
    const g = a.children[0];
    expect(g.visible).toBe(false);

    marker.showAt(120, 340);
    expect(g.visible).toBe(true);
    expect(g.alpha).toBeCloseTo(0.85);

    // Fondu normal de 0,25 s.
    marker.hide();
    marker.update(10, false);
    expect(g.visible).toBe(true);
    marker.update(10.125, false);
    expect(g.alpha).toBeCloseTo(0.425);
    marker.update(10.3, false);
    expect(g.visible).toBe(false);
    expect(g.alpha).toBe(0);

    // hide(true) coupe le fondu immédiatement (ex. changement de lieu).
    marker.showAt(200, 400);
    marker.hide(true);
    expect(g.visible).toBe(false);
    expect(g.alpha).toBe(0);

    // Remontage pendant un fondu en cours : ne réapparaît jamais dans le nouveau lieu.
    marker.showAt(200, 400);
    marker.hide();
    marker.mount(b);
    expect(g.parent).toBe(b);
    expect(g.visible).toBe(false);
    expect(g.alpha).toBe(0);
    marker.update(20, false);
    expect(g.visible).toBe(false);
  });
});
