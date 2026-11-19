// Pile de cartons à renverser (A8, choix 2A et 3A de l'auteur, séances 75-76) : logique pure.
// Elle bloque un recoin (un obstacle de la zone de marche). Le chariot poussé avec élan la renverse d'un
// coup ; sans chariot (ou en poussant doucement), le héros la pousse à la main, plus lentement : elle
// vacille, puis tombe. Une fois tombée, elle ne bloque plus rien et laisse voir ce qu'elle cachait.

import { pointInPolygon } from './walkmask.js';

export function createPile() {
  return { down: false, push: 0, fall: 0, dir: 1 }; // push : temps passé à pousser (s) ; fall : 0 → 1
}

// Un pas de jeu. poly : obstacle de la pile (compilé) ; hero : { x, z, facing } ; intent : direction voulue ;
// chariot : { pushed, impact (vitesse au choc), bumped } ou null ; p : config.pile ; offset : distance de
// l'avant du chariot devant le héros. Renvoie 'tombe' au moment où elle tombe, 'pousse' quand le héros commence à
// pousser, sinon ''.
export function stepPile(pile, poly, hero, intent, chariot, offset, p, dt) {
  if (pile.down) {
    pile.fall = Math.min(1, pile.fall + dt / p.fallTime);
    return '';
  }
  const pushing = chariot?.pushed ?? false;
  // Le chariot poussé avec élan : sa face avant entre dans la pile.
  if (pushing && pointInPolygon(poly, hero.x + hero.facing * (offset + p.reach), hero.z)) {
    if (chariot.impact >= p.ramSpeed) return fall(pile, hero.facing);
    return lean(pile, chariot.bumped, hero.facing, p, dt);
  }
  // À la main : le héros avance contre la pile.
  const len = Math.hypot(intent.moveX, intent.moveZ);
  const hand = !pushing && len > 0.2 && pointInPolygon(poly, hero.x + (intent.moveX / len) * p.reach, hero.z + (intent.moveZ / len) * p.reach);
  return lean(pile, hand, intent.moveX >= 0 ? 1 : -1, p, dt);
}

function lean(pile, on, dir, p, dt) {
  const was = pile.push;
  pile.push = on ? pile.push + dt : Math.max(0, pile.push - dt * 2);
  if (pile.push >= p.handTime) return fall(pile, dir);
  return on && was === 0 ? 'pousse' : '';
}

function fall(pile, dir) {
  pile.down = true;
  pile.dir = dir;
  pile.push = 0;
  return 'tombe';
}

// Vacillement (0 à 1) pendant qu'on pousse : pour l'affichage.
export const wobble = (pile, p) => (pile.down ? 0 : Math.min(1, pile.push / p.handTime));
