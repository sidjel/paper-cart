// Personnage en papier (8 directions origami) sous PixiJS v8 : affichage seulement (la position vient de core/movement.js).
// - 5 vues dessinées (S, SE, E, NE, N) ; les 3 vues gauche (SW, W, NW) en miroir (scale.x) ;
// - retournement de la feuille : MeshPlane 2.5D GPU sous WebGL (sauf profil Léger ou mode 'non'),
//   ou pivot léger scale.x en repli CanvasRenderer / profil Léger ;
// - animations décrites dans les données (voir animation.js) ; illustrations entières ;
// - corps vivant : rebond en marchant, respiration à l'arrêt, petit écrasement en s'arrêtant ;
// - double ombre radiale au sol (ombre douce + ombre de contact réglable en direct), plus petite quand il s'élève ;
// - objets tenus en main (Scanette pendant le scan) devant/derrière selon la vue, suivant le bras image par image.

import { Container, Sprite, Texture } from 'pixi.js';
import { bodyMotion, compileAnimation, flipEffects, flipWidth, frameIndex, frameSrc } from './animation.js';
import { createPoses } from './poses.js';
import { createPaperFlipRenderer, flipProgress, minWidthForAngle, shouldUsePaperFlip25d, turnAngleDeg, turnDirectionSign } from './paperFlip.js';
import { directionToView, needsPaperFlip } from '../core/direction.js';

export function characterImageEntries(data, rasterScale) {
  const entries = [];
  for (const view of Object.values(data.views)) {
    for (const anim of Object.values(view)) {
      for (const frame of anim.frames) {
        const url = frameSrc(frame);
        entries.push({ id: url, url, w: data.size[0], h: data.size[1], scale: rasterScale * data.scale });
      }
    }
  }
  for (const [name, item] of Object.entries(data.held ?? {})) {
    if (name === 'comment') continue;
    for (const [v, def] of Object.entries(item)) {
      if (v === 'hand' || v === 'comment' || v === 'onlyWhenScanning' || !def?.src) continue;
      entries.push({ id: def.src, url: def.src, w: data.size[0], h: data.size[1], scale: rasterScale * data.scale });
    }
  }
  return entries;
}

// Génère une seule fois (au démarrage, hors jeu) une texture radiale douce pour l'ombre au sol.
function createRadialTexture(cw, ch, stops) {
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(1, ch / cw);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, cw / 2);
    for (const [at, col] of stops) g.addColorStop(at, col);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, cw / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return Texture.from(c);
}

// settings : config.character ; display : config.display (réduire les animations, profil) ;
// onFrameEvent(son, effet) : une image d'animation demande un son et/ou un effet (un pas, de la poussière).
export function createCharacterSprite(data, images, parent, settings, display, onFrameEvent, { isWebGL = true } = {}) {
  const [w, h] = data.size;
  const [ax, ay] = data.anchor;
  const shadowW = (data.shadow?.width ?? 120) * data.scale;
  const shadowH = (data.shadow?.height ?? 28) * data.scale;

  // Double ombre radiale au sol (ex. deux dégradés CSS de .shadow) : outer + contact réglable en direct.
  const outerShadowTex = createRadialTexture(256, 128, [
    [0, 'rgba(40, 32, 22, 0.50)'],
    [0.58, 'rgba(40, 32, 22, 0.26)'],
    [1, 'rgba(40, 32, 22, 0)'],
  ]);
  const contactShadowTex = createRadialTexture(128, 64, [
    [0, 'rgba(18, 14, 10, 1)'],
    [1, 'rgba(18, 14, 10, 0)'],
  ]);

  const shadowContainer = new Container();
  shadowContainer.label = 'hero:shadow';
  const outerShadow = new Sprite(outerShadowTex);
  outerShadow.anchor.set(0.5, 0.5);
  outerShadow.width = shadowW;
  outerShadow.height = shadowH;
  const contactShadow = new Sprite(contactShadowTex);
  contactShadow.anchor.set(0.5, 0.5);
  contactShadow.width = shadowW * 0.66;
  contactShadow.height = shadowH * 0.56;
  contactShadow.alpha = settings.contactShadow;
  shadowContainer.addChild(outerShadow, contactShadow);

  // Ombre portée dynamique pendant le retournement 2.5D (visible uniquement en pivot WebGL).
  const liftShadow = new Sprite(outerShadowTex);
  liftShadow.label = 'hero:liftShadow';
  liftShadow.anchor.set(0.5, 0.5);
  liftShadow.width = shadowW;
  liftShadow.height = shadowH;
  liftShadow.visible = false;

  const root = new Container();
  root.label = 'hero:root';
  const flip = new Container(); // reçoit le soulèvement, l'écrasement et le miroir (hors 2.5D)
  flip.label = 'hero:flip';
  const heldBack = new Container();
  heldBack.x = -ax;
  heldBack.y = -ay;
  const bodyLayer = new Container();
  bodyLayer.x = -ax;
  bodyLayer.y = -ay;
  const heldFront = new Container();
  heldFront.x = -ax;
  heldFront.y = -ay;
  flip.addChild(heldBack, bodyLayer, heldFront);
  root.addChild(flip);

  const firstFrameSrc = frameSrc(data.views.S.idle.frames[0]);
  const firstTex = images.get(firstFrameSrc).texture;
  const heroSprite = new Sprite(firstTex);
  heroSprite.label = 'hero:sprite';
  heroSprite.width = w;
  heroSprite.height = h;
  bodyLayer.addChild(heroSprite);

  const poses = createPoses(images, heroSprite, data.size);
  const paperFlip = createPaperFlipRenderer(bodyLayer, data.size, firstTex, { isWebGL, liftShadow });

  parent.addChild(liftShadow, shadowContainer, root);

  // Objets tenus : un Sprite par objet distinct, placé dans heldBack ou heldFront selon view.front.
  const held = [];
  for (const [name, item] of Object.entries(data.held ?? {})) {
    if (name === 'comment') continue;
    const views = {};
    let firstHeldTex = null;
    for (const [v, def] of Object.entries(item)) {
      if (v === 'hand' || v === 'comment' || v === 'onlyWhenScanning' || !def?.src) continue;
      const tex = images.get(def.src).texture;
      if (!firstHeldTex) firstHeldTex = tex;
      views[v] = { ...def, tex };
    }
    if (!firstHeldTex) continue;
    const holder = new Container();
    holder.visible = false;
    const itemSprite = new Sprite(firstHeldTex);
    itemSprite.width = w;
    itemSprite.height = h;
    holder.addChild(itemSprite);
    heldBack.addChild(holder);
    held.push({
      name,
      hand: item.hand,
      onlyWhenScanning: !!item.onlyWhenScanning,
      views,
      holder,
      sprite: itemSprite,
      on: false,
      shown: false,
      front: false,
      src: '',
      viewName: '',
      scanning: false,
    });
  }
  const NO_HANDS = { right: [0, 0, 0], left: [0, 0, 0] };

  function setHeld(name, on) {
    const it = held.find((x) => x.name === name);
    if (it) it.on = on;
  }

  function placeHeld(src, viewName, away, scanning) {
    for (const it of held) {
      const view = it.views[viewName] ?? it.views[away ? 'dos' : 'face'];
      const visible = Boolean(it.on && (!it.onlyWhenScanning || scanning) && view);
      if (visible !== it.shown) {
        it.holder.visible = visible;
        it.shown = visible;
        it.src = '';
      }
      if (!visible || (src === it.src && viewName === it.viewName && scanning === it.scanning)) continue;
      it.src = src;
      it.viewName = viewName;
      it.scanning = scanning;
      if (it.sprite.texture !== view.tex) {
        it.sprite.texture = view.tex;
        it.sprite.scale.set(w / Math.max(1, view.tex.width), h / Math.max(1, view.tex.height));
      }
      const [dx, dy, rot] = (data.hands?.[src] ?? NO_HANDS)[it.hand];
      const [px, py] = view.pivot;
      const [ox, oy] = view.offset;
      const [sox, soy] = scanning && view.scanOffset ? view.scanOffset : [0, 0];
      const srot = scanning && view.scanRot ? view.scanRot : 0;
      it.holder.x = dx + ox + sox + px;
      it.holder.y = dy + oy + soy + py;
      it.holder.rotation = ((rot + srot) * Math.PI) / 180;
      it.sprite.x = -px;
      it.sprite.y = -py;
      const wantFront = Boolean(view.front);
      if (wantFront !== it.front) {
        (wantFront ? heldFront : heldBack).addChild(it.holder);
        it.front = wantFront;
      }
    }
  }

  const anims = {};
  for (const [viewName, view] of Object.entries(data.views)) {
    for (const [animName, def] of Object.entries(view)) {
      anims[`${viewName}.${animName}`] = {
        ...compileAnimation(def),
        texs: def.frames.map((f) => poses.texture(frameSrc(f))),
        srcs: def.frames.map(frameSrc),
        viewName,
        away: viewName === 'dos' || viewName === 'N' || viewName === 'NE',
      };
    }
  }

  const faceIdle = anims['S.idle'];
  const asides = {};
  for (const [key, a] of Object.entries(anims)) if (key.startsWith('S.aparte_')) asides[key.slice(9)] = a;

  let shownFacing = 1;
  let shownDir = 'S';
  let flipStart = -1;
  let flipDur = 0.18;
  let flipFromDir = 'S';
  let flipFromTex = null;
  let flipFromFlip = 1;
  let flipSign = 1;
  let flipAngle = 180;
  let flipP = -1;
  let swapped = false;
  let current = null;
  let animStartTime = 0;
  let animStartDist = 0;
  let shownIndex = -1;
  let lastWalkStep = -1;
  let lastFlip = 1;
  let lastHeldScaleX = 1;
  let lastX = 0;
  let lastY = 0;
  let lastS = data.scale;
  let lastSink = settings.footSink;
  let lastContact = settings.contactShadow;
  let lastLevel = -1;
  let shadowVisible = true;
  const stats = { frameChanges: 0, flipping: false };
  let wasMoving = false;
  let stopTime = -1;
  let idleStart = 0;
  const motion = { lift: 0, sx: 1, sy: 1 };
  const fxFlip = { lift: 0, brightness: 1 };
  const firstWalk = data.views.S?.walk;
  const walkStride = (firstWalk?.stride ?? 40) * Math.max(2, (firstWalk?.frames?.length ?? 4) / 2);

  function updateFlip(time, targetDir) {
    const needed = targetDir !== shownDir;
    if (flipStart < 0 && needed) {
      if (display.reduceMotion) {
        shownDir = targetDir;
        shownFacing = directionToView(shownDir).flip;
        flipP = -1;
        fxFlip.lift = 0;
        return;
      }
      const isMajorFlip = needsPaperFlip(shownDir, targetDir, settings.flipOnFrontBack);
      const dur = isMajorFlip
        ? settings.flipDuration
        : (settings.flipAllDirs ? (settings.turnFlipDuration ?? 0.12) : 0);
      if (dur <= 0) {
        shownDir = targetDir;
        shownFacing = directionToView(shownDir).flip;
        flipP = -1;
        fxFlip.lift = 0;
        return;
      }
      flipFromDir = shownDir;
      flipFromFlip = shownFacing;
      flipFromTex = current && shownIndex >= 0 ? current.texs[shownIndex] : null;
      flipSign = turnDirectionSign(flipFromDir, targetDir);
      flipAngle = turnAngleDeg(flipFromDir, targetDir) || 180;
      flipDur = dur;
      flipStart = time;
      swapped = false;
    }
    if (flipStart < 0) {
      flipP = -1;
      fxFlip.lift = 0;
      return;
    }
    const p = (time - flipStart) / Math.max(flipDur, 1e-3);
    if (p >= 0.5 && !swapped) {
      shownDir = targetDir;
      shownFacing = directionToView(shownDir).flip;
      swapped = true;
    }
    if (p >= 1) {
      flipStart = -1;
      flipP = -1;
      fxFlip.lift = 0;
      return;
    }
    flipP = p;
    flipEffects(fxFlip, p);
  }

  function pickAnim8(moving, scanning, aside, dir = shownDir) {
    if (aside) return asides[aside] ?? faceIdle;
    const { view } = directionToView(dir);
    if (scanning) return anims[`${view}.scan`] ?? anims[`${view}.idle`] ?? faceIdle;
    return moving ? (anims[`${view}.walk`] ?? anims[`${view}.idle`] ?? faceIdle) : (anims[`${view}.idle`] ?? faceIdle);
  }

  function render(sx, sy, scale, _facing, _away, moving, time, distance, scanning = false, aside = '', dir = 'S') {
    const targetDir = aside ? 'S' : dir;
    updateFlip(time, targetDir);
    const isFlipping = flipP >= 0;
    stats.flipping = isFlipping;

    const anim = pickAnim8(moving, scanning, aside, shownDir);
    if (anim !== current) {
      const keepWalkPhase = Boolean(current?.stride > 0 && anim.stride > 0);
      current = anim;
      if (!keepWalkPhase) {
        animStartTime = time;
        animStartDist = distance;
        shownIndex = -1;
        lastWalkStep = -1;
      }
    }
    const i = frameIndex(anim, (time - animStartTime) * 1000, distance - animStartDist, settings.walkAnimSpeed, anim.stride > 0);
    if (anim.stride > 0) {
      const step = Math.floor((Math.max(0, distance - animStartDist) * settings.walkAnimSpeed) / anim.stride);
      if (step !== lastWalkStep) {
        lastWalkStep = step;
        shownIndex = i;
        if (anim.sounds[i] || anim.effects[i]) onFrameEvent(anim.sounds[i], anim.effects[i]);
      } else {
        shownIndex = i;
      }
    } else if (i !== shownIndex) {
      shownIndex = i;
      if (anim.sounds[i] || anim.effects[i]) onFrameEvent(anim.sounds[i], anim.effects[i]);
    }

    const frameTex = anim.texs[i];
    const use25d = isFlipping && shouldUsePaperFlip25d(settings.paperFlip25d, isWebGL, display.profile);

    // Corps vivant (rebond, respiration, écrasement), sauf si l'on réduit les animations.
    if (moving !== wasMoving) {
      if (!moving) {
        stopTime = time;
        idleStart = time;
      }
      wasMoving = moving;
    }
    if (display.reduceMotion) {
      motion.lift = 0;
      motion.sx = 1;
      motion.sy = 1;
    } else {
      bodyMotion(motion, settings, moving, distance, walkStride / settings.walkAnimSpeed, time - idleStart, stopTime < 0 ? -1 : time - stopTime);
    }

    const up = settings.bounceHeight > 0 ? motion.lift / settings.bounceHeight : 0;
    const shadowScale = scale * settings.shadowSize * (1 - 0.18 * up);

    let heldScaleX = 1;
    if (use25d) {
      const fromAnim = pickAnim8(moving, scanning, aside, flipFromDir);
      const toAnim = pickAnim8(moving, scanning, aside, targetDir);
      const fromI = frameIndex(fromAnim, (time - animStartTime) * 1000, distance - animStartDist, settings.walkAnimSpeed, fromAnim.stride > 0);
      const toI = frameIndex(toAnim, (time - animStartTime) * 1000, distance - animStartDist, settings.walkAnimSpeed, toAnim.stride > 0);
      const fromTex = fromAnim.texs[fromI] ?? flipFromTex ?? frameTex;
      const toTex = toAnim.texs[toI] ?? frameTex;
      const toFlip = directionToView(targetDir).flip;
      const prog = flipProgress(flipP);
      const minW = minWidthForAngle(flipAngle, settings.edgeThickness);
      heldScaleX = (prog >= 0.5 ? toFlip : flipFromFlip) * flipWidth(prog, minW);
      poses.hide();
      paperFlip.draw({
        p: flipP,
        fromTex,
        fromFlip: flipFromFlip,
        toTex,
        toFlip,
        turnSign: flipSign,
        angleDeg: flipAngle,
        edgeThickness: settings.edgeThickness,
        twist: settings.paperTwist ?? 1,
        shadow: settings.flipShadow ?? 0.55,
        sheen: settings.paperSheen !== false,
        shadowScale,
        shadowBase: [shadowW, shadowH],
        shadowVisible,
      });
    } else {
      paperFlip.hide();
      if (poses.show(frameTex)) stats.frameChanges++;
    }
    placeHeld(anim.srcs[i], anim.viewName, anim.away, scanning);
    // En 2.5D, flip.scale.x vaut +motion.sx (le MeshPlane gère son propre miroir) : on applique
    // le miroir et l'amincissement autour de l'ancre (ax) aux objets tenus pour qu'ils restent solidaires.
    if (heldScaleX !== lastHeldScaleX) {
      lastHeldScaleX = heldScaleX;
      heldBack.scale.x = heldScaleX;
      heldBack.x = -ax * heldScaleX;
      heldFront.scale.x = heldScaleX;
      heldFront.x = -ax * heldScaleX;
    }

    const totalLift = motion.lift + (display.reduceMotion ? 0 : fxFlip.lift);
    const simpleFlipScale = isFlipping && !use25d
      ? flipWidth(flipP, minWidthForAngle(flipAngle, settings.edgeThickness))
      : 1;
    const fx = (use25d ? 1 : shownFacing * simpleFlipScale) * motion.sx;
    flip.y = -totalLift;
    flip.scale.set(fx, motion.sy);
    lastFlip = fx;

    const s = scale * data.scale;
    const sink = settings.footSink;
    root.x = sx;
    root.y = sy + sink * s;
    root.scale.set(s);
    lastX = sx;
    lastY = sy;
    lastS = s;
    lastSink = sink;

    if (settings.contactShadow !== lastContact) {
      lastContact = settings.contactShadow;
      contactShadow.alpha = lastContact;
    }

    shadowContainer.visible = shadowVisible;
    shadowContainer.x = sx;
    shadowContainer.y = sy;
    shadowContainer.scale.set(shadowScale);
    shadowContainer.alpha = settings.shadowOpacity * (1 - 0.35 * up);

    liftShadow.x = sx + (-flipSign * 10 + 4) * scale;
    liftShadow.y = sy + 6 * scale;
  }

  function setLevel(level) {
    if (level === lastLevel) return;
    lastLevel = level;
    root.zIndex = level;
    shadowContainer.zIndex = level - 0.1;
    liftShadow.zIndex = level - 0.2;
  }

  function setShadowVisible(v) {
    shadowVisible = Boolean(v);
    shadowContainer.visible = shadowVisible;
    if (!shadowVisible) liftShadow.visible = false;
  }

  function mount(to) {
    to.addChild(liftShadow, shadowContainer, root);
  }

  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0, y: 0 };
  function boundsClient(stage) {
    const left = lastX - ax * lastS;
    const top = lastY - ay * lastS + lastSink * lastS;
    stage.stageToClient(left, top, p0);
    stage.stageToClient(left + w * lastS, top + h * lastS, p1);
    return { x: p0.x, y: p0.y, width: p1.x - p0.x, height: p1.y - p0.y };
  }

  function info() {
    return {
      visible: heroSprite.visible || paperFlip.active,
      flipping: stats.flipping,
      flip25dActive: paperFlip.active,
      flipScaleX: lastFlip,
      shownFacing,
      heldVisible: held.filter((it) => it.shown).length,
      shadowVisible: shadowContainer.visible,
      level: lastLevel,
      frameChanges: stats.frameChanges,
    };
  }

  return {
    root,
    render,
    setLevel,
    level: () => lastLevel,
    setShadowVisible,
    setHeld,
    mount,
    boundsClient,
    info,
    stats,
  };
}
