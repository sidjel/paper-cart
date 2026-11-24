// Visibilité du héros derrière un élément du premier plan (plantes de l'accueil).
// Fonctions pures (aucun accès au DOM) : testables sous Node.

// Part du corps du héros recouverte par l'un des rectangles [x1, y1, x2, y2] du premier plan (0 à 1).
// parallaxDx : décalage horizontal actuel du calque de premier plan sur la scène.
export function behindFactor(heroX, heroY, heroScale, occluders, parallaxDx = 0) {
  if (!occluders || occluders.length === 0) return 0;
  const hw = 55 * heroScale;
  const hh = 210 * heroScale;
  const hx1 = heroX - hw;
  const hx2 = heroX + hw;
  const hy1 = heroY - hh;
  const hy2 = heroY;
  const area = (hx2 - hx1) * (hy2 - hy1);
  if (area <= 0) return 0;

  let overlap = 0;
  for (const [x1, y1, x2, y2] of occluders) {
    const ox = Math.max(0, Math.min(hx2, x2 + parallaxDx) - Math.max(hx1, x1 + parallaxDx));
    const oy = Math.max(0, Math.min(hy2, y2) - Math.max(hy1, y1));
    overlap += ox * oy;
  }
  return Math.min(1, (overlap / area) * 2.5);
}

// Progression lissée vers l'opacité cible (ou instantanée si « réduire les animations » est actif).
export function stepFade(current, target, speed, dt, instant = false) {
  if (instant || dt <= 0 || Math.abs(target - current) < 0.004) return target;
  return current + (target - current) * (1 - Math.exp(-speed * dt));
}

// Opacité du premier plan lorsque le héros passe derrière les plantes.
export function foregroundOpacity(baseOpacity, behindOpacity, amount) {
  const a = Math.max(0, Math.min(1, amount));
  return baseOpacity * (1 - a) + behindOpacity * a;
}
