// Points de départ pour tester vite (data/departs.json) : ce qu'il faut préparer pour un départ donné.
// Logique pure. Recalculé à chaque chargement à partir du jeu actuel (pas une sauvegarde).

// Moments de l'arrivée déjà passés quand on commence équipé (annonce et premières pensées).
export const ARRIVAL = ['arrivee', 'reflexion_1', 'reflexion_2', 'reflexion_3', 'presence'];

export function findDepart(list, id) {
  return list.find((d) => d.id === id) ?? null;
}

// Combien de cartes donner : un nombre, ou « plein » (la capacité du panier).
export function cardCount(def, capacity) {
  if (def.cards === 'plein') return capacity;
  return Math.max(0, Math.min(capacity, Number(def.cards) || 0));
}

// Produits à mettre dans le panier : d'abord les non alimentaires (pour que les filtres aient de quoi
// trier), puis les autres, dans l'ordre du rayon. items : [{ category }] ; renvoie leurs indices.
export function pickProducts(items, count) {
  const order = items.map((it, i) => i);
  order.sort((a, b) => (items[a].category === 'alimentaire') - (items[b].category === 'alimentaire') || a - b);
  return order.slice(0, count);
}

// Moments à considérer comme déjà dits pour ce départ.
export function saidFor(def) {
  if (!def.equip) return [];
  return [...ARRIVAL, 'prise_scanette', 'prise_panier', ...(def.met ? ['premier_scan', 'rencontre'] : [])];
}
