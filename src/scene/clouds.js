// Nuages origami animés dans le ciel (arrière-plan) sous PixiJS v8.
// Préchargés au chargement du lieu, jamais recréés en jeu ; placés dans le calque lointain avant les oiseaux.

import { Sprite } from 'pixi.js';
import { cloudPose } from '../core/clouds.js';

export function createClouds(layer, cfg, images, reduceMotion = false) {
  const items = cfg.items.map((def) => {
    const im = images.get(def.image);
    const sprite = new Sprite(im.texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.alpha = def.opacity ?? 1;
    layer.addChild(sprite);
    return {
      def,
      sprite,
      w: im.w,
      h: im.h,
      tw: Math.max(1, im.texture.width),
      th: Math.max(1, im.texture.height),
    };
  });

  function update(time, rm) {
    for (const c of items) {
      const { x, y, scale } = cloudPose(c.def, time, cfg.span, rm);
      c.sprite.x = x;
      c.sprite.y = y;
      c.sprite.scale.set((c.w * scale) / c.tw, (c.h * scale) / c.th);
    }
  }

  update(0, reduceMotion);
  return { update, count: items.length };
}
