// Orientation sur 8 directions (logique pure, sans page web).
// Coordonnées du monde : x > 0 = droite (E), z > 0 = vers le fond (N), z < 0 = vers l'écran (S).
// Les 5 vues dessinées sont S, SE, E, NE, N ; les 3 vues de gauche (SW, W, NW) sont obtenues en miroir.

const SECTORS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
const SECTOR_INDEX = Object.fromEntries(SECTORS.map((d, i) => [d, i]));
const SECTOR_STEP = Math.PI / 4; // 45° entre deux directions voisines
const HALF_SECTOR = Math.PI / 8; // 22.5° : demi-largeur d'un secteur
const HYSTERESIS = (7 * Math.PI) / 180; // ±7° autour des frontières pour éviter les oscillations
const DIR_DEADZONE = 0.2;

const VIEW_MAP = {
  S: { view: 'S', flip: 1 },
  SE: { view: 'SE', flip: 1 },
  E: { view: 'E', flip: 1 },
  NE: { view: 'NE', flip: 1 },
  N: { view: 'N', flip: 1 },
  SW: { view: 'SE', flip: -1 },
  W: { view: 'E', flip: -1 },
  NW: { view: 'NE', flip: -1 },
};

// Renvoie la direction parmi 8 à partir d'un vecteur (dx, dz), ou `current` si trop faible.
// Une hystérésis angulaire (±7°) évite les allers-retours rapides près d'une limite de secteur.
export function directionFromVector(dx, dz, current = 'S') {
  if (Math.hypot(dx, dz) < DIR_DEADZONE) return current;
  const angle = Math.atan2(dz, dx); // 0 = E, +pi/2 = N, -pi/2 = S
  const curIdx = SECTOR_INDEX[current];
  if (curIdx !== undefined) {
    const curAngle = curIdx * SECTOR_STEP;
    const diff = Math.atan2(Math.sin(angle - curAngle), Math.cos(angle - curAngle));
    if (Math.abs(diff) <= HALF_SECTOR + HYSTERESIS) return current;
  }
  const idx = ((Math.round(angle / SECTOR_STEP) % 8) + 8) % 8;
  return SECTORS[idx];
}

// Avance d'au plus un secteur (45°) depuis `currentDir` vers `targetDir` par le plus court chemin angulaire.
export function stepDirectionToward(currentDir, targetDir) {
  const a = SECTOR_INDEX[currentDir];
  const b = SECTOR_INDEX[targetDir];
  if (a === undefined || b === undefined || a === b) return targetDir;
  let diff = (b - a + 8) % 8;
  if (diff > 4) diff -= 8;
  if (Math.abs(diff) <= 1) return targetDir;
  return SECTORS[(a + (diff > 0 ? 1 : -1) + 8) % 8];
}

// Associe une des 8 directions à l'une des 5 vues dessinées et son miroir horizontal (1 ou -1).
export function directionToView(dir) {
  return VIEW_MAP[dir] ?? VIEW_MAP.S;
}

function sideOf(dir) {
  if (dir === 'E' || dir === 'SE' || dir === 'NE') return 1;
  if (dir === 'W' || dir === 'SW' || dir === 'NW') return -1;
  return 0;
}

function depthOf(dir) {
  if (dir === 'N' || dir === 'NE' || dir === 'NW') return 1;
  if (dir === 'S' || dir === 'SE' || dir === 'SW') return -1;
  return 0;
}

// Faut-il jouer le pivot de la feuille (effet Paper Mario) entre deux directions ?
// Oui en cas d'inversion gauche ↔ droite franche (ou face ↔ dos si flipOnFrontBack est actif).
// Non pour un virage progressif d'un cran (ex. E → SE → S), qui reste fluide.
export function needsPaperFlip(prevDir, nextDir, flipOnFrontBack = false) {
  if (!prevDir || prevDir === nextDir) return false;
  const s1 = sideOf(prevDir);
  const s2 = sideOf(nextDir);
  if (s1 !== 0 && s2 !== 0 && s1 !== s2) return true;
  if (flipOnFrontBack) {
    const d1 = depthOf(prevDir);
    const d2 = depthOf(nextDir);
    if (d1 !== 0 && d2 !== 0 && d1 !== d2) return true;
  }
  return false;
}
