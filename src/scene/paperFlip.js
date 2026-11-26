// Déformation papier 2.5D pendant le retournement du personnage (style Paper Mario).
// Un unique <canvas> pré-alloué dans .actor-flip, caché hors retournement (zéro coût à l'arrêt
// et en marche normale, zéro filtre CSS, zéro calque GPU créé/retiré).
//
// Rendu par maillage de N bandes horizontales :
//  1. Courbure 2.5D et légère perspective pendant la rotation ;
//  2. Torsion dynamique haut/bas (Paper Twist) : les pieds mènent, la tête suit avec inertie ;
//  3. Chant blanc/ivoire du papier extrudé strictement sur le contour de la silhouette ;
//  4. Ombrage directionnel + reflet spéculaire semi-satiné glissant, masqués par l'alpha
//     (`source-atop`) : zéro débordement ni halo sur les pixels transparents.

import { flipWidth } from './animation.js';

const STRIPS = 32;
const PAD_X = 28; // marge logique horizontale (courbure, overshoot, chant épais)
const PAD_Y = 14; // marge logique verticale (légère perspective)
const TWIST_AMP = 0.11; // décalage de phase haut ↔ bas au milieu du pivot (torsion cartonnée organique)
const BOW_PX = 7; // courbure horizontale maximale au centre de la silhouette (px logiques)

const SECTOR_IDX = { E: 0, NE: 1, N: 2, NW: 3, W: 4, SW: 5, S: 6, SE: 7 };

// Sens de rotation (+1 ou -1) entre deux directions sur l'anneau des 8 directions.
export function turnDirectionSign(fromDir, toDir) {
  const a = SECTOR_IDX[fromDir];
  const b = SECTOR_IDX[toDir];
  if (a === undefined || b === undefined || a === b) return 1;
  let diff = (b - a + 8) % 8;
  if (diff > 4) diff -= 8;
  return diff >= 0 ? 1 : -1;
}

// Progression non-linéaire du pivot : léger démarrage (anticipation), passage vif sur la tranche,
// décélération douce à l'ouverture.
export function flipProgress(p) {
  const c = Math.max(0, Math.min(1, p));
  return c < 0.5 ? 0.5 * Math.pow(c * 2, 1.55) : 1 - 0.5 * Math.pow((1 - c) * 2, 1.55);
}

// Rebond d'anticipation (début) et d'ouverture cartonnée (fin : overshoot/settle), nul à 0 et 1.
export function flipElasticScale(p) {
  const c = Math.max(0, Math.min(1, p));
  let extra = 0;
  if (c < 0.16) {
    extra += 0.028 * Math.sin((c / 0.16) * Math.PI);
  }
  if (c > 0.66 && c < 1) {
    const q = (c - 0.66) / 0.34;
    extra += 0.058 * Math.sin(q * Math.PI) * (1 - q * 0.45);
  }
  return extra;
}

export function createPaperFlipRenderer(parent, [w, h]) {
  const cw = w + PAD_X * 2;
  const ch = h + PAD_Y * 2;
  const dpr = Math.min(2, typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
  const canvas = document.createElement('canvas');
  canvas.className = 'actor-flip-canvas';
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  canvas.style.width = `${cw}px`;
  canvas.style.height = `${ch}px`;
  canvas.style.left = `${-PAD_X}px`;
  canvas.style.top = `${-PAD_Y}px`;
  canvas.hidden = true;
  parent.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let active = false;

  function show() {
    if (!active) {
      canvas.hidden = false;
      active = true;
    }
  }

  function hide() {
    if (active) {
      canvas.hidden = true;
      active = false;
    }
  }

  // Dessine une image du retournement 2.5D.
  // opts : { p, fromImg, fromFlip, toImg, toFlip, turnSign, edgeThickness, sheen }
  function draw(opts) {
    if (!ctx) return;
    show();
    const { p, fromImg, fromFlip, toImg, toFlip, turnSign, edgeThickness, sheen } = opts;
    const c = Math.max(0, Math.min(1, p));
    const baseProg = flipProgress(c);
    const elastic = flipElasticScale(c);
    const sinP = Math.sin(Math.PI * c);
    const minEdge = Math.max(0.035, edgeThickness * 0.65);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cw, ch);

    const cx = PAD_X + w * 0.5;
    const edgeBasePx = edgeThickness > 0 ? edgeThickness * 30 : 0;

    // 1. Maillage en 32 bandes horizontales (courbure, perspective, torsion haut/bas et chant blanc)
    for (let k = 0; k < STRIPS; k++) {
      const v0 = k / STRIPS;
      const v1 = (k + 1) / STRIPS;
      const vm = (v0 + v1) * 0.5; // 0 = haut de la tête, 1 = semelles

      // Torsion dynamique : les pieds (vm=1) mènent la rotation, la tête (vm=0) suit avec inertie.
      const pk = Math.max(0, Math.min(1, baseProg + (vm - 0.5) * TWIST_AMP * sinP));
      const sinT = Math.sin(pk * Math.PI);

      const useTo = pk >= 0.5;
      const img = useTo ? toImg : fromImg;
      const flip = useTo ? toFlip : fromFlip;
      if (!img || !img.naturalWidth) continue;

      // Largeur apparente (courbe flipWidth + anticipation/overshoot cartonné)
      const wScale = flipWidth(pk, minEdge) + elastic * (0.7 + 0.3 * vm);
      // Courbure horizontale organique (le milieu de la feuille bombe légèrement face à l'air)
      const bowX = -turnSign * Math.sin(Math.PI * vm) * sinT * BOW_PX;
      // Légère perspective 2.5D : compression verticale continue sans aucune jointure entre bandes
      const dy0 = PAD_Y + v0 * h + (v0 - 0.5) * sinT * 3.5;
      const dy1 = PAD_Y + v1 * h + (v1 - 0.5) * sinT * 3.5;
      const sy = v0 * img.naturalHeight;
      const sh = (v1 - v0) * img.naturalHeight;
      const dh = dy1 - dy0 + 0.65;

      // Chant blanc/carton du papier extrudé sur le côté fuyant de la silhouette
      const edgePx = edgeBasePx * sinT;
      const edgeDir = turnSign * (useTo ? 1 : -1);

      ctx.save();
      ctx.translate(cx + bowX, dy0);
      ctx.scale(flip * wScale, 1);

      if (edgePx >= 0.8) {
        // Extrusion nette (blur = 0) en 2 tons (tranche carton #D8CFC0 + bord papier #FDFBF6) :
        // suit exactement le contour découpé du héros et reste lisible sur fond clair comme sombre.
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = '#D6CCBC';
        ctx.shadowOffsetX = edgeDir * (edgePx + 0.8) * dpr;
        ctx.drawImage(img, 0, sy, img.naturalWidth, sh, -w * 0.5, 0, w, dh);
        if (edgePx > 2.6) {
          ctx.shadowColor = '#FAF6EE';
          ctx.shadowOffsetX = edgeDir * edgePx * 0.52 * dpr;
          ctx.drawImage(img, 0, sy, img.naturalWidth, sh, -w * 0.5, 0, w, dh);
        }
      } else {
        ctx.shadowColor = 'transparent';
        ctx.drawImage(img, 0, sy, img.naturalWidth, sh, -w * 0.5, 0, w, dh);
      }
      ctx.restore();
    }

    // 2. Ombrage directionnel + reflet spéculaire strictement masqués par l'alpha (source-atop)
    ctx.shadowColor = 'transparent';
    ctx.globalCompositeOperation = 'source-atop';

    // Ombrage directionnel : suit l'angle de la feuille et renforce légèrement la zone de pli/torsion.
    const shadePeak = 0.28 * sinP;
    if (shadePeak > 0.01) {
      const darkLeft = (turnSign > 0) !== (baseProg >= 0.5);
      const gx0 = darkLeft ? PAD_X : PAD_X + w;
      const gx1 = darkLeft ? PAD_X + w : PAD_X;
      const grad = ctx.createLinearGradient(gx0, PAD_Y, gx1, PAD_Y + h * 0.28);
      grad.addColorStop(0, `rgba(24, 30, 50, ${shadePeak.toFixed(3)})`);
      grad.addColorStop(0.55, `rgba(24, 30, 50, ${(shadePeak * 0.35).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(24, 30, 50, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);
    }

    // Reflet spéculaire semi-satiné glissant sur la surface lors de la réouverture face à la lumière.
    if (sheen && c > 0.22 && c < 0.94) {
      const sp = (c - 0.22) / 0.72; // 0 → 1
      const env = Math.sin(Math.PI * sp);
      const alpha = 0.38 * env;
      const pos = turnSign > 0 ? 0.12 + 0.76 * sp : 0.88 - 0.76 * sp;
      const hx = PAD_X + w * pos;
      const band = w * 0.26;
      const sGrad = ctx.createLinearGradient(hx - band, PAD_Y, hx + band, PAD_Y + h * 0.35);
      sGrad.addColorStop(0, 'rgba(255, 252, 240, 0)');
      sGrad.addColorStop(0.5, `rgba(255, 252, 240, ${alpha.toFixed(3)})`);
      sGrad.addColorStop(1, 'rgba(255, 252, 240, 0)');
      ctx.fillStyle = sGrad;
      ctx.fillRect(0, 0, cw, ch);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  return { el: canvas, draw, hide };
}
