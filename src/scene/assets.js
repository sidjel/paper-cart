// Chargement des images d'un lieu, AVANT son affichage :
// - toutes les images d'un lot sont téléchargées et décodées EN PARALLÈLE ;
// - un fichier déjà bitmap (.webp/.png/.jpg) proche de la résolution utile est utilisé tel quel
//   (sans passer par <canvas> ni ré-encodage CPU : 5 à 10× plus rapide sur PC et smartphone) ;
// - les .svg et les images trop grandes (ex. profil « Léger » ou > 4096 px) sont redessinées une fois
//   à la résolution réellement utile, encodées rapidement (WebP, repli PNG), puis décodées avant affichage.
// Rien de tout cela ne se produit pendant qu'on joue.

const MAX_SIDE = 4096; // taille maximale d'une image en mémoire (limite courante des cartes graphiques)
const DIRECT_AREA_RATIO = 1.8; // un bitmap déjà <= 1,8× la surface cible évite le ré-encodage <canvas> (PC + Oppo Reno 2 Fin)

export const assetStats = {
  images: 0,
  pixels: 0, // pixels d'images gardés en mémoire (≈ 4 octets chacun)
  loadMs: 0,
  perImage: [], // [nom, ms] : temps de préparation de chaque image du dernier chargement de lieu (les plus lentes)
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
  return img.decode().then(() => {
    // Une fois décodée au chargement, repasser en décodage synchrone : évite un trou d'une image
    // (clignotement à froid) si une pose cachée (hidden) est redécodée à sa première apparition.
    img.decoding = 'sync';
    return img;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob a échoué'))), 'image/png');
  });
}

// Peut-on utiliser le bitmap téléchargé directement (sans redimensionner dans un <canvas>) ?
function canUseDirect(url, src, pw, ph) {
  if (isSvgUrl(url)) return false;
  const nw = src.naturalWidth || 0;
  const nh = src.naturalHeight || 0;
  if (nw <= 0 || nh <= 0) return false;
  if (nw > MAX_SIDE || nh > MAX_SIDE) return false;
  return nw * nh <= pw * ph * DIRECT_AREA_RATIO;
}

// entries : [{ id, url, w, h, scale }] — w×h = taille logique, scale = échelle de rendu.
// Renvoie Map id → { el, url, w, h, pw, ph } : `el` est un élément <img> déjà décodé, prêt à afficher.
// Si une image échoue : tout ce qui a déjà été préparé est libéré (mémoire, adresses temporaires,
// compteurs), puis l'erreur est relancée.
export async function loadImages(entries) {
  const t0 = performance.now();
  const unique = [];
  const seen = new Set();
  for (const e of entries) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    unique.push(e);
  }

  // 1. Téléchargement et premier décodage de toutes les images du lot EN PARALLÈLE.
  const loaded = await Promise.all(
    unique.map(async (e) => {
      const t1 = performance.now();
      const src = await loadImage(e.url);
      return { e, src, t1 };
    }),
  );

  const out = new Map();
  const pendingDecodes = [];
  let canvas = null;
  let ctx = null;
  try {
    for (const { e, src, t1 } of loaded) {
      const s = Math.min(e.scale, MAX_SIDE / e.w, MAX_SIDE / e.h);
      const pw = Math.max(1, Math.round(e.w * s));
      const ph = Math.max(1, Math.round(e.h * s));

      if (canUseDirect(e.url, src, pw, ph)) {
        const finalW = src.naturalWidth;
        const finalH = src.naturalHeight;
        // Toujours garder une `url` valide (utilisée par les nuages, oiseaux, portiques et produits partagés) ;
        // `revoke: false` empêche releaseImages de révoquer une URL statique.
        out.set(e.id, { el: src, url: e.url, revoke: false, w: e.w, h: e.h, pw: finalW, ph: finalH });
        assetStats.images += 1;
        assetStats.pixels += finalW * finalH;
        assetStats.perImage.push([e.url.split('/').pop(), Math.round(performance.now() - t1)]);
      } else {
        if (!canvas) {
          canvas = document.createElement('canvas'); // un seul canevas, libéré à la fin
          ctx = canvas.getContext('2d');
        }
        canvas.width = pw;
        canvas.height = ph;
        ctx.clearRect(0, 0, pw, ph);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(src, 0, 0, pw, ph);
        const url = URL.createObjectURL(await canvasToBlob(canvas));
        // Le décodage du blob part en parallèle pendant qu'on dessine l'image suivante.
        pendingDecodes.push(
          loadImage(url).then(
            (el) => {
              out.set(e.id, { el, url, revoke: true, w: e.w, h: e.h, pw, ph });
              assetStats.images += 1;
              assetStats.pixels += pw * ph;
              assetStats.perImage.push([e.url.split('/').pop(), Math.round(performance.now() - t1)]);
            },
            (err) => {
              URL.revokeObjectURL(url);
              throw err;
            },
          ),
        );
      }
    }
    await Promise.all(pendingDecodes);
  } catch (err) {
    await Promise.allSettled(pendingDecodes);
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

// Libère les images d'un lieu qu'on quitte : mémoire rendue, compteurs mis à jour.
export function releaseImages(images) {
  for (const im of images.values()) {
    im.el.removeAttribute('src');
    if (im.revoke && im.url) URL.revokeObjectURL(im.url);
    assetStats.images -= 1;
    assetStats.pixels -= im.pw * im.ph;
  }
  images.clear();
}
