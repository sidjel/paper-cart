// Chargement des images d'un lieu, AVANT son affichage :
// chaque image est téléchargée, décodée, puis redessinée une fois à la résolution
// réellement utile (plafonnée par config.display.maxPixelRatio), et décodée à nouveau.
// Rien de tout cela ne se produit pendant qu'on joue.

const MAX_SIDE = 4096; // taille maximale d'une image en mémoire (limite courante des cartes graphiques)

export const assetStats = {
  images: 0,
  pixels: 0, // pixels d'images gardés en mémoire (≈ 4 octets chacun)
  loadMs: 0,
  rasterScale: 1,
};

// Échelle de rendu utile : taille de la scène sur cet écran (en paysage) × densité plafonnée.
export function computeRasterScale(stageW, stageH, maxPixelRatio) {
  const sw = Math.max(screen.width, screen.height, window.innerWidth);
  const sh = Math.min(screen.width, screen.height) || window.innerHeight;
  const cover = Math.max(sw / stageW, sh / stageH);
  const dpr = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  return cover * dpr;
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
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
  assetStats.loadMs = Math.round(performance.now() - t0);
  return out;
}
