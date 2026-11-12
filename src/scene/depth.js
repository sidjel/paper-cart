// Ordre d'affichage selon la profondeur.
// Chaque objet que le personnage peut contourner a un « point de référence de profondeur »
// (depthRef, en z du monde). Le personnage passe devant lui s'il est plus près (z plus petit),
// derrière sinon. Les objets ont des niveaux pairs (2, 4, 6…), les personnages des niveaux impairs
// entre eux : un personnage ne change de niveau que lorsqu'il franchit un point de référence.

// refs : profondeurs de référence. Renvoie le niveau de chaque objet (le plus loin = le plus bas).
export function propLevels(refs) {
  const order = refs.map((z, i) => [z, i]).sort((a, b) => b[0] - a[0]);
  const levels = new Array(refs.length);
  order.forEach(([, i], rank) => (levels[i] = 2 * (rank + 1)));
  return levels;
}

// Niveau d'un personnage à la profondeur z : juste devant tous les objets plus lointains.
export function actorLevel(refs, z) {
  let behindMe = 0;
  for (let i = 0; i < refs.length; i++) if (refs[i] > z) behindMe++;
  return 2 * behindMe + 1;
}
