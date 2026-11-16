// Agent de sécurité du hall (A6) : il garde les portiques de sortie.
// Les portiques sont un obstacle de la zone de marche (données du lieu) : le héros les contourne ou
// glisse le long, comme pour un présentoir. L'agent attend à son poste ; quand le héros s'approche
// des portiques (zone en x, vers le fond), il va se placer devant le portique le plus proche du
// héros et le suit d'un portique à l'autre. Quand le héros pousse contre les portiques (au clavier,
// vers le fond, ou en visant un point des portiques), stepGuard renvoie 'blocked' une fois par
// approche (le haut-parleur annonce que la sortie est interdite). Quand le héros s'éloigne, l'agent
// retourne à son poste.
//
// g (données du lieu) : { post: [x, z], gates: [x…], zone: [xMin, xMax], watchZ, holdZ, standZ, releaseZ }
//   holdZ : bord avant de l'obstacle des portiques.
// hero : le marcheur (core/movement.js), lu seulement (x, z, tx, tz : dernier point visé).
// input : commandes du pas (moveZ > 0 : vers le fond).

const TOUCH = 8; // contre les portiques : à moins de TOUCH de leur bord avant (marge de la zone de marche)

export function createGuard(g) {
  return { x: g.post[0], z: g.post[1], prevX: g.post[0], prevZ: g.post[1], facing: 1, moving: false, gate: -1, warned: false };
}

// Portique le plus proche de x.
export function nearestGate(gates, x) {
  let best = 0;
  for (let i = 1; i < gates.length; i++) if (Math.abs(gates[i] - x) < Math.abs(gates[best] - x)) best = i;
  return best;
}

const inside = (g, x) => x >= g.zone[0] && x <= g.zone[1];

export function stepGuard(s, g, hero, input, speed, dt) {
  s.prevX = s.x;
  s.prevZ = s.z;
  const inZone = inside(g, hero.x);
  const away = !inZone || hero.z < g.releaseZ;
  if (inZone && hero.z > g.watchZ) s.gate = nearestGate(g.gates, hero.x);
  else if (away) s.gate = -1;

  // Vers le portique gardé, ou vers le poste.
  const tx = s.gate >= 0 ? g.gates[s.gate] : g.post[0];
  const tz = s.gate >= 0 ? g.standZ : g.post[1];
  const dx = tx - s.x;
  const dz = tz - s.z;
  const d = Math.hypot(dx, dz);
  const step = speed * dt;
  if (d <= step) {
    s.x = tx;
    s.z = tz;
  } else {
    s.x += (dx / d) * step;
    s.z += (dz / d) * step;
  }
  s.moving = d > 0.5;
  // En marche : tourné vers où il va ; arrêté : vers le héros.
  const look = s.moving ? dx : hero.x - s.x;
  if (Math.abs(look) > 1) s.facing = look > 0 ? 1 : -1;

  // Le héros pousse contre les portiques : il veut sortir. S'il ne fait que les longer (vers le
  // présentoir), rien n'est dit.
  let event = null;
  const against = inZone && hero.z >= g.holdZ - TOUCH;
  const aims = input.moveZ > 0 || (inside(g, hero.tx) && hero.tz >= g.holdZ - TOUCH);
  if (against && aims && !s.warned) {
    s.warned = true;
    event = 'blocked';
  }
  if (away) s.warned = false;
  return event;
}
