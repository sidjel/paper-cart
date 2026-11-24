// Nuages origami animés dans le ciel (arrière-plan) : affichage DOM minimaliste (transform uniquement).
// Préchargés au chargement du lieu, jamais recréés en jeu ; placés dans le calque lointain avant les oiseaux.

import { cloudPose } from '../core/clouds.js';

export function createClouds(layer, cfg, images, reduceMotion = false) {
  const claimed = new Set();
  const items = cfg.items.map((def) => {
    const im = images.get(def.image);
    const el = claimed.has(def.image) ? new Image() : im.el;
    if (el !== im.el) el.src = im.url;
    claimed.add(def.image);
    el.className = 'cloud';
    el.width = im.w;
    el.height = im.h;
    el.alt = '';
    el.draggable = false;
    el.style.opacity = def.opacity != null ? String(def.opacity) : '';
    layer.appendChild(el);
    return { def, el, w: im.w, h: im.h };
  });

  function update(time, rm) {
    for (const c of items) {
      const { x, y, scale } = cloudPose(c.def, time, cfg.span, rm);
      c.el.style.transform = `translate3d(${x - c.w / 2}px, ${y - c.h / 2}px, 0) scale(${scale})`;
    }
  }

  update(0, reduceMotion);
  return { update };
}
