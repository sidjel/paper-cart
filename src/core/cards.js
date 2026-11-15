// Cartes et Panier (logique pure).
// Une carte est l'« essence » d'un produit scanné : nom, puissance, stade, propriétés.

export const STAGES = ['frais', 'mur', 'pourri'];

// def : fiche du produit (catalogue) ; productId : sa clé ; serial : numéro unique de la carte.
export function createCard(productId, def, serial) {
  return {
    uid: serial,
    productId,
    name: def.name.replace(/^\[TEMP\]\s*/, ''),
    power: def.power,
    stage: STAGES.includes(def.stage) ? def.stage : 'frais',
    properties: [...def.properties],
    category: def.category ?? 'alimentaire', // alimentaire, non-alimentaire, speciale (sous-onglets)
  };
}

export function createBasket() {
  return { cards: [], serial: 0 };
}

// slot : produit d'origine dans le lieu (une carte reposée y retourne).
export function addToBasket(basket, productId, def, slot = -1) {
  const card = createCard(productId, def, ++basket.serial);
  card.slot = slot;
  basket.cards.push(card);
  return card;
}

// Reposer une carte (panier plein) : elle quitte le panier. Renvoie la carte, ou null.
export function removeFromBasket(basket, uid) {
  const i = basket.cards.findIndex((c) => c.uid === uid);
  if (i < 0) return null;
  return basket.cards.splice(i, 1)[0];
}
