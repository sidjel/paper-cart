// Oiseaux origami dehors (vol et marche lente sur les verrières) : affichage DOM minimaliste.
// Un seul calque GPU par oiseau (translate3d/scale en transform uniquement), ses poses préchargées en <img>
// basculées par `hidden` sans recréer ni modifier d'image en cours de jeu (règle src/scene/CLAUDE.md).

import { birdPose } from '../core/birds.js';

export function createBirds(layer, cfg, images, reduceMotion = false) {
  const [defaultW, defaultH] = cfg.size;
  const claimed = new Set();

  const birds = cfg.flock.map((def) => {
    const [w, h] = def.size ?? [defaultW, defaultH];
    const box = document.createElement('div');
    box.className = 'bird';
    box.style.width = `${w}px`;
    box.style.height = `${h}px`;
    box.style.transformOrigin = '50% 50%';
    // N'attache que les poses réellement utilisées par cet oiseau (6 pour le vol, 2 pour la marche).
    const usedFrames = [...new Set(def.cycle ?? cfg.cycle)];
    const poses = new Map();
    for (const idx of usedFrames) {
      const id = cfg.frames[idx];
      const im = images.get(id);
      const el = claimed.has(id) ? new Image() : im.el;
      if (el !== im.el) el.src = im.url;
      claimed.add(id);
      el.className = 'bird-pose';
      el.width = w;
      el.height = h;
      el.alt = '';
      el.draggable = false;
      el.hidden = true;
      box.appendChild(el);
      poses.set(idx, el);
    }
    layer.appendChild(box);
    return { def, box, poses, w, h, frame: -1 };
  });

  // parallaxDx : décalage horizontal actuel du calque parent ; les oiseaux qui marchent sur le rebord
  // d'une verrière compensent ce décalage pour rester calés sur le rebord tout en restant derrière la vitre.
  function update(time, rm, parallaxDx = 0) {
    for (const b of birds) {
      const { x, y, frame, dir, scale, anchorToStage } = birdPose(b.def, time, cfg.span, cfg.cycle, rm);
      const lx = anchorToStage ? x - parallaxDx : x;
      b.box.style.transform = `translate3d(${lx - b.w / 2}px, ${y - b.h / 2}px, 0) scale(${dir * scale}, ${scale})`;
      if (frame !== b.frame) {
        if (b.frame >= 0) b.poses.get(b.frame).hidden = true;
        b.poses.get(frame).hidden = false;
        b.frame = frame;
      }
    }
  }

  update(0, reduceMotion, 0);
  return { update, layer: cfg.layer };
}
