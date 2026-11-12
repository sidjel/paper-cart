// Déplacement du personnage dans le monde (logique pure, sans affichage).
// Deux façons de le diriger :
//  - une direction (clavier, stick, joystick virtuel) : il glisse le long des obstacles ;
//  - un point à atteindre (clic, toucher) : il suit un chemin (voir pathfinding.js), point par point,
//    sans s'arrêter aux points intermédiaires, et s'arrête s'il bute malgré tout.

import { isWalkable } from './walkmask.js';

const FACE_THRESHOLD = 0.25; // part de direction nécessaire pour changer d'orientation
const STUCK_STEPS = 6; // pas sans progrès avant d'abandonner le point visé
const MAX_WAYPOINTS = 16;
const WAYPOINT_RADIUS = 10; // distance à laquelle un point intermédiaire est considéré comme atteint

export function createWalker(x, z) {
  return {
    x, z,
    prevX: x, prevZ: z, // position au pas précédent (pour l'affichage interpolé)
    vx: 0, vz: 0,
    hasTarget: false, tx: 0, tz: 0, // point visé actuel
    path: new Float64Array(MAX_WAYPOINTS * 2), pathLen: 0, pathIdx: 0, // chemin (points successifs)
    stuck: 0,
    facing: 1, // 1 = vers la droite, -1 = vers la gauche
    away: false, // true = de dos (vers le fond), false = de face
    moving: false,
    distance: 0, // distance totale parcourue (sert au rythme des pas)
  };
}

export function setTarget(w, x, z) {
  setPath(w, [[x, z]]);
}

// points : [[x, z], …], le dernier étant l'arrivée.
export function setPath(w, points) {
  const n = Math.min(points.length, MAX_WAYPOINTS);
  const skip = points.length - n; // chemin trop long : on garde la fin
  for (let i = 0; i < n; i++) {
    w.path[i * 2] = points[i + skip][0];
    w.path[i * 2 + 1] = points[i + skip][1];
  }
  w.pathLen = n;
  w.pathIdx = 0;
  w.tx = w.path[0];
  w.tz = w.path[1];
  w.hasTarget = n > 0;
  w.stuck = 0;
}

function lastWaypoint(w) {
  return w.pathIdx >= w.pathLen - 1;
}

function nextWaypoint(w) {
  w.pathIdx++;
  w.tx = w.path[w.pathIdx * 2];
  w.tz = w.path[w.pathIdx * 2 + 1];
  w.stuck = 0;
}

export function clearTarget(w) {
  w.hasTarget = false;
}

function face(w, dx, dz) {
  if (dx > FACE_THRESHOLD) w.facing = 1;
  else if (dx < -FACE_THRESHOLD) w.facing = -1;
  // De dos seulement en allant vers le fond ; de côté ou vers l'avant, on voit son visage.
  if (dz > FACE_THRESHOLD) w.away = true;
  else if (dz < -FACE_THRESHOLD || dx > FACE_THRESHOLD || dx < -FACE_THRESHOLD) w.away = false;
}

// Rapproche la vitesse de la vitesse voulue, avec accélération ou freinage limités.
function steer(w, wantX, wantZ, p, dt) {
  const dx = wantX - w.vx;
  const dz = wantZ - w.vz;
  const len = Math.hypot(dx, dz);
  // On freine (lâcher, arrivée) avec le freinage, on accélère avec l'accélération.
  const braking = wantX * wantX + wantZ * wantZ < w.vx * w.vx + w.vz * w.vz;
  const maxDelta = (braking ? p.deceleration : p.acceleration) * dt;
  if (len <= maxDelta) {
    w.vx = wantX;
    w.vz = wantZ;
  } else {
    w.vx += (dx / len) * maxDelta;
    w.vz += (dz / len) * maxDelta;
  }
}

// Avance d'un pas en tenant compte des obstacles. Renvoie false si complètement bloqué.
function moveWithCollisions(w, mask, dt) {
  const nx = w.x + w.vx * dt;
  const nz = w.z + w.vz * dt;
  // Si l'on se trouve déjà hors zone (réglage de lieu erroné), on laisse sortir.
  if (isWalkable(mask, nx, nz) || !isWalkable(mask, w.x, w.z)) {
    w.x = nx;
    w.z = nz;
    return true;
  }
  // Glisse le long de l'obstacle : on garde l'axe qui passe encore.
  if (w.vx !== 0 && isWalkable(mask, nx, w.z)) {
    w.x = nx;
    w.vz = 0;
    return true;
  }
  if (w.vz !== 0 && isWalkable(mask, w.x, nz)) {
    w.z = nz;
    w.vx = 0;
    return true;
  }
  w.vx = 0;
  w.vz = 0;
  return false;
}

// Un pas de logique. `input` : { moveX, moveZ } entre -1 et 1 (moveZ > 0 = vers le fond).
// `p` : réglages de marche (config.walk).
export function stepWalker(w, input, mask, p, dt) {
  w.prevX = w.x;
  w.prevZ = w.z;

  const ix = input.moveX;
  const iz = input.moveZ;
  let wantX = 0;
  let wantZ = 0;

  if (ix !== 0 || iz !== 0) {
    // Une direction donnée annule le point visé.
    w.hasTarget = false;
    const len = Math.hypot(ix, iz);
    const k = len > 1 ? 1 / len : 1;
    wantX = ix * k * p.maxSpeed;
    wantZ = iz * k * p.maxSpeed * p.depthFactor;
    face(w, ix * k, iz * k);
  } else if (w.hasTarget) {
    // Point intermédiaire atteint : on enchaîne sur le suivant sans s'arrêter.
    while (!lastWaypoint(w) && Math.hypot(w.tx - w.x, w.tz - w.z) <= WAYPOINT_RADIUS) nextWaypoint(w);
    // On mesure la distance « en effort » : la profondeur coûte plus cher si depthFactor < 1.
    const dx = w.tx - w.x;
    const ez = (w.tz - w.z) / p.depthFactor;
    const dist = Math.hypot(dx, ez);
    if (dist <= p.arrivalRadius && lastWaypoint(w)) {
      // Arrivé : on se pose sur le point, sans glisser au-delà.
      w.hasTarget = false;
      if (isWalkable(mask, w.tx, w.tz)) {
        w.x = w.tx;
        w.z = w.tz;
      }
      w.vx = 0;
      w.vz = 0;
      w.moving = w.x !== w.prevX || w.z !== w.prevZ;
      w.distance += Math.hypot(w.x - w.prevX, w.z - w.prevZ);
      return;
    } else {
      // Ralentit en approchant de l'arrivée pour s'arrêter pile, sans dépasser.
      const speed = lastWaypoint(w) ? Math.min(p.maxSpeed, Math.sqrt(2 * p.deceleration * dist)) : p.maxSpeed;
      const ux = dx / dist;
      const uz = ez / dist;
      wantX = ux * speed;
      wantZ = uz * speed * p.depthFactor;
      face(w, ux, uz);
    }
  }

  steer(w, wantX, wantZ, p, dt);

  if (w.hasTarget && lastWaypoint(w)) {
    // Ne pas dépasser l'arrivée dans ce pas.
    const stepLen = Math.hypot(w.vx, w.vz) * dt;
    const remaining = Math.hypot(w.tx - w.x, w.tz - w.z);
    if (stepLen >= remaining && isWalkable(mask, w.tx, w.tz)) {
      w.x = w.tx;
      w.z = w.tz;
      w.vx = 0;
      w.vz = 0;
      w.hasTarget = false;
      w.moving = true;
      w.distance += Math.hypot(w.x - w.prevX, w.z - w.prevZ);
      return;
    }
  }

  const before = w.hasTarget ? Math.hypot(w.tx - w.x, w.tz - w.z) : 0;
  const free = moveWithCollisions(w, mask, dt);

  if (w.hasTarget) {
    const after = Math.hypot(w.tx - w.x, w.tz - w.z);
    // Bloqué contre un obstacle ou ne s'approche plus : on s'arrête là.
    w.stuck = !free || before - after < 0.01 ? w.stuck + 1 : 0;
    if (!free || w.stuck >= STUCK_STEPS) {
      w.hasTarget = false;
      w.vx = 0;
      w.vz = 0;
    }
  }

  w.moving = w.x !== w.prevX || w.z !== w.prevZ;
  if (w.moving) w.distance += Math.hypot(w.x - w.prevX, w.z - w.prevZ);
}
