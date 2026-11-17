import { describe, it, expect } from 'vitest';
import { effectiveDisplay } from '../../src/core/profiles.js';
import { config } from '../../src/config.js';

const P = config.display.profiles;
const all = { maxPixelRatio: 2, hallRain: true, dust: true };

describe('profils de qualité', () => {
  it('trois profils : Léger, Normal, Fin', () => {
    expect(Object.keys(P)).toEqual(['leger', 'normal', 'fin']);
  });
  it('Léger : densité 1, sans pluie animée, sans poussière, plans lointains immobiles', () => {
    expect(effectiveDisplay(P, 'leger', all)).toEqual({ pixelRatio: 1, rain: false, dust: false, farParallax: false });
  });
  it('Normal : densité 1,5 et tous les effets ; Fin : densité 2', () => {
    expect(effectiveDisplay(P, 'normal', all)).toEqual({ pixelRatio: 1.5, rain: true, dust: true, farParallax: true });
    expect(effectiveDisplay(P, 'fin', all).pixelRatio).toBe(2);
  });
  it('un effet coupé dans ses propres réglages reste coupé ; le plafond le plus bas l’emporte', () => {
    const e = effectiveDisplay(P, 'fin', { maxPixelRatio: 1.25, hallRain: false, dust: true });
    expect(e.pixelRatio).toBe(1.25);
    expect(e.rain).toBe(false);
  });
  it('profil inconnu : Normal', () => {
    expect(effectiveDisplay(P, 'inconnu', all).pixelRatio).toBe(1.5);
  });
});
