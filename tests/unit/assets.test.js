import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { assetStats, loadImages, releaseImages, setMaxTextureSize } from '../../src/scene/assets.js';

// Faux navigateur : images SVG (une adresse « casse » échoue), fetch + createImageBitmap pour bitmaps.
let liveBitmaps;
let canvasCalls;
beforeEach(() => {
  liveBitmaps = new Set();
  canvasCalls = 0;
  setMaxTextureSize(4096);
  vi.stubGlobal(
    'Image',
    class {
      decode() {
        return this.src.includes('casse') ? Promise.reject(new Error('image introuvable')) : Promise.resolve();
      }
    },
  );
  vi.stubGlobal('document', {
    createElement: (tag) => {
      if (tag === 'canvas') canvasCalls++;
      return { width: 0, height: 0, getContext: () => ({ clearRect() {}, drawImage() {} }) };
    },
  });
  vi.stubGlobal('fetch', async (url) => {
    if (url.includes('casse')) throw new Error('image introuvable');
    return { ok: true, status: 200, blob: async () => ({ __url: url }) };
  });
  vi.stubGlobal('createImageBitmap', async (source, opts) => {
    let width = opts?.resizeWidth ?? source.width ?? 100;
    let height = opts?.resizeHeight ?? source.height ?? 50;
    if (source.__url?.includes('rayon-avant') && !opts?.resizeWidth) {
      width = 4300;
      height = 175;
    }
    const bm = {
      width,
      height,
      closed: false,
      close() {
        this.closed = true;
        liveBitmaps.delete(this);
      },
    };
    liveBitmaps.add(bm);
    return bm;
  });
});
afterEach(() => vi.unstubAllGlobals());

const entry = (name) => ({ id: name, url: `art/${name}.svg`, w: 100, h: 50, scale: 1 });

describe('chargement des textures PixiJS (scene/assets.js)', () => {
  it('un chargement qui échoue à la 3ᵉ image laisse les compteurs comme avant et ne garde aucun ImageBitmap', async () => {
    const before = { images: assetStats.images, pixels: assetStats.pixels };
    await expect(loadImages([entry('a'), entry('b'), entry('casse'), entry('d')])).rejects.toThrow('image introuvable');
    expect({ images: assetStats.images, pixels: assetStats.pixels }).toEqual(before);
    expect(liveBitmaps.size).toBe(0);
  });

  it('un chargement réussi crée des textures PixiJS et ImageBitmap ; releaseImages détruit tout proprement', async () => {
    const before = { images: assetStats.images, pixels: assetStats.pixels };
    const imgs = await loadImages([entry('a'), entry('b')]);
    const recA = imgs.get('a');
    const recB = imgs.get('b');
    expect(assetStats.images).toBe(before.images + 2);
    expect(liveBitmaps.size).toBe(2);
    expect(recA.texture.destroyed).toBe(false);
    expect(recA.url).toBe('art/a.svg');

    releaseImages(imgs);
    expect({ images: assetStats.images, pixels: assetStats.pixels }).toEqual(before);
    expect(liveBitmaps.size).toBe(0);
    expect(recA.bitmap.closed).toBe(true);
    expect(recB.bitmap.closed).toBe(true);
    expect(recA.texture.destroyed).toBe(true);
    expect(recB.texture.destroyed).toBe(true);
  });

  it('un bitmap .webp proche de la taille cible passe par fetch + createImageBitmap sans <canvas>', async () => {
    const before = { images: assetStats.images, pixels: assetStats.pixels };
    const imgs = await loadImages([{ id: 'bg', url: 'art/fond.webp', w: 100, h: 50, scale: 0.9 }]);
    const rec = imgs.get('bg');
    expect(assetStats.images).toBe(before.images + 1);
    expect(canvasCalls).toBe(0);
    expect(liveBitmaps.size).toBe(1);
    expect(rec.url).toBe('art/fond.webp');
    expect(rec.bitmap).not.toBeNull();
    expect(rec.texture.destroyed).toBe(false);
    releaseImages(imgs);
    expect(rec.bitmap.closed).toBe(true);
    expect(rec.texture.destroyed).toBe(true);
    expect(liveBitmaps.size).toBe(0);
    expect({ images: assetStats.images, pixels: assetStats.pixels }).toEqual(before);
  });

  it('plafonne automatiquement un asset > 4096 px (ex. rayon-avant 4300×175) à <= 4096 px sans fuite', async () => {
    const before = { images: assetStats.images, pixels: assetStats.pixels };
    const imgs = await loadImages([{ id: 'avant', url: 'art/rayon-avant.webp', w: 4300, h: 175, scale: 1.5 }]);
    const rec = imgs.get('avant');
    expect(canvasCalls).toBe(0);
    expect(rec.pw).toBeLessThanOrEqual(4096);
    expect(rec.ph).toBeLessThanOrEqual(4096);
    expect(rec.pw).toBe(4096);
    expect(liveBitmaps.size).toBe(1); // le bitmap temporaire 4300×175 a bien été fermé
    expect(rec.url).toBe('art/rayon-avant.webp');
    releaseImages(imgs);
    expect(rec.bitmap.closed).toBe(true);
    expect(rec.texture.destroyed).toBe(true);
    expect(liveBitmaps.size).toBe(0);
    expect({ images: assetStats.images, pixels: assetStats.pixels }).toEqual(before);
  });
});
