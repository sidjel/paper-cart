import { describe, it, expect } from 'vitest';
import { createGear, takeItem, capacity, scanBlocked } from '../../src/core/gear.js';
import { nearestProduct } from '../../src/core/scan.js';
import place from '../../src/data/places/rayon-essai.json';

const CARRY = { panier: 6 };
const P = { range: 150, minDepth: 150, looseRange: 170, looseDepth: 90 };

describe('accueil : Scanette et panier (A5a)', () => {
  const pickups = () => [
    { id: 'scanette', x: 205, z: 264, loose: true, scanned: false },
    { id: 'panier', x: 395, z: 264, loose: true, scanned: false },
  ];
  it('au début, mains vides : impossible de scanner', () => {
    const g = createGear();
    expect(scanBlocked(g, 0, CARRY)).toBe('sans_scanette');
    expect(capacity(g, CARRY)).toBe(0);
  });
  it('la Scanette seule ne suffit pas : il faut un panier', () => {
    const g = createGear();
    const p = pickups();
    expect(takeItem(g, p, 0)).toBe(true);
    expect(scanBlocked(g, 0, CARRY)).toBe('sans_panier');
    expect(takeItem(g, p, 0)).toBe(false); // déjà prise
  });
  it('avec les deux : scanner jusqu’à la capacité du panier, puis refus (règle provisoire)', () => {
    const g = createGear();
    const p = pickups();
    takeItem(g, p, 0);
    takeItem(g, p, 1);
    expect(capacity(g, CARRY)).toBe(6);
    expect(scanBlocked(g, 5, CARRY)).toBe('');
    expect(scanBlocked(g, 6, CARRY)).toBe('plein');
  });
  it('au présentoir, on vise ce qu’on n’a pas encore pris, depuis le pied de l’étagère', () => {
    const p = pickups();
    expect(nearestProduct(p, { x: 220, z: 244 }, P)).toBe(0);
    expect(nearestProduct(p, { x: 380, z: 244 }, P)).toBe(1);
    expect(nearestProduct(p, { x: 300, z: 60 }, P)).toBe(-1); // trop loin du fond
    p[0].scanned = true;
    expect(nearestProduct(p, { x: 300, z: 244 }, P)).toBe(1); // la Scanette prise, reste le panier
  });
  it('le lieu d’essai a un accueil avec une Scanette et un panier', () => {
    expect(place.accueil.items.map((i) => i.id).sort()).toEqual(['panier', 'scanette']);
  });
});
