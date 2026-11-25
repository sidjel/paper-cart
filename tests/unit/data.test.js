import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { compileMask, isWalkable } from '../../src/core/walkmask.js';
import catalog from '../../src/data/products.json';
import objectsFile from '../../src/data/objects.json';
import place from '../../src/data/places/rayon-essai.json';
import accueil from '../../src/data/places/accueil.json';
import rayon2 from '../../src/data/places/rayon-2.json';
import salleTest from '../../src/data/places/salle-test.json';
import heroTest from '../../src/data/characters/heros-test.json';
import help from '../../src/data/aide-reglages.json';
import { TUNABLES } from '../../src/config.js';

// Les données se citent entre elles (produits, images, objets) : une référence cassée doit
// échouer ici, pas planter le jeu au chargement.
const art = (src) => `public/${src}`;
const ALL_PLACES = [accueil, place, rayon2, salleTest];

// Règle dimensions (docs/ARCHITECTURE.md §4) : chaque lieu fait au moins 2400 px de large (20:9 sans bande
// noire), 1080 px de haut visible, et aucune image ne dépasse 4096 px sur un côté (sauf exceptions datées).
const MIN_PLACE_WIDTH = 2400;
const WIDTH_EXCEPTIONS = {
  accueil: 'hall origami V2 (2160 px) — élargissement prévu à ≥ 2500 px (étape 2a / 7a)',
};
const MAX_IMAGE_SIDE_EXCEPTIONS = {
  'rayon-avant': 'bande premier plan parallaxe 1,25 (4300×175, redimensionnée au chargement par assets.js)',
  'rayon2-avant': 'bande premier plan rayon 2 provisoire (4300×150, redimensionnée au chargement)',
  'salle-test-fond': 'studio de test libre uniquement (5400×3240, SVG redimensionné au chargement)',
};

describe('données : références entre fichiers', () => {
  it('chaque image citée existe', () => {
    for (const pl of ALL_PLACES) {
      for (const im of Object.values(pl.images)) expect(existsSync(art(im.src)), im.src).toBe(true);
    }
    for (const def of Object.values(catalog.products)) expect(existsSync(art(def.image)), def.image).toBe(true);
    for (const def of Object.values(objectsFile.objects)) expect(existsSync(art(def.image)), def.image).toBe(true);
    const testFrames = JSON.stringify(heroTest.views).match(/art\/[^"]+\.(svg|webp|png)/g) ?? [];
    expect(testFrames.length).toBeGreaterThan(0);
    for (const f of new Set(testFrames)) expect(existsSync(art(f)), f).toBe(true);
  });
  it('règle dimensions : largeur >= 2400 px (20:9 sans bandes noires), hauteur visible 1080 px, images <= 4096 px', () => {
    for (const pl of ALL_PLACES) {
      expect(pl.viewHeight ?? pl.size[1], `${pl.id} hauteur visible`).toBe(1080);
      if (!WIDTH_EXCEPTIONS[pl.id]) {
        expect(pl.size[0], `${pl.id} largeur >= ${MIN_PLACE_WIDTH}`).toBeGreaterThanOrEqual(MIN_PLACE_WIDTH);
      }
      for (const [id, im] of Object.entries(pl.images)) {
        if (MAX_IMAGE_SIDE_EXCEPTIONS[id]) continue;
        expect(im.size[0], `${pl.id}/${id} largeur <= 4096`).toBeLessThanOrEqual(4096);
        expect(im.size[1], `${pl.id}/${id} hauteur <= 4096`).toBeLessThanOrEqual(4096);
      }
    }
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

