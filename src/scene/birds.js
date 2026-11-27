// Oiseaux origami dehors (vol et marche lente sur les verrières) sous PixiJS v8.
// Un seul Sprite par oiseau dont on échange la référence `texture` parmi les poses préchargées.

import { Sprite } from 'pixi.js';
import { birdPose } from '../core/birds.js';

export function createBirds(layer, cfg, images, reduceMotion = false) {
  const [defaultW, defaultH] = cfg.size;

  const birds = cfg.flock.map((def) => {
    const [w, h] = def.size ?? [defaultW, defaultH];
    const usedFrames = [...new Set(def.cycle ?? cfg.cycle)];
    const frames = new Map();
    for (const idx of usedFrames) {
      frames.set(idx, images.get(cfg.frames[idx]).texture);
    }
    const firstTex = frames.values().next().value;
    const sprite = new Sprite(firstTex);
    sprite.anchor.set(0.5, 0.5);
    layer.addChild(sprite);
    return { def, sprite, frames, w, h, frame: -1 };
  });

  // parallaxDx : décalage horizontal actuel du calque parent ; les oiseaux qui marchent sur le rebord
  // d'une verrière compensent ce décalage pour rester calés sur le rebord tout en restant derrière la vitre.
  function update(time, rm, parallaxDx = 0) {
    for (const b of birds) {
      const { x, y, frame, dir, scale, anchorToStage } = birdPose(b.def, time, cfg.span, cfg.cycle, rm);
      const lx = anchorToStage ? x - parallaxDx : x;
      if (frame !== b.frame) {
        const tex = b.frames.get(frame);
        if (tex) b.sprite.texture = tex;
        b.frame = frame;
      }
      const tw = Math.max(1, b.sprite.texture?.width ?? b.w);
      const th = Math.max(1, b.sprite.texture?.height ?? b.h);
      b.sprite.x = lx;
      b.sprite.y = y;
      b.sprite.scale.set((dir * b.w * scale) / tw, (b.h * scale) / th);
    }
  }

  update(0, reduceMotion, 0);
  return { update, layer: cfg.layer, count: birds.length };
}
