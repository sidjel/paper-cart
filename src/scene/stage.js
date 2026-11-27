// La scène PixiJS d'un lieu (par exemple 3600×1080), vue à travers la caméra :
// - toute la hauteur du décor est visible (zoom 1) quelle que soit la forme de l'écran ;
// - la caméra fait glisser stage.root ; les calques avec parallaxe glissent de dx = camX * (1 - f) ;
// - les calques sont créés dans l'ordre déclaré par les données du lieu (acteurs.sortableChildren = true).

import { Container, Sprite } from 'pixi.js';
import { quality } from './quality.js';

// getValue(clé) : lit un réglage (pour les calques dont l'opacité est réglable).
export function createStage(renderer, place, images, getValue) {
  const [W, H] = place.size;
  const root = new Container();
  root.label = `stage:${place.id}`;

  const layers = {};
  const parallax = []; // { layer, f, id, last } des plans qui ne glissent pas à la vitesse du sol
  const farStill = !quality().farParallax; // lu une fois : le profil s'applique au chargement
  for (const def of place.layers) {
    const layer = new Container();
    layer.label = `layer:${def.id}`;
    if (def.id === 'acteurs') layer.sortableChildren = true;
    const pos = def.position ?? [0, 0];
    if (def.image) {
      const img = images.get(def.image);
      const sprite = new Sprite(img.texture);
      sprite.x = pos[0];
      sprite.y = pos[1];
      sprite.width = img.w;
      sprite.height = img.h;
      layer.addChild(sprite);
    }
    const f = def.parallax ?? 1;
    if (f !== 1) parallax.push({ layer, f, id: def.id, last: NaN });
    root.addChild(layer);
    layers[def.id] = layer;
  }
  renderer.worldRoot.addChild(root);

  // Opacité des calques qui la déclarent (par exemple le premier plan en transparence).
  const opacities = {};
  function setLayerOpacity(id, value) {
    const layer = layers[id];
    if (!layer) return;
    const v = Math.round(value * 1000) / 1000;
    if (opacities[id] === v) return;
    opacities[id] = v;
    layer.alpha = v;
  }
  function layerOpacity(id) {
    if (id in opacities) return opacities[id];
    return layers[id]?.alpha ?? 1;
  }
  function setLayerVisible(id, v) {
    const layer = layers[id];
    if (layer) layer.visible = Boolean(v);
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
    root.x = view.offX - view.camX * s;
    root.y = view.offY - view.camY * s;
    root.scale.set(s);
    for (const p of parallax) {
      // Décalage par rapport au sol : un calque lointain (f < 1) « recule » moins vite.
      // Profil Léger : les plans lointains (f < 1) suivent le décor.
      const dx = p.f < 1 && farStill ? 0 : view.camX * (1 - p.f);
      if (dx !== p.last) {
        p.layer.x = dx;
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
  let rectLeft = 0;
  let rectTop = 0;
  function layout(zoom) {
    const el = renderer.container;
    const r = el.getBoundingClientRect();
    rectLeft = r.left;
    rectTop = r.top;
    vw = el.clientWidth;
    vh = el.clientHeight;
    renderer.resize(vw, vh);
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

  // Écran (pixels CSS de la fenêtre) → scène. Utilise la position retenue au layout (zéro relecture DOM en jeu).
  function clientToStage(cx, cy, out) {
    out.x = (cx - rectLeft - view.offX) / view.scale + view.camX;
    out.y = (cy - rectTop - view.offY) / view.scale + view.camY;
    return out;
  }

  function stageToClient(sx, sy, out) {
    out.x = rectLeft + view.offX + (sx - view.camX) * view.scale;
    out.y = rectTop + view.offY + (sy - view.camY) * view.scale;
    return out;
  }

  function destroy() {
    if (root.parent) root.parent.removeChild(root);
    root.destroy({ children: true, texture: false, textureSource: false });
  }

  return {
    root,
    layers,
    view,
    layout,
    setZoom,
    setCamera,
    clientToStage,
    stageToClient,
    applyOpacity,
    setLayerOpacity,
    layerOpacity,
    setLayerVisible,
    parallaxOffset,
    destroy,
  };
}
