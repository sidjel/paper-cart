import { describe, it, expect } from 'vitest';
import { exitAt, createTransition, stepTransition, placeReady, transitionBlack, showWait } from '../../src/core/places.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import { TRANSITIONS } from '../../src/core/state.js';
import rayon from '../../src/data/places/rayon-essai.json';
import accueil from '../../src/data/places/accueil.json';
import rayon2 from '../../src/data/places/rayon-2.json';
import { existsSync } from 'node:fs';

const PLACES = { [rayon.id]: rayon, [accueil.id]: accueil, [rayon2.id]: rayon2 };
const P = { fade: 0.25 };

describe('lieux : sorties et fondu', () => {
  it('A7 : deux passages entre le rayon 7 et le rayon 2, chacun fait arriver du bon côté (au même endroit, en face)', () => {
    for (const [a, b] of [['rayon-essai', 'rayon-2'], ['rayon-2', 'rayon-essai']]) {
      const ways = PLACES[a].exits.items.filter((e) => e.to === b);
      expect(ways.length, `${a} → ${b}`).toBe(2);
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
    expect(exitAt(accueil.exits.items, 2690, 0).to).toBe('rayon-essai');
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
