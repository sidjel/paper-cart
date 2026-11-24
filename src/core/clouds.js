// Défilement lent et déterministe des nuages origami dans le ciel (logique pure : aucun DOM, aucun hasard).
// Chaque nuage glisse doucement de gauche à droite (ou droite à gauche) à travers `span` [xMin, xMax]
// et se fige proprement lorsque « réduire les animations » est activé.

export function cloudPose(cloud, time, [xMin, xMax], reduceMotion = false) {
  const t = reduceMotion ? 0 : Math.max(0, time);
  const width = Math.max(1, xMax - xMin);
  const speed = cloud.speed ?? 12;
  const dir = cloud.dir ?? 1;
  const u = (((cloud.phase * width + speed * t) % width) + width) % width;
  const x = dir < 0 ? xMax - u : xMin + u;
  const bob = reduceMotion ? 0 : Math.sin(t * 0.45 + cloud.phase * 10) * (cloud.bob ?? 2);
  return { x, y: cloud.y + bob, scale: cloud.scale ?? 1 };
}
