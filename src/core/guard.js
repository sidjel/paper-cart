// Agent de sécurité du hall (A6 ; comportement refait séance 59, à la demande de l'auteur).
// Une barrière de portiques, posée en profondeur, ferme la gauche du hall : le héros ne la franchit
// jamais (bord de la zone de marche). L'agent, à gauche de la barrière, tourné vers la droite :
// - au début, il va une seule fois de son poste (sur le côté) à sa place (au milieu), à la même
//   profondeur, puis ne bouge plus ;
// - la première fois que le héros va vers la gauche près de la barrière, il l'interpelle : 'warn'
//   (le jeu fige le héros le temps de la bulle) ;
// - ensuite, chaque fois que le héros force contre la barrière : 'stop' (« Stop ! … » ; le héros fait
//   demi-tour de quelques pas), au plus une fois toutes les stopEvery secondes.
//
// g (données du lieu) : { post: [x, z], stand: [x, z] (même z), startDelay, barrier: { x0, slope },
//   warn, touch, stopEvery, stopTime } — distances comptées depuis la barrière.
// hero : le marcheur (core/movement.js), lu seulement (x, z, hasTarget, tx).
// input : commandes du pas (moveX < 0 : vers la gauche).

// x de la barrière à la profondeur z (elle est en biais).
export function barrierX(g, z) {
  return g.barrier.x0 + z * g.barrier.slope;
}

export function createGuard(g) {
  const [x, z] = g.post;
  return { x, z, prevX: x, prevZ: z, t: 0, moving: false, warned: false, stopCool: 0, stopT: 0 };
}

export function stepGuard(s, g, hero, input, speed, dt) {
  s.prevX = s.x;
  s.prevZ = s.z;
  s.t += dt;
  s.stopCool = Math.max(0, s.stopCool - dt);
  s.stopT = Math.max(0, s.stopT - dt);

  // Une seule fois, au début : du poste à sa place.
  s.moving = false;
  if (s.t >= g.startDelay && s.x !== g.stand[0]) {
    const dx = g.stand[0] - s.x;
    const step = speed * dt;
    s.x = Math.abs(dx) <= step ? g.stand[0] : s.x + Math.sign(dx) * step;
    s.moving = true;
  }

  const d = hero.x - barrierX(g, hero.z); // distance du héros à la barrière
  const left = input.moveX < 0 || (hero.hasTarget && hero.tx < hero.x - 4);
  if (!left) return null;
  if (!s.warned && d < g.warn) {
    s.warned = true;
    s.stopT = g.stopTime;
    return 'warn';
  }
  if (s.warned && d < g.touch && s.stopCool === 0) {
    s.stopCool = g.stopEvery;
    s.stopT = g.stopTime;
    return 'stop';
  }
  return null;
}
