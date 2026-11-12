// Masque de zone de marche : un polygone où l'on peut marcher, moins des obstacles.
// Coordonnées du monde : x le long du rayon, z la profondeur (0 = devant, plus grand = vers le fond).

function flatten(points) {
  const out = new Float64Array(points.length * 2);
  points.forEach(([x, z], i) => {
    out[i * 2] = x;
    out[i * 2 + 1] = z;
  });
  return out;
}

// Prépare le masque décrit dans les données d'un lieu (une seule fois, au chargement).
export function compileMask(data) {
  const xs = data.area.map((p) => p[0]);
  const zs = data.area.map((p) => p[1]);
  return {
    area: flatten(data.area),
    obstacles: (data.obstacles ?? []).map((o) => flatten(o.points)),
    // Rectangle englobant la zone : un point visé hors du sol y est ramené.
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minZ: Math.min(...zs), maxZ: Math.max(...zs),
  };
}

// Un point touché hors du sol (sur une étagère, sur le rayon de devant…) est ramené au bord
// de la zone, un tout petit peu à l'intérieur : le personnage va jusqu'à la limite.
const EDGE_INSET = 1;
export function clampToBounds(mask, out) {
  out.x = Math.min(mask.maxX - EDGE_INSET, Math.max(mask.minX + EDGE_INSET, out.x));
  out.z = Math.min(mask.maxZ - EDGE_INSET, Math.max(mask.minZ + EDGE_INSET, out.z));
  return out;
}

// Point dans un polygone (règle pair-impair), sans créer d'objet.
export function pointInPolygon(poly, x, z) {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
    const xi = poly[i], zi = poly[i + 1];
    const xj = poly[j], zj = poly[j + 1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function isWalkable(mask, x, z) {
  if (!pointInPolygon(mask.area, x, z)) return false;
  for (let i = 0; i < mask.obstacles.length; i++) {
    if (pointInPolygon(mask.obstacles[i], x, z)) return false;
  }
  return true;
}
