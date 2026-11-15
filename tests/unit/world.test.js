import { describe, it, expect } from 'vitest';
import { createWorld, enterPlace, buildProducts, buildPickups, moveProduct } from '../../src/core/world.js';
import { nearestProduct } from '../../src/core/scan.js';
import place from '../../src/data/places/rayon-essai.json';
import catalog from '../../src/data/products.json';

const stageY = (z) => place.projection.floorFrontY - z * place.projection.depthToScreen;
const build = () => ({ products: buildProducts(place, catalog, stageY), pickups: buildPickups(place, 264) });

describe('état du monde', () => {
  it('produits et objets à prendre d’un lieu, d’après ses données', () => {
    const here = build();
    expect(here.products.length).toBe(place.shelfProducts.items.length + place.looseProducts.items.length);
    const banane = here.products[0];
    expect(banane).toMatchObject({ id: 'banane', x: 720, y: 282, loose: false, scanned: false });
    const loose = here.products.find((p) => p.loose);
    expect(loose.z).toBeGreaterThan(0);
    expect(loose.standAt.length).toBeGreaterThan(0);
    expect(here.pickups.map((p) => p.id)).toEqual(['scanette', 'panier']);
  });
  it('le monde se souvient : en revenant dans un lieu, un produit scanné est toujours scanné', () => {
    const w = createWorld();
    const a = enterPlace(w, 'rayon', build);
    a.products[0].scanned = true;
    a.pickups[0].scanned = true;
    enterPlace(w, 'accueil', () => ({ products: [], pickups: [] }));
    expect(w.current).toBe('accueil');
    const back = enterPlace(w, 'rayon', build);
    expect(back).toBe(a);
    expect(back.products[0].scanned).toBe(true);
    expect(back.pickups[0].scanned).toBe(true);
    expect(back.products[1].scanned).toBe(false);
  });
  it('échange : le produit reposé prend la place du produit scanné, et redevient scannable là', () => {
    const { products } = build();
    products[0].scanned = true; // banane, dans le panier
    const lait = { ...products[1] };
    products[1].scanned = true; // on scanne le lait
    moveProduct(products, 0, 1);
    expect(products[0]).toMatchObject({ id: 'banane', x: lait.x, y: lait.y, scanned: false });
    expect(nearestProduct(products, { x: lait.x, z: 200 }, { range: 150, minDepth: 150 })).toBe(0);
  });
});
