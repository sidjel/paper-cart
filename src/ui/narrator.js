// Bande du narrateur : une annonce au haut-parleur du magasin, en haut à gauche, dans la zone sûre.
// Le texte s'écrit lettre par lettre (avancement calculé dans core/narrator.js). La place du texte
// entier est réservée dès le début (le reste est invisible) : la bande ne change pas de taille.
// Toucher ou cliquer la bande : le texte s'affiche en entier, puis elle disparaît.

const SPEAKER =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

export function createNarratorUi(root, { onSkip }) {
  const band = document.createElement('div');
  band.className = 'narrator';
  band.hidden = true;
  band.setAttribute('role', 'status');
  band.innerHTML = `<span class="narrator-icon">${SPEAKER}</span><p class="narrator-text"><span class="narrator-shown"></span><span class="narrator-rest" aria-hidden="true"></span></p>`;
  const shownEl = band.querySelector('.narrator-shown');
  const restEl = band.querySelector('.narrator-rest');
  band.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSkip();
  });
  root.appendChild(band);

  let text = '';
  let count = -1;
  return {
    el: band,
    // still : « réduire les animations » (pas de glissement à l'apparition).
    show(t, still) {
      text = t;
      band.classList.toggle('still', still);
      count = -1;
      band.setAttribute('aria-label', t);
      band.hidden = false;
      band.classList.remove('visible');
      void band.offsetWidth; // relance l'apparition
      band.classList.add('visible');
    },
    // n : lettres visibles. Le texte n'est réécrit que si ce nombre change.
    setShown(n) {
      if (n === count) return;
      count = n;
      shownEl.textContent = text.slice(0, n);
      restEl.textContent = text.slice(n);
    },
    hide() {
      if (band.hidden) return;
      band.hidden = true;
      band.classList.remove('visible');
      count = -1;
    },
    get visible() {
      return !band.hidden;
    },
  };
}
