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

// Transition : 'out' (le volet papier recouvre l'écran) → 'load' (on change de lieu) → 'in' (il glisse hors écran) → 'done'.
// p : { fade } (durée d'entrée et de sortie, s). dir : 'right' | 'left' | 'up' | 'down'.
export function createTransition(exit, dir = 'right') {
  return { exit, dir, phase: 'out', t: 0 };
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

// Opacité du noir / fondu doux (0 à 1, utilisé pour le repli « Réduire les animations » et les tests).
export function transitionBlack(tr, p) {
  if (tr.phase === 'out') return p.fade <= 0 ? 1 : Math.min(1, tr.t / p.fade);
  if (tr.phase === 'load') return 1;
  if (tr.phase === 'in') return p.fade <= 0 ? 0 : Math.max(0, 1 - tr.t / p.fade);
  return 0;
}

// Direction visuelle du volet papier selon le bord de la zone de marche où se trouve la sortie.
export function transitionDirection(exit, place) {
  if (exit?.dir) return exit.dir;
  const area = place?.walkMask?.area;
  if (!exit?.zone || !area?.length) return 'right';
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of area) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const cx = (exit.zone[0] + exit.zone[2]) / 2;
  const cz = (exit.zone[1] + exit.zone[3]) / 2;
  const dLeft = (cx - minX) / spanX;
  const dRight = (maxX - cx) / spanX;
  const dUp = (maxZ - cz) / spanZ;
  const dDown = (cz - minZ) / spanZ;
  const best = Math.min(dLeft, dRight, dUp, dDown);
  if (best === dRight) return 'right';
  if (best === dLeft) return 'left';
  if (best === dUp) return 'up';
  return 'down';
}

// Décalage (en % de l'écran) du volet papier : glisse dans le sens opposé à la marche (comme le décor).
// Un léger dépassement (104 %) garantit que la bordure kraft disparaît entièrement hors champ.
const WIPE_OVERSHOOT = 104;
export function transitionWipe(tr, p, dir = tr.dir || 'right') {
  let offset = 0; // +1 = bord d'entrée, 0 = couvre l'écran, -1 = sorti du côté opposé
  if (tr.phase === 'out') {
    if (p.fade > 0) {
      const u = Math.min(1, Math.max(0, tr.t / p.fade));
      offset = (1 - u) * (1 - u); // démarrage vif, pose douce au centre
    }
  } else if (tr.phase === 'in') {
    if (p.fade <= 0) offset = -1;
    else {
      const u = Math.min(1, Math.max(0, tr.t / p.fade));
      offset = -(u * u); // repart en douceur puis accélère hors écran
    }
  } else if (tr.phase === 'done') {
    offset = -1;
  }
  const d = offset * WIPE_OVERSHOOT;
  if (dir === 'left') return { x: -d, y: 0 };
  if (dir === 'up') return { x: 0, y: -d };
  if (dir === 'down') return { x: 0, y: d };
  return { x: d, y: 0 };
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
