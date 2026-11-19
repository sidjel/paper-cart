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

// Aides selon le dernier appareil utilisé (src/input/CLAUDE.md) : 'keys' (clavier et souris),
// 'touch' (doigt) ou 'pad' (manette).
const HELP = {
  touch:
    'Touche le sol pour marcher, garde le doigt pour guider.<br>Touche deux fois un produit pour aller le scanner (ou « Scanner » quand tu es devant). Bouton « Panier » en bas à gauche.<br>Option « joystick virtuel » dans ⚙.',
  keys: 'ZQSD ou flèches, ou clic sur le sol pour marcher.<br>Entrée ou Espace : scanner un produit (ou double clic sur le produit) · I : Panier.<br>Échap : pause · F2 : réglages · F3 : diagnostic · F4 : zone de marche',
  pad: 'Stick gauche ou croix : marcher.<br>A : scanner un produit · Y : Panier · B : retour · Start : pause.<br>Dans les menus : croix pour choisir, A pour valider, LB/RB pour changer d’onglet.',
};
const HINT = { touch: 'Touche le sol pour marcher', keys: 'ZQSD, flèches ou clic pour marcher', pad: 'Stick gauche pour marcher' };
const LABEL = { scanner: 'Scanner', prendre: 'Prendre', lacher: 'Lâcher', pousser: 'Pousser' };
const KEY = { touch: '', keys: 'Entrée', pad: 'A' };

export function createHud(root, { version, onAction, device, muted }) {
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
  card.append(h, resume, help);
  pause.appendChild(card);

  // Bouton « Scanner » : visible seulement quand un produit est à portée (utile surtout au doigt).
  const scanBtn = document.createElement('button');
  scanBtn.className = 'scan-button';
  scanBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    scanBtn.blur();
    onAction('action');
  });

  const hint = document.createElement('div');
  hint.className = 'hint';

  const rotate = document.createElement('div');
  rotate.className = 'overlay rotate';
  rotate.innerHTML = '<div><p>Tourne ton téléphone en paysage ↻</p><button class="rotate-button">Passer en plein écran paysage</button></div>';
  rotate.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation();
    onAction('landscape');
  });

  const error = document.createElement('div');
  error.className = 'overlay error';
  error.hidden = true;

  root.append(bar, ver, scanBtn, hint, pause, loading, rotate, error);

  let hintGone = false;
  let shownAction = 'scanner';
  let shownDevice = device;
  // Texte du bouton d'action : son nom, et la touche qui le déclenche sur l'appareil utilisé.
  function labelAction() {
    const label = LABEL[shownAction] ?? 'Scanner';
    const key = KEY[shownDevice];
    scanBtn.replaceChildren(label);
    if (key) {
      const small = document.createElement('small');
      small.textContent = key;
      scanBtn.append(' ', small);
    }
    scanBtn.setAttribute('aria-label', `${label} (Entrée, Espace, bouton A)`);
  }
  function showDevice() {
    help.innerHTML = HELP[shownDevice];
    hint.textContent = HINT[shownDevice];
    labelAction();
  }
  showDevice();
  return {
    bar, // boutons du haut (la bande du narrateur ne passe pas dessous)
    pauseCard: card, // l'écran Pause (l'historique des dialogues s'y ajoute)
    focusResume() {
      resume.focus({ preventScroll: true });
    },
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
    // Bouton d'action au doigt : 'scanner', 'prendre', 'pousser', 'lacher' ou '' (caché).
    setAction(kind) {
      scanBtn.classList.toggle('visible', kind !== '');
      if (!kind || kind === shownAction) return;
      shownAction = kind;
      labelAction();
    },
    // Dernier appareil utilisé : 'keys', 'touch' ou 'pad' (aides à l'écran).
    setDevice(kind) {
      if (kind === shownDevice || !HELP[kind]) return;
      shownDevice = kind;
      showDevice();
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
