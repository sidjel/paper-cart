import { describe, it, expect } from 'vitest';
import { createDizzy, stepDizzy, dizzyActive } from '../../src/core/dizzy.js';

const P = { enabled: true, flips: 6, window: 3, duration: 3.5, cooldown: 60 };
// Le héros change de sens toutes les `every` secondes, pendant `secs` secondes ; renvoie les débuts du tournis.
function wiggle(d, from, secs, every, p = P) {
  const starts = [];
  let facing = 1;
  for (let t = from; t < from + secs; t += 1 / 60) {
    if (Math.floor((t - from) / every) % 2 === 1) facing = -1;
    else facing = 1;
    if (stepDizzy(d, t, facing, true, p)) starts.push(t);
  }
  return starts;
}

describe('le tournis', () => {
  it('6 demi-tours en moins de 3 s : il commence ; les étoiles durent 3,5 s', () => {
    const d = createDizzy();
    const s = wiggle(d, 0, 4, 0.4);
    expect(s.length).toBe(1);
    expect(s[0]).toBeLessThan(3);
    expect(dizzyActive(d, s[0] + 3)).toBe(true);
    expect(dizzyActive(d, s[0] + 3.6)).toBe(false);
  });
  it('des demi-tours lents (un par seconde) : rien', () => {
    expect(wiggle(createDizzy(), 0, 12, 1).length).toBe(0);
  });
  it('pas deux fois de suite : 60 s d’attente, puis il peut revenir', () => {
    const d = createDizzy();
    expect(wiggle(d, 0, 20, 0.3).length).toBe(1);
    expect(wiggle(d, 70, 4, 0.3).length).toBe(1);
    expect(d.count).toBe(2);
  });
  it('à l’arrêt, se retourner ne compte pas ; désactivé : rien', () => {
    const d = createDizzy();
    let n = 0;
    for (let k = 0; k < 20; k++) n += stepDizzy(d, k * 0.1, k % 2 ? 1 : -1, false, P) ? 1 : 0;
    expect(n).toBe(0);
    expect(wiggle(createDizzy(), 0, 4, 0.3, { ...P, enabled: false }).length).toBe(0);
  });
});
