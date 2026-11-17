// Profils de qualité (docs/ARCHITECTURE.md §14 ; option A choisie par l'auteur, séance 64).
// Un profil plafonne la densité de pixels des images et active ou non les effets coûteux. Les valeurs
// des profils sont dans src/config.js (display.profiles) ; ici seulement la règle qui les combine avec
// les autres réglages (un effet n'est actif que si le profil ET son propre réglage le veulent).

// profiles : config.display.profiles ; id : profil choisi ; s : { maxPixelRatio, hallRain, dust }.
export function effectiveDisplay(profiles, id, s) {
  const p = profiles[id] ?? profiles.normal;
  return {
    pixelRatio: Math.min(s.maxPixelRatio, p.density),
    rain: s.hallRain && p.rain,
    dust: s.dust && p.dust,
    farParallax: p.farParallax, // plans lointains en parallaxe (sinon ils suivent le décor)
  };
}
