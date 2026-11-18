// Ondes sonores sous le haut-parleur qui parle (les haut-parleurs eux-mêmes sont dessinés dans le décor).
// Un seul élément, créé au chargement, placé sous le bon haut-parleur au début de chaque annonce.
// Il pulse au rythme du temps de jeu (figé en pause) ; immobile si « réduire les animations ».

// Un seul élément : trois arcs dessinés en CSS (l'élément et ses deux pseudo-éléments).

// Séance 68 : l'élément n'est jamais caché (son calque reste en place, déjà préparé) ; au repos il est
// presque transparent (0,001 : encore dessiné, invisible). Le cacher puis le montrer créait un calque à
// chaque annonce, et le téléphone redessinait alors la scène (le héros clignotait).
const IDLE = '0.001';

export function createSpeakerWaves(parent) {
  const el = document.createElement('div');
  el.className = 'speaker-waves';
  el.style.opacity = IDLE;
  parent.appendChild(el);
  let x = 0;
  let y = 0;
  return {
    // (sx, sy) : bouche du haut-parleur sur la scène.
    show(sx, sy) {
      x = sx - 40;
      y = sy;
    },
    // t : temps de jeu (s) ; still : sans mouvement.
    pulse(t, still) {
      const k = still ? 1 : 0.92 + 0.12 * Math.abs(Math.sin(t * 7));
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
      el.style.opacity = still ? 0.85 : 0.55 + 0.4 * Math.abs(Math.sin(t * 7 + 0.6));
    },
    hide() {
      el.style.opacity = IDLE;
    },
  };
}
