// La scène : le lieu entier (par exemple 3600×1080), vu à travers la caméra.
// - toute la hauteur du décor est visible (zoom 1) quelle que soit la forme de l'écran ;
//   un écran plus allongé (20:9) montre simplement plus de largeur, sans rien couper ;
// - la caméra fait glisser la scène ; les calques avec une parallaxe (rayons lointains,
//   premier plan) glissent moins vite ou plus vite, ce qui donne la profondeur ;
// - les calques sont créés d'après la pile déclarée dans les données du lieu ;
// - DIAGNOSTIC SEULEMENT : un calque peut déclarer des « fenêtres de diagnostic » (zones où on le voit,
//   par exemple les ouvertures de l'étagère). Elles servent à comparer d'autres façons de dessiner
//   ce calque pendant les tests de fluidité (setFarMode). En jeu normal, rien ne change (mode « band »).

// getValue(clé) : lit un réglage (pour les calques dont l'opacité est réglable).
export function createStage(container, place, images, getValue) {
  const [W, H] = place.size;
  const el = document.createElement('div');
  el.className = 'stage';
  el.style.width = `${W}px`;
  el.style.height = `${H}px`;

  const layers = {};
  const parallax = []; // [élément, facteur, x, y] des calques qui ne glissent pas à la vitesse du sol
  const windowImgs = []; // diagnostic : images dans les fenêtres { el, f, ox, oy, last }
  const far = { band: null, box: null, mode: 'band', painted: false };
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
    if (def.diagnosticWindows && def.image) {
      // Diagnostic : même image, découpée par des fenêtres fixes posées sur les ouvertures.
      const src = images.get(def.image);
      const box = document.createElement('div');
      box.className = `far-box layer-${def.id}-fenetres`; // pas un calque de la pile : un outil de diagnostic
      box.style.display = 'none';
      for (const [x, y, w, h] of def.diagnosticWindows) {
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
      far.band = layer;
      far.box = box;
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
    if (far.mode === 'band' || far.mode === 'none') return; // fenêtres de diagnostic masquées : rien à faire
    for (const w of windowImgs) {
      const dx = view.camX * (1 - w.f);
      if (dx === w.last) continue;
      // Calque à part : translate3d. Dessinées dans le décor : translate (2D), pour ne pas créer de calque.
      w.el.style.transform = far.painted ? `translate(${w.ox + dx}px, ${w.oy}px)` : `translate3d(${w.ox + dx}px, ${w.oy}px, 0)`;
      w.last = dx;
    }
  }

  // DIAGNOSTIC : façon de dessiner le calque lointain pendant les tests de fluidité.
  // 'band' : bande entière (rendu du jeu) ; 'none' : aucun ; 'windows-layers' : fenêtres en calques à part ;
  // 'band+windows' : bande entière + fenêtres en calques à part ; 'windows-painted' : fenêtres dessinées dans le décor.
  function setFarMode(mode) {
    if (!far.band) return;
    far.mode = mode;
    far.painted = mode === 'windows-painted';
    far.band.style.display = mode === 'band' || mode === 'band+windows' ? '' : 'none';
    far.box.style.display = mode === 'windows-layers' || mode === 'band+windows' || mode === 'windows-painted' ? '' : 'none';
    far.box.classList.toggle('far-painted', far.painted);
    for (const w of windowImgs) w.last = NaN;
    apply();
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

  return { el, layers, view, layout, setCamera, clientToStage, stageToClient, applyOpacity, setFarMode };
}
