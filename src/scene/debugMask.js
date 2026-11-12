// Affichage de debug du masque de zone de marche (F4 ou réglage « Afficher la zone de marche »).
// Dessiné une fois, puis seulement montré ou caché : aucun coût quand il est caché.

import { worldToStageX, worldToStageY } from './projection.js';

const NS = 'http://www.w3.org/2000/svg';

function polygon(points, proj, cls) {
  const p = document.createElementNS(NS, 'polygon');
  p.setAttribute('points', points.map(([x, z]) => `${worldToStageX(proj, x)},${worldToStageY(proj, z)}`).join(' '));
  p.setAttribute('class', cls);
  return p;
}

export function createDebugMask(parent, place, proj) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'debug-mask');
  svg.setAttribute('viewBox', `0 0 ${place.size[0]} ${place.size[1]}`);
  svg.setAttribute('width', place.size[0]);
  svg.setAttribute('height', place.size[1]);
  svg.appendChild(polygon(place.walkMask.area, proj, 'mask-area'));
  for (const o of place.walkMask.obstacles) svg.appendChild(polygon(o.points, proj, 'mask-obstacle'));
  parent.appendChild(svg);
  return {
    setVisible(v) {
      svg.style.display = v ? '' : 'none';
    },
  };
}
