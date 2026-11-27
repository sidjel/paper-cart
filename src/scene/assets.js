// Chargement des textures PixiJS d'un lieu, AVANT son affichage :
// - toutes les images d'un lot sont téléchargées et décodées EN PARALLÈLE ;
// - les bitmaps (.webp/.png/.jpg) passent par fetch() + createImageBitmap() hors thread principal
//   (0 nœud DOM <img>, 0 <canvas>, redimensionnement matériel si > maxSide ou profil « Léger ») ;
// - les .svg (et environnements sans fetch/createImageBitmap) sont décodés via <img>, dessinés une fois
//   sur un canevas temporaire unique réutilisé puis convertis en ImageBitmap (zéro canvas.toBlob PNG) ;
// - libération complète dans releaseImages() : texture.destroy(true) + bitmap.close().
// Rien de tout cela ne se produit pendant qu'on joue.

import { ImageSource, Texture } from 'pixi.js';

const HARD_MAX_SIDE = 4096; // plafond matériel courant des GPU mobiles (Android 10)
const DIRECT_AREA_RATIO = 1.8; // un bitmap déjà <= 1,8× la surface cible évite le redimensionnement

let maxTextureSide = HARD_MAX_SIDE;

export function setMaxTextureSize(limit) {
  if (Number.isFinite(limit) && limit >= 512) maxTextureSide = Math.min(HARD_MAX_SIDE, Math.floor(limit));
}

export const assetStats = {
  images: 0,
  pixels: 0, // pixels de textures gardés en mémoire (≈ 4 octets chacun)
  loadMs: 0,
  perImage: [], // [nom, ms] : temps de préparation de chaque image du dernier chargement de lieu
  rasterScale: 1,
};

// Échelle de rendu utile : la hauteur du lieu remplit la hauteur de l'écran (× zoom),
// × densité de pixels plafonnée. Calculée sur l'écran en paysage (ne change pas en tournant).
export function computeRasterScale(stageH, zoom, maxPixelRatio) {
  const sh = Math.min(screen.width, screen.height) || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  return (sh / stageH) * zoom * dpr;
}

const isSvgUrl = (url) => /\.svg($|\?)/i.test(url);

function loadImage(url) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  return img.decode().then(() => img);
}

function makeTexture(resource, width, height) {
  const opts = { resource };
  if (!(resource?.naturalWidth || resource?.width)) {
    opts.width = width;
    opts.height = height;
  }
  return new Texture({ source: new ImageSource(opts) });
}

function canUseDirectSize(nw, nh, pw, ph, maxSide) {
  if (nw <= 0 || nh <= 0) return false;
  if (nw > maxSide || nh > maxSide) return false;
  return nw * nh <= pw * ph * DIRECT_AREA_RATIO;
}

function targetSize(e, maxSide) {
  const s = Math.min(e.scale, maxSide / e.w, maxSide / e.h);
  return [
    Math.max(1, Math.min(maxSide, Math.round(e.w * s))),
    Math.max(1, Math.min(maxSide, Math.round(e.h * s))),
  ];
}

// Charge un bitmap (.webp/.png/.jpg) via fetch + createImageBitmap (0 nœud DOM, décodage hors thread principal).
async function loadBitmapDirect(e, maxSide) {
  const res = await fetch(e.url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (${e.url})`);
  const blob = await res.blob();
  const [pw, ph] = targetSize(e, maxSide);
  let bitmap = await createImageBitmap(blob);
  const nw = bitmap.width || 0;
  const nh = bitmap.height || 0;
  if (!canUseDirectSize(nw, nh, pw, ph, maxSide)) {
    bitmap.close();
    bitmap = await createImageBitmap(blob, { resizeWidth: pw, resizeHeight: ph, resizeQuality: 'high' });
  }
  return { bitmap, finalW: bitmap.width || pw, finalH: bitmap.height || ph };
}

// entries : [{ id, url, w, h, scale }] — w×h = taille logique, scale = échelle de rendu.
// Renvoie Map id → { texture, bitmap, url, w, h, pw, ph } : `texture` est prête pour PixiJS,
// `url` est conservée pour l'interface DOM (cartes, fiches).
// Si une image échoue : tout ce qui a déjà été préparé est libéré (GPU, ImageBitmap, compteurs),
// puis l'erreur est relancée.
export async function loadImages(entries) {
  const t0 = performance.now();
  const maxSide = maxTextureSide;
  const unique = [];
  const seen = new Set();
  for (const e of entries) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    unique.push(e);
  }

  const useFetchBitmap = typeof fetch === 'function' && typeof createImageBitmap === 'function';

  // 1. Téléchargement et décodage de toutes les images du lot EN PARALLÈLE.
  const settled = await Promise.allSettled(
    unique.map(async (e) => {
      const t1 = performance.now();
      if (useFetchBitmap && !isSvgUrl(e.url)) {
        const { bitmap, finalW, finalH } = await loadBitmapDirect(e, maxSide);
        return { e, bitmap, src: null, finalW, finalH, t1 };
      }
      const src = await loadImage(e.url);
      return { e, bitmap: null, src, finalW: 0, finalH: 0, t1 };
    }),
  );

  // Si au moins une image a échoué, fermer tous les ImageBitmap déjà décodés avant de relancer.
  const failed = settled.find((r) => r.status === 'rejected');
  if (failed) {
    for (const r of settled) {
      if (r.status === 'fulfilled') r.value.bitmap?.close?.();
    }
    throw failed.reason;
  }

  const out = new Map();
  let canvas = null;
  let ctx = null;
  try {
    for (const r of settled) {
      const { e, bitmap: preBitmap, src, finalW: preW, finalH: preH, t1 } = r.value;
      if (preBitmap) {
        const texture = makeTexture(preBitmap, preW, preH);
        out.set(e.id, { texture, bitmap: preBitmap, url: e.url, w: e.w, h: e.h, pw: preW, ph: preH });
        assetStats.images += 1;
        assetStats.pixels += preW * preH;
        assetStats.perImage.push([e.url.split('/').pop(), Math.round(performance.now() - t1)]);
        continue;
      }

      const [pw, ph] = targetSize(e, maxSide);
      if (!isSvgUrl(e.url) && canUseDirectSize(src.naturalWidth || 0, src.naturalHeight || 0, pw, ph, maxSide)) {
        const finalW = src.naturalWidth;
        const finalH = src.naturalHeight;
        const texture = makeTexture(src, finalW, finalH);
        out.set(e.id, { texture, bitmap: null, url: e.url, w: e.w, h: e.h, pw: finalW, ph: finalH });
        assetStats.images += 1;
        assetStats.pixels += finalW * finalH;
        assetStats.perImage.push([e.url.split('/').pop(), Math.round(performance.now() - t1)]);
      } else {
        if (!canvas) {
          canvas = document.createElement('canvas'); // un seul canevas temporaire, vidé à la fin
          ctx = canvas.getContext('2d');
        }
        canvas.width = pw;
        canvas.height = ph;
        ctx.clearRect(0, 0, pw, ph);
        ctx.imageSmoothingEnabled = true;
        if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, 0, 0, pw, ph);
        let bitmap = null;
        let resource = src;
        if (typeof createImageBitmap === 'function') {
          bitmap = await createImageBitmap(canvas);
          resource = bitmap;
        }
        const texture = makeTexture(resource, pw, ph);
        out.set(e.id, { texture, bitmap, url: e.url, w: e.w, h: e.h, pw, ph });
        assetStats.images += 1;
        assetStats.pixels += pw * ph;
        assetStats.perImage.push([e.url.split('/').pop(), Math.round(performance.now() - t1)]);
      }
    }
  } catch (err) {
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value.bitmap && !out.has(r.value.e.id)) {
        r.value.bitmap.close?.();
      }
    }
    releaseImages(out);
    throw err;
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
  assetStats.loadMs = Math.round(performance.now() - t0);
  return out;
}

// Libère les textures d'un lieu qu'on quitte : VRAM + ImageBitmap + compteurs rendus.
export function releaseImages(images) {
  for (const im of images.values()) {
    im.texture?.destroy?.(true);
    im.bitmap?.close?.();
    assetStats.images -= 1;
    assetStats.pixels -= im.pw * im.ph;
  }
  images.clear();
}
