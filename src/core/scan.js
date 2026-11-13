// Le scanner : quel produit est à portée, et le déroulé d'un scan dans le temps de jeu.
// Logique pure. Les délais avancent avec la boucle de jeu (pas de setTimeout) : en pause, tout se fige.
//
// Déroulé : lever la douchette → laser (bip) → le produit se dissout (aspiration) → la carte apparaît.

// Produits scannables : [{ x, scanned, loose?, z? }].
//  - sur l'étagère du fond (loose absent) : on les scanne depuis le pied de l'étagère (z ≥ minDepth),
//    à moins de `range` le long du rayon ;
//  - posés ailleurs (loose : table, caddie…, à la profondeur z) : à moins de looseRange le long du
//    rayon et de looseDepth en profondeur, de n'importe quel côté.
// Renvoie un écart « normalisé » (0 = juste devant, 1 = limite de portée), ou Infinity hors de portée.
function reachOf(it, hero, p) {
  if (!it || it.scanned) return Infinity;
  const dx = Math.abs(it.x - hero.x);
  if (it.loose) {
    const r = Math.max(dx / p.looseRange, Math.abs(it.z - hero.z) / p.looseDepth);
    return r <= 1 ? r : Infinity;
  }
  if (hero.z < p.minDepth) return Infinity; // il faut être au pied de l'étagère
  return dx <= p.range ? dx / p.range : Infinity;
}

// Indice du produit le plus proche à portée, ou -1.
export function nearestProduct(shelf, hero, p) {
  let best = -1;
  let bestR = Infinity;
  for (let i = 0; i < shelf.length; i++) {
    const r = reachOf(shelf[i], hero, p);
    if (r < bestR) {
      best = i;
      bestR = r;
    }
  }
  return best;
}

// Produit de l'étagère du fond visé par un double toucher : le non scanné le plus proche de x
// (à tolérance près), ou -1. (Les produits posés ailleurs se visent en touchant leur dessin.)
export function productNear(shelf, x, tolerance) {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < shelf.length; i++) {
    if (shelf[i].scanned || shelf[i].loose) continue;
    const d = Math.abs(shelf[i].x - x);
    if (d <= tolerance && d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}

// Ce produit précis est-il à portée du personnage ?
export function inReach(shelf, index, hero, p) {
  return reachOf(shelf[index], hero, p) < Infinity;
}

// Où se placer pour scanner un produit posé ailleurs : l'endroit prévu le plus proche du personnage.
export function standSpot(item, hero) {
  let best = item.standAt[0];
  let bestD = Infinity;
  for (const s of item.standAt) {
    const d = Math.hypot(s[0] - hero.x, s[1] - hero.z);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

const PHASES = ['raise', 'laser', 'dissolve', 'card'];
// Événement émis à l'entrée de chaque phase (et à la fin).
const ENTER = { laser: 'bip', dissolve: 'aspire', card: 'carte' };

export function createScan() {
  return { active: false, phase: '', t: 0, index: -1 };
}

export function startScan(s, index) {
  if (s.active || index < 0) return false;
  s.active = true;
  s.phase = PHASES[0];
  s.t = 0;
  s.index = index;
  return true;
}

function duration(phase, p) {
  return p[phase];
}

// Avance d'un pas. Renvoie le nom d'un événement ('bip', 'aspire', 'carte', 'fin') ou ''.
export function stepScan(s, dt, p) {
  if (!s.active) return '';
  s.t += dt;
  if (s.t < duration(s.phase, p)) return '';
  s.t -= duration(s.phase, p);
  const next = PHASES[PHASES.indexOf(s.phase) + 1];
  if (!next) {
    s.active = false;
    s.phase = '';
    return 'fin';
  }
  s.phase = next;
  return ENTER[next] ?? '';
}

// Avancement de la phase en cours, de 0 à 1 (pour l'affichage).
export function scanProgress(s, p) {
  return s.active ? Math.min(1, s.t / duration(s.phase, p)) : 0;
}
