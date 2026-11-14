// Ondes sonores sous le haut-parleur qui parle (les haut-parleurs eux-mêmes sont dessinés dans le décor).
// Un seul élément, créé au chargement, placé sous le bon haut-parleur au début de chaque annonce.
// Il pulse au rythme du temps de jeu (figé en pause) ; immobile si « réduire les animations ».

// Un seul élément : trois arcs dessinés en CSS (l'élément et ses deux pseudo-éléments).

export function createSpeakerWaves(parent) {
  const el = document.createElement('div');
  el.className = 'speaker-waves';
  el.hidden = true;
  parent.appendChild(el);
  let x = 0;
  let y = 0;
  return {
    // (sx, sy) : bouche du haut-parleur sur la scène.
    show(sx, sy) {
      x = sx - 40;
      y = sy;
      el.hidden = false;
    },
    // t : temps de jeu (s) ; still : sans mouvement.
    pulse(t, still) {
      const k = still ? 1 : 0.92 + 0.12 * Math.abs(Math.sin(t * 7));
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
      el.style.opacity = still ? 0.85 : 0.55 + 0.4 * Math.abs(Math.sin(t * 7 + 0.6));
    },
    hide() {
      el.hidden = true;
    },
  };
}
