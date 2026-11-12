// Diagnostic en 4 configurations, côté mesures et rapport.
// Ce module n'agit pas sur le jeu : il enregistre, pour chaque image mesurée, sa durée,
// le temps de calcul du jeu, un temps de rendu approximatif (côté page) et ce qui se passait
// à ce moment-là, puis rédige un rapport court et comparatif.
//
// Ce que le jeu peut mesurer depuis la page, et ce qu'il ne peut pas :
// - durée de chaque image (entre deux rafraîchissements) : oui ;
// - calcul du jeu (JavaScript de l'image) : oui ;
// - rendu côté page (style, mise en page, préparation du dessin) : approximativement ;
// - travail de la carte graphique et du compositeur : non (seulement via un traçage système) ;
// - ménage de la mémoire (GC) : indirectement. À chaque image, un minuscule objet « témoin »
//   est créé puis abandonné ; le navigateur signale quand il l'a jeté (FinalizationRegistry).
//   Le signal arrive juste après le ménage : on marque l'image en cours et la suivante.

import { PROTOCOL_CONFIGS } from '../core/protocol.js';

const MAX = 60 * 125; // une mesure de 60 s, jusqu'à 125 images/s
// Contexte d'une image (bits) :
export const F_CAMERA = 1; // la caméra a bougé
export const F_FRAME = 2; // le dessin du personnage a changé (image de marche, clignement)
export const F_FLIP = 4; // la feuille est en train de se retourner
export const F_DUST = 8; // un nuage de poussière vient d'apparaître
export const F_GC = 16; // ménage de la mémoire détecté à ce moment

const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—');

function pct(sortedView, q) {
  const n = sortedView.length;
  return n ? sortedView[Math.min(n - 1, Math.floor(n * q))] : NaN;
}

export function createProtocolUi(root, { onStart, getContext }) {
  const frames = new Float32Array(MAX);
  const js = new Float32Array(MAX);
  const render = new Float32Array(MAX);
  const flags = new Uint8Array(MAX);
  const ends = new Float64Array(MAX); // instant de fin de chaque image (ms)
  const gcTimes = []; // instants où le navigateur a signalé un ménage de la mémoire
  let gcSupported = typeof FinalizationRegistry !== 'undefined';
  const gcRegistry = gcSupported
    ? new FinalizationRegistry(() => {
        const t = performance.now();
        if (!gcTimes.length || t - gcTimes[gcTimes.length - 1] > 5) gcTimes.push(t);
      })
    : null;
  let measuringGc = false;
  const sorted = new Float32Array(MAX);
  let n = 0;
  let runStart = 0;
  let runInfo = null;
  const results = []; // résumés des mesures
  let lastReport = '';
  let status = '';

  // Observateurs du navigateur (seulement pendant le diagnostic).
  const loaf = []; // images de plus de 50 ms vues par le navigateur (Long Animation Frames)
  const longTasks = [];
  let observers = [];
  let imageLoads = 0;
  let inputs = 0;
  let params = { warmup: 0, measure: 0, repeats: 0 };
  let wakeLock = null;
  let battery = { start: '?', end: '?' };

  const onLoad = (e) => {
    if (e.target && e.target.tagName === 'IMG') imageLoads++;
  };
  const onInput = () => inputs++;

  function startObservers() {
    observers = [];
    for (const [type, list] of [['long-animation-frame', loaf], ['longtask', longTasks]]) {
      try {
        const o = new PerformanceObserver((l) => {
          for (const e of l.getEntries()) list.push(e);
        });
        o.observe({ type, buffered: false });
        observers.push(o);
      } catch {
        /* non disponible sur ce navigateur */
      }
    }
    document.addEventListener('load', onLoad, true);
    for (const t of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(t, onInput, true);
  }

  function stopObservers() {
    for (const o of observers) o.disconnect();
    observers = [];
    document.removeEventListener('load', onLoad, true);
    for (const t of ['pointerdown', 'keydown', 'touchstart']) window.removeEventListener(t, onInput, true);
  }

  async function batteryText() {
    try {
      const b = await navigator.getBattery();
      return `${Math.round(b.level * 100)} %${b.charging ? ' (en charge)' : ''}`;
    } catch {
      return 'inconnue';
    }
  }

  // Rendu côté page : un message posté à la fin du calcul de l'image est traité après
  // que le navigateur a préparé l'image (style, mise en page, dessin). Approximation.
  const channel = new MessageChannel();
  let pendingIdx = -1;
  let pendingT = 0;
  channel.port1.onmessage = () => {
    if (pendingIdx >= 0) render[pendingIdx] = performance.now() - pendingT;
    pendingIdx = -1;
  };

  // ---------- Interface ----------
  const launcher = document.createElement('div');
  launcher.className = 'bench-launch';
  const btn = document.createElement('button');
  btn.className = 'primary';
  btn.textContent = 'Lancer le diagnostic complet (4 configurations)';
  const help = document.createElement('p');
  help.className = 'settings-note';
  help.textContent =
    "Environ 16 minutes avec les réglages par défaut. Plein écran, téléphone posé, ne touche à rien : l'écran reste allumé tout seul. À la fin, copie le rapport.";
  launcher.append(btn, help);
  btn.addEventListener('click', () => onStart());

  const panel = document.createElement('div');
  panel.className = 'bench-result panel';
  panel.hidden = true;
  const title = document.createElement('h2');
  title.textContent = 'Diagnostic en 4 configurations';
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

  function snapshot() {
    return `${window.innerWidth}×${window.innerHeight}|${document.fullscreenElement ? 'plein' : 'fenêtre'}|${window.devicePixelRatio}`;
  }

  // ---------- Résumé d'une mesure ----------
  function summarize(ci, run) {
    const view = (src) => {
      const v = sorted.subarray(0, n);
      for (let i = 0; i < n; i++) v[i] = src[i];
      v.sort();
      return v;
    };
    // Ménages de la mémoire pendant cette mesure : on marque l'image où le signal est arrivé et la précédente.
    let gcCount = 0;
    for (const t of gcTimes) {
      if (t < runStart) continue;
      gcCount++;
      let i = 0;
      while (i < n - 1 && ends[i] < t) i++;
      flags[i] |= F_GC;
      if (i > 0) flags[i - 1] |= F_GC;
    }
    let sum = 0, o20 = 0, o33 = 0, o50 = 0, jsSum = 0, rSum = 0, rN = 0, rWorst = 0;
    for (let i = 0; i < n; i++) {
      sum += frames[i];
      jsSum += js[i];
      if (frames[i] > 20) o20++;
      if (frames[i] > 33) o33++;
      if (frames[i] > 50) o50++;
      if (render[i] >= 0) {
        rSum += render[i];
        rN++;
        if (render[i] > rWorst) rWorst = render[i];
      }
    }
    const fv = view(frames);
    const s = { ci, run, n, fps: n ? (1000 * n) / sum : NaN, o20, o33, o50, p95: pct(fv, 0.95), median: pct(fv, 0.5), worst: n ? fv[n - 1] : NaN };
    const jv = view(js);
    s.jsAvg = jsSum / Math.max(1, n);
    s.jsP95 = pct(jv, 0.95);
    s.jsWorst = n ? jv[n - 1] : NaN;
    // Rendu (seulement les images où la mesure a abouti).
    let k = 0;
    for (let i = 0; i < n; i++) if (render[i] >= 0) sorted[k++] = render[i];
    const rv = sorted.subarray(0, k).sort();
    s.rAvg = rN ? rSum / rN : NaN;
    s.rP95 = pct(rv, 0.95);
    s.rWorst = rN ? rWorst : NaN;
    // Images lentes (> 20 ms) : que se passait-il à cette image ou à la précédente ?
    s.links = {};
    for (const [name, bit] of [['GC', F_GC], ['dessin', F_FRAME], ['retournement', F_FLIP], ['poussière', F_DUST], ['caméra', F_CAMERA]]) {
      let slowWith = 0, framesWith = 0;
      for (let i = 0; i < n; i++) {
        const has = (flags[i] | (i > 0 ? flags[i - 1] : 0)) & bit;
        if (has) framesWith++;
        if (has && frames[i] > 20) slowWith++;
      }
      s.links[name] = [slowWith, Math.round((framesWith / Math.max(1, n)) * 100)];
    }
    const t0 = runStart, t1 = performance.now();
    const inRun = (e) => e.startTime >= t0 && e.startTime <= t1;
    const lf = loaf.filter(inRun);
    s.loaf = lf.length;
    s.loafRender = lf.length ? Math.max(...lf.map((e) => (e.renderStart ? e.startTime + e.duration - e.renderStart : 0))) : 0;
    s.longTasks = longTasks.filter(inRun).length;
    s.gc = gcCount;
    s.imageLoads = imageLoads;
    s.inputs = inputs;
    s.same = snapshot() === runInfo.snap && !runInfo.hidden;
    return s;
  }

  // ---------- Rapport ----------
  function report() {
    const c = getContext();
    const lines = [
      'Paper Cart — diagnostic en 4 configurations',
      `Résultat : ${status}`,
      `Version : ${c.version} · ${new Date().toLocaleString('fr-FR')}`,
      `Appareil : ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, '')}`,
      `Écran : ${screen.width}×${screen.height} · densité ${window.devicePixelRatio} · fenêtre ${window.innerWidth}×${window.innerHeight} · plein écran ${document.fullscreenElement ? 'oui' : 'non'}`,
      `Rendu : ${c.renderLine}`,
      `Protocole : chauffe ${params.warmup} s puis ${params.repeats} × ${params.measure} s par configuration · même endroit, même vitesse, aller-retour en ligne droite (aucun calcul de chemin)`,
      `Batterie : début ${battery.start} · fin ${battery.end} · écran maintenu allumé : ${c.wakeLock}`,
      `Ménage de la mémoire (GC) : ${gcSupported ? `détecté par objets témoins, ${gcTimes.length} fois en tout` : 'non détectable sur ce navigateur'}`,
      `Mesures navigateur : images > 50 ms (LoAF) ${typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame') ? 'oui' : 'non'} · tâches longues ${PerformanceObserver.supportedEntryTypes?.includes('longtask') ? 'oui' : 'non'}`,
      `Réglages modifiés : ${JSON.stringify(c.overrides)}`,
      '',
      'Colonnes : i/s | >20 | >33 | >50 ms | médiane | p95 | pire (ms) | calcul jeu moy/p95/pire | rendu page moy/p95/pire | LoAF | tâches longues | GC',
    ];
    for (const cfg of PROTOCOL_CONFIGS) {
      const rs = results.filter((r) => r.ci === cfg.id - 1);
      if (!rs.length) continue;
      lines.push(`[${cfg.id}] ${cfg.label}`);
      for (const r of rs) {
        lines.push(
          `  essai ${r.run + 1}${r.same ? '' : ' (CONDITIONS CHANGÉES)'} : ${fmt(r.fps)} | ${r.o20} | ${r.o33} | ${r.o50} | ${fmt(r.median)} | ${fmt(r.p95)} | ${fmt(r.worst)} | ${fmt(r.jsAvg, 2)}/${fmt(r.jsP95, 2)}/${fmt(r.jsWorst, 1)} | ${fmt(r.rAvg, 2)}/${fmt(r.rP95, 2)}/${fmt(r.rWorst, 1)} | ${r.loaf} | ${r.longTasks} | ${r.gc}` +
            (r.imageLoads ? ` | images chargées ${r.imageLoads}` : '') +
            (r.inputs ? ` | touchers ${r.inputs}` : ''),
        );
      }
      // Liens des images lentes, cumulés sur les essais : « x images lentes sur y » (part des images concernées).
      const slow = rs.reduce((a, r) => a + r.o20, 0);
      const link = (name) => {
        const s = rs.reduce((a, r) => a + r.links[name][0], 0);
        const share = Math.round(rs.reduce((a, r) => a + r.links[name][1], 0) / rs.length);
        return `${name} ${s}/${slow} (${share} % des images)`;
      };
      lines.push(`  images lentes pendant : ${['GC', 'dessin', 'retournement', 'poussière', 'caméra'].map(link).join(' · ')}`);
    }
    lines.push('', "Lecture : « dessin 30/40 (25 % des images) » = 30 des 40 images lentes ont eu lieu juste après un changement de dessin du personnage, alors que ces moments ne représentent que 25 % des images. Si les deux parts sont proches, pas de lien.");
    return lines.join('\n');
  }

  return {
    launcher,
    // p : { warmup, measure, repeats } réellement utilisés (pour le rapport).
    async begin(p) {
      params = p;
      results.length = 0;
      loaf.length = 0;
      longTasks.length = 0;
      gcTimes.length = 0;
      measuringGc = true;
      status = 'en cours';
      panel.hidden = true;
      banner.hidden = false;
      startObservers();
      battery.start = await batteryText();
      try {
        wakeLock = await navigator.wakeLock?.request('screen');
      } catch {
        wakeLock = null;
      }
    },
    get wakeLockActive() {
      return !!wakeLock && !wakeLock.released;
    },
    startRun() {
      n = 0;
      runStart = performance.now();
      imageLoads = 0;
      inputs = 0;
      runInfo = { snap: snapshot(), hidden: false };
    },
    endRun(ci, run) {
      results.push(summarize(ci, run));
    },
    markHidden() {
      if (runInfo) runInfo.hidden = true;
    },
    // Une image mesurée. Renvoie rien ; le temps de rendu arrive juste après (message).
    record(dt, jsMs, f) {
      if (n >= MAX || dt <= 0) return;
      // Objet témoin, abandonné aussitôt : son ramassage signale un ménage de la mémoire.
      if (gcRegistry && measuringGc) gcRegistry.register({}, 0);
      frames[n] = dt;
      ends[n] = performance.now();
      js[n] = jsMs;
      render[n] = -1;
      flags[n] = f;
      pendingIdx = n;
      pendingT = performance.now();
      channel.port2.postMessage(0);
      n++;
    },
    progress(txt) {
      if (banner.textContent !== txt) banner.textContent = txt;
    },
    async finish(st) {
      status = st;
      measuringGc = false;
      stopObservers();
      banner.hidden = true;
      try {
        await wakeLock?.release();
      } catch {
        /* rien */
      }
      battery.end = await batteryText();
      lastReport = report();
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
