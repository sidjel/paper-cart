import { describe, it, expect } from 'vitest';
import { exitAt, edgeBounds, edgeTouched, createEdgeWalk, stepEdgeWalk, createTransition, stepTransition, placeReady, transitionDissolve, showWait, exitTarget, shouldPrefetch, neighborIds, neighborImageUrls } from '../../src/core/places.js';
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
    // Côté droit (accueil 2600 px, échelle 0,95) : ne déclenche pas à 2525, déclenche dès que le 1er pixel touche (~2545).
    expect(edgeTouched(outRight, 2525, accueil.size[0], 0.95)).toBe(false);
    expect(edgeTouched(outRight, 2546, accueil.size[0], 0.95)).toBe(true);
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
  it('fondu enchaîné pur : charge tout de suite en gardant l’ancien décor, puis le fond doucement', () => {
    const tr = createTransition({ to: 'accueil' });
    expect(transitionDissolve(tr, P)).toBe(1);
    let loads = 0;
    for (let k = 0; k < 5; k++) if (stepTransition(tr, 1 / 60, P) === 'load') loads++;
    expect(loads).toBe(1);
    expect(tr.phase).toBe('load');
    expect(transitionDissolve(tr, P)).toBe(1); // reste plein tant que le lieu n'est pas prêt
    placeReady(tr);
    stepTransition(tr, 0.125, P);
    expect(transitionDissolve(tr, P)).toBeCloseTo(0.5);
    stepTransition(tr, 0.2, P);
    expect(tr.phase).toBe('done');
    expect(transitionDissolve(tr, P)).toBe(0);
  });

  it('fade à 0 : passage direct sans division par zéro ni blocage', () => {
    const zero = { fade: 0, waitAfter: 0.3 };
    const tr = createTransition({ to: 'rayon-essai' });
    expect(stepTransition(tr, 1 / 60, zero)).toBe('load');
    expect(tr.phase).toBe('load');
    placeReady(tr);
    expect(transitionDissolve(tr, zero)).toBe(0);
    stepTransition(tr, 1 / 60, zero);
    expect(tr.phase).toBe('done');
    expect(transitionDissolve(tr, zero)).toBe(0);
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
    const tr = createTransition({ to: 'x' });
    stepTransition(tr, 0.01, p); // passe tout de suite en 'load'
    expect(tr.phase).toBe('load');
    expect(showWait(tr, p)).toBe(false);
    stepTransition(tr, 0.2, p);
    expect(showWait(tr, p)).toBe(false);
    stepTransition(tr, 0.15, p);
    expect(showWait(tr, p)).toBe(true); // 0,35 s de chargement
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
    // Hall d'accueil (2600 px) : cliquer dans l'allée entre les deux piliers NE redirige PAS vers la sortie droite.
    expect(exitTarget(accueil.exits.items, 1970, 320)).toBe(null);
    expect(exitTarget(accueil.exits.items, 2070, 500)).toBe(null);
    expect(exitTarget(accueil.exits.items, 2570, 300)).not.toBe(null); // seul le vrai bord droit redirige vers la sortie
  });

  it('hall d’accueil : le héros peut aller au fond entre les deux piliers et derrière la plante + les paniers rouges', () => {
    const m = compileMask(accueil.walkMask);
    expect(isWalkable(m, 1950, 360)).toBe(true); // au fond entre les deux piliers marron clair
    expect(isWalkable(m, 1780, 252)).toBe(true); // derrière la plante à gauche des paniers rouges
    expect(isWalkable(m, 1870, 260)).toBe(true); // derrière les paniers rouges
    expect(isWalkable(m, 1870, 215)).toBe(false); // pied des paniers rouges : obstacle
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
