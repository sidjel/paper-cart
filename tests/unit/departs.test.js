import { describe, it, expect } from 'vitest';
import { findDepart, cardCount, pickProducts, saidFor, ARRIVAL } from '../../src/core/departs.js';
import file from '../../src/data/departs.json' with { type: 'json' };
import narrator from '../../src/data/narrator.json' with { type: 'json' };

describe('points de départ (tests rapides)', () => {
  it('chaque départ a un identifiant unique et un libellé ; le premier est le début normal', () => {
    const ids = file.departs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('debut');
    for (const d of file.departs) expect(d.label.length, d.id).toBeGreaterThan(5);
    expect(findDepart(file.departs, 'panier-plein').cards).toBe('plein');
    expect(findDepart(file.departs, 'inconnu')).toBeNull();
  });
  it('nombre de cartes : un nombre, ou la capacité', () => {
    expect(cardCount({ cards: 'plein' }, 6)).toBe(6);
    expect(cardCount({ cards: 3 }, 6)).toBe(3);
    expect(cardCount({ cards: 9 }, 6)).toBe(6);
    expect(cardCount({}, 6)).toBe(0);
  });
  it('produits choisis : les non alimentaires d’abord, puis dans l’ordre du rayon', () => {
    const items = [{ category: 'alimentaire' }, { category: 'non-alimentaire' }, { category: 'alimentaire' }, { category: 'non-alimentaire' }];
    expect(pickProducts(items, 3)).toEqual([1, 3, 0]);
  });
  it('moments déjà passés : l’arrivée si équipé, la rencontre si elle est faite ; ils existent tous', () => {
    expect(saidFor({})).toEqual([]);
    expect(saidFor({ equip: true })).not.toContain('rencontre');
    expect(saidFor({ equip: true, met: true })).toContain('rencontre');
    for (const t of saidFor({ equip: true, met: true })) expect(narrator.triggers[t], t).toBeDefined();
    expect(ARRIVAL.length).toBe(5);
  });
});
