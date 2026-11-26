import { describe, it, expect } from 'vitest';
import { cleanProfileName, createProfileStore } from '../../src/ui/settingsProfiles.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

describe('profils de réglages nommés par onglet (ui/settingsProfiles.js)', () => {
  it('nettoie et limite les noms de profils', () => {
    expect(cleanProfileName('  Mon   profil  ')).toBe('Mon profil');
    expect(cleanProfileName('   ')).toBe('');
    expect(cleanProfileName('a'.repeat(50)).length).toBe(32);
  });

  it('crée, met à jour, renomme, supprime et persiste les profils par onglet', () => {
    const storage = memoryStorage();
    const store = createProfileStore(storage);

    expect(store.list('Personnage')).toEqual([]);
    const p1 = store.create('Personnage', 'Paper Mario PC', { 'character.flipDuration': 0.16, 'character.paperSheen': true });
    expect(p1).not.toBeNull();
    expect(p1.name).toBe('Paper Mario PC');
    expect(store.list('Personnage').length).toBe(1);
    expect(store.list('Marche').length).toBe(0);

    // Persistance dans un nouveau store lisant le même storage
    const reloaded = createProfileStore(storage);
    expect(reloaded.list('Personnage')[0].name).toBe('Paper Mario PC');
    expect(reloaded.matches(reloaded.list('Personnage')[0], (k) => ({ 'character.flipDuration': 0.16, 'character.paperSheen': true }[k]))).toBe(true);
    expect(reloaded.matches(reloaded.list('Personnage')[0], (k) => ({ 'character.flipDuration': 0.20, 'character.paperSheen': true }[k]))).toBe(false);

    // Mise à jour des valeurs et renommage
    const updated = reloaded.update('Personnage', p1.id, { name: 'Rendu net', values: { 'character.flipDuration': 0.14 } });
    expect(updated.name).toBe('Rendu net');
    expect(updated.values['character.flipDuration']).toBe(0.14);

    // Suppression
    expect(reloaded.remove('Personnage', p1.id)).toBe(true);
    expect(reloaded.list('Personnage')).toEqual([]);
    expect(reloaded.remove('Personnage', 'inconnu')).toBe(false);
  });
});
