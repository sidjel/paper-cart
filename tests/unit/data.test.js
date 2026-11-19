import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import catalog from '../../src/data/products.json';
import place from '../../src/data/places/rayon-essai.json';
import hero from '../../src/data/characters/heros.json';
import help from '../../src/data/aide-reglages.json';
import { TUNABLES } from '../../src/config.js';

// Les données se citent entre elles (produits, images, objets) : une référence cassée doit
// échouer ici, pas planter le jeu au chargement.
const art = (src) => `public/${src}`;

describe('données : références entre fichiers', () => {
  it('chaque image citée existe', () => {
    for (const im of Object.values(place.images)) expect(existsSync(art(im.src)), im.src).toBe(true);
    for (const def of Object.values(catalog.products)) expect(existsSync(art(def.image)), def.image).toBe(true);
    const frames = JSON.stringify(hero.views).match(/art\/[^"]+\.svg/g);
    for (const f of new Set(frames)) expect(existsSync(art(f)), f).toBe(true);
  });
  it('chaque produit a une description [TEMP] pour le dos de sa carte (courte)', () => {
    for (const [id, def] of Object.entries(catalog.products)) {
      expect(def.description?.startsWith('[TEMP] '), id).toBe(true);
      expect(def.description.length, id).toBeLessThan(140);
    }
  });
  it('chaque objet du décor utilise une image du lieu, chaque calque aussi', () => {
    for (const p of place.props) expect(place.images[p.image], p.id).toBeDefined();
    for (const l of place.layers) if (l.image) expect(place.images[l.image], l.id).toBeDefined();
  });
  it('produits posés ailleurs : produit connu, support existant, endroits où se placer praticables', () => {
    const m = compileMask(place.walkMask);
    const ids = place.props.map((p) => p.id);
    for (const it of place.looseProducts?.items ?? []) {
      expect(catalog.products[it.product], it.product).toBeDefined();
      expect(ids, it.on).toContain(it.on);
      for (const [x, z] of it.standAt) expect(isWalkable(m, x, z), `${it.product} ${x},${z}`).toBe(true);
    }
  });
});

describe('réglages : chacun a son explication (séance 77)', () => {
  it('chaque réglage de TUNABLES a une explication dans data/aide-reglages.json, et rien en trop', () => {
    const keys = TUNABLES.map((t) => t.key);
    expect(keys.filter((k) => !help.aide[k])).toEqual([]);
    expect(Object.keys(help.aide).filter((k) => !keys.includes(k))).toEqual([]);
  });
});

