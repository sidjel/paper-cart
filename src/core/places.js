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

// Traversée d'un bord d'écran (gauche / droite), calée au pixel près sur la taille réelle du héros
// à sa profondeur z (scaleAt(proj, z)) :
// - triggerX : premier pixel du héros qui touche le bord (le joueur garde le contrôle jusqu'ici) ;
// - outX     : le héros est 100 % hors-champ (plus aucun pixel visible, même en grande foulée) → la transition se lance ;
// - inX      : point d'arrivée collé au bord, sans toucher triggerX.
const HERO_BODY_HALF_W = 58; // demi-largeur du corps visible du héros à échelle 1 (mesurée sur heros-e-*.webp)
const EDGE_OUT_RATIO = 1.9; // décalage hors-champ (~110 px × échelle > 105 px max de foulée) : 0 pixel visible
const EDGE_IN_MARGIN = 26; // marge de sécurité à l'arrivée (collé au bord, ne re-déclenche pas)

export function edgeBounds(side, placeWidth, depthScale = 1, halfW = HERO_BODY_HALF_W) {
  const h = halfW * depthScale;
  if (side === 'left') {
    return { triggerX: h, outX: -EDGE_OUT_RATIO * h, inX: h + EDGE_IN_MARGIN };
  }
  return { triggerX: placeWidth - h, outX: placeWidth + EDGE_OUT_RATIO * h, inX: placeWidth - h - EDGE_IN_MARGIN };
}

// Vérifie si une sortie de bord est effectivement touchée par le premier pixel du héros.
export function edgeTouched(exit, x, placeWidth, depthScale = 1, halfW = HERO_BODY_HALF_W) {
  if (!exit?.edge) return true;
  const { triggerX } = edgeBounds(exit.edge, placeWidth, depthScale, halfW);
  return exit.edge === 'left' ? x <= triggerX : x >= triggerX;
}

// Marche automatique de traversée d'un bord d'écran :
// - 'out' : dès que le 1er pixel touche le bord, le héros avance seul jusqu'aux 3/4 hors-champ avant la transition ;
// - 'in'  : à l'arrivée dans le nouveau lieu, il entre depuis les 3/4 hors-champ jusqu'au bord sans toucher la sortie.
const EDGE_WALK_MAX_S = 1.2; // garde-fou : ne peut jamais bloquer même ralenti (chariot)
export function createEdgeWalk(kind, targetX, startX, exit = null) {
  return { kind, targetX, dir: targetX >= startX ? 1 : -1, exit, t: 0 };
}

export function stepEdgeWalk(edge, x, dt) {
  if (!edge) return null;
  edge.t += dt;
  const dx = edge.targetX - x;
  if (edge.t >= EDGE_WALK_MAX_S || (edge.dir > 0 && dx <= 2) || (edge.dir < 0 && dx >= -2)) {
    return { done: true, moveX: 0, moveZ: 0 };
  }
  return { done: false, moveX: edge.dir, moveZ: 0 };
}

// Transition (fondu enchaîné pur) : 'out' → 'load' immédiat (l'ancien lieu reste affiché pendant
// le chargement du nouveau) → 'in' (l'ancien décor s'estompe en courbe douce) → 'done'.
export function createTransition(exit) {
  return { exit, phase: 'out', t: 0 };
}

// Avance la transition. Renvoie 'load' une seule fois, au moment de charger le nouveau lieu.
export function stepTransition(tr, dt, p) {
  if (tr.phase === 'load') {
    tr.t += dt; // temps passé à charger (pour le signe d'attente)
    return '';
  }
  if (tr.phase === 'done') return '';
  if (tr.phase === 'out') {
    tr.t = 0;
    tr.phase = 'load';
    return 'load';
  }
  tr.t += dt;
  if (p.fade > 0 && tr.t < p.fade) return '';
  tr.t = 0;
  tr.phase = 'done';
  return '';
}

// Jamais d'écran noir muet (règle de la séance 64) : si le chargement dure plus de p.waitAfter s, un petit
// signe d'attente apparaît.
export function showWait(tr, p) {
  return !!tr && tr.phase === 'load' && tr.t >= p.waitAfter;
}

// Le nouveau lieu est prêt : l'ancien décor peut s'estomper.
export function placeReady(tr) {
  if (tr.phase === 'load') {
    tr.phase = 'in';
    tr.t = 0;
  }
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Fondu enchaîné pur : l'ancien décor s'estompe en courbe douce (smoothstep) par-dessus le nouveau.
export function transitionDissolve(tr, p) {
  if (tr.phase === 'out' || tr.phase === 'load') return 1;
  if (tr.phase === 'in') {
    if (p.fade <= 0) return 0;
    const u = clamp01(tr.t / p.fade);
    return 1 - u * u * (3 - 2 * u);
  }
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
