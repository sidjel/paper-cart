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
import { createDebugPerspective } from './debugPerspective.js';
import { propLevels } from './depth.js';
import { createPoses } from './poses.js';
import { createBirds } from './birds.js';
import { createClouds } from './clouds.js';

export function createPlaceView(container, place, images, common, here, proj, config, getValue) {
  const stage = createStage(container, place, images, getValue);
  const acteurs = stage.layers.acteurs;
  const props = createProps(place, images, acteurs, proj);
  stage.el.classList.add('props-layered');
  stage.el.classList.toggle('still', config.display.reduceMotion);
  const speakerWaves = createSpeakerWaves(acteurs);
  const products = createProducts(here.products, common, stage.layers.produits ?? acteurs, acteurs, config.scan, config.display, {
    parent: acteurs,
    levelOf: (id) => props.find((p) => p.id === id).el.style.zIndex,
  });
  // L'agent de sécurité : un seul calque (sa boîte), ses deux poses (repos, geste d'arrêt) à l'intérieur,
  // une seule visible, comme le héros (scene/poses.js ; règle : docs/ARCHITECTURE.md §4). Il ne change pas de profondeur : il est rangé avec les objets du décor (pas d'égalité
  // de niveau avec un portique).
  const g = place.guard;
  const guard = g ? createGuardBox(images, g, acteurs) : null;
  const h = place.hotesse;
  const hotesse = h ? createHotesseEl(images, h, acteurs) : null;
  const depthRefs = props.map((p) => p.depthRef);
  let guardIdx = -1;
  let hotesseIdx = -1;
  if (guard) {
    guardIdx = depthRefs.length;
    depthRefs.push(g.post[1]);
  }
  if (hotesse) {
    hotesseIdx = depthRefs.length;
    depthRefs.push(h.depthRef);
  }
  if (guard || hotesse) {
    const levels = propLevels(depthRefs);
    props.forEach((p, i) => (p.el.style.zIndex = levels[i]));
    if (guard) guard.box.style.zIndex = levels[guardIdx];
    if (hotesse) hotesse.el.style.zIndex = levels[hotesseIdx];
  }
  const clouds = place.clouds ? createClouds(stage.layers[place.clouds.layer], place.clouds, images, config.display.reduceMotion) : null;
  const birds = place.birds ? createBirds(stage.layers[place.birds.layer], place.birds, images, config.display.reduceMotion) : null;
  const debugMask = createDebugMask(stage.el, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  const debugPerspective = createDebugPerspective(stage.el, place, proj);
  debugPerspective.setVisible(config.debug.showPerspective);
  return {
    stage,
    props,
    depthRefs, // profondeurs de référence (objets du décor, et l'agent s'il y en a un)
    speakerWaves,
    products,
    clouds,
    birds,
    debugMask,
    debugPerspective,
    guard, // images de l'agent de sécurité, au repos et geste d'arrêt (game/guard.js les place), ou null
    hotesse, // image unique de l'hôtesse derrière le comptoir (game/hotesse.js l'oriente), ou null
    // En partant : tout ce qui a été construit pour ce lieu quitte la page.
    // Les images perdent aussi leur source : sinon le navigateur garde chaque <img> inscrite pour suivre la
    // taille de l'écran, et avec elle tout l'ancien lieu (mesuré : +58 éléments par changement de lieu).
    destroy() {
      for (const img of stage.el.querySelectorAll('img')) img.removeAttribute('src');
      stage.el.remove();
    },
  };
}

// L'agent de sécurité (A6) : une boîte posée sur le calque des acteurs (placée à chaque image par
// game/guard.js) ; ses poses à l'intérieur, comme celles du héros (scene/poses.js).
function createGuardBox(images, g, parent) {
  const box = document.createElement('div');
  box.className = 'guard';
  box.style.transformOrigin = `${g.anchor[0]}px ${g.anchor[1]}px`;
  const size = [images.get(g.image).w, images.get(g.image).h];
  box.style.width = `${size[0]}px`; // comme le héros : la boîte a la taille du dessin (sans taille, le
  box.style.height = `${size[1]}px`; // navigateur donnait un calque à chaque pose : mesuré séance 61)
  const poses = createPoses(images, box, size, 'guard-pose');
  const idle = poses.el(g.image);
  const stop = poses.el(g.stopImage);
  poses.show(idle);
  parent.appendChild(box);
  return { box, idle, stop, poses };
}

// L'hôtesse d'accueil (A8) : un seul élément image posé sur le calque des acteurs (derrière le héros
// grâce à depthRef). Son orientation (miroir CSS) est mise à jour par game/hotesse.js.
function createHotesseEl(images, h, parent) {
  const rec = images.get(h.image);
  const el = rec.el;
  el.className = 'hotesse';
  el.width = rec.w;
  el.height = rec.h;
  el.alt = '';
  el.draggable = false;
  el.style.transformOrigin = `${h.anchor[0]}px ${h.anchor[1]}px`;
  parent.appendChild(el);
  return { el, size: [rec.w, rec.h] };
}
