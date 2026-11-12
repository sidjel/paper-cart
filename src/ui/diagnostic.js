// Diagnostic intégré (F3 ou bouton « DBG ») : images/s, pire image, temps de calcul,
// mémoire, et un rapport court à copier dans la conversation.
// Les mesures ne sont prises que pendant le jeu (pas en pause ni sous un menu).

const N = 600; // ~10 s d'historique à 60 images/s
const LONG_FRAME = 33;

function fmt(n, d = 1) {
  return Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—';
}

export function createDiagnostic(root, getContext) {
  const frameMs = new Float32Array(N);
  const jsMs = new Float32Array(N);
  const sorted = new Float32Array(N); // copie triée, pour les percentiles (réutilisée)
  let idx = 0;
  let count = 0;
  let worstEver = 0;
  let longEver = 0;
  let framesEver = 0;
  let visible = false;
  let nextUpdate = 0;
  let copiedUntil = 0;

  const panel = document.createElement('div');
  panel.className = 'diag panel';
  panel.hidden = true;
  const text = document.createElement('pre');
  const row = document.createElement('div');
  row.className = 'panel-buttons';
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copier le rapport';
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Remettre à zéro';
  row.append(copyBtn, resetBtn);
  panel.append(text, row);
  root.appendChild(panel);

  function reset() {
    idx = 0;
    count = 0;
    worstEver = 0;
    longEver = 0;
    framesEver = 0;
  }

  // Statistiques sur l'historique : moyenne, 95e percentile, pire.
  function stats(buf) {
    let sum = 0;
    let worst = 0;
    for (let i = 0; i < count; i++) {
      sorted[i] = buf[i];
      sum += buf[i];
      if (buf[i] > worst) worst = buf[i];
    }
    const view = sorted.subarray(0, count);
    view.sort();
    const p95 = count ? view[Math.min(count - 1, Math.floor(count * 0.95))] : NaN;
    return { avg: count ? sum / count : NaN, p95, worst };
  }

  function recentFps() {
    let t = 0;
    let n = 0;
    for (let k = 1; k <= count && t < 1000; k++) {
      t += frameMs[(idx - k + N) % N];
      n++;
    }
    return t > 0 ? (n * 1000) / t : NaN;
  }

  function longFrames() {
    let n = 0;
    for (let i = 0; i < count; i++) if (frameMs[i] > LONG_FRAME) n++;
    return n;
  }

  function memoryMb() {
    const m = performance.memory;
    return m ? m.usedJSHeapSize / 1048576 : NaN;
  }

  function liveText() {
    const f = stats(frameMs);
    const j = stats(jsMs);
    const c = getContext();
    return [
      `${fmt(recentFps(), 0)} images/s   pire ${fmt(f.worst)} ms`,
      `> 33 ms : ${longFrames()} (total ${longEver})`,
      `calcul ${fmt(j.avg, 2)} ms (pire ${fmt(j.worst)})`,
      `mémoire ${fmt(memoryMb(), 0)} Mo`,
      `état ${c.state} · ${c.renderLine}`,
    ].join('\n');
  }

  function report() {
    const f = stats(frameMs);
    const j = stats(jsMs);
    const c = getContext();
    const ok = count > 0 && f.p95 < 18 && longFrames() === 0 && j.worst <= 8;
    return [
      'Paper Cart — rapport de diagnostic',
      `Version : ${c.version}`,
      `Date : ${new Date().toLocaleString('fr-FR')}`,
      `Navigateur : ${navigator.userAgent}`,
      `Écran : ${screen.width}×${screen.height} (CSS) · densité ${fmt(window.devicePixelRatio, 3)} · fenêtre ${window.innerWidth}×${window.innerHeight} · plein écran ${document.fullscreenElement ? 'oui' : 'non'}`,
      `Rendu : ${c.renderLine}`,
      `Images : ${c.images} chargées, ${fmt(c.pixels / 1e6, 2)} Mpx en mémoire (≈ ${fmt((c.pixels * 4) / 1048576, 0)} Mo), chargement du lieu ${c.loadMs} ms`,
      `Images les plus lentes à préparer : ${c.slowest}`,
      `Son : ${c.audio}`,
      `Lieu : ${c.place} · état ${c.state} · manette ${c.gamepad ? 'oui' : 'non'}`,
      `Mesures en jeu : ${count} dernières images (${framesEver} depuis la remise à zéro)`,
      `  images/s (dernière seconde) : ${fmt(recentFps())}`,
      `  temps d'image : moy ${fmt(f.avg)} ms · p95 ${fmt(f.p95)} · pire ${fmt(f.worst)} (pire depuis zéro ${fmt(worstEver)})`,
      `  images > 33 ms : ${longFrames()} dans l'historique · ${longEver} depuis zéro`,
      `  calcul JS par image : moy ${fmt(j.avg, 2)} ms · p95 ${fmt(j.p95, 2)} · pire ${fmt(j.worst, 2)}`,
      `  mémoire JS : ${fmt(memoryMb())} Mo`,
      `Réglages modifiés : ${JSON.stringify(c.overrides)}`,
      `Objectifs (60 i/s, aucune image > 33 ms, calcul ≤ 8 ms) : ${ok ? 'atteints sur cet historique' : 'à vérifier'}`,
    ].join('\n');
  }

  async function copy() {
    const txt = report();
    let done = false;
    if (window.isSecureContext && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(txt);
        done = true;
      } catch {
        /* on essaie l'autre méthode */
      }
    }
    if (!done) {
      // Adresse locale en http (téléphone sur le Wi-Fi) : presse-papiers moderne indisponible.
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly', '');
      ta.className = 'offscreen';
      document.body.appendChild(ta);
      ta.select();
      done = document.execCommand('copy');
      ta.remove();
    }
    copyBtn.textContent = done ? 'Copié !' : 'Copie impossible : texte affiché';
    if (!done) text.textContent = txt;
    copiedUntil = performance.now() + (done ? 1500 : 30000);
  }

  copyBtn.addEventListener('click', copy);
  resetBtn.addEventListener('click', reset);

  return {
    get visible() {
      return visible;
    },
    toggle() {
      visible = !visible;
      panel.hidden = !visible;
      nextUpdate = 0;
    },
    report,
    // À chaque image : durée depuis l'image précédente, temps de calcul, en jeu ou non.
    frame(dt, js, playing) {
      if (playing && dt > 0) {
        frameMs[idx] = dt;
        jsMs[idx] = js;
        idx = (idx + 1) % N;
        if (count < N) count++;
        framesEver++;
        if (dt > worstEver) worstEver = dt;
        if (dt > LONG_FRAME) longEver++;
      }
      if (!visible) return;
      const now = performance.now();
      if (now < nextUpdate) return;
      nextUpdate = now + 500;
      if (now > copiedUntil) {
        copyBtn.textContent = 'Copier le rapport';
        text.textContent = liveText();
      }
    },
  };
}
