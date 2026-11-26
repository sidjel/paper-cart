// Profils de réglages nommés (complets tous onglets ET par onglet) pour le panneau développeur (F2).
// Logique pure + persistance robuste dans localStorage avec copie de secours (.bak) et export/import JSON.

const PROFILES_KEY = 'paper-cart.profils-onglets.v1';
const PROFILES_BAK_KEY = 'paper-cart.profils-onglets.v1.bak';
const SEEDED_KEY = 'paper-cart.profils-seeded.v1';
export const GLOBAL_GROUP = '__global__';

// Deux profils prêts à l'emploi créés automatiquement au premier démarrage (modifiables/supprimables).
export const STARTER_CHARACTER_PROFILES = [
  {
    id: 'starter-papier-net',
    name: 'Papier net & cohérent',
    values: {
      'character.flipDuration': 0.16,
      'character.edgeThickness': 0.08,
      'character.flipOnFrontBack': true,
      'character.flipAllDirs': false,
      'character.turnFlipDuration': 0.12,
      'character.paperTwist': 1.0,
      'character.flipShadow': 0.55,
      'character.paperSheen': false,
      'character.smoothTurns': true,
    },
  },
  {
    id: 'starter-paper-mario',
    name: 'Paper Mario complet',
    values: {
      'character.flipDuration': 0.18,
      'character.edgeThickness': 0.1,
      'character.flipOnFrontBack': true,
      'character.flipAllDirs': true,
      'character.turnFlipDuration': 0.13,
      'character.paperTwist': 1.25,
      'character.flipShadow': 0.65,
      'character.paperSheen': true,
      'character.smoothTurns': true,
    },
  },
];

function parseObject(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readStore(storage) {
  if (!storage) return {};
  const primary = parseObject(storage.getItem(PROFILES_KEY));
  if (primary) return primary;
  const backup = parseObject(storage.getItem(PROFILES_BAK_KEY));
  if (backup) {
    writeStore(storage, backup);
    return backup;
  }
  return {};
}

function writeStore(storage, data) {
  if (!storage) return;
  try {
    const json = JSON.stringify(data);
    storage.setItem(PROFILES_KEY, json);
    storage.setItem(PROFILES_BAK_KEY, json);
  } catch {
    /* navigation privée ou quota : pas de sauvegarde */
  }
}

export function cleanProfileName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32);
}

function validProfiles(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.values && typeof p.values === 'object');
}

export function createProfileStore(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  const data = readStore(storage);

  function list(group) {
    return validProfiles(data[group]);
  }

  function saveGroup(group, arr) {
    data[group] = arr;
    writeStore(storage, data);
  }

  // Injecte une seule fois les 2 profils de départ (Personnage + Profils complets) sans jamais écraser
  // ni recréer un profil supprimé volontairement par l'utilisateur.
  function ensureStarters(allDefaults) {
    if (storage) {
      try {
        if (storage.getItem(SEEDED_KEY) === '1') return;
      } catch {
        /* ignore */
      }
    }
    const charArr = [...list('Personnage')];
    for (const st of STARTER_CHARACTER_PROFILES) {
      if (!charArr.some((p) => p.id === st.id || p.name === st.name)) {
        charArr.push({ id: st.id, name: st.name, values: { ...st.values } });
      }
    }
    data.Personnage = charArr;

    if (allDefaults && typeof allDefaults === 'object') {
      const globArr = [...list(GLOBAL_GROUP)];
      for (const st of STARTER_CHARACTER_PROFILES) {
        const gid = `global-${st.id}`;
        if (!globArr.some((p) => p.id === gid || p.name === st.name)) {
          globArr.push({ id: gid, name: st.name, values: { ...allDefaults, ...st.values } });
        }
      }
      data[GLOBAL_GROUP] = globArr;
    }

    writeStore(storage, data);
    if (storage) {
      try {
        storage.setItem(SEEDED_KEY, '1');
      } catch {
        /* ignore */
      }
    }
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
    const entries = Object.entries(profile.values);
    if (entries.length === 0) return false;
    return entries.every(([k, v]) => getValue(k) === v);
  }

  function exportJson() {
    const out = {};
    for (const [g, arr] of Object.entries(data)) {
      const clean = validProfiles(arr);
      if (clean.length > 0) out[g] = clean;
    }
    return JSON.stringify(out, null, 2);
  }

  function importJson(raw) {
    const parsed = parseObject(raw);
    if (!parsed) return 0;
    let count = 0;
    for (const [g, arr] of Object.entries(parsed)) {
      const incoming = validProfiles(arr);
      if (incoming.length === 0) continue;
      const cur = [...list(g)];
      for (const p of incoming) {
        const name = cleanProfileName(p.name);
        if (!name) continue;
        const clean = { id: p.id, name, values: { ...p.values } };
        const idx = cur.findIndex((x) => x.id === clean.id);
        if (idx >= 0) cur[idx] = clean;
        else cur.push(clean);
        count++;
      }
      data[g] = cur;
    }
    if (count > 0) writeStore(storage, data);
    return count;
  }

  return { list, ensureStarters, create, update, remove, matches, exportJson, importJson };
}
