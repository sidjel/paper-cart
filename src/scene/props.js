// Objets du décor que le personnage peut contourner (chariot, présentoir, portiques, cartons…).
// Chacun est un Sprite PixiJS posé au sol à sa position dans le monde (at),
// avec son point d'ancrage dans l'image (anchor) et son point de référence de profondeur (depthRef).

import { Sprite } from 'pixi.js';
import { scaleAt, worldToStageX, worldToStageY } from './projection.js';
import { propLevels } from './depth.js';

export function createProps(place, images, parent, proj) {
  const defs = place.props ?? [];
  const levels = propLevels(defs.map((d) => d.depthRef));
  return defs.map((def, i) => {
    const img = images.get(def.image);
    const sprite = new Sprite(img.texture);
    sprite.label = `prop:${def.id}`;
    sprite.anchor.set(def.anchor[0] / img.w, def.anchor[1] / img.h);
    // perspectiveScale : suit exactement la même loi de perspective (scaleAt) que le héros.
    // scale : échelle fixe facultative autour du point d'ancrage (1 sinon).
    const sc = def.perspectiveScale
      ? def.perspectiveScale * scaleAt(proj, def.at[1])
      : (def.scale ?? 1);
    sprite.width = img.w * sc;
    sprite.height = img.h * sc;
    const x = worldToStageX(proj, def.at[0]);
    const y = worldToStageY(proj, def.at[1]);
    sprite.x = x;
    sprite.y = y;
    sprite.zIndex = levels[i];
    if (def.fadeZ) sprite.alpha = 0;
    parent.addChild(sprite);
    const prop = {
      id: def.id,
      sprite,
      depthRef: def.depthRef,
      left: x - def.anchor[0],
      width: img.w,
      fadeZ: def.fadeZ ?? null,
      maxOpacity: def.maxOpacity ?? 1,
      lastOpacity: def.fadeZ ? 0 : 1,
      setOpacity(op) {
        if (op === prop.lastOpacity) return;
        prop.lastOpacity = op;
        sprite.alpha = op;
      },
      setRotation(deg) {
        sprite.rotation = (deg * Math.PI) / 180;
      },
      setVisible(v) {
        sprite.visible = Boolean(v);
      },
      setLevel(lv) {
        sprite.zIndex = lv;
      },
      level() {
        return sprite.zIndex;
      },
    };
    return prop;
  });
}
