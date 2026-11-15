// Intro (après « Commencer ») : une ligne de texte à la fois, chacune apparaît en fondu, reste, puis
// s'efface ; à la fin, l'écran noir s'efface sur le début de la partie. Logique pure, temps du jeu.
// p : config.intro { fadeIn, fadeOut, endFade }.

export function createIntro(lines) {
  return { lines, i: 0, t: 0, phase: 'line', done: false, started: -1 };
}

// Avance d'un pas. Renvoie l'indice d'une ligne qui commence (pour jouer son bruitage), sinon -1.
export function stepIntro(it, dt, p) {
  if (it.done) return -1;
  let started = -1;
  if (it.started !== it.i && it.phase === 'line') {
    it.started = it.i;
    started = it.i;
  }
  it.t += dt;
  if (it.phase === 'line') {
    const total = p.fadeIn + it.lines[it.i].hold + p.fadeOut;
    if (it.t >= total) next(it);
  } else if (it.phase === 'end' && it.t >= p.endFade) it.done = true;
  return started;
}

function next(it) {
  it.t = 0;
  if (it.i + 1 < it.lines.length) it.i++;
  else it.phase = 'end';
}

// Opacité du texte de la ligne en cours (0 à 1).
export function lineOpacity(it, p) {
  if (it.phase !== 'line') return 0;
  const hold = it.lines[it.i].hold;
  if (it.t < p.fadeIn) return it.t / p.fadeIn;
  if (it.t < p.fadeIn + hold) return 1;
  return Math.max(0, 1 - (it.t - p.fadeIn - hold) / p.fadeOut);
}

// Opacité du fond noir : 1 pendant les lignes, puis s'efface sur la partie.
export function blackOpacity(it, p) {
  if (it.phase === 'line') return 1;
  return Math.max(0, 1 - it.t / p.endFade);
}

// Toucher, Entrée, A : la ligne suivante tout de suite ; « Passer » : directement la fin.
export function skipLine(it) {
  if (it.phase === 'line') next(it);
}
export function skipAll(it) {
  it.phase = 'end';
  it.t = 0;
}
