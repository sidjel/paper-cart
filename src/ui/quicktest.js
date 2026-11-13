// Test rapide T0 / T1 / T2, côté mesures et rapport.
// Pour chaque image mesurée : sa durée, le calcul du jeu, la condition et le bloc.
// Le rapport compare les variantes avec une marge d'incertitude (intervalle de confiance à 95 %)
// sur le nombre d'images lentes : une différence n'est dite « démontrée » que si la marge l'exclut.

import { QUICK_CONDITIONS } from '../core/quicktest.js';

const MAX = 15 * 60 * 125; // jusqu'à 15 min à 125 images/s
const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—');

// Rapport de deux fréquences (événements a en ta secondes, b en tb) et sa marge à 95 %
// (loi de Poisson ; +0,5 si un compte est nul).
export function rateRatio(a, ta, b, tb) {
  const A = a || 0.5, B = b || 0.5;
  const r = A / ta / (B / tb);
  const se = Math.sqrt(1 / A + 1 / B);
  return { r, lo: r * Math.exp(-1.96 * se), hi: r * Math.exp(1.96 * se) };
}

export function verdict({ lo, hi }) {
  if (hi < 1) return 'amélioration démontrée';
  if (lo > 1) return 'dégradation démontrée';
  return 'pas de différence démontrée';
}

export function createQuickTestUi(root, { onStart, getContext }) {
  const frames = new Float32Array(MAX);
  const js = new Float32Array(MAX);
  const cond = new Uint8Array(MAX);
  const block = new Uint16Array(MAX);
  let n = 0;
  let blockNo = 0;
  let lastReport = '';
  let status = '';
  let params = {};
  let start = { battery: '?', wakeLock: 'non' };
  let wakeLock = null;

  async function batteryText() {
    try {
      const b = await navigator.getBattery();
      return `${Math.round(b.level * 100)} %${b.charging ? ' (EN CHARGE)' : ' (débranché)'}`;
    } catch {
      return 'inconnue';
    }
  }

  // ---------- Interface ----------
  const launcher = document.createElement('div');
  launcher.className = 'bench-launch';
  const btn = document.createElement('button');
  btn.className = 'primary';
  btn.textContent = 'Lancer le test rapide T0 / T1 / T2 (≈ 7 min)';
  const help = document.createElement('p');
  help.className = 'settings-note';
  help.textContent =
    'Compare, dans un seul essai et en alternance, la référence (T0), « réduire les animations » (T1) et le rayon de devant invisible (T2). Téléphone débranché, plein écran, ne touche à rien.';
  launcher.append(btn, help);
  btn.addEventListener('click', () => onStart());

  const panel = document.createElement('div');
  panel.className = 'bench-result panel';
  panel.hidden = true;
  const title = document.createElement('h2');
  title.textContent = 'Test rapide T0 / T1 / T2';
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

  const banner = document.createElement('div');
  banner.className = 'bench-banner';
  banner.hidden = true;
  root.appendChild(banner);

  // ---------- Statistiques par condition ----------
  function stats(ci) {
    const d = [];
    let sumT = 0, o20 = 0, o33 = 0, o50 = 0, jsSum = 0, jsWorst = 0;
    const perBlock = new Map(); // bloc → [durée (ms), images > 20 ms]
    for (let i = 0; i < n; i++) {
      if (cond[i] !== ci) continue;
      const f = frames[i];
      d.push(f);
      sumT += f;
      jsSum += js[i];
      if (js[i] > jsWorst) jsWorst = js[i];
      if (f > 20) o20++;
      if (f > 33) o33++;
      if (f > 50) o50++;
      const b = perBlock.get(block[i]) ?? [0, 0];
      b[0] += f;
      if (f > 20) b[1]++;
      perBlock.set(block[i], b);
    }
    d.sort((x, y) => x - y);
    const secs = sumT / 1000;
    const blockRates = [...perBlock.values()].map(([t, c]) => (c / t) * 60000);
    return {
      n: d.length,
      secs,
      fps: d.length / Math.max(secs, 1e-6),
      o20, o33, o50,
      perMin: (o20 / Math.max(secs, 1e-6)) * 60,
      blockMin: blockRates.length ? Math.min(...blockRates) : NaN,
      blockMax: blockRates.length ? Math.max(...blockRates) : NaN,
      p95: d.length ? d[Math.min(d.length - 1, Math.floor(d.length * 0.95))] : NaN,
      jsAvg: jsSum / Math.max(1, d.length),
      jsWorst,
    };
  }

  function report(endBattery) {
    const c = getContext();
    const s = QUICK_CONDITIONS.map((_, i) => stats(i));
    const by = (id) => s[QUICK_CONDITIONS.findIndex((q) => q.id === id)];
    const cmp = (label, a, b) => {
      const x = by(a), y = by(b);
      const rr = rateRatio(x.o20, x.secs, y.o20, y.secs);
      return `  ${label} : ×${fmt(rr.r, 2)} [marge ${fmt(rr.lo, 2)} – ${fmt(rr.hi, 2)}] → ${verdict(rr)}`;
    };
    const lines = [
      'Paper Cart — test rapide T0 / T1 / T2',
      `Résultat : ${status}`,
      `Version : ${c.version} · ${new Date().toLocaleString('fr-FR')}`,
      `Appareil : ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, '')}`,
      `Écran : ${screen.width}×${screen.height} · densité ${window.devicePixelRatio} · plein écran ${document.fullscreenElement ? 'oui' : 'non'}`,
      `Rendu : ${c.renderLine}`,
      `Batterie : début ${start.battery} · fin ${endBattery} · écran maintenu allumé : ${start.wakeLock}`,
      `Réglages modifiés : ${JSON.stringify(c.overrides)}`,
      `Protocole : chauffe ${params.warmup} s · ${params.rounds} tours × 5 conditions × ${params.block} s (${params.settle} s ignorées après chaque changement) · ordre inversé un tour sur deux · même aller-retour en ligne droite`,
      'Situations : A = marche, caméra fixe · B = marche, caméra mobile',
      'Variantes : T0 = référence · T1 = réduire les animations (rebond, respiration, écrasements, retournement, poussière) · T2 = rayon de devant invisible',
      '',
      'Condition | images (s) | i/s | >20 ms par min (blocs min–max) | >33 | >50 | p95 | calcul moy/pire',
    ];
    QUICK_CONDITIONS.forEach((q, i) => {
      const x = s[i];
      lines.push(
        `  ${q.id} | ${x.n} (${fmt(x.secs, 0)}) | ${fmt(x.fps)} | ${fmt(x.perMin)} (${fmt(x.blockMin, 0)}–${fmt(x.blockMax, 0)}) | ${x.o33} | ${x.o50} | ${fmt(x.p95)} | ${fmt(x.jsAvg, 2)}/${fmt(x.jsWorst, 1)}`,
      );
    });
    lines.push(
      '',
      'Comparaisons (images > 20 ms ; ×1 = pareil, ×0,5 = deux fois moins ; « marge » = intervalle de confiance à 95 %) :',
      cmp('T1 contre T0, caméra fixe (A)', 'A-T1', 'A-T0'),
      cmp('T1 contre T0, caméra mobile (B)', 'B-T1', 'B-T0'),
      cmp('T2 contre T0, caméra mobile (B)', 'B-T2', 'B-T0'),
      cmp('Caméra mobile contre fixe (T0)', 'B-T0', 'A-T0'),
      '',
      'Prudence : la marge suppose des images lentes indépendantes ; si les blocs d’une même condition varient beaucoup (colonne min–max), un effet « démontré » mais faible reste à confirmer.',
    );
    return lines.join('\n');
  }

  return {
    launcher,
    async begin(p) {
      params = p;
      n = 0;
      blockNo = 0;
      status = 'en cours';
      panel.hidden = true;
      banner.hidden = false;
      start.battery = await batteryText();
      try {
        wakeLock = await navigator.wakeLock?.request('screen');
      } catch {
        wakeLock = null;
      }
      start.wakeLock = wakeLock && !wakeLock.released ? 'oui' : 'non (refusé par le téléphone)';
    },
    nextBlock() {
      blockNo++;
    },
    record(dt, jsMs, ci) {
      if (n >= MAX || dt <= 0) return;
      frames[n] = dt;
      js[n] = jsMs;
      cond[n] = ci;
      block[n] = blockNo;
      n++;
    },
    progress(txt) {
      if (banner.textContent !== txt) banner.textContent = txt;
    },
    async finish(st) {
      status = st;
      banner.hidden = true;
      try {
        await wakeLock?.release();
      } catch {
        /* rien */
      }
      lastReport = report(await batteryText());
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
