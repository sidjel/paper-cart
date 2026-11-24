import { describe, it, expect } from 'vitest';
import { exitAt, createTransition, stepTransition, placeReady, transitionBlack, transitionDirection, transitionWipe, transitionFlip, transitionFlaps, transitionStrips, showWait, exitTarget, shouldPrefetch, neighborIds, neighborImageUrls } from '../../src/core/places.js';
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
        expect(isWalkable(compileMask(dest.walkMask), x, z), e.id).toBe(true);
        expect(exitAt(dest.exits.items, x, z), e.id).toBeNull();
        // la zone de sortie touche bien le sol du lieu
        expect(isWalkable(here, (e.zone[0] + e.zone[2]) / 2, (e.zone[1] + e.zone[3]) / 2), e.id).toBe(true);
      }
      expect(exitAt(pl.exits.items, pl.spawn[0], pl.spawn[1]), pl.id).toBeNull();
      for (const im of Object.values(pl.images)) expect(existsSync(`public/${im.src}`), im.src).toBe(true);
    }
  });
  it('on peut aller du rayon à l’accueil et en revenir', () => {
    expect(exitAt(rayon.exits.items, 100, 60).to).toBe('accueil');
    expect(exitAt(accueil.exits.items, 2090, 0).to).toBe('rayon-essai');
    expect(exitAt(rayon.exits.items, 1500, 60)).toBeNull();
  });
  it('fondu : noircit, attend le nouveau lieu dans le noir, puis s’efface', () => {
    const tr = createTransition({ to: 'accueil' });
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
    const tr = createTransition({ to: 'x' });
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
});
