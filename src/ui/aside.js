// Mise en scène d'un aparté (le héros parle au joueur) : bandes « cinéma » en haut et en bas de
// l'écran, et bords assombris. Deux éléments créés au chargement ; animés seulement en transform et
// opacity, selon l'avancement p (0 = rien, 1 = aparté installé), calculé avec le temps de jeu.
// Voile d'une rencontre importante (« une autre dimension », le héros comme hypnotisé) : sur les quatre
// bords, des traits ondulés violets qui défilent (haut vers la gauche, bas vers la droite, côtés en
// sens contraires : l'œil croit voir tourner), une lueur violette qui palpite, et en option un flou réel
// des bords (coûteux). Animations CSS en transform et opacity seulement.

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
  const veil = document.createElement('div');
  veil.className = 'aside-veil';
  veil.hidden = true;
  veil.innerHTML =
    '<div class="veil-blur"></div><div class="veil-glow"></div>' +
    ['top', 'bottom', 'left', 'right'].map((side) => `<div class="veil-band veil-${side}"><div class="veil-lines"></div></div>`).join('');
  const veilBlur = veil.firstChild;
  root.prepend(vignette, top, bottom, veil); // sous l'interface (boutons, bulle), au-dessus des bandes noires
  let last = -1;
  let lastVeil = -1;
  let lastBlur = -1;
  return {
    // Voile : p (0 à 1) ; blur : flou des bords (px, 0 = sans) ; still : « réduire les animations ».
    setVeil(p, blur, still) {
      if (p === lastVeil) return;
      lastVeil = p;
      veil.hidden = p <= 0;
      top.classList.toggle('veiled', p > 0);
      bottom.classList.toggle('veiled', p > 0);
      if (p <= 0) return;
      veil.style.opacity = p;
      veil.classList.toggle('still', still);
      if (blur !== lastBlur) {
        lastBlur = blur;
        veilBlur.hidden = blur <= 0;
        veilBlur.style.setProperty('--veil-blur', `${blur}px`);
      }
    },
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
