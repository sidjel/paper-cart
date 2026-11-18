import { describe, it, expect } from 'vitest';
import { createPoses } from '../../src/scene/poses.js';

// Fausses images (le mécanisme ne touche qu'à hidden).
const images = { get: (url) => ({ el: { src: url, hidden: false, style: {} } }) };
const parent = { appendChild() {} };

describe('poses : une seule montrée à la fois (scene/poses.js)', () => {
  it('chaque pose est préparée cachée ; en montrer une cache la précédente ; la même deux fois ne change rien', () => {
    const p = createPoses(images, parent, [10, 10], 'x');
    const a = p.el('a');
    const b = p.el('b');
    expect([a.hidden, b.hidden]).toEqual([true, true]);
    expect(p.show(a)).toBe(true);
    expect(p.show(b)).toBe(true);
    expect([a.hidden, b.hidden]).toEqual([true, false]);
    expect(p.show(b)).toBe(false);
    expect(p.el('a')).toBe(a); // une image par source
  });
});
