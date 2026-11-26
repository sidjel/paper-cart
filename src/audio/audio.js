// Le son du jeu : volumes, échantillons audio CC0 (musique, pluie d'intro, corbeaux, bip) et bruitages provisoires.
// Le son lit l'état du jeu : musique plus douce en pause, tout suspendu quand l'onglet est caché.
// Les navigateurs n'autorisent le son qu'après un premier geste (touche, clic, toucher) : unlock().

import { createSamples } from './samples.js';

const HERO_BLIP = 0.05; // force du petit bip d'écriture du héros (séance 66 : adouci, 0,09 avant)

export function createAudio(settings, base = '') {
  let ctx = null;
  let master, musicBus, sfxBus, birdsBus, scanBus, voiceBus, heroBus, introBus, noise;
  const samples = createSamples(base);
  let introRainOn = false;
  let paused = false;
  let frozen = false; // aparté : le temps du magasin est figé, sa musique se tait
  let hidden = false;
  let foot = 0;
  // Nœuds créés et libérés, par catégorie (effets, musique) : le navigateur ne permet pas de les compter,
  // on les compte nous-mêmes (règles : src/audio/CLAUDE.md). « Actifs » = créés − libérés : retombe à zéro
  // quand plus rien ne joue.
  const stats = { played: 0, notes: 0, sfx: { created: 0, freed: 0 }, music: { created: 0, freed: 0 }, states: [], resumed: 0, byName: {}, recent: [], cut: 0 };

  // Un son joué : ses nœuds sont libérés quand sa source se termine (onended → disconnect). Le nettoyage
  // est idempotent (garde cleanedUp) : le compteur ne baisse qu'une fois, même après stop() puis onended.
  // (Séance 65, correction n° 1 : avant, aucun nœud n'était jamais déconnecté.)
  function track(src, nodes, cat = 'sfx') {
    stats[cat].created += nodes.length;
    if (collecting) collecting.push(src);
    let cleanedUp = false;
    src.onended = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      for (const n of nodes) n.disconnect();
      stats[cat].freed += nodes.length;
      if (src.playing) src.playing.left--;
    };
  }

  // ---------- Nombre maximum de sons simultanés, par famille (séance 66, correction n° 4) ----------
  // Chaque famille a sa limite (config.audio.maxPas, maxTexte…) ; si elle est pleine, son son le plus ancien
  // s'arrête. Une famille ne coupe jamais une autre : les pas ou les froissements ne couvrent jamais le
  // haut-parleur, l'interface ou (plus tard) le combat.
  const FAMILY = {
    pas: 'pas', blip: 'texte', blipHeros: 'texte', froissement: 'papier', retourne: 'papier',
    bip: 'scanner', aspire: 'scanner', carte: 'scanner', prise: 'scanner',
    grince: 'chariot', chute: 'chariot', annonce: 'voix', ding: 'voix',
    aparte: 'aparte', corbeau: 'ambiance', portes: 'ambiance',
  };
  const FAMILY_LIMITS = { pas: 2, texte: 3, papier: 2, scanner: 4, voix: 2, aparte: 1, ambiance: 2 };
  const playing = {}; // famille → sons en cours [{ sources, left }], du plus ancien au plus récent
  let collecting = null; // sources créées par le son en train de démarrer
  function limit(family) {
    const list = (playing[family] ??= []);
    for (let i = list.length - 1; i >= 0; i--) if (list[i].left <= 0) list.splice(i, 1); // finis
    const max = settings[`max${family[0].toUpperCase()}${family.slice(1)}`] ?? FAMILY_LIMITS[family] ?? Infinity;
    while (list.length >= max) {
      const oldest = list.shift();
      stats.cut++;
      for (const src of oldest.sources) {
        try {
          src.stop(); // déclenche onended : ses nœuds sont libérés
        } catch {
          // déjà arrêté
        }
      }
    }
    return list;
  }

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
    birdsBus = ctx.createGain(); // corbeaux / oiseaux dehors
    birdsBus.connect(master);
    scanBus = ctx.createGain(); // sons du scanner (bip, aspiration, carte)
    scanBus.connect(master);
    voiceBus = ctx.createGain(); // narrateur (annonce, petits bips du texte)
    voiceBus.connect(master);
    heroBus = ctx.createGain(); // apartés du héros (froissement, petits bips)
    heroBus.connect(master);
    introBus = ctx.createGain(); // pluie réaliste de l'intro (continue même musique figée)
    introBus.connect(master);
    // Une seconde de bruit blanc, créée une fois, réutilisée par les pas et les souffles.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let x = 12345;
    for (let i = 0; i < data.length; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (x / 0x3fffffff) - 1;
    }
    samples.load(ctx);
    if (introRainOn) samples.setIntroRain(ctx, introBus, track, true);
    prepare().catch(() => {});
    // Chaque changement d'état du son est noté (une interruption par un appel, une autre application…).
    ctx.onstatechange = () => stats.states.push(`${new Date().toLocaleTimeString('fr-FR')} ${ctx.state}${hidden ? ' (onglet caché)' : ''}`);
    applyVolumes();
  }

  function applyVolumes() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(settings.muted ? 0 : settings.master, t, 0.03);
    musicBus.gain.setTargetAtTime(settings.music * (paused ? settings.pauseMusic : 1) * (frozen ? 0 : 1), t, frozen ? 0.08 : 0.4);
    sfxBus.gain.setTargetAtTime(settings.steps, t, 0.03);
    birdsBus.gain.setTargetAtTime((settings.birdsVolume ?? 0.4) * (paused || frozen ? 0 : 1), t, 0.08);
    scanBus.gain.setTargetAtTime(settings.scanVolume * 0.65, t, 0.03);
    voiceBus.gain.setTargetAtTime(settings.voiceVolume, t, 0.03);
    heroBus.gain.setTargetAtTime(settings.heroVolume, t, 0.03);
    introBus.gain.setTargetAtTime(1, t, 0.05);
  }

  // Petite note : forme d'onde, fréquence de départ et d'arrivée, début, durée, volume.
  // Une petite note dans le contexte c (le vrai, ou un contexte de préparation) ; renvoie ses nœuds.
  function toneGraph(c, out, type, f0, f1, t, dur, vol) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
    return [o, g];
  }
  function tone(type, f0, f1, t, dur, vol, bus = scanBus) {
    const nodes = toneGraph(ctx, bus, type, f0, f1, t, dur, vol);
    track(nodes[0], nodes);
  }

  // ---------- Sons courts et répétitifs, préparés une fois (séance 66, correction n° 3) ----------
  // Pas, petits bips du texte, froissement : calculés au démarrage du son dans un OfflineAudioContext, à
  // la fréquence du vrai contexte. En jeu, en jouer un = une seule source branchée sur un bus permanent,
  // aucun filtre ni oscillateur créé. Tant qu'ils ne sont pas prêts (quelques millisecondes), ils sont
  // fabriqués comme avant.
  let prepared = null; // { nom: [AudioBuffer par variante] }
  const PREPARED = {
    pas: [0, 1].map((f) => ({ len: 0.14, draw: (c, out) => [stepGraph(c, out, 0, f)] })),
    blip: [0, 1, 2].map((n) => ({ len: 0.06, draw: (c, out) => [toneGraph(c, out, 'square', 620 + n * 40, 620 + n * 40, 0, 0.03, 0.05)] })),
    blipHeros: [0, 1, 2].map((n) => ({ len: 0.07, draw: (c, out) => [toneGraph(c, out, 'triangle', 330 + n * 30, 300 + n * 30, 0, 0.04, HERO_BLIP)] })),
    froissement: [{ len: 0.3, draw: (c, out) => froissGraph(c, out, 0) }],
  };
  async function prepare() {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return;
    const out = {};
    for (const [name, variants] of Object.entries(PREPARED)) {
      out[name] = await Promise.all(
        variants.map((v) => {
          const c = new OAC(1, Math.ceil(v.len * ctx.sampleRate), ctx.sampleRate);
          v.draw(c, c.destination);
          return c.startRendering();
        }),
      );
    }
    prepared = out;
  }
  // Un son préparé (variante k), ou à défaut fabriqué en direct (graph : nœuds de chaque partie).
  function playPrepared(name, k, bus, live) {
    if (prepared) {
      const src = ctx.createBufferSource();
      src.buffer = prepared[name][k];
      src.connect(bus);
      src.start();
      track(src, [src]);
      return;
    }
    for (const nodes of live()) track(nodes[0], nodes);
  }

  // Bip de caisse : échantillon CC0 (#202530) ou synthèse de secours.
  function bip() {
    if (samples.playBip(ctx, scanBus, track)) return;
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
    track(src, [src, bp, g]);
  }

  // [TEMP] La carte apparaît : petit « pop » qui monte, puis une note claire.
  function carte() {
    const t = ctx.currentTime;
    tone('sine', 520, 980, t, 0.12, 0.25);
    tone('triangle', 1318, 1318, t + 0.1, 0.3, 0.12);
  }

  // [TEMP] Corbeaux dehors (Accueil, Rayon 1) : 3 variantes de croassements graves et rauques
  // (fondamentale grave 175-225 Hz + vibrato de gorge ~36 Hz + formant nasal + souffle rauque).
  let crowN = 0;
  function cawAt(at, f0, f1, dur, vol) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, at);
    o.frequency.exponentialRampToValueAtTime(f0 * 1.04, at + dur * 0.22);
    o.frequency.exponentialRampToValueAtTime(f1, at + dur);

    // Modulation de gorge (grain rauque caractéristique du corbeau).
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'triangle';
    lfo.frequency.value = 34 + (crowN % 3) * 4;
    lfoGain.gain.value = 18;
    lfo.connect(lfoGain).connect(o.frequency);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(840, at);
    bp.frequency.exponentialRampToValueAtTime(660, at + dur);
    bp.Q.value = 2.4;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1550;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.032);
    g.gain.exponentialRampToValueAtTime(vol * 0.78, at + dur * 0.62);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

    o.connect(bp).connect(lp).connect(g).connect(birdsBus);
    o.start(at);
    o.stop(at + dur + 0.02);
    lfo.start(at);
    lfo.stop(at + dur + 0.02);
    track(o, [o, lfo, lfoGain, bp, lp, g]);

    // Souffle rauque grave qui ajoute le côté organique / naturel.
    const n = ctx.createBufferSource();
    n.buffer = noise;
    const nbp = ctx.createBiquadFilter();
    nbp.type = 'bandpass';
    nbp.frequency.value = 920;
    nbp.Q.value = 1.9;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, at);
    ng.gain.exponentialRampToValueAtTime(vol * 0.55, at + 0.028);
    ng.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.92);
    n.connect(nbp).connect(ng).connect(birdsBus);
    n.start(at, (crowN * 0.23) % 0.6, dur + 0.02);
    track(n, [n, nbp, ng]);
  }
  function corbeau() {
    if (samples.playCrow(ctx, birdsBus, track)) return;
    const t = ctx.currentTime;
    const v = crowN;
    crowN = (crowN + 1) % 3;
    if (v === 0) {
      cawAt(t, 212, 168, 0.34, 0.32);
      cawAt(t + 0.44, 198, 158, 0.38, 0.29);
    } else if (v === 1) {
      cawAt(t, 224, 178, 0.28, 0.24);
      cawAt(t + 0.36, 214, 172, 0.28, 0.22);
      cawAt(t + 0.74, 202, 160, 0.34, 0.21);
    } else {
      cawAt(t, 192, 152, 0.4, 0.3);
    }
  }

  // [TEMP] Découverte d'un objet important (façon Zelda : fanfare montante + accord lumineux).
  function decouverte() {
    const t = ctx.currentTime;
    const seq = [
      [392.0, 0.0, 0.13, 0.16],  // Sol4
      [440.0, 0.12, 0.13, 0.17], // La4
      [493.9, 0.24, 0.13, 0.18], // Si4
      [523.3, 0.36, 0.52, 0.22], // Do5
    ];
    for (const [f, at, dur, vol] of seq) {
      tone('triangle', f, f, t + at, dur, vol, sfxBus);
      tone('sine', f * 2, f * 2, t + at, dur * 0.75, vol * 0.25, sfxBus);
    }
    // Accord majeur lumineux sur la note finale (Do5 - Mi5 - Sol5 - Do6).
    tone('triangle', 659.3, 659.3, t + 0.36, 0.56, 0.15, sfxBus);
    tone('triangle', 784.0, 784.0, t + 0.36, 0.62, 0.16, sfxBus);
    tone('sine', 1046.5, 1046.5, t + 0.39, 0.65, 0.11, sfxBus);
  }

  // [TEMP] Portes automatiques : souffle qui glisse.
  function portes() {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.5;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(1500, t + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    src.connect(bp).connect(g).connect(sfxBus);
    src.start(t, 0.4, 1.2);
    track(src, [src, bp, g]);
  }

  // [TEMP] Ding (une seule note claire, un peu réverbérée).
  function ding() {
    const t = ctx.currentTime;
    tone('sine', 1318, 1318, t, 1.6, 0.18, voiceBus);
    tone('sine', 2636, 2636, t, 0.6, 0.04, voiceBus);
  }

  // [TEMP] Prendre un objet (Scanette, panier) : petit déclic puis note qui monte.
  function prise() {
    const t = ctx.currentTime;
    tone('square', 900, 900, t, 0.03, 0.08);
    tone('sine', 600, 1200, t + 0.03, 0.12, 0.18);
  }

  // [TEMP] Le chariot grince (il se retourne, on le prend) : deux petits crissements aigus.
  function grince() {
    const t = ctx.currentTime;
    tone('sawtooth', 1900, 2350, t, 0.09, 0.02);
    tone('sawtooth', 2250, 1750, t + 0.1, 0.12, 0.016);
  }

  // [TEMP] Une pile de cartons tombe : trois chocs sourds.
  function chute() {
    const t = ctx.currentTime;
    tone('triangle', 140, 70, t, 0.18, 0.3);
    tone('triangle', 120, 60, t + 0.12, 0.2, 0.26);
    tone('triangle', 100, 50, t + 0.27, 0.26, 0.22);
  }

  // [TEMP] Annonce au haut-parleur : « ding-dong » de magasin, deux notes douces.
  function annonce() {
    const t = ctx.currentTime;
    tone('sine', 784, 784, t, 0.5, 0.2, voiceBus);
    tone('sine', 659, 659, t + 0.28, 0.7, 0.18, voiceBus);
  }

  // [TEMP] Petit bip de lettre (machine à écrire), légèrement varié.
  let blipN = 0;
  function blip() {
    blipN = (blipN + 1) % 3;
    const n = blipN;
    playPrepared('blip', n, voiceBus, () => [toneGraph(ctx, voiceBus, 'square', 620 + n * 40, 620 + n * 40, ctx.currentTime, 0.03, 0.05)]);
  }

  // [TEMP] Froissement de papier : trois petits crissements de bruit filtré (aparté du héros).
  function froissement() {
    playPrepared('froissement', 0, heroBus, () => froissGraph(ctx, heroBus, ctx.currentTime));
  }
  function froissGraph(c, out, t) {
    const parts = [];
    for (let k = 0; k < 3; k++) {
      const at = t + k * 0.07;
      const src = c.createBufferSource();
      src.buffer = noise;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.2;
      bp.frequency.value = 2600 + k * 900;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.3 - k * 0.06, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
      src.connect(bp).connect(g).connect(out);
      src.start(at, 0.1 + k * 0.2, 0.08);
      parts.push([src, bp, g]);
    }
    return parts;
  }

  // [TEMP] Carte qui se retourne (Panier) : un petit souffle de papier qui glisse (bruit filtré dont le
  // ton descend), puis un léger claquement quand la feuille retombe à plat.
  function retourne() {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(4200, t);
    bp.frequency.exponentialRampToValueAtTime(1300, t + 0.13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    src.connect(bp).connect(g).connect(scanBus);
    src.start(t, 0.37, 0.16);
    track(src, [src, bp, g]);
    // claquement : très court, plus aigu
    const c = ctx.createBufferSource();
    c.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const cg = ctx.createGain();
    const at = t + 0.15;
    cg.gain.setValueAtTime(0.0001, at);
    cg.gain.exponentialRampToValueAtTime(0.18, at + 0.004);
    cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
    c.connect(hp).connect(cg).connect(scanBus);
    c.start(at, 0.61, 0.04);
    track(c, [c, hp, cg]);
  }

  // [TEMP] Aparté : souffle grave qui monte (le temps s'arrête), puis une note basse tenue.
  function aparte() {
    const t = ctx.currentTime;
    tone('sine', 55, 82, t, 0.9, 0.35, heroBus);
    tone('triangle', 110, 110, t + 0.15, 1.1, 0.08, heroBus);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(200, t);
    lp.frequency.exponentialRampToValueAtTime(1400, t + 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    src.connect(lp).connect(g).connect(heroBus);
    src.start(t, 0.2, 0.85);
    track(src, [src, lp, g]);
    // [TEMP] Motif de l'Épaisseur : quatre notes de cloche douce, toujours les mêmes à chaque aparté.
    const notes = [659, 784, 988, 880];
    notes.forEach((f, i) => {
      tone('sine', f, f, t + 0.35 + i * 0.26, 0.9, 0.13, heroBus);
      tone('triangle', f * 2, f * 2, t + 0.35 + i * 0.26, 0.4, 0.03, heroBus);
    });
  }

  // [TEMP] Petit bip de lettre du héros : plus grave et plus doux que celui du haut-parleur.
  let heroN = 0;
  function blipHeros() {
    heroN = (heroN + 1) % 3;
    const n = heroN;
    playPrepared('blipHeros', n, heroBus, () => [toneGraph(ctx, heroBus, 'triangle', 330 + n * 30, 300 + n * 30, ctx.currentTime, 0.04, HERO_BLIP)]);
  }

  function running() {
    return ctx && ctx.state === 'running' && !hidden;
  }

  // Un pas : frottement étouffé d'une semelle souple sur le lino, sans claquement.
  // Pieds gauche et droit légèrement différents, pour ne pas sonner comme une machine.
  function step() {
    foot = 1 - foot;
    if (samples.playStep(ctx, sfxBus, track, settings.stepSound, foot)) return;
    const f = foot;
    playPrepared('pas', f, sfxBus, () => [stepGraph(ctx, sfxBus, ctx.currentTime, f)]);
  }
  function stepGraph(c, out, t, f) {
    const src = c.createBufferSource();
    src.buffer = noise;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = f ? 700 : 600;
    lp.Q.value = 0.5;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(lp).connect(g).connect(out);
    src.start(t, f ? 0.2 : 0.6, 0.12);
    return [src, lp, g];
  }

  const SOUNDS = { pas: step, bip, aspire, carte, retourne, prise, decouverte, grince, chute, annonce, blip, froissement, blipHeros, aparte, corbeau, portes, ding };

  return {
    // Appelé au premier geste du joueur.
    // Appelé à chaque geste du joueur : si le son a été suspendu ou interrompu (appel, autre application,
    // écran éteint), il reprend ici (séance 65, correction n° 2 ; « interrupted » : Safari).
    unlock() {
      if (!ctx) init();
      if (!ctx || hidden || (ctx.state !== 'suspended' && ctx.state !== 'interrupted')) return;
      stats.resumed++;
      ctx.resume().catch(() => {}); // refusé hors geste : réessayé au geste suivant
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
    // Compteurs (diagnostic, banc d'essai, tests) : sons joués, notes de musique, nœuds actifs par
    // catégorie (créés − libérés), changements d'état du contexte (suspendu, interrompu…).
    counters() {
      return {
        state: ctx ? ctx.state : 'pas démarré',
        played: stats.played,
        notes: stats.notes,
        sfx: stats.sfx.created - stats.sfx.freed,
        music: stats.music.created - stats.music.freed,
        states: stats.states.slice(-4),
        byName: { ...stats.byName },
        recent: stats.recent.slice(),
        clock: ctx ? Math.round(ctx.currentTime) : 0, // horloge du son (s)
        song: samples.position(),
        prepared: !!prepared, // sons courts préparés une fois au démarrage
        cut: stats.cut, // sons arrêtés parce que leur famille était pleine
        resumed: stats.resumed, // reprises au geste du joueur après une suspension ou une interruption
      };
    },
    applyVolumes,
    // Pendant un aparté, le magasin est figé : sa musique se tait (et reprend doucement après).
    setFrozen(f) {
      if (f === frozen) return;
      frozen = f;
      applyVolumes();
    },
    setState(state) {
      paused = state === 'pause';
      applyVolumes();
    },
    setHidden(h) {
      hidden = h;
      if (!ctx) return;
      if (h) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {}); // si le navigateur refuse sans geste : reprise au prochain geste (unlock)
    },
    play(name) {
      if (!running() || !SOUNDS[name]) return;
      stats.played++;
      stats.byName[name] = (stats.byName[name] ?? 0) + 1; // quels sons (diagnostic : un son inattendu)
      if (name !== 'pas' && name !== 'blip' && name !== 'blipHeros') {
        stats.recent.push(`${Math.round(ctx.currentTime)} s ${name}`); // les derniers sons (hors pas et bips de texte)
        if (stats.recent.length > 6) stats.recent.shift();
      }
      const family = FAMILY[name] ?? name;
      const list = limit(family);
      collecting = [];
      SOUNDS[name]();
      const entry = { sources: collecting, left: collecting.length };
      collecting = null;
      for (const src of entry.sources) src.playing = entry;
      if (entry.left > 0) list.push(entry);
    },
    // Pluie réaliste de l'intro (public/audio/pluie-intro.mp3, CC0 #595717).
    setIntroRain(on) {
      introRainOn = Boolean(on);
      if (ctx && introBus) samples.setIntroRain(ctx, introBus, track, introRainOn);
    },
    update() {
      if (!running()) return;
      const trackMusic = (src, nodes) => track(src, nodes, 'music');
      stats.notes += samples.updateMusic(ctx, musicBus, trackMusic);
    },
  };
}
