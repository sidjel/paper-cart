// La scène : un cadre logique de 1920×1080 mis à l'échelle de l'écran sans déformer.
//  - « remplir » (fill) : couvre tout l'écran, les bords du décor sont un peu coupés ;
//  - « tout montrer » (fit) : tout le cadre est visible, avec des bandes.
// Les calques sont créés d'après la pile déclarée dans les données du lieu.

// getValue(clé) : lit un réglage (pour les calques dont l'opacité est réglable).
export function createStage(container, place, images, getValue) {
  const [W, H] = place.size;
  const el = document.createElement('div');
  el.className = 'stage';
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;

  const layers = {};
  for (const def of place.layers) {
    const layer = document.createElement('div');
    layer.className = `layer layer-${def.id}`;
    layer.dataset.contains = def.contains;
    if (def.image) {
      const img = images.get(def.image);
      img.el.className = 'layer-image';
      img.el.width = img.w;
      img.el.height = img.h;
      img.el.alt = '';
      img.el.draggable = false;
      if (def.position) img.el.style.transform = `translate(${def.position[0]}px, ${def.position[1]}px)`;
      layer.appendChild(img.el);
    }
    el.appendChild(layer);
    layers[def.id] = layer;
  }
  container.appendChild(el);

  // Opacité des calques qui la déclarent (par exemple le premier plan en transparence).
  function applyOpacity() {
    for (const def of place.layers) {
      if (def.opacity) layers[def.id].style.opacity = getValue(def.opacity);
    }
  }
  applyOpacity();

  const view = { scale: 1, offX: 0, offY: 0 };

  function layout(mode) {
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    const s = mode === 'fit' ? Math.min(vw / W, vh / H) : Math.max(vw / W, vh / H);
    const offX = (vw - W * s) / 2;
    // En mode « remplir », on garde centrée la hauteur utile du lieu (là où l'on marche).
    let offY = (vh - H * s) / 2;
    if (mode !== 'fit' && H * s > vh) {
      offY = Math.min(0, Math.max(vh - H * s, vh / 2 - place.cropFocusY * s));
    }
    view.scale = s;
    view.offX = offX;
    view.offY = offY;
    el.style.transform = `translate(${offX}px, ${offY}px) scale(${s})`;
  }

  // Écran (pixels CSS de la fenêtre) → scène. Écrit dans `out` pour ne rien créer.
  function clientToStage(cx, cy, out) {
    const r = container.getBoundingClientRect();
    out.x = (cx - r.left - view.offX) / view.scale;
    out.y = (cy - r.top - view.offY) / view.scale;
    return out;
  }

  return { el, layers, view, layout, clientToStage, applyOpacity };
}
