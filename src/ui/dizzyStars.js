// Étoiles qui tournent autour de la tête du héros (le tournis). Créées une fois ; un anneau aplati
// (vu en perspective) qui tourne : animation CSS en transform seulement. Placé en pixels d'écran.

export function createDizzyStars(root) {
  const el = document.createElement('div');
  el.className = 'dizzy-stars';
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="dizzy-ring"><span>★</span><span>★</span><span>★</span><span>✦</span></div>';
  root.appendChild(el);
  let lastX = NaN;
  let lastY = NaN;
  return {
    // (x, y) : haut de la tête, en pixels d'écran ; k : échelle du héros à l'écran.
    show(x, y, k, still) {
      el.hidden = false;
      el.classList.toggle('still', still);
      if (Math.abs(x - lastX) < 0.5 && Math.abs(y - lastY) < 0.5) return;
      lastX = x;
      lastY = y;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
    },
    hide() {
      el.hidden = true;
      lastX = NaN;
    },
    get visible() {
      return !el.hidden;
    },
  };
}
