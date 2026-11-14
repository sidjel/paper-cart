// Mise en scène d'un aparté (le héros parle au joueur) : bandes « cinéma » en haut et en bas de
// l'écran, et bords assombris. Deux éléments créés au chargement ; animés seulement en transform et
// opacity, selon l'avancement p (0 = rien, 1 = aparté installé), calculé avec le temps de jeu.

export function createAsideFx(root) {
  const vignette = document.createElement('div');
  vignette.className = 'aside-vignette';
  vignette.hidden = true;
  const top = document.createElement('div');
  top.className = 'aside-bar aside-bar-top';
  top.hidden = true;
  const bottom = document.createElement('div');
  bottom.className = 'aside-bar aside-bar-bottom';
  bottom.hidden = true;
  root.prepend(vignette, top, bottom); // sous l'interface (boutons, bulle)
  let last = -1;
  return {
    // p : avancement (0 à 1) ; dim : assombrissement maximal ; still : « réduire les animations ».
    set(p, dim, still) {
      if (p === last) return;
      last = p;
      const on = p > 0;
      vignette.hidden = top.hidden = bottom.hidden = !on;
      if (!on) return;
      vignette.style.opacity = p * dim;
      const slide = still ? 0 : (1 - p) * 100;
      top.style.transform = `translate3d(0, ${-slide}%, 0)`;
      bottom.style.transform = `translate3d(0, ${slide}%, 0)`;
      top.style.opacity = bottom.style.opacity = still ? p : 1;
    },
  };
}
