// L'hôtesse d'accueil (A8), branchée sur le jeu : la règle est dans core/hotesse.js, les répliques dans
// data/characters/hotesse.json, son Sprite unique construit avec le lieu (scene/placeView.js).

import hotesseFile from '../data/characters/hotesse.json';
import { consumeChariotToken, createHotesse, exchangeRollForToken, hotesseAction, hotesseFacing, talkToHotesse } from '../core/hotesse.js';

const HEAD = 176; // haut de la tête au-dessus de la base du comptoir (px de l'image 200×190)

export function createHotesseWiring() {
  const state = createHotesse();
  let def = null;
  let sprite = null;
  let size = [0, 0];
  let facing = 1;
  let shownFacing = 0;
  const head = { x: 0, y: 0 };

  return {
    attach(place, view) {
      def = place.hotesse ?? null;
      sprite = view.hotesse?.sprite ?? null;
      size = view.hotesse?.size ?? [0, 0];
      facing = 1;
      shownFacing = 0;
      if (def) {
        head.x = def.at[0];
        head.y = def.at[1] - HEAD * def.scale;
      }
    },
    render(walkerX) {
      if (!def || !sprite) return;
      facing = hotesseFacing(def, walkerX, facing);
      if (facing === shownFacing) return;
      shownFacing = facing;
      const tex = sprite.texture;
      sprite.x = def.at[0];
      sprite.y = def.at[1];
      sprite.scale.set((facing * size[0] * def.scale) / Math.max(1, tex.width), (size[1] * def.scale) / Math.max(1, tex.height));
    },
    action: (walker, gear) => (def ? hotesseAction(def, walker, gear) : ''),
    interact: (gear) => (def ? talkToHotesse(state, hotesseFile, gear) : null),
    exchangeForToken: (gear) => exchangeRollForToken(gear),
    consumeToken: (gear) => consumeChariotToken(state, gear),
    point: () => (def ? { x: def.talkX, z: def.talkZ } : null),
    head: () => head,
    hit(sx, sy, margin) {
      if (!def) return false;
      const hw = (size[0] * def.scale) / 2;
      const h = size[1] * def.scale;
      return sx >= def.at[0] - hw - margin && sx <= def.at[0] + hw + margin && sy >= def.at[1] - h - margin && sy <= def.at[1] + margin;
    },
    info: () => (def ? { x: def.at[0], y: def.at[1], facing, sloganIndex: state.sloganIndex, exchanged: state.exchanged } : null),
  };
}
