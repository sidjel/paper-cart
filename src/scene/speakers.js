// Ondes sonores sous le haut-parleur qui parle sous PixiJS v8.
// Un seul objet Graphics dessiné une fois au chargement du lieu, puis déplacé et mis à l'échelle.

import { Graphics } from 'pixi.js';

function addHalfEllipseArc(g, rx, ry, steps = 18) {
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
}

export function createSpeakerWaves(parent) {
  const g = new Graphics();
  g.label = 'speaker:waves';
  addHalfEllipseArc(g, 14, 10);
  addHalfEllipseArc(g, 27, 20);
  addHalfEllipseArc(g, 40, 30);
  g.stroke({ color: 0x3d352a, width: 3, cap: 'round' });
  g.zIndex = 899;
  g.visible = false;
  parent.addChild(g);

  return {
    // (sx, sy) : bouche du haut-parleur sur la scène.
    show(sx, sy) {
      g.x = sx;
      g.y = sy;
    },
    // t : temps de jeu (s) ; still : sans mouvement.
    pulse(t, still) {
      const k = still ? 1 : 0.92 + 0.12 * Math.abs(Math.sin(t * 7));
      g.scale.set(k);
      g.alpha = still ? 0.85 : 0.55 + 0.4 * Math.abs(Math.sin(t * 7 + 0.6));
      g.visible = true;
    },
    hide() {
      g.visible = false;
    },
  };
}
