// Recherche de chemin simple pour « toucher / cliquer pour aller » : si la ligne droite est
// bloquée par un objet, le personnage passe par les coins des obstacles (graphe de visibilité).
// Logique pure, sans affichage. Calculée seulement quand on touche ou clique, jamais à chaque image.

import { isWalkable } from './walkmask.js';

const CORNER_OFFSET = 4; // écart des points de passage par rapport aux coins des obstacles
const SAMPLE = 6; // pas de vérification le long d'un segment (px)

// Le segment de (ax, az) à (bx, bz) reste-t-il entièrement dans la zone de marche ?
export function segmentClear(mask, ax, az, bx, bz) {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(len / SAMPLE));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!isWalkable(mask, ax + (bx - ax) * t, az + (bz - az) * t)) return false;
  }
  return true;
}

// Points de passage possibles : les coins des obstacles, poussés un peu vers l'extérieur.
function cornerNodes(mask) {
  const nodes = [];
  for (const poly of mask.obstacles) {
    const n = poly.length / 2;
    for (let i = 0; i < n; i++) {
      const x = poly[i * 2], z = poly[i * 2 + 1];
      const p = (i - 1 + n) % n, q = (i + 1) % n;
      let ax = x - poly[p * 2], az = z - poly[p * 2 + 1];
      let bx = x - poly[q * 2], bz = z - poly[q * 2 + 1];
      const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1;
      let dx = ax / la + bx / lb, dz = az / la + bz / lb;
      const ld = Math.hypot(dx, dz) || 1;
      dx /= ld;
      dz /= ld;
      const cx = x + dx * CORNER_OFFSET * 1.5, cz = z + dz * CORNER_OFFSET * 1.5;
      if (isWalkable(mask, cx, cz)) nodes.push([cx, cz]);
    }
  }
  return nodes;
}

// Si le point visé est dans un obstacle, on le ramène juste à côté (au bord le plus proche).
export function nearestWalkable(mask, x, z) {
  if (isWalkable(mask, x, z)) return [x, z];
  let best = null;
  let bestD = Infinity;
  for (const poly of mask.obstacles) {
    const n = poly.length / 2;
    for (let i = 0; i < n; i++) {
      const ax = poly[i * 2], az = poly[i * 2 + 1];
      const bx = poly[((i + 1) % n) * 2], bz = poly[((i + 1) % n) * 2 + 1];
      const ex = bx - ax, ez = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1)));
      const px = ax + ex * t, pz = az + ez * t;
      // Normale du bord : on essaie des deux côtés, on garde le côté praticable.
      const el = Math.hypot(ex, ez) || 1;
      for (const s of [1, -1]) {
        const cx = px + (-ez / el) * CORNER_OFFSET * s, cz = pz + (ex / el) * CORNER_OFFSET * s;
        const d = Math.hypot(cx - x, cz - z);
        if (d < bestD && isWalkable(mask, cx, cz)) {
          bestD = d;
          best = [cx, cz];
        }
      }
    }
  }
  return best ?? [x, z];
}

// Chemin du point de départ au point visé : liste de points [x, z], le dernier étant l'arrivée.
// Sans chemin possible, renvoie la ligne droite (le personnage s'arrêtera contre l'obstacle).
export function findPath(mask, sx, sz, gx, gz) {
  const [tx, tz] = nearestWalkable(mask, gx, gz);
  if (segmentClear(mask, sx, sz, tx, tz)) return [[tx, tz]];

  const nodes = [[sx, sz], ...cornerNodes(mask), [tx, tz]];
  const N = nodes.length;
  const goal = N - 1;
  const dist = new Array(N).fill(Infinity);
  const prev = new Array(N).fill(-1);
  const done = new Array(N).fill(false);
  dist[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity || u === goal) break;
    done[u] = true;
    for (let v = 0; v < N; v++) {
      if (done[v] || v === u) continue;
      const d = dist[u] + Math.hypot(nodes[v][0] - nodes[u][0], nodes[v][1] - nodes[u][1]);
      if (d < dist[v] && segmentClear(mask, nodes[u][0], nodes[u][1], nodes[v][0], nodes[v][1])) {
        dist[v] = d;
        prev[v] = u;
      }
    }
  }
  if (prev[goal] < 0) return [[tx, tz]];
  const path = [];
  for (let v = goal; v > 0; v = prev[v]) path.unshift(nodes[v]);
  return path;
}
