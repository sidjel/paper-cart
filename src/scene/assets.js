// Chargement des images d'un lieu, AVANT son affichage :
// chaque image est téléchargée, décodée, puis redessinée une fois à la résolution
// réellement utile (plafonnée par config.display.maxPixelRatio), et décodée à nouveau.
// Rien de tout cela ne se produit pendant qu'on joue.

const MAX_SIDE = 4096; // taille maximale d'une image en mémoire (limite courante des cartes graphiques)

export const assetStats = {
  images: 0,
  pixels: 0, // pixels d'images gardés en mémoire (≈ 4 octets chacun)
  loadMs: 0,
  perImage: [], // [nom, ms] : temps de préparation de chaque image (pour trouver les plus lentes)
  rasterScale: 1,
};

// Échelle de rendu utile : la hauteur du lieu remplit la hauteur de l'écran (× zoom),
// × densité de pixels plafonnée. Calculée sur l'écran en paysage (ne change pas en tournant).
export function computeRasterScale(stageH, zoom, maxPixelRatio) {
  const sh = Math.min(screen.width, screen.height) || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  return (sh / stageH) * zoom * dpr;
}

function loadImage(url) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  return img.decode().then(() => img);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob a échoué'))), 'image/png');
  });
}

// entries : [{ id, url, w, h, scale }] — w×h = taille logique, scale = échelle de rendu.
// Renvoie Map id → { el, url, w, h, pw, ph } : `el` est un élément <img> déjà décodé, prêt à afficher.
export async function loadImages(entries) {
  const t0 = performance.now();
  const out = new Map();
  const canvas = document.createElement('canvas'); // un seul canevas, libéré à la fin
  const ctx = canvas.getContext('2d');
  try {
    for (const e of entries) {
      if (out.has(e.id)) continue;
      const t1 = performance.now();
      const src = await loadImage(e.url);
      let s = e.scale;
      s = Math.min(s, MAX_SIDE / e.w, MAX_SIDE / e.h);
      const pw = Math.max(1, Math.round(e.w * s));
      const ph = Math.max(1, Math.round(e.h * s));
      canvas.width = pw;
      canvas.height = ph;
      ctx.clearRect(0, 0, pw, ph);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, pw, ph);
      const url = URL.createObjectURL(await canvasToBlob(canvas));
      const el = await loadImage(url); // décodé avant affichage
      out.set(e.id, { el, url, w: e.w, h: e.h, pw, ph });
      assetStats.images += 1;
      assetStats.pixels += pw * ph;
      assetStats.perImage.push([e.url.split('/').pop(), Math.round(performance.now() - t1)]);
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
  assetStats.loadMs = Math.round(performance.now() - t0);
  return out;
}
