// Changer de lieu : les sorties d'un lieu, et le déroulé du fondu (logique pure).
// Sortie (données du lieu) : { id, zone: [x1, z1, x2, z2], to, arrive: [x, z], facing }.

// La sortie dans laquelle se trouve le point (x, z), ou null.
export function exitAt(exits, x, z) {
  for (const e of exits) {
    const [x1, z1, x2, z2] = e.zone;
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) return e;
  }
  return null;
}

// Au doigt ou à la souris (séance 67) : un point visé dans la zone « reach » d'une sortie (l'ouverture
// elle-même, ou le rayon de devant à cet endroit) devient le milieu de sa zone de passage : toucher une
// ouverture, c'est vouloir la passer, même si le passage est trop bas pour être touché. Renvoie [x, z] ou null.
export function exitTarget(exits, x, z) {
  for (const e of exits) {
    if (!e.reach) continue;
    const [x1, z1, x2, z2] = e.reach;
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) return [(e.zone[0] + e.zone[2]) / 2, (e.zone[1] + e.zone[3]) / 2];
  }
  return null;
}

// Fondu : 'out' (l'écran noircit) → 'load' (noir : on change de lieu) → 'in' (le noir s'efface) → 'done'.
// p : { fade } (durée de chaque fondu, s).
export function createTransition(exit) {
  return { exit, phase: 'out', t: 0 };
}

// Avance le fondu. Renvoie 'load' une seule fois, quand l'écran est noir (c'est le moment de changer de lieu).
// Si p.fade <= 0, le fondu est supprimé : passage direct sur 'load' puis sur 'done'.
export function stepTransition(tr, dt, p) {
  if (tr.phase === 'load') {
    tr.t += dt; // temps passé dans le noir à charger (pour le signe d'attente)
    return '';
  }
  if (tr.phase === 'done') return '';
  tr.t += dt;
  if (p.fade > 0 && tr.t < p.fade) return '';
  tr.t = 0;
  if (tr.phase === 'out') {
    tr.phase = 'load';
    return 'load';
  }
  tr.phase = 'done';
  return '';
}

// Jamais d'écran noir muet (règle de la séance 64) : si le chargement dure plus de p.waitAfter s, un petit
// signe d'attente apparaît.
export function showWait(tr, p) {
  return !!tr && tr.phase === 'load' && tr.t >= p.waitAfter;
}

// Le nouveau lieu est prêt : le noir peut s'effacer.
export function placeReady(tr) {
  if (tr.phase === 'load') {
    tr.phase = 'in';
    tr.t = 0;
  }
}

// Opacité du noir (0 à 1).
export function transitionBlack(tr, p) {
  if (tr.phase === 'out') return p.fade <= 0 ? 1 : Math.min(1, tr.t / p.fade);
  if (tr.phase === 'load') return 1;
  if (tr.phase === 'in') return p.fade <= 0 ? 0 : Math.max(0, 1 - tr.t / p.fade);
  return 0;
}

// Pré-téléchargement silencieux des lieux voisins (docs/ARCHITECTURE.md §11) : logique pure.
// Désactivé en profil « Léger » ou si le téléphone demande d'économiser les données (saveData).
export function shouldPrefetch(profile, saveData = false) {
  return profile !== 'leger' && !saveData;
}

// Identifiants uniques des lieux voisins directs d'un lieu (d'après ses sorties).
export function neighborIds(place) {
  const out = [];
  for (const e of place?.exits?.items ?? []) {
    if (e.to && e.to !== place.id && !out.includes(e.to)) out.push(e.to);
  }
  return out;
}

// URLs uniques des images des lieux voisins à mettre en cache réseau (sans répéter celles du lieu actif).
export function neighborImageUrls(place, allPlaces, base = '') {
  const own = new Set(Object.values(place?.images ?? {}).map((im) => im.src));
  const urls = [];
  const seen = new Set();
  for (const id of neighborIds(place)) {
    const dest = allPlaces?.[id];
    if (!dest) continue;
    for (const im of Object.values(dest.images ?? {})) {
      if (!im?.src || own.has(im.src) || seen.has(im.src)) continue;
      seen.add(im.src);
      urls.push(base + im.src);
    }
  }
  return urls;
}
