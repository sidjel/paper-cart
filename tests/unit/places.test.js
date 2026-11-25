import { describe, it, expect } from 'vitest';
import { exitAt, edgeBounds, edgeTouched, createEdgeWalk, stepEdgeWalk, createTransition, stepTransition, placeReady, isCrossDissolve, transitionBlack, transitionDirection, transitionWipe, transitionFlip, transitionFlaps, transitionStrips, transitionDissolve, showWait, exitTarget, shouldPrefetch, neighborIds, neighborImageUrls } from '../../src/core/places.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import { TRANSITIONS } from '../../src/core/state.js';
import rayon from '../../src/data/places/rayon-essai.json';
import accueil from '../../src/data/places/accueil.json';
import rayon2 from '../../src/data/places/rayon-2.json';
import { existsSync } from 'node:fs';

const PLACES = { [rayon.id]: rayon, [accueil.id]: accueil, [rayon2.id]: rayon2 };
const P = { fade: 0.25 };

describe('lieux : sorties et fondu', () => {
  it('A7 : passage central entre le rayon 1 et le rayon 2, fait arriver du bon côté (au même endroit, en face)', () => {
    for (const [a, b] of [['rayon-essai', 'rayon-2'], ['rayon-2', 'rayon-essai']]) {
      const ways = PLACES[a].exits.items.filter((e) => e.to === b);
      expect(ways.length, `${a} → ${b}`).toBe(1);
      for (const e of ways) {
        const mid = (e.zone[0] + e.zone[2]) / 2;
        expect(e.arrive[0]).toBe(mid); // même x : on arrive en face du passage
        // et le passage du retour est au même x
        expect(PLACES[b].exits.items.some((r) => r.to === a && (r.zone[0] + r.zone[2]) / 2 === mid)).toBe(true);
      }
    }
  });

  it('chaque sortie mène à un lieu qui existe ; on arrive sur le sol, hors de toute sortie (pas d’aller-retour sans fin)', () => {
    for (const pl of Object.values(PLACES)) {
      const here = compileMask(pl.walkMask);
      expect(pl.exits.items.length, pl.id).toBeGreaterThan(0);
      for (const e of pl.exits.items) {
        const dest = PLACES[e.to];
        expect(dest, `${pl.id} → ${e.to}`).toBeDefined();
        const [x, z] = e.arrive;
        const destMask = compileMask(dest.walkMask);
        expect(isWalkable(destMask, x, z), e.id).toBe(true);
        expect(exitAt(dest.exits.items, x, z), e.id).toBeNull();
        if (e.edge) {
          const b = edgeBounds(e.edge, pl.size[0], 1);
          expect(isWalkable(here, b.outX, (e.zone[1] + e.zone[3]) / 2), `${e.id} outX`).toBe(true);
        }
        // la zone de sortie touche bien le sol du lieu
        expect(isWalkable(here, (e.zone[0] + e.zone[2]) / 2, (e.zone[1] + e.zone[3]) / 2), e.id).toBe(true);
      }
      expect(exitAt(pl.exits.items, pl.spawn[0], pl.spawn[1]), pl.id).toBeNull();
      for (const im of Object.values(pl.images)) expect(existsSync(`public/${im.src}`), im.src).toBe(true);
    }
  });
  it('sorties de bord : ne déclenchent qu’au 1er pixel qui touche le bord (selon la profondeur z), puis 3/4 hors-champ et arrivée collée au bord', () => {
    const outRight = accueil.exits.items.find((e) => e.id === 'vers-rayon');
    const outLeft = rayon.exits.items.find((e) => e.id === 'vers-accueil');
    // À z profond (échelle 0,7), le héros est plus petit : x = 50 ne touche PAS encore le bord gauche (trigger ≈ 40,6).
    expect(edgeTouched(outLeft, 50, rayon.size[0], 0.7)).toBe(false);
    expect(edgeTouched(outLeft, 40, rayon.size[0], 0.7)).toBe(true);
    // À z = 60 (échelle ~0,93), le 1er pixel touche vers x ≈ 54 ; à x = 75 il ne déclenche PAS encore.
    expect(edgeTouched(outLeft, 75, rayon.size[0], 0.93)).toBe(false);
    expect(edgeTouched(outLeft, 52, rayon.size[0], 0.93)).toBe(true);
    // Côté droit (accueil 2160 px, échelle 0,95) : ne déclenche pas à 2085, déclenche dès que le 1er pixel touche (~2105).
    expect(edgeTouched(outRight, 2085, accueil.size[0], 0.95)).toBe(false);
    expect(edgeTouched(outRight, 2106, accueil.size[0], 0.95)).toBe(true);
    // Les bornes calculées : outX sort 100 % hors-champ (plus aucun pixel visible) et inX est collé au bord sans re-déclencher.
    const leftB = edgeBounds('left', rayon.size[0], 0.93);
    expect(leftB.outX).toBeLessThan(-95);
    expect(leftB.inX).toBeGreaterThan(leftB.triggerX);
    expect(edgeTouched(outLeft, leftB.inX, rayon.size[0], 0.93)).toBe(false);
    const rightB = edgeBounds('right', accueil.size[0], 0.95);
    expect(rightB.outX).toBeGreaterThan(accueil.size[0] + 95);
    expect(rightB.inX).toBeLessThan(rightB.triggerX);
    expect(edgeTouched(outRight, rightB.inX, accueil.size[0], 0.95)).toBe(false);
    // Logique pure de marche automatique au bord : avance seule vers la cible puis se termine.
    const ew = createEdgeWalk('out', leftB.outX, leftB.triggerX, outLeft);
    expect(stepEdgeWalk(ew, leftB.triggerX, 0.016)).toEqual({ done: false, moveX: -1, moveZ: 0 });
    expect(stepEdgeWalk(ew, leftB.outX, 0.016)).toEqual({ done: true, moveX: 0, moveZ: 0 });
    // Garde-fou délai : ne peut jamais bloquer.
    const stuck = createEdgeWalk('out', rightB.outX, rightB.triggerX, outRight);
    expect(stepEdgeWalk(stuck, rightB.triggerX, 1.5).done).toBe(true);
  });
  it('fondu : noircit, attend le nouveau lieu dans le noir, puis s’efface', () => {
    const tr = createTransition({ to: 'accueil' }, 'right', 'wipe');
    expect(transitionBlack(tr, P)).toBe(0);
    let loads = 0;
    for (let k = 0; k < 30; k++) if (stepTransition(tr, 1 / 60, P) === 'load') loads++;
    expect(loads).toBe(1);
    expect(tr.phase).toBe('load');
    expect(transitionBlack(tr, P)).toBe(1); // reste noir tant que le lieu n'est pas prêt
    placeReady(tr);
    stepTransition(tr, 0.125, P);
    expect(transitionBlack(tr, P)).toBeCloseTo(0.5);
    stepTransition(tr, 0.2, P);
    expect(tr.phase).toBe('done');
    expect(transitionBlack(tr, P)).toBe(0);
  });

  it('fade à 0 : passage direct sans division par zéro ni blocage', () => {
    const zero = { fade: 0, waitAfter: 0.3 };
    const tr = createTransition({ to: 'rayon-essai' });
    expect(transitionBlack(tr, zero)).toBe(1);
    expect(stepTransition(tr, 1 / 60, zero)).toBe('load');
    expect(tr.phase).toBe('load');
    placeReady(tr);
    expect(transitionBlack(tr, zero)).toBe(0);
    stepTransition(tr, 1 / 60, zero);
    expect(tr.phase).toBe('done');
    expect(transitionBlack(tr, zero)).toBe(0);
  });
  it('la machine à états a un état « transition », entre deux moments de jeu', () => {
    expect(TRANSITIONS.play).toContain('transition');
    expect(TRANSITIONS.transition).toEqual(['play', 'erreur']);
  });

  it('un lieu qui ne se charge pas : la transition se termine toujours (jeu, ou écran « Réessayer » qui revient au jeu)', () => {
    expect(TRANSITIONS.erreur).toEqual(['play']);
  });

  it('jamais d’écran noir muet : le signe d’attente apparaît si le chargement dure plus de waitAfter', () => {
    const p = { fade: 0.25, waitAfter: 0.3 };
    const tr = createTransition({ to: 'x' }, 'right', 'wipe');
    stepTransition(tr, 0.3, p); // fondu : noir
    expect(tr.phase).toBe('load');
    expect(showWait(tr, p)).toBe(false);
    stepTransition(tr, 0.2, p);
    expect(showWait(tr, p)).toBe(false);
    stepTransition(tr, 0.15, p);
    expect(showWait(tr, p)).toBe(true); // 0,35 s dans le noir
    placeReady(tr);
    expect(showWait(tr, p)).toBe(false);
  });
});

describe('passages au doigt (séance 67)', () => {
  it('toucher une ouverture envoie au milieu de son passage, même trop bas pour être touché ; ailleurs, rien', () => {
    const a = rayon2.exits.items.find((e) => e.id === 'vers-rayon-a');
    const mid = [(a.zone[0] + a.zone[2]) / 2, (a.zone[1] + a.zone[3]) / 2];
    expect(exitTarget(rayon2.exits.items, 2170, -200)).toEqual(mid); // bas de l'écran, devant l'ouverture
    expect(exitTarget(rayon2.exits.items, 1500, -200)).toBe(null); // ailleurs : on marche, simplement
    expect(exitTarget(rayon2.exits.items, 2170, 100)).toBe(null); // le sol devant l'ouverture : on marche
    const aOut = rayon.exits.items.find((e) => e.id === 'vers-rayon2-a');
    expect(exitTarget(rayon.exits.items, 2170, 600)).toEqual([(aOut.zone[0] + aOut.zone[2]) / 2, (aOut.zone[1] + aOut.zone[3]) / 2]); // l'arche centrale, au fond
    expect(exitTarget(rayon.exits.items, 1000, 600)).toBe(null); // l'étagère : comme avant
    // Hall d'accueil : cliquer dans l'allée entre les deux piliers (à droite des paniers rouges) NE redirige PAS vers la sortie droite.
    expect(exitTarget(accueil.exits.items, 1750, 320)).toBe(null);
    expect(exitTarget(accueil.exits.items, 1850, 500)).toBe(null);
    expect(exitTarget(accueil.exits.items, 2130, 300)).not.toBe(null); // seul le vrai bord droit redirige vers la sortie
  });

  it('hall d’accueil : le héros peut aller au fond entre les deux piliers et derrière la plante + les paniers rouges', () => {
    const m = compileMask(accueil.walkMask);
    expect(isWalkable(m, 1730, 360)).toBe(true); // au fond entre les deux piliers marron clair
    expect(isWalkable(m, 1560, 252)).toBe(true); // derrière la plante à gauche des paniers rouges
    expect(isWalkable(m, 1650, 260)).toBe(true); // derrière les paniers rouges
    expect(isWalkable(m, 1650, 215)).toBe(false); // pied des paniers rouges : obstacle
  });
});

describe('pré-téléchargement silencieux des lieux voisins', () => {
  it('désactivé en profil Léger ou en mode économie de données (saveData)', () => {
    expect(shouldPrefetch('fin', false)).toBe(true);
    expect(shouldPrefetch('normal', false)).toBe(true);
    expect(shouldPrefetch('leger', false)).toBe(false);
    expect(shouldPrefetch('fin', true)).toBe(false);
  });

  it('liste les lieux voisins uniques et leurs images sans doublon', () => {
    expect(neighborIds(accueil)).toEqual(['rayon-essai']);
    expect(neighborIds(rayon)).toEqual(['accueil', 'rayon-2']);
    const urls = neighborImageUrls(accueil, PLACES, '/paper-cart/');
    expect(urls).toContain('/paper-cart/art/rayon-essai/rayon-fond.webp');
    expect(new Set(urls).size).toBe(urls.length);
    // Ne répète pas les images déjà présentes dans l'accueil (ex. oiseau-1.webp).
    expect(urls.some((u) => u.endsWith('art/accueil/oiseau-1.webp'))).toBe(false);
  });
});

describe('volet papier directionnel (2A)', () => {
  it('déduit la direction selon le bord de sortie du lieu', () => {
    expect(transitionDirection(accueil.exits.items[0], accueil)).toBe('right');
    expect(transitionDirection(rayon.exits.items.find((e) => e.to === 'accueil'), rayon)).toBe('left');
    expect(transitionDirection(rayon.exits.items.find((e) => e.to === 'rayon-2'), rayon)).toBe('up');
    expect(transitionDirection(rayon2.exits.items.find((e) => e.to === 'rayon-essai'), rayon2)).toBe('down');
  });

  it('glisse de +104 % à 0 % puis à -104 % dans le sens opposé à la marche', () => {
    const p = { fade: 0.18 };
    const tr = createTransition({ to: 'rayon-essai' }, 'right');
    expect(transitionWipe(tr, p)).toEqual({ x: 104, y: 0 });
    stepTransition(tr, 0.09, p); // mi-parcours aller : 75 % couvert
    expect(transitionWipe(tr, p).x).toBeCloseTo(26);
    stepTransition(tr, 0.1, p); // passe en 'load'
    expect(tr.phase).toBe('load');
    expect(transitionWipe(tr, p)).toEqual({ x: 0, y: 0 });
    placeReady(tr);
    stepTransition(tr, 0.09, p); // mi-parcours sortie
    expect(transitionWipe(tr, p).x).toBeCloseTo(-26);
    stepTransition(tr, 0.1, p);
    expect(tr.phase).toBe('done');
    expect(transitionWipe(tr, p)).toEqual({ x: -104, y: 0 });
  });

  it('inverse correctement les axes pour left, up et down', () => {
    const p = { fade: 0.18 };
    expect(transitionWipe(createTransition({ to: 'accueil' }, 'left'), p)).toEqual({ x: -104, y: 0 });
    expect(transitionWipe(createTransition({ to: 'rayon-2' }, 'up'), p)).toEqual({ x: 0, y: -104 });
    expect(transitionWipe(createTransition({ to: 'rayon-essai' }, 'down'), p)).toEqual({ x: 0, y: 104 });
  });

  it('3A (flip) : pivote depuis la tranche blanche puis se replie en sortie', () => {
    const p = { fade: 0.24 };
    const tr = createTransition({ to: 'rayon-essai' }, 'right', 'flip');
    expect(transitionFlip(tr, p).edge).toBe(true);
    expect(transitionFlip(tr, p).sx).toBeCloseTo(0.045);
    stepTransition(tr, 0.25, p);
    expect(tr.phase).toBe('load');
    expect(transitionFlip(tr, p)).toEqual({ x: 0, y: 0, sx: 1, sy: 1, edge: false });
    placeReady(tr);
    stepTransition(tr, 0.25, p);
    expect(tr.phase).toBe('done');
    expect(transitionFlip(tr, p).edge).toBe(true);
  });

  it('3B (double) : ferme les deux rabats vers le centre puis les rouvre', () => {
    const p = { fade: 0.24 };
    const tr = createTransition({ to: 'rayon-2' }, 'up', 'double');
    expect(transitionFlaps(tr, p)).toEqual({ axis: 'y', a: 0, b: 0 });
    stepTransition(tr, 0.25, p);
    expect(transitionFlaps(tr, p)).toEqual({ axis: 'y', a: 1, b: 1 });
    placeReady(tr);
    stepTransition(tr, 0.25, p);
    expect(transitionFlaps(tr, p)).toEqual({ axis: 'y', a: 0, b: 0 });
  });

  it('strips : lignes blanches → élargissement en cartes → retournement', () => {
    const p = { fade: 0.24 };
    const tr = createTransition({ to: 'rayon-essai' }, 'right', 'strips');
    stepTransition(tr, 0.05, p); // début : lignes blanches fines
    const early = transitionStrips(tr, p, 'right', 6);
    expect(early.axis).toBe('x');
    expect(early.items[0].white).toBe(true);
    expect(early.items[0].s).toBeCloseTo(0.14);
    stepTransition(tr, 0.25, p); // plein écran en cartes
    const full = transitionStrips(tr, p, 'right', 6);
    expect(full.items.every((it) => !it.white && it.s > 1)).toBe(true);
    placeReady(tr);
    stepTransition(tr, 0.25, p); // retournées et disparues
    expect(transitionStrips(tr, p, 'right', 6).items.every((it) => it.opacity === 0)).toBe(true);
  });

  it('cross-dissolve et brume lumineuse : charge tout de suite puis fond doucement l’ancien lieu', () => {
    const p = { fade: 0.34 };
    expect(isCrossDissolve('dissolve')).toBe(true);
    expect(isCrossDissolve('mist')).toBe(true);
    expect(isCrossDissolve('flip')).toBe(false);

    const tr = createTransition({ to: 'rayon-essai' }, 'right', 'mist');
    expect(stepTransition(tr, 1 / 60, p)).toBe('load'); // passe tout de suite au chargement
    expect(tr.phase).toBe('load');
    expect(transitionDissolve(tr, p).oldOpacity).toBe(1);
    placeReady(tr);
    stepTransition(tr, 0.17, p); // mi-parcours : ancien lieu à 50 %, brume douce à son pic (~0.34)
    const mid = transitionDissolve(tr, p);
    expect(mid.oldOpacity).toBeCloseTo(0.5);
    expect(mid.mistOpacity).toBeCloseTo(0.34);
    stepTransition(tr, 0.2, p);
    expect(tr.phase).toBe('done');
    expect(transitionDissolve(tr, p)).toEqual({ oldOpacity: 0, mistOpacity: 0 });

    const pure = createTransition({ to: 'accueil' }, 'left', 'dissolve');
    stepTransition(pure, 1 / 60, p);
    placeReady(pure);
    stepTransition(pure, 0.17, p);
    expect(transitionDissolve(pure, p)).toEqual({ oldOpacity: 0.5, mistOpacity: 0 });
  });
});
