// La vue d'un lieu : tout ce qui est construit pour l'afficher (scène et calques, objets du décor,
// produits et effets du scan, ondes du haut-parleur, masque de debug), et de quoi le défaire en partant.
// Le héros, sa poussière et le repère au sol n'en font pas partie : ils passent d'un lieu à l'autre
// (ils sont « montés » sur le calque des acteurs du lieu affiché).
//
// images : images du lieu ; common : images communes (produits) ; here : état du lieu (core/world.js).

import { createStage } from './stage.js';
import { createProps } from './props.js';
import { createProducts } from './products.js';
import { createSpeakerWaves } from './speakers.js';
import { createDebugMask } from './debugMask.js';

export function createPlaceView(container, place, images, common, here, proj, config, getValue) {
  const stage = createStage(container, place, images, getValue);
  const acteurs = stage.layers.acteurs;
  const props = createProps(place, images, acteurs, proj);
  stage.el.classList.toggle('props-layered', config.display.propLayers);
  stage.el.classList.toggle('still', config.display.reduceMotion); // pluie figée
  const speakerWaves = createSpeakerWaves(acteurs);
  const products = createProducts(here.products, common, stage.layers.produits ?? acteurs, acteurs, config.scan, config.display, {
    parent: acteurs,
    levelOf: (id) => props.find((p) => p.id === id).el.style.zIndex,
  });
  const g = place.guard;
  const guard = g ? { idle: guardImage(images.get(g.image), g.anchor, acteurs), stop: guardImage(images.get(g.stopImage), g.anchor, acteurs) } : null;
  if (guard) guard.stop.hidden = true;
  if (place.rain) addRain(stage.layers.fond, place.rain.rect);
  const debugMask = createDebugMask(stage.el, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  return {
    stage,
    props,
    depthRefs: props.map((p) => p.depthRef),
    speakerWaves,
    products,
    debugMask,
    guard, // images de l'agent de sécurité, au repos et geste d'arrêt (game/guard.js les place), ou null
    // En partant : tout ce qui a été construit pour ce lieu quitte la page.
    // Les images perdent aussi leur source : sinon le navigateur garde chaque <img> inscrite pour suivre la
    // taille de l'écran, et avec elle tout l'ancien lieu (mesuré : +58 éléments par changement de lieu).
    destroy() {
      for (const img of stage.el.querySelectorAll('img')) img.removeAttribute('src');
      stage.el.remove();
    },
  };
}

// L'agent de sécurité (A6) : une image (par pose) posée sur le calque des acteurs, placée à chaque image.
function guardImage(img, anchor, parent) {
  const el = img.el;
  el.className = 'guard';
  el.width = img.w;
  el.height = img.h;
  el.alt = '';
  el.draggable = false;
  el.style.transformOrigin = `${anchor[0]}px ${anchor[1]}px`;
  parent.appendChild(el);
  return el;
}

// Pluie derrière les portes vitrées : deux voiles de traits qui glissent vers le bas (animation CSS,
// transform seulement), découpés au rectangle des vitres. Figée avec « réduire les animations ».
function addRain(layer, [x, y, w, h]) {
  const box = document.createElement('div');
  box.className = 'rain';
  box.style.transform = `translate(${x}px, ${y}px)`;
  box.style.width = `${w}px`;
  box.style.height = `${h}px`;
  for (const k of ['near', 'far']) {
    const sheet = document.createElement('div');
    sheet.className = `rain-sheet rain-${k}`;
    box.appendChild(sheet);
  }
  layer.appendChild(box);
}
