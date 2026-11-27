// La vue PixiJS d'un lieu : tout ce qui est construit pour l'afficher (scène et calques, objets du décor,
// produits et effets du scan, ondes du haut-parleur, agent, hôtesse, nuages, oiseaux, debug F4/F6),
// et de quoi le défaire proprement en partant.
// Le héros, sa poussière, le chariot et le repère au sol passent d'un lieu à l'autre (montés sur acteurs).

import { Sprite } from 'pixi.js';
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

export function createPlaceView(renderer, place, images, common, here, proj, config, getValue) {
  const stage = createStage(renderer, place, images, getValue);
  const acteurs = stage.layers.acteurs;
  const props = createProps(place, images, acteurs, proj);
  const speakerWaves = createSpeakerWaves(acteurs);
  const products = createProducts(here.products, common, stage.layers.produits ?? acteurs, acteurs, config.scan, config.display, {
    parent: acteurs,
    levelOf: (id) => props.find((p) => p.id === id).level(),
  });

  const g = place.guard;
  const guard = g ? createGuardView(images, g, acteurs) : null;
  const h = place.hotesse;
  const hotesse = h ? createHotesseView(images, h, acteurs) : null;

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
    props.forEach((p, i) => p.setLevel(levels[i]));
    if (guard) guard.sprite.zIndex = levels[guardIdx];
    if (hotesse) hotesse.sprite.zIndex = levels[hotesseIdx];
  }

  const clouds = place.clouds ? createClouds(stage.layers[place.clouds.layer], place.clouds, images, config.display.reduceMotion) : null;
  const birds = place.birds ? createBirds(stage.layers[place.birds.layer], place.birds, images, config.display.reduceMotion) : null;
  const debugMask = createDebugMask(stage.root, place, proj, props);
  debugMask.setVisible(config.debug.showWalkMask);
  const debugPerspective = createDebugPerspective(stage.root, place, proj);
  debugPerspective.setVisible(config.debug.showPerspective);

  return {
    stage,
    props,
    depthRefs,
    speakerWaves,
    products,
    clouds,
    birds,
    debugMask,
    debugPerspective,
    guard,
    hotesse,
    destroy() {
      products.destroy();
      debugPerspective.destroy();
      stage.destroy();
    },
  };
}

// L'agent de sécurité (A6) : un Sprite unique sur le calque acteurs, ses deux poses gérées par poses.js.
function createGuardView(images, g, parent) {
  const rec = images.get(g.image);
  const size = [rec.w, rec.h];
  const sprite = new Sprite(rec.texture);
  sprite.label = 'actor:guard';
  sprite.anchor.set(g.anchor[0] / size[0], g.anchor[1] / size[1]);
  const poses = createPoses(images, sprite);
  const idle = poses.texture(g.image);
  const stop = poses.texture(g.stopImage);
  poses.show(idle);
  parent.addChild(sprite);
  return { sprite, idle, stop, poses, size };
}

// L'hôtesse d'accueil (A8) : un Sprite unique sur le calque acteurs (derrière le héros via depthRef).
function createHotesseView(images, h, parent) {
  const rec = images.get(h.image);
  const sprite = new Sprite(rec.texture);
  sprite.label = 'actor:hotesse';
  sprite.anchor.set(h.anchor[0] / rec.w, h.anchor[1] / rec.h);
  sprite.x = h.at[0];
  sprite.y = h.at[1];
  parent.addChild(sprite);
  return { sprite, size: [rec.w, rec.h] };
}
