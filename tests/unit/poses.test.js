import { describe, it, expect } from 'vitest';
import { createPoses } from '../../src/scene/poses.js';

// Fausses images (le mécanisme ne touche qu'à hidden et style.opacity).
const images = { get: (url) => ({ el: { src: url, hidden: false, style: {} } }) };
const parent = { appendChild() {} };

describe('poses : une seule montrée, préchauffage (séance 68)', () => {
  it('préchauffage : toutes les poses montrées presque transparentes pendant quelques images, puis cachées ; la pose affichée reste nette', () => {
    const p = createPoses(images, parent, [10, 10], 'x');
    const a = p.el('a');
    const b = p.el('b');
    const c = p.el('c');
    p.show(a);
    p.warm(2);
    expect([b.hidden, b.style.opacity, c.hidden]).toEqual([false, '0.01', false]);
    expect([a.hidden, a.style.opacity ?? '']).toEqual([false, '']);
    p.tick();
    expect(b.hidden).toBe(false);
    p.tick(); // fin
    expect([b.hidden, b.style.opacity, c.hidden]).toEqual([true, '', true]);
    expect(a.hidden).toBe(false);
  });
  it('une pose montrée pendant le préchauffage est nette (pas transparente)', () => {
    const p = createPoses(images, parent, [10, 10], 'x');
    const a = p.el('a');
    const b = p.el('b');
    p.show(a);
    p.warm(3);
    p.show(b);
    expect([b.hidden, b.style.opacity]).toEqual([false, '']);
    expect(a.hidden).toBe(true);
  });
});
