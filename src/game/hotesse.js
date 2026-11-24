// L'hôtesse d'accueil (A8), branchée sur le jeu : la règle est dans core/hotesse.js, les répliques dans
// data/characters/hotesse.json, son image unique construite avec le lieu (scene/placeView.js).
// Ici : suivre le héros du regard (miroir CSS, jamais de création d'élément), détecter la portée ou le
// double toucher, et fournir la position de sa tête pour placer sa bulle.

import hotesseFile from '../data/characters/hotesse.json';
import { consumeChariotToken, createHotesse, exchangeRollForToken, hotesseAction, hotesseFacing, talkToHotesse } from '../core/hotesse.js';

const HEAD = 176; // haut de la tête au-dessus de la base du comptoir (px de l'image 200×190)

export function createHotesseWiring() {
  const state = createHotesse();
  let def = null;
  let el = null;
  let size = [0, 0];
  let facing = 1;
  let shownFacing = 0;
  const head = { x: 0, y: 0 };

  return {
    attach(place, view) {
      def = place.hotesse ?? null;
      el = view.hotesse?.el ?? null;
      size = view.hotesse?.size ?? [0, 0];
      facing = 1;
      shownFacing = 0;
      if (def) {
        head.x = def.at[0];
        head.y = def.at[1] - HEAD * def.scale;
      }
    },
    render(walkerX) {
      if (!def || !el) return;
      facing = hotesseFacing(def, walkerX, facing);
      if (facing === shownFacing) return;
      shownFacing = facing;
      const [ax, ay] = def.anchor;
      el.style.transform = `translate3d(${def.at[0] - ax}px, ${def.at[1] - ay}px, 0) scale(${facing * def.scale}, ${def.scale})`;
    },
    action: (walker, gear) => (def ? hotesseAction(def, walker, gear) : ''),
    interact: (gear) => (def ? talkToHotesse(state, hotesseFile, gear) : null),
    exchangeForToken: (gear) => exchangeRollForToken(gear),
    consumeToken: (gear) => consumeChariotToken(state, gear),
    point: () => (def ? { x: def.talkX, z: def.talkZ } : null),
    head: () => head,
    // Double toucher sur l'hôtesse (coordonnées de la scène).
    hit(sx, sy, margin) {
      if (!def) return false;
      const hw = (size[0] * def.scale) / 2;
      const h = size[1] * def.scale;
      return sx >= def.at[0] - hw - margin && sx <= def.at[0] + hw + margin && sy >= def.at[1] - h - margin && sy <= def.at[1] + margin;
    },
    info: () => (def ? { x: def.at[0], y: def.at[1], facing, sloganIndex: state.sloganIndex, exchanged: state.exchanged } : null),
  };
}
