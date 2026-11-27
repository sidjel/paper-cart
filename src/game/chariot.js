// Le chariot (A8), branché sur le jeu sous PixiJS v8 : la règle est dans core/chariot.js.
// Un seul Sprite créé au chargement ; passe sur le calque acteurs du lieu affiché via mount().

import { Sprite } from 'pixi.js';
import { config } from '../config.js';
import { chariotInReach, createChariot, pushChariot, releaseChariot, nearChariot, arriveChariot, pushWalk, bump, stepChariot, noteBump, wheelDrift } from '../core/chariot.js';
import { worldToStageX, worldToStageY, scaleAt } from '../scene/projection.js';
import { actorLevel } from '../scene/depth.js';

export const CHARIOT_IMAGE = 'art/placeholder/chariot-vide.svg';
export const CHARIOT_SIZE = [335, 250];
const ANCHOR = [167, 230]; // milieu du chariot, au sol (dans l'image) : la feuille pivote sur ce point

// image : { texture, w, h } (images communes, préparées au chargement).
export function createChariotWiring(game, image, parent) {
  let state = null;
  const sprite = new Sprite(image.texture);
  sprite.label = 'actor:chariot';
  sprite.anchor.set(ANCHOR[0] / image.w, ANCHOR[1] / image.h);
  sprite.visible = false;
  parent.addChild(sprite);

  const tw = Math.max(1, image.texture?.width ?? image.w);
  const th = Math.max(1, image.texture?.height ?? image.h);
  const baseSx = image.w / tw;
  const baseSy = image.h / th;

  let proj = null;
  let shownHere = false;
  let lastPlace = null;
  let lastLevel = -1;
  const box = { x: 0, y: 0, s: 1 };
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0, y: 0 };

  const show = () => {
    shownHere = state !== null && state.place === game.place();
    sprite.visible = shownHere;
  };

  return {
    mount(to) {
      to.addChild(sprite);
    },
    get pushing() {
      return state !== null && state.pushed && shownHere;
    },
    give() {
      const w = game.walker();
      state = createChariot(game.place(), w.x + config.chariot.offset, w.z);
      pushChariot(state, w);
      lastPlace = game.place();
      show();
    },
    attach(pr) {
      proj = pr;
      show();
    },
    arrived() {
      if (state) arriveChariot(state, game.place(), game.walker(), config.chariot);
      if (state && !state.pushed && state.place === lastPlace && lastPlace !== game.place()) game.onForgot();
      lastPlace = game.place();
      show();
    },
    action() {
      if (!state || !nearChariot(state, game.walker(), game.place(), config.chariot.range)) return '';
      return state.pushed ? 'lacher' : 'pousser';
    },
    toggle() {
      const a = this.action();
      if (a === 'lacher') releaseChariot(state);
      else if (a === 'pousser') {
        pushChariot(state, game.walker());
        game.onTurn();
      }
      return a;
    },
    walk: (walk) => (state?.pushed && shownHere ? pushWalk(walk, config.chariot) : walk),
    step(mask, dt) {
      if (!state || !shownHere) return;
      const w = game.walker();
      wheelDrift(state, w, mask, config.chariot, config.walk.maxSpeed * config.chariot.speed, dt);
      if (noteBump(state, bump(state, w, mask, config.chariot), config.chariot, dt) === 'cogne') game.onBumps();
      if (stepChariot(state, game.walker(), config.chariot, dt) === 'tourne') game.onTurn();
    },
    heroNearer(z) {
      return shownHere && z <= state.z + 1;
    },
    render(alpha, refs) {
      if (!shownHere) return;
      const x = state.prevX + (state.x - state.prevX) * alpha;
      const z = state.prevZ + (state.z - state.prevZ) * alpha;
      const side = state.prevSide + (state.side - state.prevSide) * alpha;
      const s = scaleAt(proj, z) * config.chariot.size;
      const fx = worldToStageX(proj, x);
      const fy = worldToStageY(proj, z);
      box.x = fx;
      box.y = fy;
      box.s = s;
      const sx = Math.sign(side || 1) * Math.max(Math.abs(side), config.character.edgeThickness);
      sprite.x = fx;
      sprite.y = fy;
      sprite.scale.set(baseSx * s * sx, baseSy * s);
      const level = actorLevel(refs, z, z < game.walker().z - 1);
      if (level !== lastLevel) {
        sprite.zIndex = level;
        lastLevel = level;
      }
    },
    hit(sx, sy, margin) {
      if (!shownHere) return false;
      const w = image.w * box.s;
      return sx >= box.x - w / 2 - margin && sx <= box.x + w / 2 + margin && sy >= box.y - image.h * box.s - margin && sy <= box.y + margin;
    },
    visible: () => shownHere,
    boundsClient(stage) {
      if (!shownHere || !stage) return null;
      const left = box.x - ANCHOR[0] * box.s;
      const top = box.y - ANCHOR[1] * box.s;
      stage.stageToClient(left, top, p0);
      stage.stageToClient(left + image.w * box.s, top + image.h * box.s, p1);
      return { x: p0.x, y: p0.y, width: p1.x - p0.x, height: p1.y - p0.y };
    },
    inReach: (exits) => chariotInReach(state, game.place(), exits),
    core: () => (state && shownHere ? state : null),
    info: () => (state ? { place: state.place, x: state.x, z: state.z, pushed: state.pushed, side: state.side } : null),
  };
}
