// Échantillons audio CC0 (Freesound) décodés une fois dans le contexte audio unique du jeu.
// En cas d'absence de réseau ou dans les tests sans decodeAudioData, le jeu retombe silencieusement
// sur la synthèse (audio.js / music.js) sans erreur.

const CROW_FILES = ['audio/corbeau-1.mp3', 'audio/corbeau-2.mp3', 'audio/corbeau-3.mp3', 'audio/corbeau-4.mp3'];
const BIP_FILE = 'audio/scan-bip.mp3';
const MUSIC_FILE = 'audio/supermarche.mp3';

// Effet sonore joué une fois : une source + un gain, libérés dans onended via track().
function playOnce(ctx, bus, track, buffer, gain = 1, rate = 1) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  if (src.playbackRate) src.playbackRate.value = rate;
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
  let loaded = false;
  let lastCrow = -1;
  let musicSrc = null;
  let musicBeatT = -1;
  let musicStartT = 0;

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

  return {
    load(ctx) {
      if (loaded || !ctx || typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') return;
      loaded = true;
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
    },

    // Alterne entre les vrais cris de corbeaux (#741366 découpé + #813115) sans répéter deux fois le même.
    playCrow(ctx, bus, track) {
      if (!crows.length) return false;
      let idx = Math.floor(Math.random() * crows.length);
      if (crows.length > 1 && idx === lastCrow) idx = (idx + 1) % crows.length;
      lastCrow = idx;
      const rate = 0.93 + Math.random() * 0.12;
      const gain = 0.78 + Math.random() * 0.22;
      playOnce(ctx, bus, track, crows[idx], gain, rate);
      return true;
    },

    playBip(ctx, bus, track) {
      if (!bipBuf) return false;
      playOnce(ctx, bus, track, bipBuf, 0.6, 1);
      return true;
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
      if (!musicBuf || !musicSrc) return '';
      const dur = musicBuf.duration || 12;
      const loop = Math.floor((musicBeatT - musicStartT) / dur) + 1;
      return `bossa supermarché (boucle ${loop}, ${dur.toFixed(0)} s)`;
    },
  };
}
