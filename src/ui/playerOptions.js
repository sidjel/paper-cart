// Options du joueur (depuis l'écran titre) : assorties à l'écran titre (noir, touches de bleu clair),
// sans les réglages de développement. Les réglages viennent de TUNABLES (src/config.js) : mêmes
// valeurs que le panneau ⚙, enregistrées de la même façon.
// Doigt, souris, clavier et manette : haut/bas pour choisir, gauche/droite pour changer, A ou Entrée
// pour cocher, B ou Échap pour revenir.

import { TUNABLES, getValue, setValue, onConfigChange } from '../config.js';

const SECTIONS = [
  ['Son', ['audio.muted', 'audio.master', 'audio.music', 'audio.steps', 'audio.scanVolume', 'audio.voiceVolume', 'audio.heroVolume']],
  ['Affichage', ['display.fullscreenMode', 'display.crt', 'display.crtStrength']],
  ['Accessibilité', ['access.textSize', 'narrator.speed', 'access.vibration', 'access.brightness', 'access.contrast', 'display.reduceMotion']],
  ['Jeu', ['narrator.enabled', 'input.virtualJoystick']],
];

function format(t, v) {
  if (t.type === 'bool' || t.type === 'choice') return '';
  if (t.min === 0 && t.max === 1 && !t.unit) return `${Math.round(v * 100)} %`; // volumes, forces
  const d = t.step < 0.1 ? 2 : t.step < 1 ? 1 : 0;
  return `${Number(v).toFixed(d)}${t.unit ? ` ${t.unit}` : ''}`;
}

export function createPlayerOptions(root, { onClose }) {
  const el = document.createElement('div');
  el.className = 'player-options';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Options');
  const title = document.createElement('h2');
  title.textContent = 'Options';
  const list = document.createElement('div');
  list.className = 'po-list';
  const back = document.createElement('button');
  back.className = 'po-back';
  back.textContent = 'Retour';
  back.addEventListener('click', () => onClose());
  el.append(title, list, back);
  root.appendChild(el);

  const rows = []; // { t, input, out }
  for (const [name, keys] of SECTIONS) {
    const h = document.createElement('h3');
    h.textContent = name;
    list.appendChild(h);
    for (const key of keys) {
      const t = TUNABLES.find((x) => x.key === key);
      if (!t) continue;
      const row = document.createElement('label');
      row.className = 'po-row';
      const label = document.createElement('span');
      label.className = 'po-label';
      label.textContent = t.label;
      let input;
      if (t.type === 'bool') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.addEventListener('change', () => setValue(key, input.checked));
      } else if (t.type === 'choice') {
        input = document.createElement('select');
        for (const [value, text] of t.options) input.add(new Option(text, value));
        input.addEventListener('change', () => setValue(key, input.value));
      } else {
        input = document.createElement('input');
        input.type = 'range';
        input.min = t.min;
        input.max = t.max;
        input.step = t.step;
        input.addEventListener('input', () => setValue(key, Number(input.value)));
      }
      input.dataset.key = key;
      const out = document.createElement('span');
      out.className = 'po-value';
      row.append(label, input, out);
      list.appendChild(row);
      rows.push({ t, input, out });
    }
  }
  const focusables = [...rows.map((r) => r.input), back];

  function refresh() {
    for (const { t, input, out } of rows) {
      const v = getValue(t.key);
      if (t.type === 'bool') input.checked = v;
      else input.value = v;
      out.textContent = format(t, v);
    }
  }
  onConfigChange(() => {
    if (!el.hidden) refresh();
  });

  let focus = 0;
  function focusAt(i) {
    focus = (i + focusables.length) % focusables.length;
    focusables[focus].focus({ preventScroll: false });
  }
  // Clavier dans le panneau : haut/bas passent d'un réglage à l'autre (gauche/droite gardent leur rôle
  // habituel sur les curseurs et les listes).
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    e.stopPropagation();
    const i = focusables.indexOf(document.activeElement);
    focusAt((i < 0 ? focus : i) + (e.key === 'ArrowUp' ? -1 : 1));
  });

  return {
    open() {
      refresh();
      el.hidden = false;
      focusAt(0);
    },
    close() {
      el.hidden = true;
    },
    get open_() {
      return !el.hidden;
    },
    // Clavier, manette : haut/bas (choisir), gauche/droite (changer), A (cocher, valider).
    move(dir) {
      const i = focusables.indexOf(document.activeElement);
      focusAt((i < 0 ? focus : i) + dir);
    },
    adjust(dir) {
      const r = rows.find((x) => x.input === document.activeElement);
      if (!r) return;
      const { t, input } = r;
      if (t.type === 'bool') setValue(t.key, !getValue(t.key));
      else if (t.type === 'choice') {
        const values = t.options.map((o) => o[0]);
        const k = values.indexOf(getValue(t.key));
        setValue(t.key, values[(k + dir + values.length) % values.length]);
      } else {
        const v = Math.min(t.max, Math.max(t.min, Number(getValue(t.key)) + dir * t.step));
        setValue(t.key, Math.round(v / t.step) * t.step);
      }
      input.focus();
    },
    press() {
      const a = document.activeElement;
      if (a === back) onClose();
      else if (a?.type === 'checkbox') a.click();
    },
  };
}
