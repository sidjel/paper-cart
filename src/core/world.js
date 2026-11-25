// L'état du monde : ce dont le jeu se souvient, lieu par lieu (logique pure, une seule source).
// Un produit scanné reste scanné, un objet pris reste pris ; l'affichage (scene/products.js) ne fait que
// montrer cet état. Les cartes et les objets portés suivent le héros (core/cards.js, core/gear.js).
//
// Par lieu : { products: [...], pickups: [...] }
//  - products : [{ id, def, x, y, w, h, loose, z, standAt, on, scanned }] — x, y : bas du dessin sur la
//    scène ; loose (posé ailleurs que sur l'étagère) : z = profondeur au sol, standAt = où se placer,
//    on = objet du décor qui le porte. Mêmes champs que ceux lus par core/scan.js.
//  - pickups : objets à prendre (présentoir), visés comme des produits posés ailleurs ; scanned = déjà pris.

export function createWorld() {
  return { places: {}, current: '' };
}

// Entrer dans un lieu : son état est créé la première fois (build), retrouvé tel quel ensuite.
export function enterPlace(world, id, build) {
  if (!world.places[id]) world.places[id] = build();
  world.current = id;
  return world.places[id];
}

// Produits d'un lieu, d'après ses données. stageY(z) : hauteur sur la scène du sol à la profondeur z.
export function buildProducts(place, catalog, stageY) {
  const entry = (it, x, y, scale, extra) => {
    const def = catalog.products[it.product];
    return { id: it.product, def, x, y, w: Math.round(def.size[0] * scale), h: Math.round(def.size[1] * scale), loose: false, z: undefined, standAt: undefined, on: undefined, scanned: false, ...extra };
  };
  const out = (place.shelfProducts?.items ?? []).map((it) => entry(it, it.at[0], it.at[1], 1));
  for (const it of place.looseProducts?.items ?? []) {
    const [wx, wz] = it.at;
    out.push(entry(it, wx, stageY(wz) - it.lift, it.scale ?? 1, { loose: true, z: wz, standAt: it.standAt, on: it.on }));
  }
  return out;
}

// Objets à prendre : au présentoir (au fond, backZ, contre l'étagère ; on s'y présente de face), et posés
// au sol (place.pickups : at = [x, z] ; stageY(z) : hauteur sur la scène). Un objet caché par une pile de
// cartons (place.pile.hides) n'est pas disponible tant qu'elle n'est pas tombée (scanned : indisponible).
export function buildPickups(place, backZ, stageY) {
  const deskZ = place.accueil?.z ?? backZ;
  const desk = (place.accueil?.items ?? []).map((it) => {
    const iz = it.z ?? deskZ;
    return {
      id: it.id, x: it.at[0], z: iz, loose: true, scanned: false, standAt: [[it.at[0], iz - 20]], y: it.at[1] + it.h, w: it.w, h: it.h,
    };
  });
  const floor = (place.pickups?.items ?? []).map((it) => ({
    id: it.id, x: it.at[0], z: it.at[1], loose: true, scanned: place.pile?.hides === it.id, standAt: it.standAt, y: stageY(it.at[1]), w: it.w, h: it.h,
  }));
  return [...desk, ...floor];
}

// Échange (panier plein) : le produit `from` (reposé) prend la place du produit `to` (qu'on vient de scanner).
export function moveProduct(products, from, to) {
  const a = products[from];
  const b = products[to];
  a.x = b.x;
  a.y = b.y;
  a.loose = b.loose;
  a.z = b.z;
  a.standAt = b.standAt;
  a.on = b.on;
  a.scanned = false;
}

// Panier plein : une carte est reposée pour faire de la place au produit `target`, dans le lieu `placeId`.
// Son produit prend la place du produit scanné, sur ce rayon-ci (règle de l'auteur, séance 63) :
// - carte de ce lieu : son produit d'origine y est déplacé → { from, to } ;
// - carte d'un autre lieu (A7, séance 67) : un nouveau produit est posé ici → { product, to }.
// Renvoie l'échange prévu, ou null (rien de reposé).
export function planSwap(dropped, placeId, target) {
  if (!dropped) return null;
  if (dropped.place === placeId && dropped.slot >= 0) return { from: dropped.slot, to: target };
  if (dropped.place && dropped.place !== placeId && dropped.productId) return { product: dropped.productId, to: target };
  return null;
}

// Le produit `def` posé à la place du produit `to` (même endroit, même échelle que lui), prêt à scanner.
export function swapEntry(products, to, id, def) {
  const b = products[to];
  const k = b.w / b.def.size[0];
  return { id, def, x: b.x, y: b.y, w: Math.round(def.size[0] * k), h: Math.round(def.size[1] * k), loose: b.loose, z: b.z, standAt: b.standAt, on: b.on, scanned: false };
}

// La carte du produit `scanned` arrive : si l'échange prévu l'attendait, le produit reposé prend sa place.
// catalog : data/products.json (pour un produit venu d'un autre lieu). Renvoie l'indice du produit posé, ou -1.
export function applySwap(pending, products, scanned, catalog) {
  if (!pending || pending.to !== scanned) return -1;
  if (pending.product) {
    products.push(swapEntry(products, pending.to, pending.product, catalog.products[pending.product]));
    return products.length - 1;
  }
  moveProduct(products, pending.from, pending.to);
  return pending.from;
}
