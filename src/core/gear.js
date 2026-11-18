// Ce que le héros porte (étape A5a) : la Scanette (obligatoire pour scanner) et un contenant pour
// ses cartes (le panier à main), avec une capacité limitée. Logique pure.
// Les objets à prendre (présentoir de l'accueil) sont des « points à prendre » qui se visent comme les
// produits posés ailleurs (core/scan.js : portée, endroit où se placer, double toucher).

export function createGear() {
  return { scanette: false, panier: false };
}

// Points à prendre : [{ id, x, z, loose: true, scanned, standAt, y, w, h }] (scanned = déjà pris).
export function takeItem(gear, pickups, i) {
  const it = pickups[i];
  if (!it || it.scanned) return false;
  gear[it.id] = true;
  it.scanned = true;
  return true;
}

// Capacité du contenant porté (0 sans contenant). p : config.carry.
// Le chariot (A8) remplace le panier : il a sa propre capacité.
export function capacity(gear, p) {
  if (gear.chariot) return p.chariot;
  return gear.panier ? p.panier : 0;
}

// Peut-on scanner maintenant ? '' si oui, sinon la raison : 'sans_scanette', 'sans_panier' ou 'plein'.
export function scanBlocked(gear, cardCount, p) {
  if (!gear.scanette) return 'sans_scanette';
  if (!gear.panier && !gear.chariot) return 'sans_panier';
  if (cardCount >= capacity(gear, p)) return 'plein';
  return '';
}
