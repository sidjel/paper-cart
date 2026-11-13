// Le scanner : quel produit est à portée, et le déroulé d'un scan dans le temps de jeu.
// Logique pure. Les délais avancent avec la boucle de jeu (pas de setTimeout) : en pause, tout se fige.
//
// Déroulé : lever la douchette → laser (bip) → le produit se dissout (aspiration) → la carte apparaît.

// shelf : [{ x, scanned }] ; hero : { x, z } ; p : réglages (config.scan).
// Renvoie l'indice du produit le plus proche à portée, ou -1.
export function nearestProduct(shelf, hero, p) {
  if (hero.z < p.minDepth) return -1; // il faut être au pied de l'étagère
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < shelf.length; i++) {
    if (shelf[i].scanned) continue;
    const d = Math.abs(shelf[i].x - hero.x);
    if (d <= p.range && d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}

// Produit visé par un double toucher : le non scanné le plus proche de x (à tolerance près), ou -1.
export function productNear(shelf, x, tolerance) {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < shelf.length; i++) {
    if (shelf[i].scanned) continue;
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
  const it = shelf[index];
  return !!it && !it.scanned && hero.z >= p.minDepth && Math.abs(it.x - hero.x) <= p.range;
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
