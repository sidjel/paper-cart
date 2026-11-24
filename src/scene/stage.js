// La scène : le lieu entier (par exemple 3600×1080), vu à travers la caméra.
// - toute la hauteur du décor est visible (zoom 1) quelle que soit la forme de l'écran ;
//   un écran plus allongé (20:9) montre simplement plus de largeur, sans rien couper ;
// - la caméra fait glisser la scène ; les calques avec une parallaxe (rayons lointains,
//   premier plan) glissent moins vite ou plus vite, ce qui donne la profondeur ;
// - les calques sont créés d'après la pile déclarée dans les données du lieu.

import { quality } from './quality.js';

// getValue(clé) : lit un réglage (pour les calques dont l'opacité est réglable).
export function createStage(container, place, images, getValue) {
  const [W, H] = place.size;
  const el = document.createElement('div');
  el.className = 'stage';
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;

  const layers = {};
  const parallax = []; // [élément, facteur, x, y] des calques qui ne glissent pas à la vitesse du sol
  const farStill = !quality().farParallax; // lu une fois : le profil s'applique au chargement
  for (const def of place.layers) {
    const layer = document.createElement('div');
    layer.className = `layer layer-${def.id}`;
    layer.dataset.contains = def.contains;
    // size (facultatif) : un calque presque vide (le dehors, la pluie) ne prend que la place de son contenu,
    // pour ne pas réserver dans la mémoire graphique une surface grande comme tout le lieu.
    if (def.size) {
      layer.style.width = `${def.size[0]}px`;
      layer.style.height = `${def.size[1]}px`;
    }
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
      parallax.push({ el: layer, f, id: def.id, last: NaN });
    }
    el.appendChild(layer);
    layers[def.id] = layer;
  }
  container.appendChild(el);

  // Opacité des calques qui la déclarent (par exemple le premier plan en transparence).
  const opacities = {};
  function setLayerOpacity(id, value) {
    const elLayer = layers[id];
    if (!elLayer) return;
    const v = Math.round(value * 1000) / 1000;
    if (opacities[id] === v) return;
    opacities[id] = v;
    elLayer.style.opacity = String(v);
  }
  function applyOpacity() {
    for (const def of place.layers) {
      if (def.opacity) setLayerOpacity(def.id, getValue(def.opacity));
    }
  }
  applyOpacity();
  function parallaxOffset(id) {
    const p = parallax.find((x) => x.id === id);
    return p && Number.isFinite(p.last) ? p.last : 0;
  }

  // scale : taille d'un pixel de scène à l'écran ; viewW/viewH : partie visible (pixels de scène).
  const view = { scale: 1, offX: 0, offY: 0, viewW: W, viewH: H, camX: 0, camY: 0 };
  let lastCamX = NaN;
  let lastCamY = NaN;

  function apply() {
    const s = view.scale;
    el.style.transform = `translate3d(${view.offX - view.camX * s}px, ${view.offY - view.camY * s}px, 0) scale(${s})`;
    for (const p of parallax) {
      // Décalage par rapport au sol : un calque lointain (f < 1) « recule » moins vite.
      // Profil Léger : les plans lointains (f < 1) suivent le décor (moins de mouvement à dessiner).
      const dx = p.f < 1 && farStill ? 0 : view.camX * (1 - p.f);
      if (dx !== p.last) {
        p.el.style.transform = `translate3d(${dx}px, 0, 0)`;
        p.last = dx;
      }
    }
  }

  // Zoom supplémentaire (aparté) : multiplie l'échelle, sans relire la taille de la page.
  let extra = 1;
  let vw = 0;
  let vh = 0;
  let baseScale = 1;
  function scaleTo() {
    const s = baseScale * extra;
    view.scale = s;
    view.viewW = vw / s;
    view.viewH = vh / s;
    view.offX = view.viewW > W ? (vw - W * s) / 2 : 0;
    view.offY = 0;
    lastCamX = NaN;
    apply();
  }
  function setZoom(k) {
    if (k === extra) return;
    extra = k;
    scaleTo();
  }

  const refH = place.viewHeight ?? H;
  function layout(zoom) {
    vw = container.clientWidth;
    vh = container.clientHeight;
    baseScale = (vh / refH) * zoom;
    scaleTo();
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

  return { el, layers, view, layout, setZoom, setCamera, clientToStage, stageToClient, applyOpacity, setLayerOpacity, parallaxOffset };
}
