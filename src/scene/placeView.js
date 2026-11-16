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
import { propLevels } from './depth.js';
import { createPoses } from './poses.js';

export function createPlaceView(container, place, images, common, here, proj, config, getValue) {
  const stage = createStage(container, place, images, getValue);
  const acteurs = stage.layers.acteurs;
  const props = createProps(place, images, acteurs, proj);
  stage.el.classList.toggle('props-layered', config.display.propLayers);
  stage.el.classList.toggle('still', config.display.reduceMotion); // pluie figée
  stage.el.classList.toggle('no-rain', !config.display.hallRain); // pluie éteinte (réglages)
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
  const depthRefs = props.map((p) => p.depthRef);
  if (guard) {
    depthRefs.push(g.post[1]);
    const levels = propLevels(depthRefs);
    props.forEach((p, i) => (p.el.style.zIndex = levels[i]));
    guard.box.style.zIndex = levels[levels.length - 1];
  }
  if (place.rain) {
    addRain(stage.layers[place.rain.layer], place.rain);
    if (place.rain.mat) addMatSheen(stage.layers[place.rain.mat.layer], place.rain.mat.points);
  }
  const debugMask = createDebugMask(stage.el, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  return {
    stage,
    props,
    depthRefs, // profondeurs de référence (objets du décor, et l'agent s'il y en a un)
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

// Pluie (calque du dehors, découpée par le mur vitré) : deux voiles de gouttes qui glissent en biais,
// un voile de ruissellement plus lent, des ronds dans les flaques. Animations CSS, transform et opacité
// seulement ; figées avec « réduire les animations ». rain : { rect: [x, y, w, h], ripples: [[x, y]…] }.
function addRain(layer, { rect: [x, y, w, h], ripples = [] }) {
  const box = document.createElement('div');
  box.className = 'rain';
  box.style.transform = `translate(${x}px, ${y}px)`;
  box.style.width = `${w}px`;
  box.style.height = `${h}px`;
  for (const k of ['far', 'near', 'streams']) {
    const sheet = document.createElement('div');
    sheet.className = `rain-sheet rain-${k}`;
    box.appendChild(sheet);
  }
  ripples.forEach(([rx, ry], i) => {
    const r = document.createElement('span');
    r.className = 'rain-ripple';
    r.style.left = `${rx - x}px`;
    r.style.top = `${ry - y}px`;
    r.style.animationDelay = `${-((i * 0.618) % 1) * 1.6}s`; // décalés, sans hasard
    box.appendChild(r);
  });
  layer.appendChild(box);
}

// Reflet mouillé qui glisse lentement sur le tapis d'entrée. Le tapis est un parallélogramme (bords haut
// et bas horizontaux) : une boîte penchée (skewX) qui coupe ce qui dépasse.
function addMatSheen(layer, [tl, tr, , bl]) {
  const h = bl[1] - tl[1];
  const box = document.createElement('div');
  box.className = 'mat-sheen';
  box.style.width = `${tr[0] - tl[0]}px`;
  box.style.height = `${h}px`;
  const angle = (Math.atan((bl[0] - tl[0]) / h) * 180) / Math.PI;
  box.style.transform = `translate(${tl[0]}px, ${tl[1]}px) skewX(${-angle}deg)`;
  const band = document.createElement('span');
  box.appendChild(band);
  layer.appendChild(box);
}
