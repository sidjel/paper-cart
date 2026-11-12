// Personnage en papier : affichage seulement (la position vient de core/movement.js).
// - deux vues dessinées (face, dos), tournées vers la droite ; la gauche en miroir (scaleX) ;
// - animations décrites dans les données : liste d'images + vitesse ; 1 image ou 10, même code ;
// - illustrations entières, jamais découpées.

export function characterImageEntries(data, rasterScale) {
  const entries = [];
  for (const view of Object.values(data.views)) {
    for (const anim of Object.values(view)) {
      for (const url of anim.frames) {
        entries.push({ id: url, url, w: data.size[0], h: data.size[1], scale: rasterScale * data.scale });
      }
    }
  }
  return entries;
}

export function createCharacterSprite(data, images, parent) {
  const [w, h] = data.size;
  const root = document.createElement('div');
  root.className = 'actor';
  const flip = document.createElement('div'); // reçoit le miroir gauche/droite
  flip.className = 'actor-flip';
  flip.style.width = `${w}px`;
  flip.style.height = `${h}px`;
  flip.style.transformOrigin = `${data.anchor[0]}px ${data.anchor[1]}px`;
  root.appendChild(flip);
  parent.appendChild(root);

  // Un élément <img> par image d'animation ; une seule visible à la fois.
  const anims = {};
  const used = new Set();
  for (const [viewName, view] of Object.entries(data.views)) {
    for (const [animName, anim] of Object.entries(view)) {
      const els = anim.frames.map((url) => {
        const src = images.get(url);
        // Une même image peut servir dans plusieurs animations : on la clone alors.
        const img = used.has(url) ? new Image() : src.el;
        if (img !== src.el) img.src = src.url;
        used.add(url);
        img.className = 'actor-frame';
        img.width = w;
        img.height = h;
        img.alt = '';
        img.draggable = false;
        img.hidden = true;
        flip.appendChild(img);
        return img;
      });
      anims[`${viewName}.${animName}`] = { fps: anim.fps, frames: els };
    }
  }

  let shown = null;
  let lastFlip = 0;
  let lastX = NaN;
  let lastY = NaN;
  const ax = data.anchor[0];
  const ay = data.anchor[1];

  // Appelé à chaque image affichée. (sx, sy) : position des pieds sur la scène.
  function render(sx, sy, scale, facing, away, moving, time) {
    const key = away ? (moving ? 'dos.walk' : 'dos.idle') : moving ? 'face.walk' : 'face.idle';
    const anim = anims[key] ?? anims[away ? 'dos.idle' : 'face.idle'];
    const n = anim.frames.length;
    const frame = n > 1 && anim.fps > 0 ? anim.frames[Math.floor(time * anim.fps) % n] : anim.frames[0];
    if (frame !== shown) {
      if (shown) shown.hidden = true;
      frame.hidden = false;
      shown = frame;
    }
    if (facing !== lastFlip) {
      flip.style.transform = facing < 0 ? 'scaleX(-1)' : 'none';
      lastFlip = facing;
    }
    const s = scale * data.scale;
    if (sx !== lastX || sy !== lastY) {
      root.style.transform = `translate3d(${sx - ax}px, ${sy - ay}px, 0) scale(${s})`;
      lastX = sx;
      lastY = sy;
    }
  }

  root.style.transformOrigin = `${ax}px ${ay}px`;
  return { el: root, render };
}
