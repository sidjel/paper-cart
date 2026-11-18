// Le chariot jouable (A8, étape 1/3) : logique pure.
// Il suit le héros dans le lieu où il se trouve, en reprenant son chemin (la trace de ses pas) à une
// distance donnée derrière lui : il passe donc là où le héros est passé, jamais à travers une étagère.
// Il ne bloque jamais le héros (aucune collision). On peut le garer et le reprendre quand on est à
// côté. Il ne suit pas le héros d'un lieu à l'autre : en partant, il reste garé là où il était
// (docs/GAME_DESIGN.md, « Le Chariot jouable »).

const TRAIL = 48; // points de la trace (tableau fixe, rien n'est créé en jeu)
const TRAIL_STEP = 8; // distance entre deux points de la trace (px du monde)

// place : id du lieu où il se trouve.
export function createChariot(place, x, z) {
  return {
    place, x, z,
    prevX: x, prevZ: z, // position au pas précédent (affichage lissé)
    following: false,
    facing: 1, // 1 : la poignée à gauche, il roule vers la droite ; -1 : l'inverse
    trail: new Float64Array(TRAIL * 2), // trace du héros, en anneau ; trailLen points, le dernier en trailHead
    trailLen: 0,
    trailHead: -1,
  };
}

function pushTrail(c, x, z) {
  c.trailHead = (c.trailHead + 1) % TRAIL;
  c.trail[c.trailHead * 2] = x;
  c.trail[c.trailHead * 2 + 1] = z;
  c.trailLen = Math.min(TRAIL, c.trailLen + 1);
}

// Le héros reprend le chariot : la trace part du chariot et va jusqu'au héros (ils sont à côté).
export function takeChariot(c, hero) {
  c.following = true;
  c.trailLen = 0;
  c.trailHead = -1;
  pushTrail(c, c.x, c.z);
  pushTrail(c, hero.x, hero.z);
}

export function parkChariot(c) {
  c.following = false;
}

// Le héros est-il assez près pour le garer ou le reprendre ? range : px du monde.
export function nearChariot(c, hero, place, range) {
  return c.place === place && Math.hypot(c.x - hero.x, (c.z - hero.z) * 1.5) <= range;
}

// Le héros quitte le lieu : le chariot reste là, garé.
export function leaveChariot(c) {
  c.following = false;
}

// Un pas de jeu. p : { follow (distance derrière le héros, px), ease (part du retard rattrapée par
// seconde) }. Le point visé est sur la trace, à `follow` du héros en remontant le chemin.
export function stepChariot(c, hero, p, dt) {
  c.prevX = c.x;
  c.prevZ = c.z;
  if (!c.following) return;
  const hx = c.trail[c.trailHead * 2];
  const hz = c.trail[c.trailHead * 2 + 1];
  if (Math.hypot(hero.x - hx, hero.z - hz) >= TRAIL_STEP) pushTrail(c, hero.x, hero.z);
  // Remonter la trace depuis le héros jusqu'à la distance voulue.
  let left = p.follow;
  let ax = hero.x;
  let az = hero.z;
  let tx = ax;
  let tz = az;
  let found = false;
  for (let k = 0; k < c.trailLen; k++) {
    const i = (c.trailHead - k + TRAIL) % TRAIL;
    const bx = c.trail[i * 2];
    const bz = c.trail[i * 2 + 1];
    const d = Math.hypot(bx - ax, bz - az);
    if (d >= left) {
      const t = left / d;
      tx = ax + (bx - ax) * t;
      tz = az + (bz - az) * t;
      found = true;
      break;
    }
    left -= d;
    ax = tx = bx;
    az = tz = bz;
  }
  // Trace trop courte (le héros vient de le reprendre) : il reste où il est tant qu'il est assez près.
  if (!found && Math.hypot(hero.x - c.x, hero.z - c.z) <= p.follow) return;
  const k = Math.min(1, p.ease * dt);
  const nx = c.x + (tx - c.x) * k;
  const dx = nx - c.x;
  c.x = nx;
  c.z += (tz - c.z) * k;
  if (Math.abs(dx) > 0.3) c.facing = dx > 0 ? 1 : -1;
}
