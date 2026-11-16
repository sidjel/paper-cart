// Agent de sécurité du hall (A6, refait séance 57). Une barrière de portiques, posée en profondeur,
// ferme la gauche du hall (la baie vitrée, l'entrée) : le héros ne la franchit jamais (bord de la zone
// de marche). L'agent se tient à gauche de la barrière, tourné vers la droite.
// - Quand le héros s'approche de la barrière, l'agent longe la barrière pour se mettre en face de lui.
// - Quand le héros va vers la gauche près de la barrière, l'agent l'interpelle : 'warn' (une fois par
//   approche ; le jeu fige le héros pendant la bulle de l'agent).
// - Si le héros force ensuite contre la barrière, l'agent le repousse d'un petit pas vers la droite :
//   'push' (au plus une fois toutes les pushEvery secondes).
// - Quand le héros s'éloigne, l'agent retourne à son poste.
//
// g (données du lieu) : { post: [x, z], barrier: { x0, slope }, offset, zRange: [zMin, zMax],
//   watch, warn, touch, release, pushEvery, stopTime } — distances comptées depuis la barrière.
// hero : le marcheur (core/movement.js), lu seulement (x, z, hasTarget, tx).
// input : commandes du pas (moveX < 0 : vers la gauche).

// x de la barrière à la profondeur z (elle est un peu en biais).
export function barrierX(g, z) {
  return g.barrier.x0 + z * g.barrier.slope;
}

export function createGuard(g) {
  const [x, z] = g.post;
  return { x, z, prevX: x, prevZ: z, moving: false, warned: false, pushCool: 0, stopT: 0 };
}

export function stepGuard(s, g, hero, input, speed, dt) {
  s.prevX = s.x;
  s.prevZ = s.z;
  s.pushCool = Math.max(0, s.pushCool - dt);
  s.stopT = Math.max(0, s.stopT - dt);
  const d = hero.x - barrierX(g, hero.z); // distance du héros à la barrière

  // En face du héros, le long de la barrière ; sinon à son poste.
  let tx = g.post[0];
  let tz = g.post[1];
  if (d < g.watch) {
    tz = Math.min(g.zRange[1], Math.max(g.zRange[0], hero.z));
    tx = barrierX(g, tz) - g.offset;
  }
  const dx = tx - s.x;
  const dz = tz - s.z;
  const dist = Math.hypot(dx, dz);
  const step = speed * dt;
  if (dist <= step) {
    s.x = tx;
    s.z = tz;
  } else {
    s.x += (dx / dist) * step;
    s.z += (dz / dist) * step;
  }
  s.moving = dist > 0.5;

  const left = input.moveX < 0 || (hero.hasTarget && hero.tx < hero.x - 4);
  let event = null;
  if (!s.warned && d < g.warn && left) {
    s.warned = true;
    s.stopT = g.stopTime;
    event = 'warn';
  } else if (s.warned && d < g.touch && left && s.pushCool === 0) {
    s.pushCool = g.pushEvery;
    s.stopT = g.stopTime;
    event = 'push';
  }
  if (d > g.release) s.warned = false;
  return event;
}
