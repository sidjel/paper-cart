import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAudio } from '../../src/audio/audio.js';
import song from '../../src/data/music/supermarche.json';

// Faux contexte audio : on garde les sources créées pour simuler leur fin (onended).
let sources;
let disconnected;
function param() {
  return { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} };
}
function node(extra = {}) {
  return { connect: (n) => n, disconnect: () => disconnected++, ...extra };
}
class FakeContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 48000;
    this.destination = node();
  }
  createGain() {
    return node({ gain: param() });
  }
  createBiquadFilter() {
    return node({ frequency: param(), Q: param() });
  }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
  }
  createBuffer(c, n) {
    return { getChannelData: () => new Float32Array(n) };
  }
  createOscillator() {
    return this.source({ frequency: param() });
  }
  createBufferSource() {
    return this.source({});
  }
  source(extra) {
    const s = node({ start() {}, stop() {}, onended: null, ...extra });
    sources.push(s);
    return s;
  }
  resume() {}
  suspend() {}
}
const end = () => {
  for (const s of sources.splice(0)) s.onended?.();
};

beforeEach(() => {
  sources = [];
  disconnected = 0;
  vi.stubGlobal('window', { AudioContext: FakeContext });
});
afterEach(() => vi.unstubAllGlobals());

const settings = { latency: 'balanced', muted: false, master: 1, music: 1, pauseMusic: 0.5, steps: 1, scanVolume: 1, voiceVolume: 1, heroVolume: 1 };

describe('son : aucun nœud ne s’accumule (séance 65)', () => {
  it('chaque son libère ses nœuds à sa fin : le compteur des effets retombe à zéro', () => {
    const a = createAudio(settings, song);
    a.unlock();
    for (const name of ['pas', 'bip', 'aspire', 'carte', 'retourne', 'froissement', 'aparte', 'portes', 'ding', 'annonce', 'blip']) a.play(name);
    expect(a.counters().sfx).toBeGreaterThan(0);
    end();
    expect(a.counters().sfx).toBe(0);
    expect(disconnected).toBeGreaterThan(0);
  });

  it('le nettoyage est idempotent : une fin signalée deux fois ne compte qu’une fois', () => {
    const a = createAudio(settings, song);
    a.unlock();
    a.play('pas');
    const once = sources.slice();
    end();
    for (const s of once) s.onended(); // stop() puis onended, par exemple
    expect(a.counters().sfx).toBe(0);
  });

  it('les notes de musique libèrent aussi leurs nœuds', () => {
    const a = createAudio(settings, song);
    a.unlock();
    a.update();
    expect(a.counters().music).toBeGreaterThan(0);
    end();
    expect(a.counters().music).toBe(0);
  });

  it('la pluie de l’intro (son en boucle) est libérée quand on l’arrête', () => {
    const a = createAudio(settings, song);
    a.unlock();
    a.play('pluie');
    expect(a.counters().sfx).toBe(3);
    a.stopRain();
    end();
    expect(a.counters().sfx).toBe(0);
  });
});
