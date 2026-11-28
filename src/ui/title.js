// Écran titre : illustration origami plein écran (logo intégré) et menu (Nouvelle Partie, Options).
// Doigt, souris, clavier (flèches haut/bas/gauche/droite ou Tab, Entrée) et manette (croix ou LB/RB, A).

// departs : boutons des points de départ (mode dev : config.debug.devMode), ou null.
// onSelect() : petit son joué lorsque le choix de bouton change.
export function createTitleScreen(root, { image, onStart, onOptions, onSelect = () => {}, onFullscreen = null, departs = null, version = '' }) {
  const el = document.createElement('div');
  el.className = 'title-screen';
  el.hidden = true;
  el.innerHTML = `
    <img class="title-image" alt="" draggable="false">
    <div class="title-shade"></div>
    <div class="title-content">
      <h1 class="title-name"><span class="title-main">Paper Cart</span><span class="title-sub">The Final Checkout</span></h1>
      <nav class="title-menu" aria-label="Menu principal">
        <button class="title-button title-button-primary" data-act="start">Nouvelle Partie</button>
        <button class="title-button" data-act="options">Options</button>
      </nav>
    </div>`;
  el.querySelector('.title-image').src = image;
  // Version du jeu, en haut à gauche (comme en jeu) : l'auteur sait à quelle version il joue.
  const ver = document.createElement('div');
  ver.className = 'title-version';
  ver.textContent = version ? `v ${version}` : '';
  el.appendChild(ver);
  // Bouton plein écran en haut à droite sur l'écran titre.
  if (onFullscreen && document.fullscreenEnabled) {
    const fs = document.createElement('button');
    fs.type = 'button';
    fs.className = 'hud-button title-fullscreen';
    fs.textContent = '⛶';
    fs.title = 'Plein écran';
    fs.setAttribute('aria-label', 'Plein écran');
    fs.addEventListener('click', (e) => {
      e.stopPropagation();
      fs.blur();
      onFullscreen();
    });
    el.appendChild(fs);
  }
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

  let focus = 0;
  function selectButton(idx, playSound) {
    if (idx < 0 || idx >= buttons.length) return;
    const changed = idx !== focus;
    focus = idx;
    buttons[focus].focus({ preventScroll: true });
    if (playSound && changed) onSelect();
  }

  // Survol à la souris ou navigation au clavier (Tab) : change le choix et joue le petit son.
  const bindHover = (container) => {
    container.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const btn = e.target?.closest?.('button');
      if (!btn) return;
      refresh();
      const idx = buttons.indexOf(btn);
      if (idx >= 0 && idx !== focus) selectButton(idx, true);
    });
  };
  bindHover(el.querySelector('.title-menu'));
  if (list) bindHover(list);

  root.appendChild(el);
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
      refresh();
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
      const next = (focus + dir + buttons.length) % buttons.length;
      selectButton(next, true);
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
