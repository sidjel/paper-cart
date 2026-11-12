// Projection : coordonnées du monde (x le long du rayon, z la profondeur)
// → coordonnées de la scène 1920×1080 (où l'on dessine, à quelle taille).
// La position à l'écran reste simple (le sol est dessiné en perspective dans le décor) ;
// la taille, elle, diminue quand on s'éloigne vers le fond.

// settings : config.scene (force de l'effet réglable en jeu).
export function createProjection(data, settings) {
  return {
    floorY: data.floorFrontY,
    k: data.depthToScreen,
    perDepth: data.scalePerDepth ?? 0, // perte de taille par unité de profondeur
    settings,
  };
}

export function worldToStageX(proj, x) {
  return x;
}

export function worldToStageY(proj, z) {
  return proj.floorY - z * proj.k;
}

// Taille d'affichage d'un élément selon sa profondeur : 1 au bord avant du sol (z = 0),
// plus petit vers le fond, un peu plus grand tout devant.
export function scaleAt(proj, z) {
  return Math.max(0.2, 1 - z * proj.perDepth * proj.settings.depthScale);
}

export function stageToWorldX(proj, sx) {
  return sx;
}

export function stageToWorldZ(proj, sy) {
  return (proj.floorY - sy) / proj.k;
}
