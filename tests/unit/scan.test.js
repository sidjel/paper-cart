import { describe, it, expect } from 'vitest';
import { nearestProduct, productNear, inReach, createScan, startScan, stepScan, scanProgress } from '../../src/core/scan.js';
import { createBasket, addToBasket, STAGES } from '../../src/core/cards.js';
import { createWalker, faceShelf } from '../../src/core/movement.js';
import { createStateMachine } from '../../src/core/state.js';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import catalog from '../../src/data/products.json';
import place from '../../src/data/places/rayon-essai.json';

const P = { range: 150, minDepth: 150, raise: 0.15, laser: 0.22, dissolve: 0.55, card: 1.0 };

describe('produit à portée', () => {
  const shelf = [{ x: 300, scanned: false }, { x: 600, scanned: false }, { x: 650, scanned: true }];
  it('le plus proche, à portée et au pied de l’étagère', () => {
    expect(nearestProduct(shelf, { x: 420, z: 200 }, P)).toBe(0);
    expect(nearestProduct(shelf, { x: 560, z: 200 }, P)).toBe(1);
  });
  it('rien si trop loin, trop en avant, ou déjà scanné', () => {
    expect(nearestProduct(shelf, { x: 1000, z: 200 }, P)).toBe(-1);
    expect(nearestProduct(shelf, { x: 300, z: 50 }, P)).toBe(-1);
    expect(nearestProduct([{ x: 300, scanned: true }], { x: 300, z: 200 }, P)).toBe(-1);
  });
});

describe('double toucher : produit visé', () => {
  const shelf = [{ x: 300, scanned: false }, { x: 600, scanned: false }, { x: 650, scanned: true }];
  it('le produit non scanné le plus proche du toucher, à tolérance près', () => {
    expect(productNear(shelf, 330, 150)).toBe(0);
    expect(productNear(shelf, 640, 150)).toBe(1); // le 650 est déjà scanné
    expect(productNear(shelf, 1000, 150)).toBe(-1);
  });
  it('à portée : ce produit précis, au pied de l’étagère', () => {
    expect(inReach(shelf, 1, { x: 560, z: 200 }, P)).toBe(true);
    expect(inReach(shelf, 0, { x: 560, z: 200 }, P)).toBe(false); // trop loin
    expect(inReach(shelf, 1, { x: 560, z: 50 }, P)).toBe(false); // pas au pied de l'étagère
    expect(inReach(shelf, 2, { x: 650, z: 200 }, P)).toBe(false); // déjà scanné
  });
});

describe('déroulé d’un scan (temps de jeu)', () => {
  it('lever → laser (bip) → dissolution (aspiration) → carte → fin', () => {
    const s = createScan();
    expect(startScan(s, 2)).toBe(true);
    expect(startScan(s, 3)).toBe(false); // pas deux scans à la fois
    const events = [];
    let t = 0;
    while (s.active && t < 5) {
      const e = stepScan(s, 1 / 60, P);
      if (e) events.push([e, Math.round(t * 100) / 100]);
      t += 1 / 60;
    }
    expect(events.map((e) => e[0])).toEqual(['bip', 'aspire', 'carte', 'fin']);
    expect(t).toBeCloseTo(P.raise + P.laser + P.dissolve + P.card, 1);
    expect(s.index).toBe(2);
  });
  it('figé si on n’avance pas le temps (pause)', () => {
    const s = createScan();
    startScan(s, 0);
    stepScan(s, 0.1, P);
    const before = scanProgress(s, P);
    expect(scanProgress(s, P)).toBe(before);
    expect(s.phase).toBe('raise');
  });
});

describe('cartes et Panier', () => {
  it('une carte reprend la fiche du produit, sans le préfixe provisoire', () => {
    const b = createBasket();
    const c = addToBasket(b, 'steak', catalog.products.steak);
    expect(c).toMatchObject({ uid: 1, productId: 'steak', name: 'Steak', power: 5, stage: 'frais' });
    expect(c.properties).toEqual(['gras', 'organique']);
    addToBasket(b, 'banane', catalog.products.banane);
    expect(b.cards.map((x) => x.uid)).toEqual([1, 2]);
  });
  it('chaque produit du catalogue a un stade connu, une puissance et des propriétés', () => {
    for (const def of Object.values(catalog.products)) {
      expect(STAGES).toContain(def.stage);
      expect(def.power).toBeGreaterThan(0);
      expect(def.properties.length).toBeGreaterThan(0);
    }
  });
  it('les produits du rayon existent au catalogue et sont scannables depuis le sol', () => {
    const m = compileMask(place.walkMask);
    expect(place.shelfProducts.items.length).toBe(10);
    for (const it of place.shelfProducts.items) {
      expect(catalog.products[it.product]).toBeDefined();
      // il existe un point praticable au pied de l'étagère, à portée du produit
      let ok = false;
      for (let dx = -P.range; dx <= P.range && !ok; dx += 10) for (let z = P.minDepth; z <= 264 && !ok; z += 10) ok = isWalkable(m, it.at[0] + dx, z);
      expect(ok, it.product).toBe(true);
    }
  });
});

describe('se tourner vers l’étagère, Panier dans la machine à états', () => {
  it('le personnage s’arrête et se met de dos, du côté du produit', () => {
    const w = createWalker(500, 200);
    w.vx = 300;
    faceShelf(w, 420);
    expect(w).toMatchObject({ vx: 0, vz: 0, facing: -1, away: true, hasTarget: false });
  });
  it('le Panier s’ouvre depuis le jeu et y revient', () => {
    const sm = createStateMachine('play');
    expect(sm.go('panier')).toBe(true);
    expect(sm.go('menu')).toBe(false);
    expect(sm.go('play')).toBe(true);
  });
});
