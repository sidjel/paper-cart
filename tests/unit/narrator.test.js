import { describe, it, expect } from 'vitest';
import { createNarrator, narrate, stepNarrator, skipNarrator, stepIdle } from '../../src/core/narrator.js';
import file from '../../src/data/narrator.json';

const P = { enabled: true, speed: 40, hold: 2, holdPerChar: 0, minGap: 20, lineCooldown: 600, inactivity: 30 };
const DATA = {
  triggers: { arrivee: { once: true, strong: true }, scan: { every: 3 }, idle: {} },
  lines: [
    { id: 'a', trigger: 'arrivee', text: 'Bonjour' },
    { id: 's1', trigger: 'scan', text: 'Un' },
    { id: 's2', trigger: 'scan', text: 'Deux' },
    { id: 'i1', trigger: 'idle', text: 'Zzz' },
  ],
};
// Avance le temps de jeu de `s` secondes par pas de 1/60 s.
function run(n, s) {
  for (let t = 0; t < s; t += 1 / 60) stepNarrator(n, 1 / 60, P);
}

describe('narrateur : quand parler', () => {
  it('un moment fort coupe la réplique en cours (le premier scan n’est jamais perdu)', () => {
    const n = createNarrator();
    narrate(n, DATA, 'idle', P);
    expect(narrate(n, DATA, 'arrivee', P).id).toBe('a');
    expect(n.line.id).toBe('a');
  });
  it('« once » : une seule fois ; un moment ordinaire ne coupe pas une réplique en cours', () => {
    const n = createNarrator();
    expect(narrate(n, DATA, 'arrivee', P).id).toBe('a');
    expect(narrate(n, DATA, 'scan', P)).toBe(null); // il parle déjà
    run(n, 10);
    expect(narrate(n, DATA, 'arrivee', P)).toBe(null);
  });
  it('« every: 3 » : la 1re, la 4e, la 7e occurrence…', () => {
    const n = createNarrator();
    const said = [];
    const Q = { ...P, lineCooldown: 0 }; // ici, seule la règle « every » compte
    for (let k = 0; k < 7; k++) {
      said.push(!!narrate(n, DATA, 'scan', Q));
      run(n, 30); // assez pour finir la réplique et respecter l'écart minimal
    }
    expect(said).toEqual([true, false, false, true, false, false, true]);
  });
  it('écart minimal entre deux prises de parole, sauf moment fort', () => {
    const n = createNarrator();
    narrate(n, DATA, 'idle', P);
    run(n, 5); // réplique finie, mais moins de 20 s depuis
    expect(narrate(n, DATA, 'idle', P)).toBe(null);
    expect(narrate(n, DATA, 'arrivee', P)?.id).toBe('a'); // fort : passe quand même
  });
  it('anti-répétition : la réplique dite il y a le plus longtemps, jamais deux fois en 600 s', () => {
    const n = createNarrator();
    const ids = [];
    for (let k = 0; k < 7; k++) {
      const l = narrate(n, DATA, 'scan', P);
      if (l) ids.push(l.id);
      run(n, 30);
    }
    expect(ids).toEqual(['s1', 's2']); // la 3e fois, les deux sont encore « récentes » : il se tait
  });
  it('désactivé : il ne dit rien', () => {
    expect(narrate(createNarrator(), DATA, 'arrivee', { ...P, enabled: false })).toBe(null);
  });
});

describe('narrateur : machine à écrire', () => {
  it('les lettres apparaissent au rythme réglé, puis la réplique reste, puis disparaît', () => {
    const n = createNarrator();
    narrate(n, DATA, 'arrivee', P); // 7 lettres à 40 lettres/s ≈ 0,18 s
    let letters = 0;
    for (let k = 0; k < 7; k++) letters += stepNarrator(n, 1 / 60, P); // 7/60 s × 40 ≈ 4,7 lettres
    expect(Math.floor(n.shown)).toBe(4);
    expect(letters).toBe(4);
    run(n, 0.2);
    expect(n.shown).toBe(7);
    expect(n.line).not.toBe(null);
    run(n, 2.1);
    expect(n.line).toBe(null);
  });
  it('toucher la bande : texte entier, puis disparition', () => {
    const n = createNarrator();
    narrate(n, DATA, 'arrivee', P);
    skipNarrator(n, P);
    expect(n.shown).toBe(7);
    skipNarrator(n, P);
    expect(n.line).toBe(null);
  });
  it('inactivité : un seul signal par période sans action', () => {
    const n = createNarrator();
    let fired = 0;
    for (let t = 0; t < 70; t += 0.5) if (stepIdle(n, 0.5, false, P)) fired++;
    expect(fired).toBe(1);
    stepIdle(n, 0.5, true, P);
    for (let t = 0; t < 31; t += 0.5) if (stepIdle(n, 0.5, false, P)) fired++;
    expect(fired).toBe(2);
  });
});

describe('répliques du narrateur (données)', () => {
  it('chaque réplique a un moment connu, un identifiant unique et le préfixe [TEMP]', () => {
    const ids = new Set();
    for (const l of file.lines) {
      expect(file.triggers[l.trigger], l.id).toBeDefined();
      expect(ids.has(l.id), l.id).toBe(false);
      ids.add(l.id);
      expect(l.text.startsWith('[TEMP] '), l.id).toBe(true);
    }
  });
  it('chaque moment a au moins une réplique', () => {
    for (const tr of Object.keys(file.triggers)) expect(file.lines.some((l) => l.trigger === tr), tr).toBe(true);
  });
  it('le fil « Client » → « Article non référencé » est présent', () => {
    const all = file.lines.map((l) => l.text).join(' ');
    expect(all).toContain('Client');
    expect(all).toContain('Article non référencé');
  });
});
