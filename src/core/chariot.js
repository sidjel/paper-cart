// Le chariot (A8) : logique pure. Choix de l'auteur (séances 73-74) :
// - il est **poussé** par le héros, devant lui, du côté où il regarde ; en papier comme lui, il se
//   retourne comme une feuille quand le héros fait demi-tour (côté qui passe de -1 à 1 en passant par 0) ;
// - il est **lourd** : le héros pousse plus lentement, démarre et freine moins vite (pushWalk) ;
// - il **bute** contre le décor : le héros ne peut pas l'enfoncer dans une étagère (bump) ;
// - **lâché**, il reste là ; **poussé**, il passe les portes avec le héros (arrive) ;
// - panier ou chariot, jamais les deux (core/gear.js).

import { isWalkable } from './walkmask.js';

// place : id du lieu où il se trouve.
export function createChariot(place, x, z) {
  return {
    place, x, z,
    prevX: x, prevZ: z, prevSide: 1, // au pas précédent (affichage lissé)
    pushed: false,
    side: 1, // de -1 (à gauche du héros) à 1 (à droite) ; entre les deux : il se retourne
    bumped: false, // il bute en ce moment
    bumps: 0, // chocs récents (pour le haut-parleur)
    bumpAge: 0, // temps depuis le premier de ces chocs (s)
  };
}

// Le héros prend le chariot : il se tourne vers lui et le pousse.
export function pushChariot(c, hero) {
  c.pushed = true;
  hero.facing = c.x >= hero.x ? 1 : -1;
  c.side = c.prevSide = hero.facing;
}

export function releaseChariot(c) {
  c.pushed = false;
}

// Assez près pour le prendre ou le lâcher ? range : px du monde.
export function nearChariot(c, hero, place, range) {
  return c.place === place && Math.hypot(c.x - hero.x, (c.z - hero.z) * 1.5) <= range;
}

// Le héros arrive dans un autre lieu : poussé, le chariot arrive avec lui, devant lui.
export function arriveChariot(c, place, hero, p) {
  if (!c.pushed) return;
  c.place = place;
  c.side = c.prevSide = hero.facing;
  c.x = c.prevX = hero.x + c.side * p.offset;
  c.z = c.prevZ = hero.z;
}

// Réglages de marche du héros qui pousse (objet réutilisé : rien n'est créé à chaque pas).
// walk : config.walk ; p : config.chariot.
const pushed = {};
export function pushWalk(walk, p) {
  Object.assign(pushed, walk);
  pushed.maxSpeed = walk.maxSpeed * p.speed;
  pushed.acceleration = walk.acceleration * p.weight;
  pushed.deceleration = walk.deceleration * p.weight;
  return pushed;
}

// Après le pas du héros : si le chariot entrerait dans le décor, le héros recule d'autant (le chariot
// bute). Renvoie true s'il a buté. prevX, prevZ : position du héros avant son pas.
export function bump(c, hero, mask, p) {
  if (!c.pushed) return false;
  const front = (x, z) => isWalkable(mask, x + hero.facing * p.offset, z);
  if (front(hero.x, hero.z)) return false;
  if (front(hero.prevX, hero.z)) hero.x = hero.prevX; // glisse en profondeur
  else if (front(hero.x, hero.prevZ)) hero.z = hero.prevZ; // glisse de côté
  else {
    hero.x = hero.prevX;
    hero.z = hero.prevZ;
  }
  hero.vx = 0;
  return true;
}

// Après bump : compte les chocs (un choc = il se met à buter). Renvoie 'cogne' quand il y en a eu
// p.bumpCount en moins de p.bumpWindow secondes (le haut-parleur s'en mêle), sinon ''.
export function noteBump(c, bumped, p, dt) {
  c.bumpAge += dt;
  if (c.bumpAge > p.bumpWindow) c.bumps = 0;
  const hit = bumped && !c.bumped;
  c.bumped = bumped;
  if (!hit) return '';
  if (c.bumps === 0) c.bumpAge = 0;
  c.bumps++;
  if (c.bumps < p.bumpCount) return '';
  c.bumps = 0;
  return 'cogne';
}

// La roue folle (choix 6A de l'auteur, séance 75) : poussé en marchant de côté, le chariot tire
// légèrement vers le fond ; le joueur corrige. p.drift : px/s à pleine vitesse (0 = roue réparée).
// maxSpeed : vitesse du héros qui pousse. Ne fait jamais sortir de la zone de marche.
export function wheelDrift(c, hero, mask, p, maxSpeed, dt) {
  if (!c.pushed || p.drift <= 0 || maxSpeed <= 0) return;
  const k = Math.min(1, Math.abs(hero.vx) / maxSpeed);
  if (k < 0.1) return;
  const z = hero.z + p.drift * k * dt;
  if (isWalkable(mask, hero.x, z) && isWalkable(mask, hero.x + hero.facing * p.offset, z)) hero.z = z;
}

// Un pas de jeu. p : { offset (distance devant le héros, px), flipTime (durée du retournement, s) }.
// Renvoie 'tourne' quand il commence à se retourner (le grincement), sinon ''.
export function stepChariot(c, hero, p, dt) {
  c.prevX = c.x;
  c.prevZ = c.z;
  c.prevSide = c.side;
  if (!c.pushed) return '';
  let event = '';
  const want = hero.facing;
  if (c.side !== want) {
    if (Math.abs(c.side) === 1) event = 'tourne';
    const step = p.flipTime > 0 ? (2 * dt) / p.flipTime : 2;
    c.side = want > c.side ? Math.min(want, c.side + step) : Math.max(want, c.side - step);
  }
  c.x = hero.x + c.side * p.offset;
  c.z = hero.z;
  return event;
}
