// Projection : coordonnées du monde (x le long du rayon, z la profondeur)
// → coordonnées de la scène 1920×1080 (où l'on dessine, à quelle taille).
// La position à l'écran reste simple (le sol est dessiné en perspective dans le décor) ;
// la taille, elle, diminue quand on s'éloigne vers le fond.

// settings : config.scene (force de l'effet réglable en jeu).
export function createProjection(data, settings) {
  return {
    floorY: data.floorFrontY,
    k: data.depthToScreen,
    perDepth: data.scalePerDepth ?? 0, // perte de taille par unité de profondeur (mode linéaire)
    refZ: data.refZ ?? 0, // profondeur de référence (taille = baseScale à z = refZ)
    baseScale: data.baseScale ?? 1, // échelle à z = refZ (1 par défaut)
    horizonY: data.horizonY ?? null, // point de fuite réel en y (facultatif : perspective exacte proportionnelle à y - horizonY)
    maxScale: data.maxScale ?? Infinity, // plafond facultatif tout devant
    settings,
  };
}

export function worldToStageX(proj, x) {
  return x;
}

export function worldToStageY(proj, z) {
  return proj.floorY - z * proj.k;
}

// Taille d'affichage d'un élément selon sa profondeur : baseScale à z = refZ,
// plus petit vers le fond, un peu plus grand tout devant.
export function scaleAt(proj, z) {
  if (proj.horizonY !== null) {
    const refY = proj.floorY - proj.refZ * proj.k;
    const y = proj.floorY - z * proj.k;
    const raw = proj.baseScale * ((y - proj.horizonY) / Math.max(1, refY - proj.horizonY));
    const s = proj.baseScale + (raw - proj.baseScale) * proj.settings.depthScale;
    return Math.min(proj.maxScale, Math.max(0.2, s));
  }
  return Math.min(proj.maxScale, Math.max(0.2, proj.baseScale - (z - proj.refZ) * proj.perDepth * proj.settings.depthScale));
}

export function stageToWorldX(proj, sx) {
  return sx;
}

export function stageToWorldZ(proj, sy) {
  return (proj.floorY - sy) / proj.k;
}
