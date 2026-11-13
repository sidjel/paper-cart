// Le son du jeu : volumes, bruits de pas, musique. Tout est synthétisé (aucun fichier).
// Le son lit l'état du jeu : musique plus douce en pause, tout suspendu quand l'onglet est caché.
// Les navigateurs n'autorisent le son qu'après un premier geste (touche, clic, toucher) : unlock().

import { createMusic } from './music.js';

export function createAudio(settings, song) {
  let ctx = null;
  let master, musicBus, sfxBus, scanBus, noise, music;
  let paused = false;
  let hidden = false;
  let foot = 0;

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC({ latencyHint: settings.latency });
    } catch {
      ctx = new AC();
    }
    // Limiteur en sortie : évite toute saturation si plusieurs sons s'additionnent.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    limiter.connect(ctx.destination);
    master = ctx.createGain();
    master.connect(limiter);
    // La musique passe par un filtre qui imite les haut-parleurs du plafond.
    const speaker = ctx.createBiquadFilter();
    speaker.type = 'lowpass';
    speaker.frequency.value = 3800;
    // Les très basses fréquences font vibrer (grésiller) les petits haut-parleurs de téléphone : on les retire.
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = 90;
    musicBus = ctx.createGain();
    musicBus.connect(lowCut).connect(speaker).connect(master);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    scanBus = ctx.createGain(); // sons du scanner (bip, aspiration, carte)
    scanBus.connect(master);
    // Une seconde de bruit blanc, créée une fois, réutilisée par les pas et le shaker.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let x = 12345;
    for (let i = 0; i < data.length; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (x / 0x3fffffff) - 1;
    }
    music = createMusic(song);
    applyVolumes();
  }

  function applyVolumes() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(settings.muted ? 0 : settings.master, t, 0.03);
    musicBus.gain.setTargetAtTime(settings.music * (paused ? settings.pauseMusic : 1), t, 0.15);
    sfxBus.gain.setTargetAtTime(settings.steps, t, 0.03);
    scanBus.gain.setTargetAtTime(settings.scanVolume, t, 0.03);
  }

  // Petite note : forme d'onde, fréquence de départ et d'arrivée, début, durée, volume.
  function tone(type, f0, f1, t, dur, vol) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(scanBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // [TEMP] Bip de caisse : deux notes courtes et nettes.
  function bip() {
    const t = ctx.currentTime;
    tone('square', 1760, 1760, t, 0.07, 0.12);
    tone('square', 2350, 2350, t + 0.075, 0.09, 0.1);
  }

  // [TEMP] Aspiration : souffle qui monte, comme un petit aspirateur.
  function aspire() {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    src.connect(bp).connect(g).connect(scanBus);
    src.start(t, 0.3, 0.6);
  }

  // [TEMP] La carte apparaît : petit « pop » qui monte, puis une note claire.
  function carte() {
    const t = ctx.currentTime;
    tone('sine', 520, 980, t, 0.12, 0.25);
    tone('triangle', 1318, 1318, t + 0.1, 0.3, 0.12);
  }

  function running() {
    return ctx && ctx.state === 'running' && !hidden;
  }

  // Un pas : frottement étouffé d'une semelle souple sur le lino, sans claquement.
  // Pieds gauche et droit légèrement différents, pour ne pas sonner comme une machine.
  function step() {
    const t = ctx.currentTime;
    foot = 1 - foot;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = foot ? 700 : 600;
    lp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(lp).connect(g).connect(sfxBus);
    src.start(t, foot ? 0.2 : 0.6, 0.12);
  }

  const SOUNDS = { pas: step, bip, aspire, carte };

  return {
    // Appelé au premier geste du joueur.
    unlock() {
      if (!ctx) init();
      if (ctx && ctx.state === 'suspended' && !hidden) ctx.resume();
    },
    get started() {
      return !!ctx;
    },
    // Pour le rapport de diagnostic.
    describe() {
      if (!ctx) return 'pas encore démarré';
      const ms = (v) => (v ? `${Math.round(v * 1000)} ms` : '?');
      return `${ctx.state} · ${ctx.sampleRate} Hz · réserve « ${settings.latency} » · latence ${ms(ctx.baseLatency)} + sortie ${ms(ctx.outputLatency)}`;
    },
    applyVolumes,
    setState(state) {
      paused = state === 'pause';
      applyVolumes();
    },
    setHidden(h) {
      hidden = h;
      if (!ctx) return;
      if (h) ctx.suspend();
      else ctx.resume();
    },
    play(name) {
      if (running()) SOUNDS[name]?.();
    },
    // À chaque image affichée.
    update() {
      if (running()) music.update(ctx, musicBus, noise);
    },
  };
}
