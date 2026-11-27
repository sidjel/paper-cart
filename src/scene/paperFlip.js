// Déformation papier 2.5D (passe 2) pendant le retournement du personnage (style Paper Mario).
// Architecture à tampons réutilisables (zéro allocation par image, caché hors retournement =
// zéro coût à l'arrêt et en marche normale, zéro filtre CSS, zéro calque GPU créé/retiré) :
//  - spriteCanvas (résolution 2× native 480×680 sur PC) : maillage 24 bandes alignées, torsion
//    diagonale + courbe en S, perspective 2.5D, amplitude adaptée à l'angle réel (45°/90°/135°/180°),
//    chant cartonné fidèle à la silhouette, ombrage directionnel et reflet spéculaire masqués (`source-atop`).
//  - shadowCanvas (tampon réutilisable 1×) : ombre portée douce de la silhouette tordue, décalée
//    et diffusée selon le soulèvement, visible uniquement pendant le pivot.

import { flipWidth } from './animation.js';

const STRIPS = 24;
const PAD_X = 48; // marge logique horizontale (torsion en S, ombre portée décalée, chant épais)
const PAD_Y = 26; // marge logique verticale (perspective + ombre portée sous les pieds)

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
// 45° reste lisible (pivot partiel ~0.50), 90° pivot marqué (~0.28), 135° (~0.14), 180° tranche fine.
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

// Décide si la déformation 2.5D (<canvas>) est active :
//  - 'non'  : pivot CSS léger partout ;
//  - 'oui'  : 2.5D forcé même sur smartphone (test) ;
//  - 'auto' : 2.5D sur PC (profil Normal/Fin), pivot CSS léger sur smartphone ou profil Léger
//             (évite la création de calque <canvas> à froid et l'éviction de tuiles GPU sur mobile).
export function shouldUsePaperFlip25d(mode, touch, profile) {
  if (mode === 'non') return false;
  if (mode === 'oui') return true;
  return !touch && profile !== 'leger';
}

export function createPaperFlipRenderer(parent, [w, h], { touch = false } = {}) {
  const cw = w + PAD_X * 2;
  const ch = h + PAD_Y * 2;
  // Résolution interne 2× sur PC (sprites 480×680 natifs) ; 1× si forcé sur mobile pour préserver le GPU.
  const backing = touch ? 1 : 2;
  const bw = Math.round(cw * backing);
  const bh = Math.round(ch * backing);

  const canvas = document.createElement('canvas');
  canvas.className = 'actor-flip-canvas';
  canvas.width = bw;
  canvas.height = bh;
  canvas.style.width = `${cw}px`;
  canvas.style.height = `${ch}px`;
  canvas.style.left = `${-PAD_X}px`;
  canvas.style.top = `${-PAD_Y}px`;
  canvas.hidden = true;
  parent.appendChild(canvas);

  // Tampons pré-alloués une seule fois (zéro allocation pendant l'animation).
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = bw;
  spriteCanvas.height = bh;

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = cw;
  shadowCanvas.height = ch;

  const ctx = canvas.getContext('2d');
  const sctx = spriteCanvas.getContext('2d');
  const shctx = shadowCanvas.getContext('2d');

  for (const c2d of [ctx, sctx, shctx]) {
    if (!c2d) continue;
    c2d.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in c2d) c2d.imageSmoothingQuality = 'high';
  }

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
  // opts : { p, fromImg, fromFlip, toImg, toFlip, turnSign, angleDeg, edgeThickness, twist, shadow, sheen }
  function draw(opts) {
    if (!ctx || !sctx || !shctx) return;
    show();
    const {
      p,
      fromImg,
      fromFlip,
      toImg,
      toFlip,
      turnSign,
      angleDeg = 180,
      edgeThickness = 0.08,
      twist = 1,
      shadow = 0.55,
      sheen = true,
    } = opts;

    const c = Math.max(0, Math.min(1, p));
    const baseProg = flipProgress(c);
    const elastic = flipElasticScale(c);
    const sinP = Math.sin(Math.PI * c);
    const sin2P = Math.sin(2 * Math.PI * c); // anticipation → pic de torsion → relâchement

    const minW = minWidthForAngle(angleDeg, edgeThickness);
    const angleFactor = angleDeg <= 45 ? 0.78 : angleDeg <= 90 ? 0.92 : 1.0;
    const edgeAngleFactor = angleDeg >= 135 ? 1.0 : angleDeg >= 90 ? 0.75 : 0.48;
    const effTwist = Math.max(0, twist) * angleFactor;

    const cx = PAD_X + w * 0.5;
    const edgeBasePx = edgeThickness > 0 ? edgeThickness * 30 * edgeAngleFactor : 0;

    // 1. Dessin net (2×) de la feuille déformée + chant cartonné dans spriteCanvas
    sctx.save();
    sctx.setTransform(backing, 0, 0, backing, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, cw, ch);

    for (let k = 0; k < STRIPS; k++) {
      const v0 = k / STRIPS;
      const v1 = (k + 1) / STRIPS;
      const vm = (v0 + v1) * 0.5; // 0 = haut de la tête, 1 = semelles

      // Torsion dynamique haut/bas : les pieds (vm=1) mènent, le haut du corps suit avec inertie cartonnée.
      const pk = Math.max(0, Math.min(1, baseProg + (vm - 0.5) * 0.24 * effTwist * sinP));
      const sinT = Math.sin(pk * Math.PI);

      const useTo = pk >= 0.5;
      const img = useTo ? toImg : fromImg;
      const flip = useTo ? toFlip : fromFlip;
      if (!img || !img.naturalWidth) continue;

      // Perspective 2.5D : avancée/recul subtil entre haut et bas de la feuille en torsion
      const perspScale = 1 + (0.5 - vm) * 0.085 * effTwist * sin2P;
      const wScale = (flipWidth(pk, minW) + elastic * (0.65 + 0.35 * vm)) * perspScale;

      // Courbure asymétrique en S + cisaillement diagonal + arc organique
      const diagTwist = (0.5 - vm) * 16 * effTwist * turnSign * sin2P;
      const sWave = Math.sin(2 * Math.PI * vm) * 9.5 * effTwist * turnSign * sinT;
      const cBow = -turnSign * Math.sin(Math.PI * vm) * 7.5 * effTwist * sinT;
      const offsetX = diagTwist + sWave + cBow;

      // Légère perspective verticale continue sans jointure entre bandes
      const dy0 = PAD_Y + v0 * h + (v0 - 0.5) * sinT * 4.5 * effTwist;
      const dy1 = PAD_Y + v1 * h + (v1 - 0.5) * sinT * 4.5 * effTwist;
      // Découpe source alignée sur pixels entiers pour préserver la netteté des contours
      const sy0 = Math.round(v0 * img.naturalHeight);
      const sy1 = Math.round(v1 * img.naturalHeight);
      const sh = Math.max(1, sy1 - sy0);
      const dh = dy1 - dy0 + 0.55;

      const edgePx = edgeBasePx * sinT;
      const edgeDir = turnSign * (useTo ? 1 : -1);

      sctx.save();
      sctx.translate(cx + offsetX, dy0);
      sctx.scale(flip * wScale, 1);

      if (edgePx >= 0.75) {
        sctx.shadowBlur = 0;
        sctx.shadowOffsetY = 0;
        sctx.shadowColor = '#D4C9B8';
        sctx.shadowOffsetX = edgeDir * (edgePx + 0.8) * backing;
        sctx.drawImage(img, 0, sy0, img.naturalWidth, sh, -w * 0.5, 0, w, dh);
        if (edgePx > 2.4) {
          sctx.shadowColor = '#FAF6EE';
          sctx.shadowOffsetX = edgeDir * edgePx * 0.5 * backing;
          sctx.drawImage(img, 0, sy0, img.naturalWidth, sh, -w * 0.5, 0, w, dh);
        }
      } else {
        sctx.shadowColor = 'transparent';
        sctx.drawImage(img, 0, sy0, img.naturalWidth, sh, -w * 0.5, 0, w, dh);
      }
      sctx.restore();
    }

    // 2. Ombrage directionnel léger + reflet spéculaire discret (100 % masqués sur spriteCanvas par source-atop)
    sctx.shadowColor = 'transparent';
    sctx.globalCompositeOperation = 'source-atop';

    const shadePeak = 0.19 * sinP * edgeAngleFactor;
    if (shadePeak > 0.01) {
      const darkLeft = (turnSign > 0) !== (baseProg >= 0.5);
      const gx0 = darkLeft ? PAD_X : PAD_X + w;
      const gx1 = darkLeft ? PAD_X + w : PAD_X;
      const grad = sctx.createLinearGradient(gx0, PAD_Y, gx1, PAD_Y + h * 0.3);
      grad.addColorStop(0, `rgba(26, 30, 46, ${shadePeak.toFixed(3)})`);
      grad.addColorStop(0.5, `rgba(26, 30, 46, ${(shadePeak * 0.3).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(26, 30, 46, 0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, cw, ch);
    }

    if (sheen && c > 0.24 && c < 0.92) {
      const sp = (c - 0.24) / 0.68;
      const alpha = 0.28 * Math.sin(Math.PI * sp) * edgeAngleFactor;
      const pos = turnSign > 0 ? 0.14 + 0.72 * sp : 0.86 - 0.72 * sp;
      const hx = PAD_X + w * pos;
      const band = w * 0.22;
      const sGrad = sctx.createLinearGradient(hx - band, PAD_Y, hx + band, PAD_Y + h * 0.36);
      sGrad.addColorStop(0, 'rgba(255, 252, 240, 0)');
      sGrad.addColorStop(0.5, `rgba(255, 252, 240, ${alpha.toFixed(3)})`);
      sGrad.addColorStop(1, 'rgba(255, 252, 240, 0)');
      sctx.fillStyle = sGrad;
      sctx.fillRect(0, 0, cw, ch);
    }

    sctx.globalCompositeOperation = 'source-over';
    sctx.restore();

    // 3. Composition finale : ombre portée dynamique (derrière/dessous) + feuille 2× nette au-dessus
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);

    if (shadow > 0 && sinP > 0.03) {
      // Construire la silhouette d'ombre chaude (teinte cohérente avec l'ombre au sol du jeu)
      shctx.save();
      shctx.setTransform(1, 0, 0, 1, 0, 0);
      shctx.globalCompositeOperation = 'source-over';
      shctx.clearRect(0, 0, cw, ch);
      shctx.drawImage(spriteCanvas, 0, 0, bw, bh, 0, 0, cw, ch);
      shctx.globalCompositeOperation = 'source-in';
      shctx.fillStyle = 'rgb(34, 26, 20)';
      shctx.fillRect(0, 0, cw, ch);
      shctx.globalCompositeOperation = 'source-over';
      shctx.restore();

      // Décalage, étirement et diffusion liés au soulèvement et à l'inclinaison de la feuille
      const liftFactor = sinP * angleFactor;
      const offX = (-turnSign * (7 + 8 * liftFactor) + 5 * liftFactor) * backing;
      const offY = (5 + 8 * liftFactor) * backing;
      const alpha = Math.min(0.45, shadow * 0.42 * liftFactor * (1 - 0.2 * sinP));

      ctx.save();
      ctx.globalAlpha = alpha;
      // Diffusion douce dans le canvas 2D (aucun filtre CSS DOM) : plus diffuse quand la feuille s'élève
      ctx.shadowColor = 'rgba(34, 26, 20, 0.85)';
      ctx.shadowBlur = (3 + 7 * liftFactor) * backing;
      ctx.shadowOffsetX = offX;
      ctx.shadowOffsetY = offY;
      // Dessine hors-cadre décalé pour ne projeter que l'ombre diffuse sans contour artificiel
      ctx.translate(-bw, 0);
      ctx.shadowOffsetX = offX + bw;
      ctx.drawImage(shadowCanvas, 0, 0, cw, ch, 0, 0, bw, bh);
      ctx.restore();
    }

    // Dessin final razor-sharp de la feuille cartonnée 2× au-dessus de son ombre portée
    ctx.drawImage(spriteCanvas, 0, 0);
    ctx.restore();
  }

  return { el: canvas, draw, hide };
}
