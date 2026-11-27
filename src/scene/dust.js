// Petits nuages de poussière en papier, à chaque pas (comme dans Paper Mario) sous PixiJS v8.
// Une petite réserve de Sprites créés au chargement et réutilisés : rien n'est créé pendant le jeu.

import { Sprite } from 'pixi.js';
import { quality } from './quality.js';

const POOL = 6;
const DRIFT = 26; // recul du nuage, en pixels de scène, sur sa durée de vie
const RISE = 16; // montée du nuage

// image : { texture, w, h } ; anchor : point du nuage posé au sol (dans l'image).
export function createDust(parent, image, anchor, settings, display) {
  const tw = Math.max(1, image.texture?.width ?? image.w);
  const th = Math.max(1, image.texture?.height ?? image.h);
  const baseSx = image.w / tw;
  const baseSy = image.h / th;
  const items = [];
  for (let i = 0; i < POOL; i++) {
    const sprite = new Sprite(image.texture);
    sprite.anchor.set(anchor[0] / image.w, anchor[1] / image.h);
    sprite.visible = false;
    parent.addChild(sprite);
    items.push({ sprite, active: false, start: 0, x: 0, y: 0, dir: 1, scale: 1 });
  }
  let next = 0;
  const counter = { spawns: 0 }; // pour le diagnostic

  return {
    counter,
    // Passe sur le calque des acteurs du lieu affiché.
    mount(to) {
      for (const it of items) to.addChild(it.sprite);
    },
    // (sx, sy) : pieds du personnage sur la scène ; facing : 1 vers la droite, -1 vers la gauche.
    spawn(sx, sy, facing, scale, level, time) {
      if (!quality().dust || display.reduceMotion) return;
      const it = items[next];
      counter.spawns++;
      next = (next + 1) % POOL;
      it.active = true;
      it.start = time;
      it.x = sx - facing * 22 * scale; // derrière le pied
      it.y = sy + 2;
      it.dir = -facing;
      it.scale = scale * settings.dustSize;
      it.sprite.zIndex = level;
      it.sprite.visible = true;
    },
    update(time) {
      const dur = settings.dustDuration;
      for (let i = 0; i < POOL; i++) {
        const it = items[i];
        if (!it.active) continue;
        const p = (time - it.start) / dur;
        if (p >= 1 || p < 0) {
          it.active = false;
          it.sprite.visible = false;
          continue;
        }
        const ease = 1 - (1 - p) * (1 - p); // part vite, ralentit
        const s = it.scale * (0.35 + 0.75 * ease);
        it.sprite.x = it.x + it.dir * DRIFT * ease;
        it.sprite.y = it.y - RISE * ease;
        it.sprite.scale.set(baseSx * s, baseSy * s);
        it.sprite.alpha = settings.dustOpacity * (1 - p) * (1 - p * 0.5);
      }
    },
    activeCount() {
      let n = 0;
      for (let i = 0; i < POOL; i++) if (items[i].active) n++;
      return n;
    },
  };
}
