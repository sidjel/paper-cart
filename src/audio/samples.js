// Échantillons audio CC0 (Freesound) décodés une fois dans le contexte audio unique du jeu :
// musique d'ambiance supermarché, pluie réaliste de l'intro, cris de corbeaux dehors, bip de la Scanette.
// En cas d'absence de réseau ou dans les tests sans decodeAudioData, les lectures restent silencieuses sans erreur.

const CROW_FILES = ['audio/corbeau-1.mp3', 'audio/corbeau-2.mp3', 'audio/corbeau-3.mp3', 'audio/corbeau-4.mp3'];
const BIP_FILE = 'audio/scan-bip.mp3';
const MUSIC_FILE = 'audio/supermarche.mp3';
const INTRO_RAIN_FILE = 'audio/pluie-intro.mp3';

// Variations légères et déterministes des cris de corbeaux (évite la répétition mécanique sans Math.random).
const CROW_RATES = [0.96, 1.03, 0.94, 1.05, 0.99];
const CROW_GAINS = [0.85, 0.96, 0.82, 0.92, 0.89];

// Effet sonore joué une fois : une source branchée sur son bus (plus un gain si volume != 1), libérée dans onended.
function playOnce(ctx, bus, track, buffer, gain = 1, rate = 1) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  if (src.playbackRate) src.playbackRate.value = rate;
  if (gain === 1) {
    src.connect(bus);
    src.start();
    track(src, [src]);
    return;
  }
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(bus);
  src.start();
  track(src, [src, g]);
}

export function createSamples(base = '') {
  const crows = [];
  let bipBuf = null;
  let musicBuf = null;
  let rainBuf = null;
  let loaded = false;
  let crowIdx = 0;
  let musicSrc = null;
  let musicBeatT = -1;
  let musicStartT = 0;
  let rainSrc = null;
  let rainGain = null;
  let rainWanted = false;
  let rainBusRef = null;
  let rainTrackRef = null;
  let rainCtxRef = null;

  async function fetchBuffer(ctx, relPath) {
    try {
      const res = await fetch(base + relPath);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      return await ctx.decodeAudioData(arr);
    } catch {
      return null;
    }
  }

  function startRainNow() {
    if (!rainWanted || !rainBuf || !rainCtxRef || !rainBusRef || rainSrc) return;
    const ctx = rainCtxRef;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = rainBuf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.55, now + 0.45);
    src.connect(g).connect(rainBusRef);
    src.start(now);
    rainSrc = src;
    rainGain = g;
    rainTrackRef?.(src, [src, g], 'sfx');
  }

  function stopRainNow() {
    if (!rainSrc || !rainCtxRef) return;
    const src = rainSrc;
    const g = rainGain;
    rainSrc = null;
    rainGain = null;
    const now = rainCtxRef.currentTime;
    try {
      g?.gain?.setTargetAtTime(0.0001, now, 0.14);
      src.stop(now + 0.5);
    } catch {
      // déjà arrêté
    }
  }

  return {
    load(ctx) {
      if (loaded || !ctx || typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') return;
      loaded = true;
      rainCtxRef = ctx;
      for (const f of CROW_FILES) {
        fetchBuffer(ctx, f).then((b) => {
          if (b) crows.push(b);
        });
      }
      fetchBuffer(ctx, BIP_FILE).then((b) => {
        if (b) bipBuf = b;
      });
      fetchBuffer(ctx, MUSIC_FILE).then((b) => {
        if (b) musicBuf = b;
      });
      fetchBuffer(ctx, INTRO_RAIN_FILE).then((b) => {
        if (b) {
          rainBuf = b;
          if (rainWanted) startRainNow();
        }
      });
    },

    // Alterne entre les vrais cris de corbeaux (#741366 découpé + #813115) dans un ordre déterministe.
    playCrow(ctx, bus, track) {
      if (!crows.length) return false;
      const idx = crowIdx % crows.length;
      const rate = CROW_RATES[crowIdx % CROW_RATES.length];
      const gain = CROW_GAINS[crowIdx % CROW_GAINS.length];
      crowIdx++;
      playOnce(ctx, bus, track, crows[idx], gain, rate);
      return true;
    },

    // Bip de Scanette (#202530) : une seule source branchée directement sur le bus scanner.
    playBip(ctx, bus, track) {
      if (!bipBuf) return false;
      playOnce(ctx, bus, track, bipBuf, 1, 1);
      return true;
    },

    setIntroRain(ctx, bus, track, on) {
      rainCtxRef = ctx;
      rainBusRef = bus;
      rainTrackRef = track;
      rainWanted = Boolean(on);
      if (rainWanted) startRainNow();
      else stopRainNow();
    },

    hasMusic: () => musicBuf !== null,

    // Boucle musicale sans couture (AudioBufferSourceNode loop = true) sur le bus haut-parleur.
    // Renvoie 1 battement toutes les 0,5 s pour le compteur du diagnostic.
    updateMusic(ctx, bus, track) {
      if (!musicBuf) return 0;
      const now = ctx.currentTime;
      if (!musicSrc) {
        const src = ctx.createBufferSource();
        src.buffer = musicBuf;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.36, now + 0.4);
        src.connect(g).connect(bus);
        src.start(now);
        track(src, [src, g], 'music');
        musicSrc = src;
        musicStartT = now;
        musicBeatT = now;
        return 1;
      }
      if (now - musicBeatT >= 0.5) {
        musicBeatT = now;
        return 1;
      }
      return 0;
    },

    position() {
      if (!musicBuf || !musicSrc) return 'en attente';
      const dur = musicBuf.duration || 12;
      const loop = Math.floor((musicBeatT - musicStartT) / dur) + 1;
      return `bossa supermarché (boucle ${loop}, ${dur.toFixed(0)} s)`;
    },
  };
}
