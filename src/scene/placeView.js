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
  const speakerWaves = createSpeakerWaves(acteurs);
  const products = createProducts(here.products, common, stage.layers.produits ?? acteurs, acteurs, config.scan, config.display, {
    parent: acteurs,
    levelOf: (id) => props.find((p) => p.id === id).el.style.zIndex,
  });
  const debugMask = createDebugMask(stage.el, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  return {
    stage,
    props,
    depthRefs: props.map((p) => p.depthRef),
    speakerWaves,
    products,
    debugMask,
    // En partant : tout ce qui a été construit pour ce lieu quitte la page.
    // Les images perdent aussi leur source : sinon le navigateur garde chaque <img> inscrite pour suivre la
    // taille de l'écran, et avec elle tout l'ancien lieu (mesuré : +58 éléments par changement de lieu).
    destroy() {
      for (const img of stage.el.querySelectorAll('img')) img.removeAttribute('src');
      stage.el.remove();
    },
  };
}
