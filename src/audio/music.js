// Musique d'ambiance provisoire, jouée en direct par des sons synthétisés (aucun fichier audio).
// Les notes sont programmées un court instant à l'avance sur l'horloge du son, à chaque image :
// pas de setTimeout, et la musique reste parfaitement en rythme.

const LOOKAHEAD = 0.3; // secondes programmées à l'avance

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Transforme la partition (JSON) en une liste d'événements triés, une fois pour toutes.
export function compileSong(song) {
  const bpb = song.beatsPerBar;
  const events = [];
  song.chords.forEach((c, bar) => {
    const b0 = bar * bpb;
    for (const [beat, dur, vel] of song.piano) for (const n of c.notes) events.push({ beat: b0 + beat, kind: 'piano', midi: n, dur, vel });
    for (const [beat, which, dur] of song.bass) events.push({ beat: b0 + beat, kind: 'bass', midi: c[which], dur, vel: 1 });
    for (const [beat, vel] of song.shaker) events.push({ beat: b0 + beat, kind: 'shaker', midi: 0, dur: 0, vel });
  });
  for (const [beat, midi, dur] of song.melody) events.push({ beat, kind: 'melody', midi, dur, vel: 1 });
  events.sort((a, b) => a.beat - b.beat);
  return { events, loopBeats: song.chords.length * bpb, spb: 60 / song.bpm, melodyLoops: song.melodyLoops ?? [true] };
}

export function createMusic(song) {
  const s = compileSong(song);
  let start = -1;
  let idx = 0;
  let loop = 0;

  const timeOf = (i) => start + (loop * s.loopBeats + s.events[i].beat) * s.spb;

  function env(ctx, g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function tone(ctx, out, type, f, t, peak, attack, decay) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    env(ctx, g, t, peak, attack, decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  function play(ctx, out, noise, e, t) {
    const len = e.dur * s.spb;
    if (e.kind === 'piano') {
      // Piano électrique doux : fondamentale + un peu d'octave.
      tone(ctx, out, 'sine', freq(e.midi), t, 0.05 * e.vel, 0.012, len + 0.5);
      tone(ctx, out, 'triangle', freq(e.midi) * 2, t, 0.008 * e.vel, 0.01, len * 0.6 + 0.2);
    } else if (e.kind === 'bass') {
      tone(ctx, out, 'triangle', freq(e.midi), t, 0.16, 0.015, len + 0.15);
    } else if (e.kind === 'melody') {
      // Vibraphone : son pur avec une petite harmonique aiguë.
      tone(ctx, out, 'sine', freq(e.midi), t, 0.07, 0.006, len + 0.9);
      tone(ctx, out, 'sine', freq(e.midi) * 4, t, 0.006, 0.004, 0.25);
    } else {
      // Shaker : bruit très aigu et très court.
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      const g = ctx.createGain();
      env(ctx, g, t, 0.03 * e.vel, 0.004, 0.05);
      src.connect(hp).connect(g).connect(out);
      src.start(t, (idx % 7) * 0.1, 0.1);
    }
  }

  return {
    // À chaque image : programme les notes des prochaines LOOKAHEAD secondes.
    update(ctx, out, noise) {
      const now = ctx.currentTime;
      if (start < 0) start = now + 0.15;
      // Retard (onglet en veille…) : on recale le morceau au lieu de tout jouer d'un coup.
      if (timeOf(idx) < now - 0.05) start += now + 0.05 - timeOf(idx);
      let t;
      while ((t = timeOf(idx)) < now + LOOKAHEAD) {
        const e = s.events[idx];
        if (e.kind !== 'melody' || s.melodyLoops[loop % s.melodyLoops.length]) play(ctx, out, noise, e, t);
        idx++;
        if (idx === s.events.length) {
          idx = 0;
          loop++;
        }
      }
    },
  };
}
