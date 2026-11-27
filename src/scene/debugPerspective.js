// Grille visuelle de perspective (F6 ou réglage « Afficher la grille de perspective ») sous PixiJS v8.
// Construite paresseusement uniquement quand F6 est actif, et détruite aussitôt quand cachée ou au changement de lieu.

import { Container, Graphics, Text } from 'pixi.js';
import { worldToStageY, scaleAt } from './projection.js';

function drawDashed(g, x1, y1, x2, y2, dash, gap) {
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

export function createDebugPerspective(parent, place, proj) {
  const [W, H] = place.size;
  const root = new Container();
  root.label = 'debug:perspective';
  root.visible = false;
  parent.addChild(root);

  let visible = false;

  function clearChildren() {
    for (const child of root.removeChildren()) {
      child.destroy({ children: true, texture: true, textureSource: true });
    }
  }

  function rebuild() {
    clearChildren();
    const g = new Graphics();
    root.addChild(g);

    const ds = Math.max(0.01, proj.settings.depthScale);
    const horizonY = proj.horizonY !== null
      ? proj.horizonY
      : proj.perDepth > 0
        ? proj.floorY - (proj.baseScale / (proj.perDepth * ds) + proj.refZ) * proj.k
        : 320;
    const vanishX = place.projection.vanishX ?? W / 2;

    // 1. Rayons de fuite en éventail depuis le point de fuite vers le bas de la scène.
    for (let x = -W * 0.5; x <= W * 1.5; x += 240) {
      g.moveTo(vanishX, horizonY).lineTo(x, H + 300);
    }
    g.stroke({ color: 0x06b6d4, alpha: 0.45, width: 2 });

    // 2. Lignes horizontales de profondeur z (avec y écran et échelle du héros).
    const zs = place.walkMask.area.map((p) => p[1]);
    const minZ = Math.floor(Math.min(...zs) / 100) * 100;
    const maxZ = Math.ceil(Math.max(...zs) / 100) * 100;
    const zLabelStyle = {
      fontFamily: 'system-ui, sans-serif',
      fontSize: 18,
      fontWeight: '700',
      fill: 0xfef3c7,
      stroke: { color: 0x0f172a, width: 4 },
    };
    for (let z = minZ; z <= maxZ; z += 100) {
      const y = worldToStageY(proj, z);
      if (y < 0 || y > H) continue;
      const sc = scaleAt(proj, z);
      drawDashed(g, 0, y, W, y, 10, 8);
      const label = `z=${z} · y=${Math.round(y)} · ×${sc.toFixed(2)}`;
      for (let lx = 24; lx < W - 200; lx += 1200) {
        const t = new Text({ text: label, style: zLabelStyle });
        t.x = lx;
        t.y = y - 24;
        root.addChild(t);
      }
    }
    g.stroke({ color: 0xf59e0b, alpha: 0.65, width: 2 });

    // 3. Ligne d'horizon + croix du point de fuite.
    if (horizonY >= -100 && horizonY <= H) {
      drawDashed(g, 0, horizonY, W, horizonY, 14, 8);
      g.stroke({ color: 0xe11d48, alpha: 0.9, width: 3 });

      g.moveTo(vanishX - 24, horizonY).lineTo(vanishX + 24, horizonY);
      g.moveTo(vanishX, horizonY - 24).lineTo(vanishX, horizonY + 24);
      g.circle(vanishX, horizonY, 10);
      g.stroke({ color: 0xfacc15, width: 3 });

      const hLabel = `HORIZON y=${Math.round(horizonY)} (fuite x=${Math.round(vanishX)})`;
      const hStyle = {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 20,
        fontWeight: '700',
        fill: 0xffe4e6,
        stroke: { color: 0x881337, width: 4 },
      };
      for (let lx = 24; lx < W - 260; lx += 1200) {
        const t = new Text({ text: hLabel, style: hStyle });
        t.x = lx;
        t.y = Math.max(4, horizonY - 30);
        root.addChild(t);
      }
    }
  }

  return {
    setVisible(v) {
      visible = Boolean(v);
      if (visible) rebuild();
      else clearChildren();
      root.visible = visible;
    },
    refresh() {
      if (visible) rebuild();
    },
    destroy() {
      clearChildren();
    },
  };
}
