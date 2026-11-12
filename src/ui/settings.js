// Panneau de réglages (F2 ou bouton « ⚙ »), construit d'après TUNABLES (src/config.js).
// Les réglages modifiés sont gardés dans le navigateur (localStorage) d'une partie à l'autre.

import { TUNABLES, getValue, getDefault, setValue, overrides, applyOverrides, resetAll, onConfigChange } from '../config.js';

const STORAGE_KEY = 'paper-cart.reglages.v1';

export function loadSavedSettings() {
  try {
    applyOverrides(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    /* réglages illisibles : on garde les valeurs par défaut */
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides()));
  } catch {
    /* navigation privée : pas de sauvegarde */
  }
}

function formatValue(t, v) {
  if (t.type === 'bool' || t.type === 'choice') return '';
  const decimals = t.step < 0.1 ? 2 : t.step < 1 ? 1 : 0;
  return `${Number(v).toFixed(decimals).replace('.', ',')}${t.unit ? ` ${t.unit}` : ''}`;
}

// onClose : demandé quand on ferme le panneau.
export function createSettingsPanel(root, { onClose }) {
  const panel = document.createElement('div');
  panel.className = 'settings panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Réglages');

  const title = document.createElement('h2');
  title.textContent = 'Réglages';
  panel.appendChild(title);

  const controls = new Map(); // clé → fonction de mise à jour de l'affichage
  const startValues = new Map(TUNABLES.filter((t) => t.reload).map((t) => [t.key, getValue(t.key)]));
  let group = null;

  for (const t of TUNABLES) {
    if (t.group !== group) {
      group = t.group;
      const h = document.createElement('h3');
      h.textContent = group;
      panel.appendChild(h);
    }
    const row = document.createElement('label');
    row.className = 'setting';
    const name = document.createElement('span');
    name.className = 'setting-name';
    name.textContent = t.label + (t.reload ? ' (au rechargement)' : '');
    const out = document.createElement('span');
    out.className = 'setting-value';
    let input;

    if (t.type === 'bool') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.addEventListener('change', () => setValue(t.key, input.checked));
    } else if (t.type === 'choice') {
      input = document.createElement('select');
      for (const [value, label] of t.options) input.add(new Option(label, value));
      input.addEventListener('change', () => setValue(t.key, input.value));
    } else {
      input = document.createElement('input');
      input.type = 'range';
      input.min = t.min;
      input.max = t.max;
      input.step = t.step;
      input.addEventListener('input', () => setValue(t.key, Number(input.value)));
    }
    input.dataset.key = t.key;
    row.append(name, input, out);
    panel.appendChild(row);

    controls.set(t.key, () => {
      const v = getValue(t.key);
      if (t.type === 'bool') input.checked = v;
      else input.value = v;
      out.textContent = formatValue(t, v);
      row.classList.toggle('changed', v !== getDefault(t.key));
    });
  }

  const note = document.createElement('p');
  note.className = 'settings-note';
  note.hidden = true;
  const reloadBtn = document.createElement('button');
  reloadBtn.textContent = 'Recharger le jeu maintenant';
  reloadBtn.addEventListener('click', () => location.reload());
  note.append('Un réglage ne s’appliquera qu’au rechargement. ', reloadBtn);
  panel.appendChild(note);

  const buttons = document.createElement('div');
  buttons.className = 'panel-buttons';
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copier mes réglages';
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Tout réinitialiser';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fermer (Échap)';
  closeBtn.className = 'primary';
  buttons.append(closeBtn, copyBtn, resetBtn);
  panel.appendChild(buttons);
  root.appendChild(panel);

  copyBtn.addEventListener('click', async () => {
    const txt = `Réglages Paper Cart : ${JSON.stringify(overrides())}`;
    try {
      await navigator.clipboard.writeText(txt);
      copyBtn.textContent = 'Copié !';
    } catch {
      copyBtn.textContent = txt; // affiché pour copie à la main
    }
  });
  resetBtn.addEventListener('click', () => resetAll());
  closeBtn.addEventListener('click', () => onClose());

  onConfigChange((key) => {
    controls.get(key)?.();
    note.hidden = ![...startValues].some(([k, v]) => getValue(k) !== v);
    save();
  });
  for (const update of controls.values()) update();

  return {
    open() {
      copyBtn.textContent = 'Copier mes réglages';
      panel.hidden = false;
      closeBtn.focus({ preventScroll: true });
    },
    close() {
      panel.hidden = true;
      if (panel.contains(document.activeElement)) document.activeElement.blur();
    },
  };
}
