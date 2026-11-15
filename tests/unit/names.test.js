import { describe, it, expect } from 'vitest';
import { cleanName, playerName, fillName, OTHER, MAX_NAME } from '../../src/core/names.js';
import file from '../../src/data/joueur.json' with { type: 'json' };
import narrator from '../../src/data/narrator.json' with { type: 'json' };

describe('nom du joueur', () => {
  it('par défaut « Épaisseur » ; un nom de la liste ; ou le nom tapé', () => {
    expect(playerName(file.names, 'epaisseur', '')).toEqual({ name: 'Épaisseur', mon: 'mon' });
    expect(playerName(file.names, 'moitie', '')).toEqual({ name: 'Moitié', mon: 'ma' });
    expect(playerName(file.names, OTHER, '  Sid  ')).toEqual({ name: 'Sid', mon: '' });
    expect(playerName(file.names, OTHER, '   ')).toEqual({ name: 'Épaisseur', mon: 'mon' }); // rien tapé
    expect(playerName(file.names, 'inconnu', '')).toEqual({ name: 'Épaisseur', mon: 'mon' });
  });
  it('un nom tapé est nettoyé et limité', () => {
    expect(cleanName('<b>Zoé</b>{x}')).toBe('bZoé/bx');
    expect(cleanName('a'.repeat(40)).length).toBe(MAX_NAME);
  });
  it('les repères dans les répliques', () => {
    const t = 'Hé, {mon nom}… {Mon… nom}. Toi, {nom} ?';
    expect(fillName(t, { name: 'Épaisseur', mon: 'mon' })).toBe('Hé, mon Épaisseur… Mon… Épaisseur. Toi, Épaisseur ?');
    expect(fillName(t, { name: 'Moitié', mon: 'ma' })).toBe('Hé, ma Moitié… Ma… Moitié. Toi, Moitié ?');
    expect(fillName(t, { name: 'Sid', mon: '' })).toBe('Hé, Sid… … Sid. Toi, Sid ?');
  });
  it('chaque nom a un identifiant unique et un possessif ; les répliques n’emploient que des repères connus', () => {
    const ids = new Set(file.names.map((n) => n.id));
    expect(ids.size).toBe(file.names.length);
    expect(file.names[0].id).toBe('epaisseur');
    for (const n of file.names) expect(['mon', 'ma']).toContain(n.mon);
    // Tous les textes (répliques, réponses, conversations), puis les repères qu'ils contiennent.
    const texts = [];
    const walk = (o) => {
      if (typeof o === 'string') texts.push(o);
      else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (k !== 'comment') walk(v);
    };
    walk(narrator.lines);
    const all = texts.join(' ');
    for (const m of all.match(/\{[^}]*\}/g) ?? []) expect(['{mon nom}', '{Mon… nom}', '{nom}']).toContain(m);
    expect(all).toContain('{mon nom}');
  });
});
