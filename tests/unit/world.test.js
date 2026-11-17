import { describe, it, expect } from 'vitest';
import { createWorld, enterPlace, buildProducts, buildPickups, moveProduct, planSwap, applySwap, swapEntry } from '../../src/core/world.js';
import { nearestProduct } from '../../src/core/scan.js';
import place from '../../src/data/places/rayon-essai.json';
import catalog from '../../src/data/products.json';
import accueil from '../../src/data/places/accueil.json';

const stageY = (z) => place.projection.floorFrontY - z * place.projection.depthToScreen;
// Les produits viennent du rayon ; le présentoir (Scanette, panier) est dans le hall d'accueil depuis la séance 55.
const build = () => ({ products: buildProducts(place, catalog, stageY), pickups: buildPickups(accueil, 264) });

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
    expect(buildPickups(place, 264)).toEqual([]); // plus de présentoir dans le rayon
    expect(buildProducts(accueil, catalog, stageY)).toEqual([]); // pas de produit dans le hall
  });
  it('le monde se souvient : en revenant dans un lieu, un produit scanné est toujours scanné', () => {
    const w = createWorld();
    const a = enterPlace(w, 'rayon', build);
    a.products[0].scanned = true;
    a.pickups[0].scanned = true;
    enterPlace(w, 'ailleurs', () => ({ products: [], pickups: [] }));
    expect(w.current).toBe('ailleurs');
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

  it('échange prévu : carte de ce lieu → son produit est déplacé ; d’un autre lieu → un nouveau produit (A7)', () => {
    expect(planSwap({ slot: 2, place: 'rayon-essai' }, 'rayon-essai', 5)).toEqual({ from: 2, to: 5 });
    expect(planSwap({ slot: 2, place: 'rayon-2', productId: 'pile' }, 'rayon-essai', 5)).toEqual({ product: 'pile', to: 5 });
    expect(planSwap({ slot: -1, place: 'rayon-essai' }, 'rayon-essai', 5)).toBe(null); // sans produit d'origine
    expect(planSwap(null, 'rayon-essai', 5)).toBe(null); // rien de reposé
  });

  it('l’échange prévu se fait à l’arrivée de la carte du bon produit, pas d’un autre', () => {
    const { products } = build();
    products[2].scanned = true;
    const at5 = { x: products[5].x, z: products[5].z };
    expect(applySwap({ from: 2, to: 5 }, products, 4)).toBe(-1); // un autre produit : rien
    expect(products[2].scanned).toBe(true);
    expect(applySwap(null, products, 5)).toBe(-1);
    expect(applySwap({ from: 2, to: 5 }, products, 5)).toBe(2);
    expect({ x: products[2].x, z: products[2].z }).toEqual(at5);
    expect(products[2].scanned).toBe(false); // de nouveau scannable, à la place du produit scanné
  });

  it('A7 : la carte d’un autre lieu est reposée : son produit apparaît à la place du produit scanné, ici, prêt à scanner', () => {
    const { products } = build();
    const n = products.length;
    const target = products[0];
    expect(applySwap({ product: 'pile', to: 0 }, products, 3, catalog)).toBe(-1); // un autre produit scanné : rien
    const i = applySwap({ product: 'pile', to: 0 }, products, 0, catalog);
    expect(i).toBe(n); // un produit de plus dans ce lieu
    expect(products[i]).toMatchObject({ id: 'pile', x: target.x, y: target.y, scanned: false });
    expect(products[i].w).toBe(Math.round(catalog.products.pile.size[0] * (target.w / target.def.size[0])));
    expect(swapEntry(products, 0, 'pile', catalog.products.pile).loose).toBe(target.loose);
  });
});

