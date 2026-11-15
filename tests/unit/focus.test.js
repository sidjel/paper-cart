import { describe, it, expect } from 'vitest';
import { focusOwner, heroFree, inGame } from '../../src/core/focus.js';
import { TRANSITIONS } from '../../src/core/state.js';

const NONE = { confirm: false, card: false, name: false, choice: false, scene: false };

describe('qui a la main ?', () => {
  it('dans le Panier : la question d’abord, puis la grande carte, puis le Panier', () => {
    expect(focusOwner('panier', { ...NONE, confirm: true, card: true })).toBe('confirm');
    expect(focusOwner('panier', { ...NONE, card: true })).toBe('card');
    expect(focusOwner('panier', NONE)).toBe('panier');
  });
  it('en jeu : le choix du nom, puis la réponse attendue, puis la conversation, puis le héros libre', () => {
    expect(focusOwner('play', { ...NONE, name: true, choice: true, scene: true })).toBe('name');
    expect(focusOwner('play', { ...NONE, choice: true, scene: true })).toBe('choice');
    expect(focusOwner('play', { ...NONE, scene: true })).toBe('scene');
    expect(focusOwner('play', NONE)).toBe('play');
  });
  it('sous un menu, ce qui se passe en jeu n’a pas la main', () => {
    for (const s of ['pause', 'menu', 'options', 'title', 'intro', 'bench']) expect(focusOwner(s, { ...NONE, scene: true, choice: true })).toBe(s);
    expect(focusOwner('loading', NONE)).toBe('none');
  });
  it('chaque état de la machine a un propriétaire ; héros libre seulement en jeu sans conversation', () => {
    for (const s of Object.keys(TRANSITIONS)) expect(typeof focusOwner(s, NONE)).toBe('string');
    expect(heroFree('play')).toBe(true);
    for (const o of ['scene', 'choice', 'name', 'panier', 'pause']) expect(heroFree(o)).toBe(false);
    for (const o of ['play', 'scene', 'choice', 'name']) expect(inGame(o)).toBe(true);
    expect(inGame('panier')).toBe(false);
  });
});
