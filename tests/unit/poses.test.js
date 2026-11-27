import { describe, it, expect } from 'vitest';
import { createPoses } from '../../src/scene/poses.js';

describe('poses PixiJS : échange de texture sans réaffectation redondante (scene/poses.js)', () => {
  it('résout chaque texture une fois, évite les réaffectations redondantes, et gère hide/show', () => {
    const texA = { id: 'a', width: 480, height: 680 };
    const texB = { id: 'b', width: 240, height: 340 };
    const map = new Map([
      ['a', { texture: texA }],
      ['b', { texture: texB }],
    ]);
    let sets = 0;
    let scale = [1, 1];
    const target = {
      visible: true,
      _texture: null,
      get texture() {
        return this._texture;
      },
      set texture(v) {
        sets++;
        this._texture = v;
      },
      scale: {
        set(x, y) {
          scale = [x, y];
        },
      },
    };

    const p = createPoses(map, target, [240, 340]);
    const a = p.texture('a');
    const b = p.texture('b');
    expect(a).toBe(texA);
    expect(p.texture('a')).toBe(texA);

    expect(p.show(a)).toBe(true);
    expect(target.texture).toBe(texA);
    expect(scale).toEqual([0.5, 0.5]);
    expect(sets).toBe(1);

    // Même texture deux fois : aucun changement.
    expect(p.show(a)).toBe(false);
    expect(sets).toBe(1);

    // Changement de pose : met à jour texture et échelle logique.
    expect(p.show(b)).toBe(true);
    expect(target.texture).toBe(texB);
    expect(scale).toEqual([1, 1]);
    expect(p.current()).toBe(texB);

    // hide() cache la cible et réinitialise la pose affichée.
    p.hide();
    expect(target.visible).toBe(false);
    expect(p.current()).toBeNull();
    expect(p.show(b)).toBe(true);
    expect(target.visible).toBe(true);
  });
});
