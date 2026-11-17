// La qualité d'affichage en vigueur : le profil choisi (config.display.profile) combiné aux réglages
// de chaque effet (règle : core/profiles.js). Lu au chargement d'un lieu et pendant l'affichage.

import { config } from '../config.js';
import { effectiveDisplay } from '../core/profiles.js';

export function quality() {
  const d = config.display;
  return effectiveDisplay(d.profiles, d.profile, { maxPixelRatio: d.maxPixelRatio, hallRain: d.hallRain, dust: config.character.dust });
}
