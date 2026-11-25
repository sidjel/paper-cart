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

// Transition : 'out' (couvre l'écran) → 'load' (on change de lieu) → 'in' (s'ouvre / fond) → 'done'.
// En fondu enchaîné ('dissolve' / 'mist'), 'out' passe tout de suite en 'load' : l'ancien lieu reste affiché
// pendant le chargement du nouveau, puis s'estompe directement dessus pendant 'in'.
export function isCrossDissolve(style) {
  return style === 'dissolve' || style === 'mist';
}

export function createTransition(exit, dir = 'right', style = 'wipe') {
  return { exit, dir, style, phase: 'out', t: 0 };
}

// Avance la transition. Renvoie 'load' une seule fois, au moment de charger le nouveau lieu.
// Si p.fade <= 0 (ou en fondu enchaîné), passage direct sur 'load'.
export function stepTransition(tr, dt, p) {
  if (tr.phase === 'load') {
    tr.t += dt; // temps passé à charger (pour le signe d'attente)
    return '';
  }
  if (tr.phase === 'done') return '';
  if (tr.phase === 'out' && isCrossDissolve(tr.style)) {
    tr.t = 0;
    tr.phase = 'load';
    return 'load';
  }
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

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// 3A : feuille origami qui se retourne (scaleX / scaleY, comme le héros et les cartes), avec tranche papier.
export function transitionFlip(tr, p, dir = tr.dir || 'right') {
  const horiz = dir === 'right' || dir === 'left';
  const sign = dir === 'left' || dir === 'up' ? -1 : 1;
  let scale = 1;
  let shift = 0;
  if (tr.phase === 'out') {
    if (p.fade > 0) {
      const u = clamp01(tr.t / p.fade);
      const e = 1 - (1 - u) * (1 - u);
      scale = 0.045 + 0.955 * e;
      shift = (1 - e) * 16 * sign;
    }
  } else if (tr.phase === 'in') {
    if (p.fade <= 0) {
      scale = 0.04;
      shift = -16 * sign;
    } else {
      const u = clamp01(tr.t / p.fade);
      const e = u * u;
      scale = 1 - 0.96 * e;
      shift = -e * 16 * sign;
    }
  } else if (tr.phase === 'done') {
    scale = 0.04;
    shift = -16 * sign;
  }
  return {
    x: horiz ? shift : 0,
    y: horiz ? 0 : shift,
    sx: horiz ? scale : 1,
    sy: horiz ? 1 : scale,
    edge: scale < 0.2,
  };
}

// 3B : double-volet origami (deux rabats qui se replient vers le centre puis se rouvrent).
export function transitionFlaps(tr, p, dir = tr.dir || 'right') {
  const axis = dir === 'right' || dir === 'left' ? 'x' : 'y';
  const leadB = dir === 'right' || dir === 'down';
  let a = 1;
  let b = 1;
  if (tr.phase === 'out' && p.fade > 0) {
    const u = clamp01(tr.t / p.fade);
    const fast = clamp01(u / 0.86);
    const slow = clamp01((u - 0.14) / 0.86);
    const eFast = 1 - (1 - fast) * (1 - fast);
    const eSlow = 1 - (1 - slow) * (1 - slow);
    a = leadB ? eSlow : eFast;
    b = leadB ? eFast : eSlow;
  } else if (tr.phase === 'in') {
    if (p.fade <= 0) {
      a = 0;
      b = 0;
    } else {
      const u = clamp01(tr.t / p.fade);
      const fast = clamp01(u / 0.86);
      const slow = clamp01((u - 0.14) / 0.86);
      const eFast = 1 - fast * fast;
      const eSlow = 1 - slow * slow;
      a = leadB ? eFast : eSlow;
      b = leadB ? eSlow : eFast;
    }
  } else if (tr.phase === 'done') {
    a = 0;
    b = 0;
  }
  return { axis, a, b };
}

// Lignes blanches dans le sens de la marche → élargissement → retournement comme des cartes à liseré bleu.
export function transitionStrips(tr, p, dir = tr.dir || 'right', count = 6) {
  const axis = dir === 'right' || dir === 'left' ? 'x' : 'y';
  const sign = dir === 'left' || dir === 'up' ? -1 : 1;
  const items = [];
  const denom = Math.max(1, count - 1);
  for (let i = 0; i < count; i++) {
    const delay = (i / denom) * 0.18;
    const span = 0.82;
    let t = 0;
    let s = 1.03;
    let white = false;
    let opacity = 1;
    if (tr.phase === 'out' && p.fade > 0) {
      const u = clamp01(tr.t / p.fade);
      const v = clamp01((u - delay) / span);
      if (v <= 0) {
        t = 106 * sign;
        s = 0.14;
        white = true;
        opacity = 0;
      } else if (v < 0.46) {
        const q = v / 0.46;
        t = (1 - (1 - (1 - q) * (1 - q))) * 106 * sign;
        s = 0.14;
        white = true;
      } else {
        const q = (v - 0.46) / 0.54;
        const e = 1 - (1 - q) * (1 - q);
        t = 0;
        s = 0.14 + 0.89 * e;
        white = q < 0.42;
      }
    } else if (tr.phase === 'in') {
      if (p.fade <= 0) {
        s = 0.03;
        white = true;
        opacity = 0;
      } else {
        const u = clamp01(tr.t / p.fade);
        const v = clamp01((u - delay) / span);
        const e = v * v;
        t = 0;
        s = 1.03 - e;
        white = s < 0.28;
        opacity = v >= 0.96 ? 0 : 1;
      }
    } else if (tr.phase === 'done') {
      s = 0.03;
      white = true;
      opacity = 0;
    }
    items.push({ t, s, white, opacity });
  }
  return { axis, items };
}

// Fondu enchaîné ('dissolve') et fondu enchaîné + très légère brume lumineuse ('mist').
// L'ancien décor s'estompe en courbe douce (smoothstep) directement par-dessus le nouveau.
export function transitionDissolve(tr, p) {
  const withMist = tr.style === 'mist';
  if (tr.phase === 'out' || tr.phase === 'load') {
    return { oldOpacity: 1, mistOpacity: withMist ? 0.12 : 0 };
  }
  if (tr.phase === 'in') {
    if (p.fade <= 0) return { oldOpacity: 0, mistOpacity: 0 };
    const u = clamp01(tr.t / p.fade);
    const e = u * u * (3 - 2 * u); // courbe douce sans à-coup
    return {
      oldOpacity: 1 - e,
      mistOpacity: withMist ? Math.sin(u * Math.PI) * 0.34 : 0,
    };
  }
  return { oldOpacity: 0, mistOpacity: 0 };
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
