// Projection : coordonnées du monde (x le long du rayon, z la profondeur)
// → coordonnées de la scène 1920×1080 (où l'on dessine, à quelle taille).
// A1 : projection simple, sans perspective. L'échelle selon la profondeur arrive en A2.

export function createProjection(data) {
  return {
    floorY: data.floorFrontY,
    k: data.depthToScreen,
  };
}

export function worldToStageX(proj, x) {
  return x;
}

export function worldToStageY(proj, z) {
  return proj.floorY - z * proj.k;
}

// Taille d'affichage d'un élément selon sa profondeur (constante en A1).
export function scaleAt(proj, z) {
  return 1;
}

export function stageToWorldX(proj, sx) {
  return sx;
}

export function stageToWorldZ(proj, sy) {
  return (proj.floorY - sy) / proj.k;
}
