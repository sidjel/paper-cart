// Interface DOM des profils de réglages dans le panneau développeur (F2) :
// - barre de profils par onglet (en haut à droite de chaque onglet) ;
// - vue complète de l'onglet bleu « Profils » (tous les onglets + sauvegarde/import JSON).

import { GLOBAL_GROUP } from './settingsProfiles.js';

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

export function createGlobalProfilesView(store, allKeys, { getValue, setValue, onProfilesChange }) {
  const box = document.createElement('div');
  box.className = 'global-profiles';

  const intro = document.createElement('p');
  intro.className = 'global-profiles-intro';
  intro.textContent = 'Un profil complet enregistre l’ensemble des réglages de tous les onglets. Vous pouvez aussi créer des profils par onglet en haut à droite de chaque onglet.';

  const createForm = document.createElement('form');
  createForm.className = 'global-profiles-create';
  const createInput = document.createElement('input');
  createInput.type = 'text';
  createInput.maxLength = 32;
  createInput.placeholder = 'Nom du nouveau profil complet…';
  createInput.setAttribute('aria-label', 'Nom du nouveau profil complet');
  const createBtn = document.createElement('button');
  createBtn.type = 'submit';
  createBtn.className = 'settings-profile-btn primary';
  createBtn.textContent = '+ Enregistrer tous les onglets';
  createForm.append(createInput, createBtn);

  const status = document.createElement('p');
  status.className = 'settings-profile-status';

  const listEl = document.createElement('div');
  listEl.className = 'global-profiles-list';

  const backupBar = document.createElement('div');
  backupBar.className = 'global-profiles-backup';
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'settings-profile-btn';
  exportBtn.textContent = 'Copier tous les profils (JSON)';
  const importToggle = document.createElement('button');
  importToggle.type = 'button';
  importToggle.className = 'settings-profile-btn';
  importToggle.textContent = 'Importer (JSON)';
  backupBar.append(exportBtn, importToggle);

  const importForm = document.createElement('form');
  importForm.className = 'global-profiles-import';
  importForm.hidden = true;
  const importArea = document.createElement('textarea');
  importArea.rows = 4;
  importArea.placeholder = 'Collez ici le JSON exporté…';
  const importOk = document.createElement('button');
  importOk.type = 'submit';
  importOk.className = 'settings-profile-btn primary';
  importOk.textContent = 'Restaurer';
  const importCancel = document.createElement('button');
  importCancel.type = 'button';
  importCancel.className = 'settings-profile-btn';
  importCancel.textContent = 'Annuler';
  importForm.append(importArea, importOk, importCancel);

  box.append(intro, createForm, status, listEl, backupBar, importForm);

  let activeId = '';
  let renamingId = '';
  let confirmDeleteId = '';
  let timer = null;

  function snapshotAll() {
    const vals = {};
    for (const k of allKeys) vals[k] = getValue(k);
    return vals;
  }

  function flash(msg) {
    status.textContent = msg;
    clearTimeout(timer);
    timer = setTimeout(() => {
      status.textContent = '';
    }, 2600);
  }

  function refresh() {
    const items = store.list(GLOBAL_GROUP);
    if (activeId && !items.some((p) => p.id === activeId)) activeId = '';
    listEl.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'global-profiles-empty';
      empty.textContent = 'Aucun profil complet enregistré pour l’instant.';
      listEl.appendChild(empty);
      return;
    }

    for (const prof of items) {
      const exact = store.matches(prof, getValue);
      const card = document.createElement('div');
      card.className = 'global-profile-card';
      if (exact) card.classList.add('is-active');

      const head = document.createElement('div');
      head.className = 'global-profile-head';

      if (renamingId === prof.id) {
        const f = document.createElement('form');
        f.className = 'settings-profile-editor';
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 32;
        inp.value = prof.name;
        const ok = document.createElement('button');
        ok.type = 'submit';
        ok.className = 'settings-profile-btn primary';
        ok.textContent = 'Valider';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'settings-profile-btn';
        cancel.textContent = 'Annuler';
        cancel.addEventListener('click', () => {
          renamingId = '';
          refresh();
        });
        f.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const res = store.update(GLOBAL_GROUP, prof.id, { name: inp.value });
          if (res) {
            renamingId = '';
            flash(`Profil renommé en « ${res.name} » ✓`);
            onProfilesChange();
          }
        });
        f.append(inp, ok, cancel);
        head.appendChild(f);
        queueMicrotask(() => {
          inp.focus();
          inp.select();
        });
      } else {
        const title = document.createElement('span');
        title.className = 'global-profile-name';
        title.textContent = prof.name;
        const badge = document.createElement('span');
        badge.className = 'global-profile-badge';
        badge.textContent = exact ? 'Actif' : (prof.id === activeId ? 'Modifié' : `${Object.keys(prof.values).length} réglages`);
        head.append(title, badge);
      }

      const actions = document.createElement('div');
      actions.className = 'global-profile-actions';

      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'settings-profile-btn primary';
      loadBtn.textContent = 'Charger';
      loadBtn.addEventListener('click', () => {
        activeId = prof.id;
        confirmDeleteId = '';
        for (const [k, v] of Object.entries(prof.values)) setValue(k, v);
        flash(`Profil complet « ${prof.name} » chargé ✓`);
        onProfilesChange();
      });

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'settings-profile-btn';
      saveBtn.textContent = 'Mettre à jour';
      saveBtn.title = 'Enregistrer tous les réglages actuels dans ce profil';
      saveBtn.addEventListener('click', () => {
        const res = store.update(GLOBAL_GROUP, prof.id, { values: snapshotAll() });
        if (res) {
          activeId = prof.id;
          confirmDeleteId = '';
          flash(`Profil « ${res.name} » mis à jour ✓`);
          onProfilesChange();
        }
      });

      const renameBtn = document.createElement('button');
      renameBtn.type = 'button';
      renameBtn.className = 'settings-profile-btn';
      renameBtn.textContent = 'Renommer';
      renameBtn.addEventListener('click', () => {
        renamingId = prof.id;
        confirmDeleteId = '';
        refresh();
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'settings-profile-btn danger';
      delBtn.textContent = confirmDeleteId === prof.id ? 'Confirmer ?' : 'Supprimer';
      delBtn.addEventListener('click', () => {
        if (confirmDeleteId !== prof.id) {
          confirmDeleteId = prof.id;
          refresh();
          return;
        }
        if (store.remove(GLOBAL_GROUP, prof.id)) {
          confirmDeleteId = '';
          if (activeId === prof.id) activeId = '';
          flash(`Profil « ${prof.name} » supprimé`);
          onProfilesChange();
        }
      });

      actions.append(loadBtn, saveBtn, renameBtn, delBtn);
      card.append(head, actions);
      listEl.appendChild(card);
    }
  }

  createForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const created = store.create(GLOBAL_GROUP, createInput.value, snapshotAll());
    if (!created) return;
    activeId = created.id;
    createInput.value = '';
    flash(`Profil complet « ${created.name} » créé ✓`);
    onProfilesChange();
  });

  exportBtn.addEventListener('click', async () => {
    const json = store.exportJson();
    try {
      await navigator.clipboard.writeText(json);
      flash('Tous les profils copiés dans le presse-papiers ✓');
    } catch {
      importForm.hidden = false;
      importArea.value = json;
      importArea.select();
      flash('JSON affiché ci-dessous pour copie manuelle');
    }
  });

  importToggle.addEventListener('click', () => {
    importForm.hidden = !importForm.hidden;
    if (!importForm.hidden) {
      importArea.value = '';
      importArea.focus();
    }
  });

  importCancel.addEventListener('click', () => {
    importForm.hidden = true;
    importArea.value = '';
  });

  importForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const n = store.importJson(importArea.value);
    if (n > 0) {
      importForm.hidden = true;
      importArea.value = '';
      flash(`${n} profil(s) importé(s) ✓`);
      onProfilesChange();
    } else {
      flash('JSON invalide ou aucun profil trouvé');
    }
  });

  refresh();
  return { el: box, refresh };
}
