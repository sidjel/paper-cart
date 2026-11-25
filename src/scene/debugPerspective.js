// Grille visuelle de perspective (F6 ou réglage « Afficher la grille de perspective »).
// Affiche la ligne d'horizon, le point de fuite, les rayons de fuite et les lignes de profondeur z
// avec l'échelle exacte du héros à chaque niveau. Zéro coût quand caché.

import { worldToStageY, scaleAt } from './projection.js';

const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createDebugPerspective(parent, place, proj) {
  const [W, H] = place.size;
  const svg = el('svg', { class: 'debug-perspective', viewBox: `0 0 ${W} ${H}`, width: W, height: H });
  parent.appendChild(svg);

  function rebuild() {
    svg.replaceChildren();
    // Horizon effectif : horizonY explicite, ou déduit de la pente linéaire scalePerDepth.
    const ds = Math.max(0.01, proj.settings.depthScale);
    const horizonY = proj.horizonY !== null
      ? proj.horizonY
      : proj.perDepth > 0
        ? proj.floorY - (proj.baseScale / (proj.perDepth * ds) + proj.refZ) * proj.k
        : 320;
    const vanishX = place.projection.vanishX ?? W / 2;

    // 1. Rayons de fuite en éventail depuis le point de fuite vers le bas de la scène.
    for (let x = -W * 0.5; x <= W * 1.5; x += 240) {
      svg.appendChild(el('line', { x1: vanishX, y1: horizonY, x2: x, y2: H + 300, class: 'persp-ray' }));
    }

    // 2. Lignes horizontales de profondeur z (avec y écran et échelle du héros).
    const zs = place.walkMask.area.map((p) => p[1]);
    const minZ = Math.floor(Math.min(...zs) / 100) * 100;
    const maxZ = Math.ceil(Math.max(...zs) / 100) * 100;
    for (let z = minZ; z <= maxZ; z += 100) {
      const y = worldToStageY(proj, z);
      if (y < 0 || y > H) continue;
      const sc = scaleAt(proj, z);
      svg.appendChild(el('line', { x1: 0, y1: y, x2: W, y2: y, class: 'persp-z' }));
      const label = `z=${z} · y=${Math.round(y)} · ×${sc.toFixed(2)}`;
      // Répéter l'étiquette tous les 1200 px pour qu'elle reste visible quel que soit le scroll caméra.
      for (let lx = 24; lx < W - 200; lx += 1200) {
        svg.appendChild(el('text', { x: lx, y: y - 6, class: 'persp-label' }, label));
      }
    }

    // 3. Ligne d'horizon + croix du point de fuite.
    if (horizonY >= -100 && horizonY <= H) {
      svg.appendChild(el('line', { x1: 0, y1: horizonY, x2: W, y2: horizonY, class: 'persp-horizon' }));
      svg.appendChild(el('line', { x1: vanishX - 24, y1: horizonY, x2: vanishX + 24, y2: horizonY, class: 'persp-vp' }));
      svg.appendChild(el('line', { x1: vanishX, y1: horizonY - 24, x2: vanishX, y2: horizonY + 24, class: 'persp-vp' }));
      svg.appendChild(el('circle', { cx: vanishX, cy: horizonY, r: 10, class: 'persp-vp' }));
      const hLabel = `HORIZON y=${Math.round(horizonY)} (fuite x=${Math.round(vanishX)})`;
      for (let lx = 24; lx < W - 260; lx += 1200) {
        svg.appendChild(el('text', { x: lx, y: Math.max(24, horizonY - 10), class: 'persp-horizon-label' }, hLabel));
      }
    }
  }

  let visible = false;
  svg.style.display = 'none';

  return {
    setVisible(v) {
      visible = !!v;
      if (visible) rebuild();
      svg.style.display = visible ? '' : 'none';
    },
    refresh() {
      if (visible) rebuild();
    },
  };
}
