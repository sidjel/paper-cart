// Intro : texte blanc sur fond noir, une ligne à la fois (logique dans core/intro.js).
// Toucher l'écran : ligne suivante ; « Passer » : directement au jeu. Créé une fois.

export function createIntroUi(root, { onNext, onSkip }) {
  const el = document.createElement('div');
  el.className = 'intro';
  el.hidden = true;
  el.innerHTML = '<p class="intro-text"></p><button class="intro-skip">Passer ›</button>';
  const text = el.querySelector('.intro-text');
  const skip = el.querySelector('.intro-skip');
  el.addEventListener('pointerdown', (e) => {
    if (e.target === skip) return;
    e.preventDefault();
    onNext();
  });
  skip.addEventListener('click', (e) => {
    e.stopPropagation();
    onSkip();
  });
  root.appendChild(el);
  let shownIndex = -1;
  return {
    show() {
      el.hidden = false;
      shownIndex = -1;
      el.style.opacity = 1;
      skip.hidden = false;
    },
    // line : { text, voice } ; index : pour ne réécrire le texte qu'au changement de ligne.
    set(line, index, textOpacity, black) {
      if (index !== shownIndex) {
        shownIndex = index;
        text.textContent = line ? line.text : '';
        text.classList.toggle('speaker', line?.voice === 'haut-parleur');
      }
      text.style.opacity = textOpacity;
      el.style.opacity = black;
      skip.hidden = black < 1; // pendant le fondu final, plus de bouton
    },
    hide() {
      el.hidden = true;
    },
    get visible() {
      return !el.hidden;
    },
  };
}
