// Produits sur l'étagère et effets du scanner sous PixiJS v8 (affichage seulement ; la logique est dans core/scan.js).
// - chaque produit est un Sprite posé sur l'étagère du fond ou sur un meuble (« loose », zIndex = levelOf(on) + 0.1) ;
// - un repère triangle origami (Graphics) flotte au-dessus du produit à portée ;
// - pendant un scan : laser (Graphics), dissolution du produit, et jusqu'à 24 confettis Graphics pré-alloués
//   (0 <canvas>, 0 tint non-blanc → compatible CanvasRenderer sans getImageData).

import { Graphics, Sprite } from 'pixi.js';

const BITS_MAX = 24;

// Petit générateur déterministe (positions des confettis identiques d'un scan à l'autre).
function noise(i, k) {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

// items : produits du lieu (état du monde, core/world.js) — la seule source : ici on ne fait que les montrer.
// loose : { parent, levelOf(idObjet) } pour les produits posés ailleurs que sur l'étagère.
export function createProducts(items, images, parent, effectsParent, settings, display, loose) {
  function applyScale(s, w, h, k = 1) {
    const tex = s.texture;
    const tw = Math.max(1, tex?.width ?? w);
    const th = Math.max(1, tex?.height ?? h);
    s.scale.set((w / tw) * k, (h / th) * k);
  }

  // Place (ou replace) le Sprite d'un produit d'après son état : calque, niveau, position, visible ou non.
  function place(i) {
    const it = items[i];
    const s = sprites[i];
    const into = it.loose ? loose.parent : parent;
    if (s.parent !== into) into.addChild(s);
    s.zIndex = it.loose ? loose.levelOf(it.on) + 0.1 : 0;
    s.alpha = 1;
    s.x = it.x;
    s.y = it.y;
    applyScale(s, it.w, it.h, 1);
    s.visible = !it.scanned;
  }

  const sprites = items.map((it) => {
    const s = new Sprite(images.get(it.def.image).texture);
    s.anchor.set(0.5, 1);
    return s;
  });
  items.forEach((_, i) => place(i));

  // Réserve pour les échanges avec un produit venu d'un autre lieu (A7) : Sprites préparés au chargement.
  const spares = [];
  for (let k = 0; k < settings.exchangeSpares; k++) {
    const sprite = new Sprite();
    sprite.anchor.set(0.5, 1);
    sprite.visible = false;
    spares.push({ sprite, used: false });
  }

  // Repère triangle origami au-dessus du produit à portée.
  const marker = new Graphics();
  marker.label = 'scan:marker';
  marker.poly([6, 8, 34, 8, 20, 32]).fill(0xfbf8ee).stroke({ color: 0x4a4236, width: 3, join: 'round' });
  marker.zIndex = 900;
  marker.visible = false;
  effectsParent.addChild(marker);
  let markerOn = -1;

  // Laser : un trait rouge et son halo (longueur unitaire étirée en scale.x, 0 redessin par image).
  const laser = new Graphics();
  laser.label = 'scan:laser';
  laser.rect(0, -4, 1, 8).fill({ color: 0xff463c, alpha: 0.35 }).rect(0, -1.5, 1, 3).fill(0xff3b30);
  laser.zIndex = 901;
  laser.visible = false;
  effectsParent.addChild(laser);

  // Confettis : jusqu'à 24 Graphics pré-alloués (0 Sprite teinté → 0 getImageData sous CanvasRenderer).
  const bits = [];
  const bitsCount = Math.min(BITS_MAX, settings.particles);
  for (let i = 0; i < bitsCount; i++) {
    const b = new Graphics();
    b.zIndex = 902;
    b.visible = false;
    effectsParent.addChild(b);
    bits.push(b);
  }
  let bitsOn = false;
  let dissolving = -1;

  function setMarker(index, time) {
    if (index < 0) markAt(-1, 0, 0, time);
    else markAt(index, items[index].x, items[index].y - items[index].h, time);
  }

  // Repère au-dessus d'un point (x, haut du dessin) de la scène ; key : ce qui est visé (-1 : rien).
  function markAt(key, x, top, time) {
    if (key !== markerOn) {
      marker.visible = key !== -1;
      markerOn = key;
    }
    if (key === -1) return;
    const bob = display.reduceMotion ? 0 : Math.sin(time * 5) * 6;
    marker.x = x - 20;
    marker.y = top - 46 + bob;
  }

  function hideEffects() {
    laser.visible = false;
    if (bitsOn) {
      for (const b of bits) b.visible = false;
      bitsOn = false;
    }
  }

  // Appelé à chaque image affichée. scan : état du scan (core) ; progress : avancement de la phase ;
  // tip : bout de la Scanette sur la scène { x, y }.
  function update(scan, progress, tip) {
    if (!scan.active) {
      hideEffects();
      return;
    }
    const it = items[scan.index];
    const s = sprites[scan.index];
    const cx = it.x;
    const cy = it.y - it.h / 2;

    if (scan.phase === 'laser' || scan.phase === 'dissolve') {
      const dx = cx - tip.x;
      const dy = cy - tip.y;
      const len = Math.hypot(dx, dy);
      const grow = scan.phase === 'laser' ? progress : 1;
      const fade = scan.phase === 'dissolve' ? 1 - progress : 1;
      laser.x = tip.x;
      laser.y = tip.y;
      laser.rotation = Math.atan2(dy, dx);
      laser.scale.set(len * grow, 1);
      laser.alpha = fade;
      laser.visible = true;
    } else {
      laser.visible = false;
    }

    if (scan.phase === 'dissolve') {
      if (dissolving !== scan.index) {
        dissolving = scan.index;
        const colors = it.def.colors;
        bits.forEach((b, i) => {
          b.clear()
            .roundRect(-6, -4, 12, 8, 2)
            .fill(colors[i % colors.length])
            .stroke({ color: 0x4a4236, width: 1.5 });
          b.visible = true;
        });
        bitsOn = true;
      }
      const p = progress;
      s.alpha = 1 - p;
      applyScale(s, it.w, it.h, 1 - 0.5 * p);
      const n = bits.length;
      for (let i = 0; i < n; i++) {
        const start = noise(i, 1) * 0.45;
        const q = Math.max(0, Math.min(1, (p - start) / (1 - start)));
        const e = q * q;
        const sx = it.x + (noise(i, 2) - 0.5) * it.w;
        const sy = it.y - noise(i, 3) * it.h;
        const mx = (sx + tip.x) / 2 + (noise(i, 4) - 0.5) * 120;
        const my = Math.min(sy, tip.y) - 40 - noise(i, 5) * 60;
        const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tip.x;
        const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * tip.y;
        const sc = (1 - 0.7 * e) * (0.6 + noise(i, 6));
        const b = bits[i];
        b.x = x;
        b.y = y;
        b.rotation = (noise(i, 7) - 0.5) * 6 + q * 8;
        b.scale.set(sc);
        b.alpha = q >= 1 ? 0 : 1;
      }
    } else if (bitsOn) {
      for (const b of bits) b.visible = false;
      bitsOn = false;
    }
  }

  function remove(index) {
    sprites[index].visible = false;
    dissolving = -1;
  }

  function reserve(entry) {
    const k = spares.findIndex((sp) => !sp.used);
    if (k < 0) return -1;
    const sp = spares[k];
    sp.used = true;
    sp.sprite.texture = images.get(entry.def.image).texture;
    return k;
  }

  function adopt(index, k) {
    sprites[index] = spares[k].sprite;
  }

  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0, y: 0 };
  function info(stage) {
    return {
      markerVisible: marker.visible,
      items: items.map((it, i) => {
        stage.stageToClient(it.x - it.w / 2, it.y - it.h, p0);
        stage.stageToClient(it.x + it.w / 2, it.y, p1);
        return {
          id: it.id,
          visible: Boolean(sprites[i]?.visible),
          bounds: { x: p0.x, y: p0.y, width: p1.x - p0.x, height: p1.y - p0.y },
        };
      }),
    };
  }

  return { setMarker, markAt, update, remove, sync: place, reserve, adopt, info };
}
