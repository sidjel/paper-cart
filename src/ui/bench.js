// Banc d'essai, côté interface : bouton de lancement (onglet Diagnostic des réglages),
// mesures pendant le parcours, et rapport à copier à la fin.
// Une moyenne seule ne prouve rien : le rapport donne le 95e percentile et les images > 33 ms.

const MAX = 60 * 60 * 6; // jusqu'à 6 minutes de mesures à 60 images/s

function fmt(n, d = 1) {
  return Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—';
}

function percentile(sorted, n, q) {
  return n ? sorted[Math.min(n - 1, Math.floor(n * q))] : NaN;
}

export function createBenchUi(root, { onStart, getContext }) {
  const frames = new Float32Array(MAX);
  const js = new Float32Array(MAX);
  let n = 0;
  let duration = 0;

  // Bloc placé dans l'onglet « Diagnostic » des réglages.
  const launcher = document.createElement('div');
  launcher.className = 'bench-launch';
  const startBtn = document.createElement('button');
  startBtn.className = 'primary';
  startBtn.textContent = "Lancer le banc d'essai";
  const help = document.createElement('p');
  help.className = 'settings-note';
  help.textContent =
    "Le personnage parcourt seul le rayon, toujours de la même façon (chauffe, puis plusieurs tours). Ne touche à rien ; à la fin, copie le rapport. Échap ou ⏸ pour annuler.";
  launcher.append(startBtn, help);
  startBtn.addEventListener('click', () => onStart());

  // Panneau de résultats.
  const panel = document.createElement('div');
  panel.className = 'bench-result panel';
  panel.hidden = true;
  const title = document.createElement('h2');
  title.textContent = "Banc d'essai";
  const text = document.createElement('pre');
  const row = document.createElement('div');
  row.className = 'panel-buttons';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'primary';
  copyBtn.textContent = 'Copier le rapport';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fermer';
  row.append(copyBtn, closeBtn);
  panel.append(title, text, row);
  root.appendChild(panel);
  closeBtn.addEventListener('click', () => (panel.hidden = true));

  // Petit bandeau pendant le parcours.
  const banner = document.createElement('div');
  banner.className = 'bench-banner';
  banner.hidden = true;
  root.appendChild(banner);

  let lastReport = '';

  function report(status, b) {
    const c = getContext();
    const sorted = frames.slice(0, n).sort();
    const jsSorted = js.slice(0, n).sort();
    let sum = 0, jsSum = 0, over33 = 0, over20 = 0;
    for (let i = 0; i < n; i++) {
      sum += frames[i];
      jsSum += js[i];
      if (frames[i] > 33) over33++;
      if (frames[i] > 20) over20++;
    }
    const avg = n ? sum / n : NaN;
    const p95 = percentile(sorted, n, 0.95);
    const jsWorst = n ? jsSorted[n - 1] : NaN;
    const ok = n > 0 && over33 === 0 && jsWorst <= 8 && 1000 / avg >= 58;
    return [
      "Paper Cart — banc d'essai",
      `Résultat : ${status}`,
      `Version : ${c.version}`,
      `Date : ${new Date().toLocaleString('fr-FR')}`,
      `Navigateur : ${navigator.userAgent}`,
      `Écran : ${screen.width}×${screen.height} (CSS) · densité ${fmt(window.devicePixelRatio, 3)} · fenêtre ${window.innerWidth}×${window.innerHeight} · plein écran ${document.fullscreenElement ? 'oui' : 'non'}`,
      `Rendu : ${c.renderLine}`,
      `Images : ${c.images} chargées, ${fmt(c.pixels / 1e6, 2)} Mpx · chargement ${c.loadMs} ms`,
      `Lieu : ${c.place} · ${b.passes} tour(s) mesuré(s) · chauffe ${b.warmup} s · interrupteurs : ${c.switches || 'aucun'}`,
      `Mesures : ${n} images en ${fmt(duration)} s`,
      `  images/s moyennes : ${fmt(1000 / avg)}`,
      `  temps d'image (total) : moy ${fmt(avg)} ms · médiane ${fmt(percentile(sorted, n, 0.5))} · p95 ${fmt(p95)} · p99 ${fmt(percentile(sorted, n, 0.99))} · pire ${fmt(n ? sorted[n - 1] : NaN)}`,
      `  images > 33 ms : ${over33} (${fmt((over33 / Math.max(1, n)) * 100, 2)} %) · images > 20 ms : ${over20}`,
      `  calcul JavaScript par image : moy ${fmt(jsSum / Math.max(1, n), 2)} ms · p95 ${fmt(percentile(jsSorted, n, 0.95), 2)} · pire ${fmt(jsWorst, 2)}`,
      `  (le reste du temps d'image est pris par le navigateur et la carte graphique)`,
      `Réglages modifiés : ${JSON.stringify(c.overrides)}`,
      `Objectifs (60 i/s, aucune image > 33 ms, calcul ≤ 8 ms) : ${ok ? 'atteints' : 'non atteints'}`,
    ].join('\n');
  }

  copyBtn.addEventListener('click', async () => {
    let done = false;
    try {
      await navigator.clipboard.writeText(lastReport);
      done = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lastReport;
      ta.className = 'offscreen';
      document.body.appendChild(ta);
      ta.select();
      done = document.execCommand('copy');
      ta.remove();
    }
    copyBtn.textContent = done ? 'Copié !' : 'Copie impossible : sélectionne le texte';
  });

  return {
    launcher,
    begin() {
      n = 0;
      duration = 0;
      panel.hidden = true;
      banner.hidden = false;
      banner.textContent = "Banc d'essai : chauffe…";
    },
    // À chaque image pendant le parcours mesuré.
    record(dt, jsMs) {
      if (n >= MAX || dt <= 0) return;
      frames[n] = dt;
      js[n] = jsMs;
      n++;
      duration += dt / 1000;
    },
    progress(b) {
      const t = b.phase === 'warmup' ? 'chauffe…' : `tour ${Math.min(b.pass + 1, b.passes)} / ${b.passes}`;
      const txt = `Banc d'essai : ${t}`;
      if (banner.textContent !== txt) banner.textContent = txt;
    },
    finish(status, b) {
      banner.hidden = true;
      lastReport = report(status, b);
      text.textContent = lastReport;
      copyBtn.textContent = 'Copier le rapport';
      panel.hidden = false;
      return lastReport;
    },
    get lastReport() {
      return lastReport;
    },
  };
}
