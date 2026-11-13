// La scène : le lieu entier (par exemple 3600×1080), vu à travers la caméra.
// - toute la hauteur du décor est visible (zoom 1) quelle que soit la forme de l'écran ;
//   un écran plus allongé (20:9) montre simplement plus de largeur, sans rien couper ;
// - la caméra fait glisser la scène ; les calques avec une parallaxe (rayons lointains,
//   premier plan) glissent moins vite ou plus vite, ce qui donne la profondeur ;
// - les calques sont créés d'après la pile déclarée dans les données du lieu ;
// - DIAGNOSTIC SEULEMENT : setLayerVariant change la façon de dessiner un calque pendant une
//   campagne de mesure (puis la remet comme avant). En jeu normal, rien ne change.

// getValue(clé) : lit un réglage (pour les calques dont l'opacité est réglable).
export function createStage(container, place, images, getValue) {
  const [W, H] = place.size;
  const el = document.createElement('div');
  el.className = 'stage';
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;

  const layers = {};
  const layerInfo = {}; // pour le diagnostic : { def, img } de chaque calque à image
  const parallax = []; // [élément, facteur, x, y] des calques qui ne glissent pas à la vitesse du sol
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
      layerInfo[def.id] = { def, img };
    }
    const f = def.parallax ?? 1;
    if (f !== 1) {
      layer.classList.add('layer-parallax');
      parallax.push({ el: layer, f, f0: f, id: def.id, last: NaN });
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

  // DIAGNOSTIC (campagne « rayon de devant ») : façon de dessiner un calque pendant une mesure.
  // 'normal' : comme dans le jeu ; 'half' : seulement la moitié haute de l'image ;
  // 'parallax1' : le calque glisse à la vitesse du sol (sans effet de profondeur propre).
  function setLayerVariant(id, variant) {
    const info = layerInfo[id];
    if (!info) return;
    const layer = layers[id];
    const { def, img } = info;
    const [x, y] = def.position ?? [0, 0];
    const half = variant === 'half';
    layer.style.left = half ? `${x}px` : '';
    layer.style.top = half ? `${y}px` : '';
    layer.style.width = half ? `${img.w}px` : '';
    layer.style.height = half ? `${img.h / 2}px` : '';
    layer.style.overflow = half ? 'hidden' : '';
    img.el.style.transform = half ? 'none' : `translate(${x}px, ${y}px)`;
    const p = parallax.find((q) => q.id === id);
    if (p) {
      p.f = variant === 'parallax1' ? 1 : p.f0;
      p.last = NaN;
    }
    apply();
    applyOpacity();
  }

  return { el, layers, view, layout, setCamera, clientToStage, stageToClient, applyOpacity, setLayerVariant };
}
