import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAudio } from '../../src/audio/audio.js';

// Faux contexte audio : on garde les sources créées pour simuler leur fin (onended).
let sources;
let disconnected;
let built; // filtres et oscillateurs créés dans le vrai contexte (pas en préparation)
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
    window.lastCtx = this;
    if (!window.realCtx) window.realCtx = this;
  }
  createGain() {
    return node({ gain: param() });
  }
  createBiquadFilter() {
    if (!this.offline) built++;
    return node({ frequency: param(), Q: param() });
  }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
  }
  createBuffer(c, n) {
    return { getChannelData: () => new Float32Array(n) };
  }
  createOscillator() {
    if (!this.offline) built++;
    return this.source({ frequency: param() });
  }
  createBufferSource() {
    return this.source({});
  }
  source(extra) {
    const s = node({ start() {}, stop(...when) { if (!when.length) this.cut = true; }, onended: null, ...extra });
    sources.push(s);
    return s;
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
}
// Contexte de préparation (OfflineAudioContext) : rend un faux tampon.
class FakeOffline extends FakeContext {
  constructor() {
    super();
    this.offline = true;
    window.lastCtx = window.realCtx;
  }
  startRendering() {
    return Promise.resolve({ fake: 'tampon' });
  }
}
const end = () => {
  for (const s of sources.splice(0)) s.onended?.();
};

beforeEach(() => {
  sources = [];
  disconnected = 0;
  built = 0;
  vi.stubGlobal('window', { AudioContext: FakeContext, OfflineAudioContext: FakeOffline });
});
afterEach(() => vi.unstubAllGlobals());
const prepared = (a) => vi.waitFor(() => expect(a.counters().prepared).toBe(true));

const settings = { latency: 'balanced', muted: false, master: 1, music: 1, pauseMusic: 0.5, steps: 1, scanVolume: 1, voiceVolume: 1, heroVolume: 1, maxPas: 2, maxVoix: 2 };

describe('son : aucun nœud ne s’accumule (séance 65)', () => {
  it('chaque son libère ses nœuds à sa fin : le compteur des effets retombe à zéro', () => {
    const a = createAudio(settings);
    a.unlock();
    for (const name of ['pas', 'bip', 'aspire', 'carte', 'retourne', 'froissement', 'aparte', 'portes', 'ding', 'annonce', 'blip']) a.play(name);
    expect(a.counters().sfx).toBeGreaterThan(0);
    end();
    expect(a.counters().sfx).toBe(0);
    expect(disconnected).toBeGreaterThan(0);
  });

  it('le nettoyage est idempotent : une fin signalée deux fois ne compte qu’une fois', () => {
    const a = createAudio(settings);
    a.unlock();
    a.play('pas');
    const once = sources.slice();
    end();
    for (const s of once) s.onended?.(); // stop() puis onended, par exemple
    expect(a.counters().sfx).toBe(0);
  });

  it('update sans fichier audio décodé reste silencieux sans erreur ni fuite', () => {
    const a = createAudio(settings);
    a.unlock();
    a.update();
    expect(a.counters().music).toBe(0);
    a.setIntroRain(true);
    a.setIntroRain(false);
    expect(a.counters().sfx).toBe(0);
  });

  it('interrompu (appel, autre application) : le son reprend au prochain geste, et c’est compté', () => {
    const a = createAudio(settings);
    a.unlock();
    expect(a.counters().resumed).toBe(0);
    for (const st of ['interrupted', 'suspended']) {
      window.lastCtx.state = st;
      a.unlock(); // un geste du joueur
      expect(a.counters().state).toBe('running');
    }
    expect(a.counters().resumed).toBe(2);
    a.setHidden(true); // onglet caché : pas de reprise au geste
    a.unlock();
    expect(a.counters().state).toBe('suspended');
  });

  it('sons courts préparés une fois : un pas, un bip, un froissement = une seule source, aucun filtre ni oscillateur', async () => {
    const a = createAudio(settings);
    a.unlock();
    await prepared(a);
    end();
    built = 0;
    for (const name of ['pas', 'pas', 'blip', 'blipHeros', 'froissement']) a.play(name);
    expect(built).toBe(0);
    expect(a.counters().sfx).toBe(5); // une source par son
    end();
    expect(a.counters().sfx).toBe(0);
  });

  it('famille pleine : son son le plus ancien s’arrête, sans jamais couper une autre famille (séance 66)', () => {
    const a = createAudio(settings);
    a.unlock();
    a.play('annonce'); // haut-parleur
    const voice = sources.slice();
    for (let k = 0; k < 5; k++) a.play('pas'); // 5 pas qui ne se terminent pas
    const cut = sources.filter((s) => s.cut);
    expect(cut.length).toBe(3); // les 3 plus anciens pas (limite : 2)
    expect(voice.some((s) => s.cut)).toBe(false); // le haut-parleur n'est jamais coupé par les pas
    expect(a.counters().cut).toBe(3);
  });

  it('les cris de corbeaux libèrent tous leurs nœuds audio à leur fin', () => {
    const a = createAudio(settings);
    a.unlock();
    a.play('corbeau');
    a.play('corbeau');
    a.play('corbeau');
    expect(a.counters().sfx).toBeGreaterThan(0);
    end();
    expect(a.counters().sfx).toBe(0);
  });
});
