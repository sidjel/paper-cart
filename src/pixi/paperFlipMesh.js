// Rendu du héros 8 directions + retournement papier 2.5D matériel (GPU MeshPlane, 24 bandes) sous PixiJS v8.
// Zéro redessin Canvas 2D CPU : pendant le pivot, seuls les sommets du MeshPlane (50 vertices) sont déformés
// directement sur le tampon GPU (torsion diagonale, courbe en S, perspective 2.5D, amplitude selon l'angle réel).

import { Container, Graphics, MeshPlane, Sprite } from 'pixi.js';
import { flipWidth } from '../scene/animation.js';
import { turnAngleDeg, turnDirectionSign, minWidthForAngle, flipProgress, flipElasticScale } from '../scene/paperFlip.js';

const STRIPS = 24;

export function createPixiHero(heroData, textures, useMesh = true) {
  const [w, h] = heroData.size;
  const [ax, ay] = heroData.anchor;

  const root = new Container();
  const shadow = new Graphics();
  shadow.ellipse(0, 0, 56, 16).fill({ color: 0x101828, alpha: 0.48 });

  // Ombre portée dynamique pendant le soulèvement du papier (visible uniquement en pivot)
  const liftShadow = new Graphics();
  liftShadow.ellipse(0, 0, 62, 18).fill({ color: 0x0b1220, alpha: 0.35 });
  liftShadow.visible = false;

  const firstTex = textures.values().next().value;
  const body = new Container();
  let plane = null;
  let sprite = null;
  if (useMesh) {
    plane = new MeshPlane({ texture: firstTex, verticesX: 2, verticesY: STRIPS + 1 });
    plane.x = -ax;
    plane.y = -ay;
    body.addChild(plane);
  } else {
    sprite = new Sprite(firstTex);
    sprite.anchor.set(ax / w, ay / h);
    sprite.width = w;
    sprite.height = h;
    body.addChild(sprite);
  }
  root.addChild(body);

  let meshDeformed = false;
  let lastTex = firstTex;
  let lastFlipSign = 1;

  function setFlatQuad(flipX = 1) {
    if (!plane) {
      sprite.scale.set((w / Math.max(1, sprite.texture.width)) * flipX, h / Math.max(1, sprite.texture.height));
      sprite.skew.set(0, 0);
      sprite.tint = 0xffffff;
      liftShadow.visible = false;
      lastFlipSign = flipX;
      return;
    }
    if (!meshDeformed && flipX === lastFlipSign) return;
    const pos = plane.geometry.getBuffer('aPosition');
    const data = pos.data;
    const xL = flipX < 0 ? w : 0;
    const xR = flipX < 0 ? 0 : w;
    for (let row = 0; row <= STRIPS; row++) {
      const y = (row / STRIPS) * h;
      const i0 = row * 4;
      data[i0] = xL;
      data[i0 + 1] = y;
      data[i0 + 2] = xR;
      data[i0 + 3] = y;
    }
    pos.update();
    plane.tint = 0xffffff;
    liftShadow.visible = false;
    meshDeformed = false;
    lastFlipSign = flipX;
  }

  function applyPaperTwist({ p, fromTex, fromFlip, toTex, toFlip, turnSign, angleDeg, edgeThickness, twist, shadowAmt }) {
    const prog = flipProgress(p);
    const secondHalf = prog >= 0.5;
    const tex = secondHalf ? toTex : fromTex;
    const flipX = (secondHalf ? toFlip : fromFlip) ? -1 : 1;
    const target = plane ?? sprite;
    if (tex && tex !== lastTex) {
      target.texture = tex;
      lastTex = tex;
    }

    const angleScale = Math.min(1, Math.max(0.45, angleDeg / 180));
    const minW = minWidthForAngle(angleDeg, edgeThickness);
    const baseWidth = Math.max(minW, Math.abs(flipWidth(prog, minW)));
    const elastic = flipElasticScale(p);
    const twistEnv = Math.sin(prog * Math.PI);
    const dir = turnSign * (secondHalf ? -1 : 1);

    if (plane) {
      const twistPx = 28 * twist * (0.65 + 0.55 * angleScale) * twistEnv * dir;
      const persp = 0.085 * twistEnv * (0.6 + 0.4 * angleScale);
      const pos = plane.geometry.getBuffer('aPosition');
      const data = pos.data;
      const cx = w * 0.5;
      for (let row = 0; row <= STRIPS; row++) {
        const v = row / STRIPS;
        const sCurve = Math.sin((v - 0.5) * Math.PI);
        const localW = Math.max(0.03, baseWidth + elastic + 0.05 * twist * twistEnv * Math.sin(v * Math.PI));
        const halfW = cx * localW;
        const shiftX = twistPx * (0.5 - v) + 9 * twist * twistEnv * sCurve * dir;
        const tiltY = (v - 0.5) * h * persp * (secondHalf ? -1 : 1);
        const y = v * h + tiltY * 0.25;
        const leftX = cx + shiftX - halfW;
        const rightX = cx + shiftX + halfW;
        const i0 = row * 4;
        data[i0] = flipX < 0 ? rightX : leftX;
        data[i0 + 1] = y;
        data[i0 + 2] = flipX < 0 ? leftX : rightX;
        data[i0 + 3] = y;
      }
      pos.update();
      meshDeformed = true;
      lastFlipSign = 0;
    } else {
      const sx = (w / Math.max(1, sprite.texture.width)) * Math.max(0.04, baseWidth + elastic) * flipX;
      sprite.scale.set(sx, h / Math.max(1, sprite.texture.height));
      sprite.skew.set(0.14 * twist * twistEnv * dir, 0);
    }

    // Ombrage directionnel subtil + bref éclat cartonné sur le GPU (zero filter)
    const shade = Math.round(255 - 38 * twistEnv * (secondHalf ? 0.55 : 1));
    target.tint = (shade << 16) | (shade << 8) | Math.min(255, shade + 6);

    liftShadow.visible = shadowAmt > 0 && twistEnv > 0.04;
    if (liftShadow.visible) {
      liftShadow.alpha = shadowAmt * twistEnv * 0.65;
      liftShadow.scale.set(0.85 + 0.35 * twistEnv, 0.8 + 0.25 * twistEnv);
    }
  }

  return {
    root,
    shadow,
    liftShadow,
    setTexture(tex, flipX = 1) {
      const target = plane ?? sprite;
      if (tex && tex !== lastTex) {
        target.texture = tex;
        lastTex = tex;
      }
      setFlatQuad(flipX);
    },
    applyPaperTwist,
    setBodyMotion(lift, sx, sy) {
      body.y = -lift;
      body.scale.set(sx, sy);
    },
    turnAngleDeg,
    turnDirectionSign,
  };
}
