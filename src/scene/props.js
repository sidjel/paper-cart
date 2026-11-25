// Objets du décor que le personnage peut contourner (chariot, présentoir…).
// Chacun est une illustration entière, posée au sol à sa position dans le monde (at),
// avec son point d'ancrage dans l'image (anchor) et son point de référence de profondeur (depthRef).

import { scaleAt, worldToStageX, worldToStageY } from './projection.js';
import { propLevels } from './depth.js';

export function createProps(place, images, parent, proj) {
  const defs = place.props ?? [];
  const levels = propLevels(defs.map((d) => d.depthRef));
  const used = new Set();
  return defs.map((def, i) => {
    const img = images.get(def.image);
    // Une même image peut servir pour plusieurs objets : les suivants en reçoivent une copie.
    const el = used.has(def.image) ? new Image() : img.el;
    if (el !== img.el) el.src = img.url;
    used.add(def.image);
    el.className = 'prop';
    el.width = img.w;
    el.height = img.h;
    el.alt = '';
    el.draggable = false;
    el.dataset.prop = def.id;
    const sx = worldToStageX(proj, def.at[0]) - def.anchor[0];
    const sy = worldToStageY(proj, def.at[1]) - def.anchor[1];
    // perspectiveScale : suit exactement la même loi de perspective (scaleAt) que le héros.
    // scale : échelle fixe facultative autour du point d'ancrage.
    const s = def.perspectiveScale
      ? def.perspectiveScale * scaleAt(proj, def.at[1])
      : (def.scale ?? 0);
    if (s) el.style.transformOrigin = `${def.anchor[0]}px ${def.anchor[1]}px`;
    el.style.transform = `translate(${sx}px, ${sy}px)${s ? ` scale(${s.toFixed(4)})` : ''}`;
    el.style.zIndex = levels[i];
    if (def.fadeZ) el.style.opacity = '0';
    parent.appendChild(el);
    return {
      id: def.id,
      el,
      depthRef: def.depthRef,
      left: sx,
      width: img.w,
      fadeZ: def.fadeZ ?? null,
      maxOpacity: def.maxOpacity ?? 1,
      lastOpacity: def.fadeZ ? 0 : 1,
    };
  });
}
