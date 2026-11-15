// Les deux voix à l'écran :
//  - le haut-parleur du magasin : une bande sombre juste sous le haut-parleur (dessiné au plafond) d'où
//    sort la voix, avec une pointe vers lui ; elle ne passe jamais sous les boutons du haut ;
//  - les apartés du héros : une bulle de papier au-dessus de sa tête, qui le suit ;
//  - la voix du joueur (son « Épaisseur »), dans une conversation : un cadre « Toi » en haut de l'écran,
//    d'où il regarde.
// Une réplique qui attend un toucher (conversation) montre un petit ▾.
// Le texte s'écrit lettre par lettre (avancement calculé dans core/narrator.js). La place du texte
// entier est réservée dès le début (le reste est invisible) : rien ne change de taille.
// Toucher ou cliquer la réplique : le texte s'affiche en entier, puis elle disparaît.

const SPEAKER =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const MARGIN = 8; // marge au bord de l'écran (px)
const TAIL = 14; // hauteur de la pointe de la bulle (px)

function textParts(el) {
  el.innerHTML = '<span class="voice-shown"></span><span class="voice-rest" aria-hidden="true"></span>';
  return [el.firstChild, el.lastChild];
}

// onSkip() : toucher la réplique ; onChoose(k) : le joueur choisit la réponse k (0 ou 1).
export function createNarratorUi(root, { onSkip, onChoose }) {
  const band = document.createElement('div');
  band.className = 'narrator';
  band.hidden = true;
  band.setAttribute('role', 'status');
  band.innerHTML = `<span class="narrator-icon">${SPEAKER}</span><p class="narrator-text"></p><span class="narrator-tail"></span>`;
  const bandParts = textParts(band.querySelector('.narrator-text'));
  const bandTail = band.querySelector('.narrator-tail');

  const bubble = document.createElement('div');
  bubble.className = 'hero-bubble';
  bubble.hidden = true;
  bubble.setAttribute('role', 'status');
  bubble.innerHTML = '<p class="hero-bubble-text"></p><div class="hero-choices" hidden><button class="hero-choice"></button><button class="hero-choice"></button></div><span class="hero-bubble-tail"></span>';
  const bubbleParts = textParts(bubble.querySelector('.hero-bubble-text'));
  const tail = bubble.querySelector('.hero-bubble-tail');
  // Deux réponses possibles (créées une fois, réutilisées).
  const choiceBox = bubble.querySelector('.hero-choices');
  const choiceBtns = [...bubble.querySelectorAll('.hero-choice')];
  choiceBtns.forEach((b, k) => {
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      onChoose(k);
    });
  });

  const player = document.createElement('div');
  player.className = 'player-voice';
  player.hidden = true;
  player.setAttribute('role', 'status');
  player.innerHTML = '<span class="player-voice-label">Toi</span><p class="player-voice-text"></p>';
  const playerParts = textParts(player.querySelector('.player-voice-text'));

  for (const el of [band, bubble, player]) {
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onSkip();
    });
    root.appendChild(el);
  }

  let current = null; // élément affiché
  let parts = bandParts;
  let text = '';
  let count = -1;
  let bw = 0;
  let bh = 0;
  let lastX = NaN;
  let lastY = NaN;

  return {
    // voice : 'heros' (bulle), 'regard' (rien : un regard sans texte) ou autre (bande) ;
    // still : « réduire les animations » ; choices : deux réponses (le texte de chacune) ou null.
    show(t, voice, still, choices = null) {
      if (voice === 'regard' || voice === 'marche') {
        this.hide();
        return;
      }
      const el = voice === 'heros' || voice === 'pensee' ? bubble : voice === 'epaisseur' ? player : band;
      bubble.classList.toggle('thought', voice === 'pensee');
      if (current && current !== el) current.hidden = true;
      current = el;
      parts = el === bubble ? bubbleParts : el === player ? playerParts : bandParts;
      el.classList.remove('tap');
      text = t;
      count = -1;
      el.classList.toggle('still', still);
      el.setAttribute('aria-label', t);
      parts[0].textContent = '';
      parts[1].textContent = t; // place réservée pour le texte entier
      // Réponses : place réservée dès le début (invisibles tant que la question n'est pas écrite).
      choiceBox.hidden = !choices;
      choiceBox.classList.remove('ready');
      if (choices) choiceBtns.forEach((b, k) => (b.textContent = `${k + 1}. ${choices[k]}`));
      el.hidden = false;
      el.classList.remove('visible');
      bw = el.offsetWidth; // mesuré une fois par réplique (relance aussi l'apparition)
      bh = el.offsetHeight;
      lastX = NaN;
      el.classList.add('visible');
    },
    // n : lettres visibles. Le texte n'est réécrit que si ce nombre change.
    setShown(n) {
      if (n === count) return;
      count = n;
      parts[0].textContent = text.slice(0, n);
      parts[1].textContent = text.slice(n);
    },
    // Bulle : (x, y) = au-dessus de la tête du héros, en pixels d'écran. Reste dans l'écran.
    placeBubble(x, y) {
      if (current !== bubble) return;
      const W = root.clientWidth;
      const left = Math.max(MARGIN, Math.min(W - bw - MARGIN, x - bw / 2));
      const top = Math.max(MARGIN, y - bh - TAIL);
      if (Math.abs(left - lastX) < 0.5 && Math.abs(top - lastY) < 0.5) return;
      lastX = left;
      lastY = top;
      bubble.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      tail.style.left = `${Math.max(16, Math.min(bw - 16, x - left))}px`;
    },
    // La question est écrite : les réponses deviennent utilisables ; k : réponse mise en avant.
    choicesReady(k) {
      if (!choiceBox.classList.contains('ready')) {
        choiceBox.classList.add('ready');
        choiceBtns[k].focus({ preventScroll: true });
      }
    },
    focusChoice(k) {
      choiceBtns[k]?.focus({ preventScroll: true });
    },
    // Voix du joueur : en haut, au milieu, sans passer sous les boutons du haut (maxRight).
    placePlayer(maxRight) {
      if (current !== player) return;
      const left = Math.max(MARGIN, Math.min(maxRight - bw - MARGIN, root.clientWidth / 2 - bw / 2));
      if (Math.abs(left - lastX) < 0.5) return;
      lastX = left;
      player.style.transform = `translate3d(${left}px, 0, 0)`;
    },
    // La réplique est écrite et attend un toucher : petit ▾.
    setWaiting(w) {
      if (current && current.classList.contains('tap') !== w) current.classList.toggle('tap', w);
    },
    // Bande : (x, y) = bouche du haut-parleur, en pixels d'écran ; maxRight : bord gauche des boutons du haut.
    placeBand(x, y, maxRight) {
      if (current !== band) return;
      const left = Math.max(MARGIN, Math.min(maxRight - bw - MARGIN, x - bw / 2));
      const top = Math.max(MARGIN, y + TAIL);
      if (Math.abs(left - lastX) < 0.5 && Math.abs(top - lastY) < 0.5) return;
      lastX = left;
      lastY = top;
      band.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      bandTail.style.left = `${Math.max(16, Math.min(bw - 16, x - left))}px`;
    },
    hide() {
      if (!current) return;
      current.hidden = true;
      current.classList.remove('visible');
      current = null;
      count = -1;
    },
    get visible() {
      return current !== null;
    },
    get voice() {
      return current === bubble ? 'heros' : current === band ? 'narrateur' : current === player ? 'epaisseur' : '';
    },
  };
}
