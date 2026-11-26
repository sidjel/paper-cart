// Profils de réglages nommés par onglet du panneau développeur (F2).
// Logique pure + persistance localStorage : créer, renommer, mettre à jour, supprimer, comparer.

const PROFILES_KEY = 'paper-cart.profils-onglets.v1';

function readStore(storage) {
  if (!storage) return {};
  try {
    const raw = JSON.parse(storage.getItem(PROFILES_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function writeStore(storage, data) {
  if (!storage) return;
  try {
    storage.setItem(PROFILES_KEY, JSON.stringify(data));
  } catch {
    /* navigation privée ou quota : pas de sauvegarde */
  }
}

export function cleanProfileName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32);
}

export function createProfileStore(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  const data = readStore(storage);

  function list(group) {
    const arr = Array.isArray(data[group]) ? data[group] : [];
    return arr.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.values && typeof p.values === 'object');
  }

  function saveGroup(group, arr) {
    data[group] = arr;
    writeStore(storage, data);
  }

  function create(group, rawName, values) {
    const name = cleanProfileName(rawName);
    if (!name) return null;
    const arr = [...list(group)];
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const profile = { id, name, values: { ...values } };
    arr.push(profile);
    saveGroup(group, arr);
    return profile;
  }

  function update(group, id, { name, values } = {}) {
    const arr = [...list(group)];
    const idx = arr.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const nextName = name !== undefined ? cleanProfileName(name) : arr[idx].name;
    if (!nextName) return null;
    const next = {
      ...arr[idx],
      name: nextName,
      values: values ? { ...values } : { ...arr[idx].values },
    };
    arr[idx] = next;
    saveGroup(group, arr);
    return next;
  }

  function remove(group, id) {
    const prev = list(group);
    const next = prev.filter((p) => p.id !== id);
    if (next.length === prev.length) return false;
    saveGroup(group, next);
    return true;
  }

  function matches(profile, getValue) {
    if (!profile) return false;
    return Object.entries(profile.values).every(([k, v]) => getValue(k) === v);
  }

  return { list, create, update, remove, matches };
}

// Barre de profils nommés en haut à droite d'un onglet (créer, appliquer, mettre à jour, renommer, supprimer).
export function createTabProfilesBar(store, groupName, keys, { getValue, setValue }) {
  const wrap = document.createElement('div');
  wrap.className = 'settings-tab-profiles';

  const row = document.createElement('div');
  row.className = 'settings-profiles-row';

  const select = document.createElement('select');
  select.className = 'settings-profiles-select';
  select.setAttribute('aria-label', `Profils enregistrés pour ${groupName}`);

  const newBtn = document.createElement('button');
  newBtn.type = 'button';
  newBtn.className = 'settings-profile-btn';
  newBtn.textContent = '+ Créer';
  newBtn.title = 'Enregistrer les réglages actuels de cet onglet dans un nouveau profil';

  const updateBtn = document.createElement('button');
  updateBtn.type = 'button';
  updateBtn.className = 'settings-profile-btn';
  updateBtn.textContent = 'Enregistrer';
  updateBtn.title = 'Mettre à jour le profil sélectionné avec les réglages actuels';

  const renameBtn = document.createElement('button');
  renameBtn.type = 'button';
  renameBtn.className = 'settings-profile-btn';
  renameBtn.textContent = 'Renommer';

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'settings-profile-btn danger';
  delBtn.textContent = 'Supprimer';

  const status = document.createElement('span');
  status.className = 'settings-profile-status';

  row.append(select, newBtn, updateBtn, renameBtn, delBtn);

  const editor = document.createElement('form');
  editor.className = 'settings-profile-editor';
  editor.hidden = true;
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.maxLength = 32;
  nameInput.placeholder = 'Nom du profil…';
  nameInput.setAttribute('aria-label', 'Nom du profil');
  const okBtn = document.createElement('button');
  okBtn.type = 'submit';
  okBtn.className = 'settings-profile-btn primary';
  okBtn.textContent = 'Valider';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'settings-profile-btn';
  cancelBtn.textContent = 'Annuler';
  editor.append(nameInput, okBtn, cancelBtn);

  wrap.append(row, editor, status);

  let selectedId = '';
  let editMode = null;
  let pendingDelete = false;
  let statusTimer = null;

  function snapshotValues() {
    const vals = {};
    for (const k of keys) vals[k] = getValue(k);
    return vals;
  }

  function flash(msg) {
    status.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.textContent = '';
    }, 2200);
  }

  function closeEditor() {
    editMode = null;
    editor.hidden = true;
    nameInput.value = '';
  }

  function refresh() {
    const list = store.list(groupName);
    if (selectedId && !list.some((p) => p.id === selectedId)) selectedId = '';
    select.replaceChildren();
    select.add(new Option(list.length ? `Profils (${list.length})…` : 'Aucun profil', ''));
    for (const p of list) {
      const exact = store.matches(p, getValue);
      const label = p.id === selectedId && !exact ? `${p.name} (modifié)` : p.name;
      select.add(new Option(label, p.id));
    }
    select.value = selectedId;
    const hasSel = Boolean(selectedId);
    updateBtn.hidden = !hasSel;
    renameBtn.hidden = !hasSel;
    delBtn.hidden = !hasSel;
    if (!hasSel) {
      pendingDelete = false;
      delBtn.textContent = 'Supprimer';
    }
  }

  select.addEventListener('change', () => {
    selectedId = select.value;
    pendingDelete = false;
    delBtn.textContent = 'Supprimer';
    closeEditor();
    if (!selectedId) {
      refresh();
      return;
    }
    const prof = store.list(groupName).find((p) => p.id === selectedId);
    if (prof) {
      for (const [k, v] of Object.entries(prof.values)) setValue(k, v);
      flash(`Profil « ${prof.name} » chargé`);
    }
    refresh();
  });

  newBtn.addEventListener('click', () => {
    pendingDelete = false;
    delBtn.textContent = 'Supprimer';
    editMode = 'create';
    editor.hidden = false;
    nameInput.value = '';
    nameInput.placeholder = 'Nom du nouveau profil…';
    nameInput.focus();
  });

  updateBtn.addEventListener('click', () => {
    if (!selectedId) return;
    const updated = store.update(groupName, selectedId, { values: snapshotValues() });
    if (updated) {
      flash(`Profil « ${updated.name} » mis à jour ✓`);
      refresh();
    }
  });

  renameBtn.addEventListener('click', () => {
    if (!selectedId) return;
    const prof = store.list(groupName).find((p) => p.id === selectedId);
    if (!prof) return;
    pendingDelete = false;
    delBtn.textContent = 'Supprimer';
    editMode = 'rename';
    editor.hidden = false;
    nameInput.value = prof.name;
    nameInput.placeholder = 'Nouveau nom…';
    nameInput.focus();
    nameInput.select();
  });

  delBtn.addEventListener('click', () => {
    if (!selectedId) return;
    if (!pendingDelete) {
      pendingDelete = true;
      delBtn.textContent = 'Confirmer ?';
      return;
    }
    const prof = store.list(groupName).find((p) => p.id === selectedId);
    if (store.remove(groupName, selectedId)) {
      selectedId = '';
      pendingDelete = false;
      delBtn.textContent = 'Supprimer';
      closeEditor();
      flash(prof ? `Profil « ${prof.name} » supprimé` : 'Profil supprimé');
      refresh();
    }
  });

  cancelBtn.addEventListener('click', () => closeEditor());

  editor.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const raw = nameInput.value;
    if (editMode === 'create') {
      const created = store.create(groupName, raw, snapshotValues());
      if (!created) return;
      selectedId = created.id;
      closeEditor();
      flash(`Profil « ${created.name} » créé ✓`);
      refresh();
    } else if (editMode === 'rename' && selectedId) {
      const renamed = store.update(groupName, selectedId, { name: raw });
      if (!renamed) return;
      closeEditor();
      flash(`Renommé en « ${renamed.name} » ✓`);
      refresh();
    }
  });

  refresh();
  return { el: wrap, refresh };
}
