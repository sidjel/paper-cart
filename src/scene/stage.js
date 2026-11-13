// La scène : le lieu entier (par exemple 3600×1080), vu à travers la caméra.
// - toute la hauteur du décor est visible (zoom 1) quelle que soit la forme de l'écran ;
//   un écran plus allongé (20:9) montre simplement plus de largeur, sans rien couper ;
// - la caméra fait glisser la scène ; les calques avec une parallaxe (rayons lointains,
//   premier plan) glissent moins vite ou plus vite, ce qui donne la profondeur ;
// - les calques sont créés d'après la pile déclarée dans les données du lieu ;
// - un calque lointain peut déclarer des « fenêtres » (les seules zones où on le voit, par exemple
//   les ouvertures de l'étagère) : il n'est alors dessiné que dans ces fenêtres, l'image glissant
//   à l'intérieur avec la même parallaxe. L'ancienne façon (bande entière) reste disponible pour
//   comparer les deux (test T3), une seule étant affichée à la fois.

// getValue(clé) : lit un réglage (pour les calques dont l'opacité est réglable).
export function createStage(container, place, images, getValue) {
  const [W, H] = place.size;
  const el = document.createElement('div');
  el.className = 'stage';
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;

  const layers = {};
  const parallax = []; // calques qui ne glissent pas à la vitesse du sol : { el, f, last }
  const windowImgs = []; // images dans les fenêtres : { el, f, ox, oy, last }
  const far = { full: null, windows: null }; // les deux rendus possibles d'un calque à fenêtres
  for (const def of place.layers) {
    const layer = document.createElement('div');
    layer.className = `layer layer-${def.id}`;
    layer.dataset.contains = def.contains;
    const pos = def.position ?? [0, 0];
    if (def.image) {
      const img = images.get(def.image);
      img.el.className = 'layer-image';
      img.el.width = img.w;
      img.el.height = img.h;
      img.el.alt = '';
      img.el.draggable = false;
      img.el.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`;
      layer.appendChild(img.el);
    }
    const f = def.parallax ?? 1;
    if (f !== 1) {
      layer.classList.add('layer-parallax');
      parallax.push({ el: layer, f, last: NaN });
    }
    el.appendChild(layer);
    layers[def.id] = layer;
    if (def.windows && def.image) {
      // Même image, découpée par des fenêtres fixes (elles suivent le décor du fond).
      const src = images.get(def.image);
      const box = document.createElement('div');
      box.className = `layer layer-${def.id}-fenetres`;
      box.dataset.contains = `${def.contains} (seulement dans les fenêtres)`;
      for (const [x, y, w, h] of def.windows) {
        const win = document.createElement('div');
        win.className = 'far-window';
        win.style.left = `${x}px`;
        win.style.top = `${y}px`;
        win.style.width = `${w}px`;
        win.style.height = `${h}px`;
        const im = new Image();
        im.src = src.url;
        im.className = 'far-window-image';
        im.width = src.w;
        im.height = src.h;
        im.alt = '';
        im.draggable = false;
        win.appendChild(im);
        box.appendChild(win);
        windowImgs.push({ el: im, f, ox: pos[0] - x, oy: pos[1] - y, last: NaN });
      }
      el.appendChild(box);
      far.full = layer;
      far.windows = box;
    }
  }
  container.appendChild(el);

  // Opacité des calques qui la déclarent (par exemple le premier plan en transparence).
  function applyOpacity() {
    for (const def of place.layers) {
      if (def.opacity) layers[def.id].style.opacity = getValue(def.opacity);
    }
  }
  applyOpacity();

  // scale : taille d'un pixel de scène à l'écran ; viewW/viewH : partie visible (pixels de scène).
  const view = { scale: 1, offX: 0, offY: 0, viewW: W, viewH: H, camX: 0, camY: 0 };
  let lastCamX = NaN;
  let lastCamY = NaN;

  function apply() {
    const s = view.scale;
    el.style.transform = `translate3d(${view.offX - view.camX * s}px, ${view.offY - view.camY * s}px, 0) scale(${s})`;
    for (const p of parallax) {
      // Décalage par rapport au sol : un calque lointain (f < 1) « recule » moins vite.
      const dx = view.camX * (1 - p.f);
      if (dx !== p.last) {
        p.el.style.transform = `translate3d(${dx}px, 0, 0)`;
        p.last = dx;
      }
    }
    for (const w of windowImgs) {
      const dx = view.camX * (1 - w.f);
      if (dx !== w.last) {
        w.el.style.transform = `translate3d(${w.ox + dx}px, ${w.oy}px, 0)`;
        w.last = dx;
      }
    }
  }

  // Rendu du calque lointain : dans les fenêtres seulement (true) ou en bande entière (false) ;
  // hidden : le masquer complètement (interrupteur d'essai du banc).
  function setFar(windows, hidden = false) {
    if (!far.full) return;
    far.full.style.display = hidden || windows ? 'none' : '';
    far.windows.style.display = hidden || !windows ? 'none' : '';
  }

  function layout(zoom) {
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    const s = (vh / H) * zoom;
    view.scale = s;
    view.viewW = vw / s;
    view.viewH = vh / s;
    // Écran plus large que tout le lieu : on centre.
    view.offX = view.viewW > W ? (vw - W * s) / 2 : 0;
    view.offY = 0;
    lastCamX = NaN;
    apply();
  }

  // Position de la caméra (coin haut-gauche de la partie visible, en pixels de scène).
  function setCamera(x, y) {
    view.camX = view.viewW > W ? 0 : x;
    view.camY = y;
    if (view.camX === lastCamX && view.camY === lastCamY) return;
    lastCamX = view.camX;
    lastCamY = view.camY;
    apply();
  }

  // Écran (pixels CSS de la fenêtre) → scène. Écrit dans `out` pour ne rien créer.
  function clientToStage(cx, cy, out) {
    const r = container.getBoundingClientRect();
    out.x = (cx - r.left - view.offX) / view.scale + view.camX;
    out.y = (cy - r.top - view.offY) / view.scale + view.camY;
    return out;
  }

  function stageToClient(sx, sy, out) {
    const r = container.getBoundingClientRect();
    out.x = r.left + view.offX + (sx - view.camX) * view.scale;
    out.y = r.top + view.offY + (sy - view.camY) * view.scale;
    return out;
  }

  return { el, layers, view, layout, setCamera, clientToStage, stageToClient, applyOpacity, setFar };
}
