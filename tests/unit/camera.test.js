import { describe, it, expect } from 'vitest';
import { createCamera, updateCamera } from '../../src/scene/camera.js';

const P = { follow: 5, lookAhead: 100, deadZone: 0.1 };
const W = 3600, H = 1080;

describe('caméra', () => {
  it('se place d’emblée sur le personnage, sans sortir du lieu', () => {
    const c = updateCamera(createCamera(), P, 300, 700, 1, 1920, 1080, W, H, 0);
    expect(c.x).toBe(0); // bord gauche du rayon
    expect(c.y).toBe(0); // toute la hauteur visible
  });
  it('glisse doucement vers le personnage', () => {
    const c = updateCamera(createCamera(), P, 1000, 700, 1, 1920, 1080, W, H, 0);
    const start = c.x;
    updateCamera(c, P, 2500, 700, 1, 1920, 1080, W, H, 1 / 60);
    expect(c.x).toBeGreaterThan(start);
    expect(c.x).toBeLessThan(2500 - 960); // pas d'un coup
    for (let i = 0; i < 600; i++) updateCamera(c, P, 2500, 700, 1, 1920, 1080, W, H, 1 / 60);
    // Le personnage est visible, dans la zone centrale élargie (zone morte comprise).
    expect(2500).toBeGreaterThan(c.x + 960 - 192 - 100);
    expect(2500).toBeLessThan(c.x + 1920);
  });
  it('ne bouge pas tant que le personnage reste au centre', () => {
    const c = updateCamera(createCamera(), P, 1500, 700, 1, 1920, 1080, W, H, 0);
    const x0 = c.x;
    updateCamera(c, P, 1550, 700, 1, 1920, 1080, W, H, 1 / 60);
    expect(c.x).toBe(x0);
  });
  it('s’arrête au bout du rayon', () => {
    const c = updateCamera(createCamera(), P, 3500, 700, 1, 1920, 1080, W, H, 0);
    expect(c.x).toBe(W - 1920);
  });
  it('avec un zoom, suit aussi en hauteur sans sortir du décor', () => {
    const c = updateCamera(createCamera(), P, 1000, 1000, 1, 1200, 675, W, H, 0);
    expect(c.y).toBeGreaterThan(0);
    expect(c.y).toBeLessThanOrEqual(H - 675);
  });
});
