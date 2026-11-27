// Déformation papier 2.5D GPU pendant le retournement du personnage (style Paper Mario, PixiJS v8).
// Option 1A (validée par l'auteur) :
//  - MeshPlane principal (24 bandes, 50 sommets, autoResize = false) : torsion diagonale + courbe en S
//    + arc organique + perspective 2.5D, amplitude adaptée à l'angle réel (45°/90°/135°/180°) ;
//  - 2ᵉ MeshPlane silhouette décalée derrière le premier pour le chant cartonné clair (edgeThickness) ;
//  - ombrage directionnel + éclat discret par tint WebGL uniquement (0 shader custom, 0 Filter,
//    JAMAIS de tint !== 0xffffff sur CanvasRenderer) ;
//  - ombre portée dynamique (liftShadow) visible uniquement pendant le pivot.

import { MeshPlane } from 'pixi.js';
import { flipWidth } from './animation.js';

const STRIPS = 24;
const EDGE_TINT = 0xe8dfd0; // chant cartonné crème chaud (WebGL uniquement)
const SECTOR_IDX = { E: 0, NE: 1, N: 2, NW: 3, W: 4, SW: 5, S: 6, SE: 7 };

// Angle réel (en degrés : 0, 45, 90, 135 ou 180) entre deux directions sur l'anneau des 8 directions.
export function turnAngleDeg(fromDir, toDir) {
  const a = SECTOR_IDX[fromDir];
  const b = SECTOR_IDX[toDir];
  if (a === undefined || b === undefined || a === b) return 0;
  let diff = (b - a + 8) % 8;
  if (diff > 4) diff = 8 - diff;
  return diff * 45;
}

// Sens de rotation (+1 ou -1) entre deux directions sur l'anneau des 8 directions.
export function turnDirectionSign(fromDir, toDir) {
  const a = SECTOR_IDX[fromDir];
  const b = SECTOR_IDX[toDir];
  if (a === undefined || b === undefined || a === b) return 1;
  let diff = (b - a + 8) % 8;
  if (diff > 4) diff -= 8;
  return diff >= 0 ? 1 : -1;
}

// Largeur minimale au creux du pivot selon l'angle réel du virage :
// 45° reste lisible (~0.50), 90° pivot marqué (~0.28), 135° (~0.14), 180° tranche fine.
export function minWidthForAngle(angleDeg, edgeThickness) {
  const e = Math.max(0, edgeThickness);
  if (angleDeg <= 45) return Math.min(0.75, Math.max(0.48, 0.42 + e * 0.9));
  if (angleDeg <= 90) return Math.min(0.55, Math.max(0.26, 0.22 + e * 0.9));
  if (angleDeg <= 135) return Math.min(0.40, Math.max(0.13, 0.10 + e * 0.85));
  return Math.max(0.035, e * 0.72);
}

// Progression non-linéaire du pivot : léger démarrage (anticipation), passage vif au milieu,
// décélération douce à l'ouverture.
export function flipProgress(p) {
  const c = Math.max(0, Math.min(1, p));
  return c < 0.5 ? 0.5 * Math.pow(c * 2, 1.6) : 1 - 0.5 * Math.pow((1 - c) * 2, 1.6);
}

// Rebond d'anticipation (début) et d'ouverture cartonnée (fin : overshoot/settle), nul à 0 et 1.
export function flipElasticScale(p) {
  const c = Math.max(0, Math.min(1, p));
  let extra = 0;
  if (c < 0.16) {
    extra += 0.032 * Math.sin((c / 0.16) * Math.PI);
  }
  if (c > 0.64 && c < 1) {
    const q = (c - 0.64) / 0.36;
    extra += 0.062 * Math.sin(q * Math.PI) * (1 - q * 0.45);
  }
  return extra;
}

// Décide si la déformation papier 2.5D GPU (MeshPlane WebGL) est active (décision 2A de l'auteur) :
//  - repli CanvasRenderer (!isWebGL) ou mode 'non' : pivot léger (scaleX) sans MeshPlane ni tint ;
//  - mode 'oui' (sous WebGL) : 2.5D GPU forcée même en profil Léger ;
//  - mode 'auto' (sous WebGL) : 2.5D GPU active sur PC ET smartphone, sauf profil Léger.
export function shouldUsePaperFlip25d(mode, isWebGL, profile) {
  if (!isWebGL || mode === 'non') return false;
  if (mode === 'oui') return true;
  return profile !== 'leger';
}

export function createPaperFlipRenderer(parent, [w, h], firstTex, { isWebGL = true, liftShadow = null } = {}) {
  if (!isWebGL || !firstTex) {
    return {
      get active() {
        return false;
      },
      draw() {},
      hide() {},
      destroy() {},
    };
  }

  // 2ᵉ MeshPlane silhouette décalée (derrière) pour le chant cartonné clair (Option 1A).
  const edgePlane = new MeshPlane({ texture: firstTex, verticesX: 2, verticesY: STRIPS + 1 });
  edgePlane.autoResize = false;
  edgePlane.visible = false;
  edgePlane.tint = EDGE_TINT;

  // MeshPlane principal (devant) : 24 bandes, autoResize = false (empêche le saut ×2 sur poses 480×680).
  const plane = new MeshPlane({ texture: firstTex, verticesX: 2, verticesY: STRIPS + 1 });
  plane.autoResize = false;
  plane.visible = false;

  parent.addChild(edgePlane, plane);

  let active = false;
  let lastTex = firstTex;
  let lastFlipSign = 0;

  function hide() {
    if (!active && !plane.visible && !edgePlane.visible) return;
    plane.visible = false;
    edgePlane.visible = false;
    plane.tint = 0xffffff;
    if (liftShadow) liftShadow.visible = false;
    active = false;
    lastFlipSign = 0;
  }

  // Déforme les 50 sommets du MeshPlane (et du chant décalé) pour l'image courante du pivot.
  // opts : { p, fromTex, fromFlip, toTex, toFlip, turnSign, angleDeg, edgeThickness, twist, shadow, sheen, shadowScale, shadowBase, shadowVisible }
  function draw(opts) {
    const {
      p,
      fromTex,
      fromFlip,
      toTex,
      toFlip,
      turnSign,
      angleDeg = 180,
      edgeThickness = 0.06,
      twist = 1,
      shadow = 0.55,
      sheen = true,
      shadowScale = 1,
      shadowBase = [120, 28],
      shadowVisible = true,
    } = opts;

    const c = Math.max(0, Math.min(1, p));
    const prog = flipProgress(c);
    const elastic = flipElasticScale(c);
    const sinP = Math.sin(Math.PI * c);
    const sin2P = Math.sin(2 * Math.PI * c);
    const secondHalf = prog >= 0.5;

    const tex = secondHalf ? toTex : fromTex;
    const flipX = (secondHalf ? toFlip : fromFlip) < 0 ? -1 : 1;
    if (tex && tex !== lastTex) {
      plane.texture = tex;
      edgePlane.texture = tex;
      lastTex = tex;
    }

    const angleFactor = angleDeg <= 45 ? 0.78 : angleDeg <= 90 ? 0.92 : 1.0;
    const edgeAngleFactor = angleDeg >= 135 ? 1.0 : angleDeg >= 90 ? 0.75 : 0.48;
    const effTwist = Math.max(0, twist) * angleFactor;
    const minW = minWidthForAngle(angleDeg, edgeThickness);
    const cx = w * 0.5;

    const edgeBasePx = edgeThickness > 0 ? edgeThickness * 28 * edgeAngleFactor : 0;
    const edgeDir = turnSign * (secondHalf ? 1 : -1);
    const showEdge = edgeBasePx * sinP >= 0.6;

    const pos = plane.geometry.getBuffer('aPosition');
    const data = pos.data;
    const edgePos = showEdge ? edgePlane.geometry.getBuffer('aPosition') : null;
    const edgeData = edgePos ? edgePos.data : null;

    for (let row = 0; row <= STRIPS; row++) {
      const v = row / STRIPS;
      const pk = Math.max(0, Math.min(1, prog + (v - 0.5) * 0.22 * effTwist * sinP));
      const sinT = Math.sin(pk * Math.PI);
      const perspScale = 1 + (0.5 - v) * 0.085 * effTwist * sin2P;
      const localW = Math.max(0.03, (flipWidth(pk, minW) + elastic * (0.65 + 0.35 * v)) * perspScale);
      const halfW = cx * localW;

      const diagTwist = (0.5 - v) * 16 * effTwist * turnSign * sin2P;
      const sWave = Math.sin(2 * Math.PI * v) * 9.5 * effTwist * turnSign * sinT;
      const cBow = -turnSign * Math.sin(Math.PI * v) * 7.5 * effTwist * sinT;
      const shiftX = diagTwist + sWave + cBow;
      const y = v * h + (v - 0.5) * sinT * 4.5 * effTwist;

      const leftX = cx + shiftX - halfW;
      const rightX = cx + shiftX + halfW;
      const i0 = row * 4;
      data[i0] = flipX < 0 ? rightX : leftX;
      data[i0 + 1] = y;
      data[i0 + 2] = flipX < 0 ? leftX : rightX;
      data[i0 + 3] = y;

      if (edgeData) {
        const edgeShift = edgeDir * edgeBasePx * Math.max(0.25, sinT);
        edgeData[i0] = data[i0] + edgeShift;
        edgeData[i0 + 1] = y;
        edgeData[i0 + 2] = data[i0 + 2] + edgeShift;
        edgeData[i0 + 3] = y;
      }
    }
    pos.update();
    plane.visible = true;
    if (edgePos) {
      edgePos.update();
      edgePlane.visible = true;
    } else {
      edgePlane.visible = false;
    }

    // Ombrage directionnel subtil + bref éclat cartonné sur le GPU (WebGL uniquement, 0 Filter).
    let shade = 255 - Math.round(36 * sinP * edgeAngleFactor * (secondHalf ? 0.55 : 1));
    if (sheen && c > 0.24 && c < 0.92) {
      const sp = (c - 0.24) / 0.68;
      shade = Math.min(255, shade + Math.round(22 * Math.sin(Math.PI * sp) * edgeAngleFactor));
    }
    const r = Math.max(190, Math.min(255, shade));
    const g = Math.max(188, Math.min(255, shade));
    const b = Math.max(192, Math.min(255, shade + 4));
    plane.tint = (r << 16) | (g << 8) | b;

    if (liftShadow) {
      const showShadow = shadowVisible && shadow > 0 && sinP > 0.03;
      liftShadow.visible = showShadow;
      if (showShadow) {
        const liftFactor = sinP * angleFactor;
        liftShadow.alpha = Math.min(0.55, shadow * 0.52 * liftFactor);
        liftShadow.width = shadowBase[0] * shadowScale * (1.06 + 0.28 * liftFactor);
        liftShadow.height = shadowBase[1] * shadowScale * (1.06 + 0.24 * liftFactor);
      }
    }

    active = true;
    lastFlipSign = flipX;
  }

  function destroy() {
    edgePlane.destroy();
    plane.destroy();
  }

  return {
    get active() {
      return active;
    },
    get lastFlipSign() {
      return lastFlipSign;
    },
    draw,
    hide,
    destroy,
  };
}
