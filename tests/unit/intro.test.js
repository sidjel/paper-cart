import { describe, it, expect } from 'vitest';
import { createIntro, stepIntro, lineOpacity, blackOpacity, skipLine, skipAll } from '../../src/core/intro.js';
import lines from '../../src/data/intro.json' with { type: 'json' };

const P = { fadeIn: 1, fadeOut: 1, endHold: 0, endFade: 2 };
const L = [{ text: 'A', hold: 1 }, { text: 'B', hold: 1 }];
const run = (it, s) => {
  const started = [];
  for (let t = 0; t < s; t += 1 / 60) {
    const k = stepIntro(it, 1 / 60, P);
    if (k >= 0) started.push(k);
  }
  return started;
};

describe('intro (texte blanc sur noir)', () => {
  it('chaque ligne apparaît, reste, s’efface, puis le noir s’efface sur la partie', () => {
    const it0 = createIntro(L);
    expect(run(it0, 0.5)).toEqual([0]); // la 1re ligne commence (son)
    expect(lineOpacity(it0, P)).toBeCloseTo(0.5, 1);
    run(it0, 1);
    expect(lineOpacity(it0, P)).toBe(1);
    expect(run(it0, 2)).toEqual([1]); // la 2e ligne commence
    run(it0, 3);
    expect(it0.phase).toBe('end');
    expect(blackOpacity(it0, P)).toBeLessThan(1);
    run(it0, 2.1);
    expect(it0.done).toBe(true);
    expect(blackOpacity(it0, P)).toBe(0);
  });
  it('toucher passe à la ligne suivante ; « Passer » va directement au fondu final', () => {
    const it0 = createIntro(L);
    run(it0, 0.1);
    skipLine(it0);
    expect(it0.i).toBe(1);
    skipAll(it0);
    expect(it0.phase).toBe('end');
    expect(lineOpacity(it0, P)).toBe(0);
  });
  it('les lignes de l’intro ont un texte et une durée', () => {
    expect(lines.lines.length).toBeGreaterThan(0);
    for (const l of lines.lines) {
      expect(typeof l.text).toBe('string');
      expect(l.hold).toBeGreaterThan(0);
    }
  });
});

describe('fin de l’intro : le noir reste plein un instant (séance 68)', () => {
  it('pendant endHold, le noir est plein (la scène se prépare derrière) ; ensuite il s’efface ; puis c’est fini', async () => {
    const { createIntro, stepIntro, blackOpacity, skipAll } = await import('../../src/core/intro.js');
    const p = { fadeIn: 1, fadeOut: 1, endHold: 0.3, endFade: 2 };
    const it = createIntro([{ text: 'a', hold: 1 }]);
    skipAll(it);
    stepIntro(it, 0.2, p);
    expect(blackOpacity(it, p)).toBe(1);
    stepIntro(it, 0.2, p); // 0,4 s
    expect(blackOpacity(it, p)).toBeLessThan(1);
    stepIntro(it, 2, p);
    expect(it.done).toBe(true);
  });
});
