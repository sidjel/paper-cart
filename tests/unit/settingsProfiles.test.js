import { describe, it, expect } from 'vitest';
import { TUNABLES, getValue, getDefault, setValue, resetAll } from '../../src/config.js';
import {
  GLOBAL_GROUP,
  STARTER_CHARACTER_PROFILES,
  cleanProfileName,
  createProfileStore,
} from '../../src/ui/settingsProfiles.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    _raw: map,
  };
}

describe('profils de réglages nommés (complets + par onglet)', () => {
  it('nettoie et limite les noms de profils', () => {
    expect(cleanProfileName('  Mon   profil  ')).toBe('Mon profil');
    expect(cleanProfileName('   ')).toBe('');
    expect(cleanProfileName('a'.repeat(50)).length).toBe(32);
  });

  it('crée automatiquement les 2 profils pré-enregistrés une seule fois sans les recréer après suppression', () => {
    const storage = memoryStorage();
    const allDefaults = Object.fromEntries(TUNABLES.map((t) => [t.key, getDefault(t.key)]));

    const store1 = createProfileStore(storage);
    store1.ensureStarters(allDefaults);
    expect(store1.list('Personnage').map((p) => p.name)).toEqual(STARTER_CHARACTER_PROFILES.map((s) => s.name));
    expect(store1.list(GLOBAL_GROUP).map((p) => p.name)).toEqual(STARTER_CHARACTER_PROFILES.map((s) => s.name));

    // Suppression volontaire d'un profil de départ : ne doit jamais réapparaître au rechargement
    expect(store1.remove('Personnage', 'starter-papier-net')).toBe(true);
    const store2 = createProfileStore(storage);
    store2.ensureStarters(allDefaults);
    expect(store2.list('Personnage').map((p) => p.id)).toEqual(['starter-paper-mario']);
  });

  it('enregistre et restaure un profil complet couvrant 100 % des onglets sans perte de réglages', () => {
    resetAll();
    const storage = memoryStorage();
    const store = createProfileStore(storage);
    const allKeys = TUNABLES.map((t) => t.key);

    // Modifie des réglages dans plusieurs onglets distincts
    setValue('walk.maxSpeed', 640);
    setValue('character.flipDuration', 0.26);
    setValue('character.paperTwist', 1.45);
    setValue('character.flipShadow', 0.75);
    setValue('character.paperSheen', false);
    setValue('camera.zoom', 1.25);
    setValue('audio.master', 0.6);

    const snap = Object.fromEntries(allKeys.map((k) => [k, getValue(k)]));
    const created = store.create(GLOBAL_GROUP, 'Mon réglage PC', snap);
    expect(created).not.toBeNull();
    expect(Object.keys(created.values).length).toBe(allKeys.length);

    // Remise à zéro puis rechargement depuis un nouveau store (simule un redémarrage navigateur)
    resetAll();
    expect(getValue('walk.maxSpeed')).toBe(getDefault('walk.maxSpeed'));
    expect(getValue('character.paperTwist')).toBe(getDefault('character.paperTwist'));

    const reloaded = createProfileStore(storage);
    const loaded = reloaded.list(GLOBAL_GROUP).find((p) => p.id === created.id);
    expect(loaded).toBeDefined();
    for (const [k, v] of Object.entries(loaded.values)) setValue(k, v);

    expect(getValue('walk.maxSpeed')).toBe(640);
    expect(getValue('character.flipDuration')).toBe(0.26);
    expect(getValue('character.paperTwist')).toBe(1.45);
    expect(getValue('character.flipShadow')).toBe(0.75);
    expect(getValue('character.paperSheen')).toBe(false);
    expect(getValue('camera.zoom')).toBe(1.25);
    expect(getValue('audio.master')).toBe(0.6);
    expect(reloaded.matches(loaded, getValue)).toBe(true);

    // Un changement ultérieur est bien détecté par matches()
    setValue('camera.zoom', 1.4);
    expect(reloaded.matches(loaded, getValue)).toBe(false);
    resetAll();
  });

  it('récupère les profils depuis la copie de secours (.bak) si la clé principale est corrompue', () => {
    const storage = memoryStorage();
    const store = createProfileStore(storage);
    store.create('Personnage', 'Précieux', { 'character.paperTwist': 1.6 });

    // Simule une corruption de la clé principale
    storage.setItem('paper-cart.profils-onglets.v1', '{JSON_CASSE');
    const recovered = createProfileStore(storage);
    expect(recovered.list('Personnage').length).toBe(1);
    expect(recovered.list('Personnage')[0].name).toBe('Précieux');
    expect(recovered.list('Personnage')[0].values['character.paperTwist']).toBe(1.6);
  });

  it('exporte et réimporte tous les profils en JSON sans écraser les profils existants', () => {
    const srcStorage = memoryStorage();
    const src = createProfileStore(srcStorage);
    const pA = src.create(GLOBAL_GROUP, 'Profil A', { 'walk.maxSpeed': 550 });
    src.create('Son', 'Silencieux', { 'audio.muted': true });
    const exported = src.exportJson();

    const dstStorage = memoryStorage();
    const dst = createProfileStore(dstStorage);
    dst.create(GLOBAL_GROUP, 'Déjà là', { 'walk.maxSpeed': 480 });

    const imported = dst.importJson(exported);
    expect(imported).toBe(2);
    expect(dst.list(GLOBAL_GROUP).map((p) => p.name)).toContain('Déjà là');
    expect(dst.list(GLOBAL_GROUP).map((p) => p.name)).toContain('Profil A');
    expect(dst.list('Son')[0].name).toBe('Silencieux');

    // Mise à jour + renommage + suppression
    const renamed = dst.update(GLOBAL_GROUP, pA.id, { name: 'Profil A v2' });
    expect(renamed.name).toBe('Profil A v2');
    expect(dst.remove(GLOBAL_GROUP, pA.id)).toBe(true);
    expect(dst.importJson('pas du json')).toBe(0);
  });

  it('ignore proprement les anciennes clés retirées du menu F2 dans un profil déjà sauvegardé', () => {
    resetAll();
    const storage = memoryStorage();
    const store = createProfileStore(storage);
    const oldProfile = store.create('Personnage', 'Ancien profil', {
      'character.flipDuration': getDefault('character.flipDuration'),
      'character.smoothTurns': true,
      'places.style': 'mist',
      'audio.musicTrack': 'airport-lounge',
    });
    expect(store.matches(oldProfile, getValue)).toBe(true);
    setValue('character.flipDuration', 0.35);
    expect(store.matches(oldProfile, getValue)).toBe(false);
    resetAll();
  });
});
