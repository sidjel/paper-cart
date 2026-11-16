import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { assetStats, loadImages, releaseImages } from '../../src/scene/assets.js';

// Faux navigateur : images (une adresse « casse » échoue), canevas, adresses temporaires.
let live; // adresses temporaires encore réservées
beforeEach(() => {
  live = new Set();
  let n = 0;
  vi.stubGlobal(
    'Image',
    class {
      decode() {
        return this.src.includes('casse') ? Promise.reject(new Error('image introuvable')) : Promise.resolve();
      }
      removeAttribute() {}
    },
  );
  vi.stubGlobal('document', {
    createElement: () => ({ getContext: () => ({ clearRect() {}, drawImage() {} }), toBlob: (cb) => cb({}) }),
  });
  vi.stubGlobal('URL', {
    createObjectURL: () => {
      const u = `blob:${++n}`;
      live.add(u);
      return u;
    },
    revokeObjectURL: (u) => live.delete(u),
  });
});
afterEach(() => vi.unstubAllGlobals());

const entry = (name) => ({ id: name, url: `art/${name}.svg`, w: 100, h: 50, scale: 1 });

describe('chargement des images', () => {
  it('un chargement qui échoue à la 3ᵉ image laisse les compteurs comme avant et ne garde aucune adresse temporaire', async () => {
    const before = { images: assetStats.images, pixels: assetStats.pixels };
    await expect(loadImages([entry('a'), entry('b'), entry('casse'), entry('d')])).rejects.toThrow('image introuvable');
    expect({ images: assetStats.images, pixels: assetStats.pixels }).toEqual(before);
    expect(live.size).toBe(0);
  });

  it('un chargement réussi compte ses images ; les libérer rend tout', async () => {
    const before = { images: assetStats.images, pixels: assetStats.pixels };
    const imgs = await loadImages([entry('a'), entry('b')]);
    expect(assetStats.images).toBe(before.images + 2);
    expect(live.size).toBe(2);
    releaseImages(imgs);
    expect({ images: assetStats.images, pixels: assetStats.pixels }).toEqual(before);
    expect(live.size).toBe(0);
  });
});
