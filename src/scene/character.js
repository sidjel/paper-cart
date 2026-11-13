// Personnage en papier : affichage seulement (la position vient de core/movement.js).
// - deux vues dessinées (face, dos), tournées vers la droite ; la gauche en miroir (scaleX) ;
// - retournement de la feuille quand il change de sens : elle s'amincit jusqu'à sa tranche,
//   l'autre orientation la remplace, puis elle se rouvre (scaleX, jamais rotateY) ;
// - animations décrites dans les données (voir animation.js) ; illustrations entières ;
// - corps vivant : rebond en marchant, respiration à l'arrêt, petit écrasement en s'arrêtant ;
// - ombre au sol séparée du dessin, plus petite et plus pâle quand il s'élève.

import { bodyMotion, compileAnimation, flipWidth, frameIndex, frameSrc } from './animation.js';

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
  return entries;
}

// settings : config.character ; display : config.display (réduire les animations) ;
// onFrameEvent(son, effet) : une image d'animation demande un son et/ou un effet (un pas, de la poussière).
export function createCharacterSprite(data, images, parent, settings, display, onFrameEvent) {
  const [w, h] = data.size;
  const [ax, ay] = data.anchor;
  // Ombre : un élément à part, posé au sol sous les pieds, dessiné avant le personnage.
  const shadowW = (data.shadow?.width ?? 120) * data.scale;
  const shadowH = (data.shadow?.height ?? 28) * data.scale;
  const shadow = document.createElement('div');
  shadow.className = 'shadow';
  shadow.style.width = `${shadowW}px`;
  shadow.style.height = `${shadowH}px`;
  parent.appendChild(shadow);

  const root = document.createElement('div');
  root.className = 'actor';
  root.style.transformOrigin = `${ax}px ${ay}px`;
  const flip = document.createElement('div'); // reçoit le miroir et le retournement
  flip.className = 'actor-flip';
  flip.style.width = `${w}px`;
  flip.style.height = `${h}px`;
  flip.style.transformOrigin = `${ax}px ${ay}px`;
  root.appendChild(flip);
  parent.appendChild(root);

  // Un élément <img> par image distincte ; une seule visible à la fois.
  const elements = new Map();
  function imageEl(url) {
    if (!elements.has(url)) {
      const img = images.get(url).el;
      img.className = 'actor-frame';
      img.width = w;
      img.height = h;
      img.alt = '';
      img.draggable = false;
      img.hidden = true;
      flip.appendChild(img);
      elements.set(url, img);
    }
    return elements.get(url);
  }
  const anims = {};
  for (const [viewName, view] of Object.entries(data.views)) {
    for (const [animName, def] of Object.entries(view)) {
      anims[`${viewName}.${animName}`] = { ...compileAnimation(def), els: def.frames.map((f) => imageEl(frameSrc(f))) };
    }
  }

  // Une animation absente des données retombe sur l'image à l'arrêt.
  const faceIdle = anims['face.idle'];
  const dosIdle = anims['dos.idle'] ?? faceIdle;
  const faceWalk = anims['face.walk'] ?? faceIdle;
  const dosWalk = anims['dos.walk'] ?? dosIdle;
  const faceScan = anims['face.scan'] ?? faceIdle;
  const dosScan = anims['dos.scan'] ?? dosIdle;

  // État de l'affichage (distinct de la logique : la feuille met un instant à se retourner).
  let shownFacing = 1;
  let shownAway = false;
  let flipStart = -1;
  let swapped = false;
  let current = null; // animation en cours
  let animStartTime = 0;
  let animStartDist = 0;
  let shown = null;
  let shownIndex = -1;
  let lastFlip = NaN;
  let lastX = NaN;
  let lastY = NaN;
  let lastS = NaN;
  let lastLevel = -1;
  const stats = { frameChanges: 0, flipping: false }; // pour le diagnostic
  let lastBody = NaN;
  let lastLift = NaN;
  let wasMoving = false;
  let stopTime = -1;
  let idleStart = 0;
  const motion = { lift: 0, sx: 1, sy: 1 };
  // Distance parcourue pendant un pas : 2 images de marche (pied gauche puis pied droit).
  const walkStride = (data.views.face.walk?.stride ?? 40) * 2;

  function flipScale(time, facing, away) {
    const needed = facing !== shownFacing || away !== shownAway;
    if (flipStart < 0 && needed) {
      const dur = display.reduceMotion ? 0 : settings.flipDuration;
      const sideChange = facing !== shownFacing;
      if (dur <= 0 || (!sideChange && !settings.flipOnFrontBack)) {
        shownFacing = facing;
        shownAway = away;
        return 1;
      }
      flipStart = time;
      swapped = false;
    }
    if (flipStart < 0) return 1;
    const p = (time - flipStart) / Math.max(settings.flipDuration, 1e-3);
    if (p >= 0.5 && !swapped) {
      // À mi-chemin, la feuille est vue par la tranche : on change d'orientation.
      shownFacing = facing;
      shownAway = away;
      swapped = true;
    }
    if (p >= 1) {
      flipStart = -1;
      return 1;
    }
    return flipWidth(p, settings.edgeThickness);
  }

  // Appelé à chaque image affichée. (sx, sy) : position des pieds sur la scène ; time : temps de jeu (s).
  // scanning : douchette levée (animation « scan » des données, si elle existe).
  function render(sx, sy, scale, facing, away, moving, time, distance, scanning = false) {
    const width = flipScale(time, facing, away);
    stats.flipping = flipStart >= 0;

    const anim = scanning
      ? (shownAway ? dosScan : faceScan)
      : shownAway ? (moving ? dosWalk : dosIdle) : moving ? faceWalk : faceIdle;
    if (anim !== current) {
      current = anim;
      animStartTime = time;
      animStartDist = distance;
      shownIndex = -1;
    }
    const i = frameIndex(anim, (time - animStartTime) * 1000, distance - animStartDist, settings.walkAnimSpeed);
    if (i !== shownIndex) {
      shownIndex = i;
      if (anim.sounds[i] || anim.effects[i]) onFrameEvent(anim.sounds[i], anim.effects[i]);
    }
    const frame = anim.els[i];
    if (frame !== shown) {
      stats.frameChanges++;
      if (shown) shown.hidden = true;
      frame.hidden = false;
      shown = frame;
    }

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

    const fx = shownFacing * width * motion.sx;
    if (fx !== lastFlip || motion.sy !== lastBody || motion.lift !== lastLift) {
      flip.style.transform = `translateY(${-motion.lift}px) scale(${fx}, ${motion.sy})`;
      lastFlip = fx;
      lastBody = motion.sy;
      lastLift = motion.lift;
    }
    const s = scale * data.scale;
    if (sx !== lastX || sy !== lastY || s !== lastS) {
      root.style.transform = `translate3d(${sx - ax}px, ${sy - ay}px, 0) scale(${s})`;
      lastX = sx;
      lastY = sy;
      lastS = s;
    }

    // Ombre : sous les pieds, à l'échelle de la profondeur ; s'amenuise quand il s'élève.
    const up = settings.bounceHeight > 0 ? motion.lift / settings.bounceHeight : 0;
    const k = scale * settings.shadowSize * (1 - 0.18 * up);
    shadow.style.transform = `translate3d(${sx - shadowW / 2}px, ${sy - shadowH / 2}px, 0) scale(${k})`;
    shadow.style.opacity = settings.shadowOpacity * (1 - 0.35 * up);
  }

  // Niveau d'affichage (devant ou derrière les objets du décor), changé seulement s'il le faut.
  function setLevel(level) {
    if (level === lastLevel) return;
    root.style.zIndex = level;
    shadow.style.zIndex = level;
    lastLevel = level;
  }

  return { el: root, shadowEl: shadow, render, setLevel, stats };
}
