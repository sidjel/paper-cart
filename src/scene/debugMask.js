// Affichage de debug du masque de zone de marche (F4 ou réglage « Afficher la zone de marche ») sous PixiJS v8.
// Dessiné paresseusement à la première activation, puis seulement montré ou caché : aucun coût quand caché.

import { Graphics } from 'pixi.js';
import { worldToStageX, worldToStageY } from './projection.js';

function drawDashedLine(g, x1, y1, x2, y2, dash, gap) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len <= 0) return;
  const ux = dx / len;
  const uy = dy / len;
  for (let d = 0; d < len; d += dash + gap) {
    const end = Math.min(len, d + dash);
    g.moveTo(x1 + ux * d, y1 + uy * d);
    g.lineTo(x1 + ux * end, y1 + uy * end);
  }
}

// props : objets du décor ; leur point de référence de profondeur est tracé en pointillés bleus.
export function createDebugMask(parent, place, proj, props) {
  const g = new Graphics();
  g.label = 'debug:mask';
  g.visible = false;
  parent.addChild(g);

  let built = false;

  function build() {
    if (built) return;
    built = true;
    const areaPts = [];
    for (const [x, z] of place.walkMask.area) areaPts.push(worldToStageX(proj, x), worldToStageY(proj, z));
    g.poly(areaPts).fill({ color: 0x50c85a, alpha: 0.25 }).stroke({ color: 0x1e8c32, width: 3 });

    for (const o of place.walkMask.obstacles) {
      const pts = [];
      for (const [x, z] of o.points) pts.push(worldToStageX(proj, x), worldToStageY(proj, z));
      g.poly(pts).fill({ color: 0xdc3c32, alpha: 0.35 }).stroke({ color: 0xaa1e14, width: 3 });
    }

    for (const p of props) {
      const y = worldToStageY(proj, p.depthRef);
      drawDashedLine(g, p.left, y, p.left + p.width, y, 12, 8);
    }
    if (props.length) g.stroke({ color: 0x285ac8, width: 4 });
  }

  return {
    setVisible(v) {
      const on = Boolean(v);
      if (on) build();
      g.visible = on;
    },
  };
}
