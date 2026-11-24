// Panneau de réglages des développeurs (F2 ou bouton « ⚙ », en mode dev seulement), construit d'après
// TUNABLES (src/config.js), avec l'explication de chaque réglage. Les joueurs ont les Options (ui/playerOptions.js).
// Les réglages modifiés sont gardés dans le navigateur (localStorage) d'une partie à l'autre.

import helpFile from '../data/aide-reglages.json';
import { WALK_PRESETS, TUNABLES, getValue, getDefault, setValue, overrides, applyOverrides, resetAll, onConfigChange } from '../config.js';

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
  if (t.type === 'bool' || t.type === 'choice' || t.type === 'text') return '';
  const decimals = t.step < 0.1 ? 2 : t.step < 1 ? 1 : 0;
  return `${Number(v).toFixed(decimals).replace('.', ',')}${t.unit ? ` ${t.unit}` : ''}`;
}

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// onClose : demandé quand on ferme le panneau ; extras : { nomOnglet: élément } ajouté en tête de l'onglet.
export function createSettingsPanel(root, { onClose, extras = {} }) {
  const panel = document.createElement('div');
  panel.className = 'settings panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Réglages');

  const header = document.createElement('div');
  header.className = 'settings-header';
  const title = document.createElement('h2');
  title.textContent = 'Réglages (développeurs)';
  const toolbar = document.createElement('div');
  toolbar.className = 'settings-toolbar';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'settings-search';
  searchInput.placeholder = 'Rechercher un réglage…';
  searchInput.setAttribute('aria-label', 'Rechercher un réglage');
  const changedBtn = document.createElement('button');
  changedBtn.type = 'button';
  changedBtn.className = 'settings-filter-changed';
  changedBtn.setAttribute('aria-pressed', 'false');
  toolbar.append(searchInput, changedBtn);
  header.append(title, toolbar);
  panel.appendChild(header);

  const controls = new Map(); // clé → fonction de mise à jour de l'affichage
  const entries = []; // { key, group, item, searchText, section }
  const startValues = new Map(TUNABLES.filter((t) => t.reload).map((t) => [t.key, getValue(t.key)]));
  let group = null;
  let section = null;
  const TAB_KEY = 'paper-cart.onglet';
  let currentTab = 'Marche';
  try {
    currentTab = localStorage.getItem(TAB_KEY) || 'Marche';
  } catch {
    /* pas de mémoire : premier onglet */
  }
  if (!TUNABLES.some((t) => t.group === currentTab) && !extras[currentTab]) currentTab = TUNABLES[0].group;

  const layout = document.createElement('div');
  layout.className = 'settings-layout';
  const tabBar = document.createElement('div');
  tabBar.className = 'settings-tabs';
  tabBar.setAttribute('role', 'tablist');
  const sectionsHolder = document.createElement('div');
  sectionsHolder.className = 'settings-body';
  const emptyMsg = document.createElement('p');
  emptyMsg.className = 'settings-empty';
  emptyMsg.hidden = true;
  emptyMsg.textContent = 'Aucun réglage ne correspond à ce filtre.';
  sectionsHolder.appendChild(emptyMsg);
  layout.append(tabBar, sectionsHolder);
  panel.appendChild(layout);

  const tabs = [];
  const sections = new Map();
  let onlyChanged = false;

  function applyFilter() {
    const q = normalize(searchInput.value.trim());
    const filtering = q.length > 0 || onlyChanged;
    panel.classList.toggle('is-filtering', filtering);
    let visibleCount = 0;

    if (!filtering) {
      for (const e of entries) e.item.hidden = false;
      for (const [g, tab, sec] of tabs) {
        const on = g === currentTab;
        sec.hidden = !on;
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', on);
        const h = sec.querySelector('.settings-section-title');
        if (h) h.hidden = true;
      }
      emptyMsg.hidden = true;
      return;
    }

    const perGroup = new Map();
    for (const e of entries) {
      const matchText = !q || e.searchText.includes(q);
      const matchChanged = !onlyChanged || getValue(e.key) !== getDefault(e.key);
      const show = matchText && matchChanged;
      e.item.hidden = !show;
      if (show) {
        visibleCount++;
        perGroup.set(e.group, (perGroup.get(e.group) || 0) + 1);
      }
    }
    for (const [g, tab, sec] of tabs) {
      const hasAny = (perGroup.get(g) || 0) > 0;
      sec.hidden = !hasAny;
      tab.classList.toggle('active', false);
      tab.setAttribute('aria-selected', 'false');
      const h = sec.querySelector('.settings-section-title');
      if (h) h.hidden = !hasAny;
    }
    emptyMsg.hidden = visibleCount > 0;
  }

  function showTab(name) {
    currentTab = name;
    if (searchInput.value || onlyChanged) {
      searchInput.value = '';
      onlyChanged = false;
      changedBtn.classList.remove('active');
      changedBtn.setAttribute('aria-pressed', 'false');
    }
    applyFilter();
    sectionsHolder.scrollTop = 0;
    try {
      localStorage.setItem(TAB_KEY, name);
    } catch {
      /* rien */
    }
  }

  const presetButtons = [];
  // Le profil dont toutes les valeurs correspondent aux réglages actuels est mis en évidence.
  function updatePresets() {
    for (const [preset, b] of presetButtons) {
      const active = Object.entries(preset.values).every(([k, v]) => getValue(k) === v);
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active);
    }
  }

  function updateCounters() {
    const ov = overrides();
    const totalChanged = Object.keys(ov).length;
    changedBtn.textContent = totalChanged > 0 ? `Modifiés (${totalChanged})` : 'Modifiés (0)';
    for (const [g, tab] of tabs) {
      const groupKeys = TUNABLES.filter((t) => t.group === g);
      const changedInGroup = groupKeys.filter((t) => getValue(t.key) !== getDefault(t.key)).length;
      if (groupKeys.length > 0) tab.dataset.count = String(groupKeys.length);
      tab.classList.toggle('has-changed', changedInGroup > 0);
    }
  }

  // Onglets sans réglage, seulement un contenu ajouté (par exemple « Départ »).
  const extraOnly = Object.keys(extras).filter((g) => !TUNABLES.some((t) => t.group === g)).map((g) => ({ group: g, key: null }));
  for (const t of [...TUNABLES, ...extraOnly]) {
    if (t.group !== group && sections.has(t.group)) {
      // Thème déjà rencontré plus haut dans la liste : on complète son onglet.
      group = t.group;
      section = sections.get(group);
    } else if (t.group !== group) {
      group = t.group;
      // Un onglet par thème ; une seule section visible à la fois (sauf en recherche).
      section = document.createElement('section');
      section.className = 'settings-section';
      section.dataset.group = group;
      section.hidden = group !== currentTab;
      const heading = document.createElement('h3');
      heading.className = 'settings-section-title';
      heading.textContent = group;
      heading.hidden = true;
      section.appendChild(heading);

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'settings-tab';
      tab.textContent = group;
      tab.setAttribute('role', 'tab');
      const g = group;
      tab.addEventListener('click', () => showTab(g));
      tabBar.appendChild(tab);
      tabs.push([g, tab, section]);
      sectionsHolder.appendChild(section);
      sections.set(group, section);
      if (extras[group]) {
        const extraWrap = document.createElement('div');
        extraWrap.className = 'settings-extra';
        extraWrap.appendChild(extras[group]);
        section.appendChild(extraWrap);
      }
      if (group === 'Marche') {
        // Profils de marche : un toucher règle vitesse, accélération et freinage d'un coup.
        const row = document.createElement('div');
        row.className = 'presets';
        row.append('Profil : ');
        for (const preset of WALK_PRESETS) {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = preset.name;
          b.addEventListener('click', () => {
            for (const [k, v] of Object.entries(preset.values)) setValue(k, v);
          });
          presetButtons.push([preset, b]);
          row.appendChild(b);
        }
        section.appendChild(row);
      }
    }
    if (!t.key) continue; // onglet sans réglage

    const item = document.createElement('div');
    item.className = 'setting-item';

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
    } else if (t.type === 'text') {
      input = document.createElement('input');
      input.type = 'text';
      input.maxLength = t.maxLength ?? 20;
      input.autocomplete = 'off';
      input.addEventListener('change', () => setValue(t.key, input.value));
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

    const resetOne = document.createElement('button');
    resetOne.type = 'button';
    resetOne.className = 'setting-reset';
    resetOne.textContent = '↺';
    resetOne.title = 'Remettre la valeur par défaut';
    resetOne.setAttribute('aria-label', `Réinitialiser ${t.label}`);
    resetOne.hidden = true;
    resetOne.addEventListener('click', (ev) => {
      ev.preventDefault();
      setValue(t.key, getDefault(t.key));
    });

    const valWrap = document.createElement('span');
    valWrap.className = 'setting-meta';
    valWrap.append(out, resetOne);

    row.append(name, input, valWrap);
    item.appendChild(row);

    // Explication du réglage (data/aide-reglages.json), sous son nom.
    const helpText = helpFile.aide[t.key] ?? '';
    const help = document.createElement('p');
    help.className = 'setting-help';
    help.textContent = helpText;
    item.appendChild(help);
    section.appendChild(item);

    entries.push({
      key: t.key,
      group,
      item,
      section,
      searchText: normalize(`${t.group} ${t.label} ${t.key} ${helpText}`),
    });

    controls.set(t.key, () => {
      const v = getValue(t.key);
      if (t.type === 'bool') input.checked = v;
      else input.value = v;
      out.textContent = formatValue(t, v);
      const changed = v !== getDefault(t.key);
      row.classList.toggle('changed', changed);
      item.classList.toggle('changed', changed);
      resetOne.hidden = !changed;
    });
  }

  searchInput.addEventListener('input', () => applyFilter());
  changedBtn.addEventListener('click', () => {
    onlyChanged = !onlyChanged;
    changedBtn.classList.toggle('active', onlyChanged);
    changedBtn.setAttribute('aria-pressed', String(onlyChanged));
    applyFilter();
  });

  const footer = document.createElement('div');
  footer.className = 'settings-footer';

  const note = document.createElement('p');
  note.className = 'settings-note';
  note.hidden = true;
  const reloadBtn = document.createElement('button');
  reloadBtn.type = 'button';
  reloadBtn.textContent = 'Recharger le jeu maintenant';
  reloadBtn.addEventListener('click', () => location.reload());
  note.append('Un réglage ne s’appliquera qu’au rechargement. ', reloadBtn);
  footer.appendChild(note);

  const buttons = document.createElement('div');
  buttons.className = 'panel-buttons';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'Copier mes réglages';
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Tout réinitialiser';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Fermer (Échap)';
  closeBtn.className = 'primary';
  buttons.append(closeBtn, copyBtn, resetBtn);
  footer.appendChild(buttons);
  panel.appendChild(footer);
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
    updatePresets();
    updateCounters();
    if (onlyChanged) applyFilter();
    note.hidden = ![...startValues].some(([k, v]) => getValue(k) !== v);
    save();
  });
  for (const update of controls.values()) update();
  updatePresets();
  updateCounters();
  showTab(currentTab);

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
