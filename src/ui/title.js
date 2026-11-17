// Écran titre : grand nom du jeu, image mystérieuse, et le menu (Commencer, Options).
// Doigt, souris, clavier (Tab ou flèches, Entrée) et manette (croix ou LB/RB, A).

// departs : boutons des points de départ (mode dev : config.debug.devMode), ou null.
export function createTitleScreen(root, { image, onStart, onOptions, departs = null }) {
  const el = document.createElement('div');
  el.className = 'title-screen';
  el.hidden = true;
  el.innerHTML = `
    <img class="title-image" alt="" draggable="false">
    <div class="title-shade"></div>
    <div class="title-content">
      <h1 class="title-name"><span class="title-main">Paper Cart</span><span class="title-sub">The Final Checkout</span></h1>
      <nav class="title-menu" aria-label="Menu principal">
        <button class="title-button" data-act="start">Commencer</button>
        <button class="title-button" data-act="options">Options</button>
      </nav>
    </div>`;
  el.querySelector('.title-image').src = image;
  const main = [...el.querySelectorAll('.title-button')];
  main[0].addEventListener('click', () => onStart());
  main[1].addEventListener('click', () => onOptions());
  // Mode dev : « Départ » ouvre la liste des points de départ (le jeu se recharge à ce point).
  let list = null;
  if (departs) {
    const b = document.createElement('button');
    b.className = 'title-button title-dev';
    b.dataset.act = 'departs';
    b.textContent = 'Départ (dev)';
    // La liste s'ouvre par-dessus l'écran titre (au centre, défilante) : sur un téléphone en paysage,
    // sous le menu, elle sortait de l'écran (séance 67).
    list = document.createElement('div');
    list.className = 'title-departs';
    list.hidden = true;
    const close = document.createElement('button');
    close.className = 'title-departs-close';
    close.textContent = 'Fermer';
    close.addEventListener('click', () => closeDeparts());
    list.append(close, ...departs);
    b.addEventListener('click', () => {
      list.hidden = false;
      refresh();
      focus = 1;
      buttons[focus]?.focus({ preventScroll: true });
    });
    el.querySelector('.title-menu').append(b);
    el.appendChild(list);
  }
  // Boutons au clavier et à la manette : ceux du menu, puis la liste des départs si elle est ouverte.
  const buttons = [];
  const refresh = () => {
    buttons.length = 0;
    if (list && !list.hidden) buttons.push(...list.querySelectorAll('button')); // liste ouverte : elle seule
    else buttons.push(...el.querySelectorAll('.title-menu > .title-button'));
  };
  refresh();
  root.appendChild(el);
  let focus = 0;
  function closeDeparts() {
    if (!list || list.hidden) return false;
    list.hidden = true;
    refresh();
    focus = buttons.length - 1; // de retour sur « Départ (dev) »
    buttons[focus]?.focus({ preventScroll: true });
    return true;
  }
  return {
    show() {
      el.hidden = false;
      focus = 0;
      buttons[0].focus({ preventScroll: true });
    },
    hide() {
      el.hidden = true;
    },
    get visible() {
      return !el.hidden;
    },
    // Gauche/haut : bouton précédent ; droite/bas : suivant.
    move(dir) {
      refresh();
      focus = (focus + dir + buttons.length) % buttons.length;
      buttons[focus].focus({ preventScroll: true });
    },
    // Échap, B : fermer la liste des départs si elle est ouverte. Renvoie true si quelque chose s'est fermé.
    back: () => closeDeparts(),
    // Manette (A) : le bouton mis en avant.
    press() {
      refresh();
      buttons[focus]?.click();
    },
  };
}
