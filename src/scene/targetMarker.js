// Petit repère au sol, à l'endroit touché ou cliqué sous PixiJS v8. Il s'efface en fondu (0,25 s) à l'arrivée.

import { Graphics } from 'pixi.js';

const FADE_DURATION = 0.25;
const PEAK_ALPHA = 0.85;

export function createTargetMarker(parent) {
  const g = new Graphics();
  g.label = 'target:marker';
  // Contour encre + anneau papier (fidèle au style CSS .target-marker : 44×22, bordure 4 px papier + 2 px encre).
  g.ellipse(0, 0, 22, 11).stroke({ color: 0x3d352a, width: 7 });
  g.ellipse(0, 0, 22, 11).stroke({ color: 0xfbf8ee, width: 4 });
  g.zIndex = 898;
  g.visible = false;
  g.alpha = 0;
  parent.addChild(g);

  let visible = false;
  let fading = false;
  let fadeStart = -1;

  return {
    // Passe sur le calque des acteurs du lieu affiché.
    mount(to) {
      to.addChild(g);
    },
    showAt(sx, sy) {
      g.x = sx;
      g.y = sy;
      g.alpha = PEAK_ALPHA;
      g.visible = true;
      visible = true;
      fading = false;
      fadeStart = -1;
    },
    hide() {
      if (!visible) return;
      visible = false;
      fading = true;
      fadeStart = -1;
    },
    update(time, reduceMotion = false) {
      if (!fading) return;
      if (reduceMotion) {
        g.visible = false;
        g.alpha = 0;
        fading = false;
        return;
      }
      if (fadeStart < 0) fadeStart = time;
      const p = (time - fadeStart) / FADE_DURATION;
      if (p >= 1) {
        g.visible = false;
        g.alpha = 0;
        fading = false;
      } else {
        g.alpha = PEAK_ALPHA * (1 - p);
      }
    },
  };
}
