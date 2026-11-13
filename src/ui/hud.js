// Interface permanente : boutons en haut à droite, version, écran de chargement,
// écran de pause, aide aux contrôles. Tout est dans la zone sûre de l'écran.
// L'interface ne change pas l'état du jeu elle-même : elle transmet des actions.

function button(label, title, action, onAction) {
  const b = document.createElement('button');
  b.className = 'hud-button';
  b.textContent = label;
  b.title = title;
  b.setAttribute('aria-label', title);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    b.blur(); // pour que Espace/Entrée ne relancent pas le bouton
    onAction(action);
  });
  return b;
}

export function createHud(root, { version, onAction, touch, muted }) {
  const bar = document.createElement('div');
  bar.className = 'hud-bar';
  const soundBtn = button('♪', 'Couper ou remettre le son', 'mute', onAction);
  soundBtn.classList.toggle('off', muted);
  bar.append(
    button('II', 'Pause (Échap)', 'pause', onAction),
    soundBtn,
    button('⚙', 'Réglages (F2)', 'settings', onAction),
    button('DBG', 'Diagnostic (F3)', 'diagnostic', onAction),
  );
  if (document.fullscreenEnabled) bar.append(button('⛶', 'Plein écran', 'fullscreen', onAction));

  const ver = document.createElement('div');
  ver.className = 'version';
  ver.textContent = `v ${version}`;

  const loading = document.createElement('div');
  loading.className = 'overlay loading';
  loading.innerHTML = '<p>Chargement du rayon…</p>';

  const pause = document.createElement('div');
  pause.className = 'overlay pause';
  pause.hidden = true;
  const card = document.createElement('div');
  card.className = 'pause-card';
  const h = document.createElement('h2');
  h.textContent = 'Pause';
  const resume = document.createElement('button');
  resume.className = 'primary';
  resume.textContent = 'Reprendre';
  resume.addEventListener('click', () => onAction('pause'));
  const help = document.createElement('p');
  help.className = 'help';
  help.innerHTML = touch
    ? 'Touche le sol pour marcher, garde le doigt pour guider.<br>Près d’un produit, touche « Scanner ». Bouton « Panier » en bas à gauche.<br>Option « joystick virtuel » dans ⚙.'
    : 'ZQSD ou flèches, ou clic sur le sol pour marcher.<br>Entrée ou Espace : scanner un produit · I : Panier.<br>Manette : stick gauche, A scanner, Y Panier, B retour, Start pause.<br>Échap : pause · F2 : réglages · F3 : diagnostic · F4 : zone de marche';
  card.append(h, resume, help);
  pause.appendChild(card);

  // Bouton « Scanner » : visible seulement quand un produit est à portée (utile surtout au doigt).
  const scanBtn = document.createElement('button');
  scanBtn.className = 'scan-button';
  scanBtn.innerHTML = touch ? 'Scanner' : 'Scanner <small>Entrée</small>';
  scanBtn.setAttribute('aria-label', 'Scanner le produit (Entrée, Espace, bouton A)');
  scanBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    scanBtn.blur();
    onAction('action');
  });

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = touch ? 'Touche le sol pour marcher' : 'ZQSD, flèches ou clic pour marcher';

  const rotate = document.createElement('div');
  rotate.className = 'overlay rotate';
  rotate.innerHTML = '<p>Tourne ton téléphone en paysage ↻</p>';

  const error = document.createElement('div');
  error.className = 'overlay error';
  error.hidden = true;

  root.append(bar, ver, scanBtn, hint, pause, loading, rotate, error);

  let hintGone = false;
  return {
    ready() {
      loading.hidden = true;
    },
    setPaused(p) {
      pause.hidden = !p;
      if (p) resume.focus({ preventScroll: true });
    },
    // Après le premier pas du joueur, l'aide s'efface.
    playerMoved() {
      if (hintGone) return;
      hintGone = true;
      hint.classList.add('gone');
    },
    setScanAvailable(on) {
      scanBtn.classList.toggle('visible', on);
    },
    setMuted(m) {
      soundBtn.classList.toggle('off', m);
    },
    showError(message) {
      error.hidden = false;
      error.textContent = message;
    },
  };
}
