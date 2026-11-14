// Le narrateur : quand il parle, quoi dire, et l'avancement de l'effet machine à écrire.
// Logique pure, sans hasard : parmi les répliques possibles, on prend celle dite il y a le plus
// longtemps (jamais dite d'abord, dans l'ordre du fichier). Le temps est celui du jeu (figé en pause).
//
// Règles (docs/PERSONNAGES.md : pas omniprésent, répliques rares et liées au contexte) :
//  - une même réplique ne revient pas avant p.lineCooldown secondes ;
//  - deux prises de parole sont séparées d'au moins p.minGap secondes, sauf les moments « forts »
//    du fichier (strong : true), qui passent quand même et coupent la réplique en cours ;
//  - un moment ordinaire ne coupe jamais une réplique en cours ;
//  - un moment marqué once ne fait parler qu'une fois ; every: N = une fois toutes les N occurrences.
//
// lines : [{ id, trigger, text }] ; triggers : { nom: { once?, every?, strong? } } (src/data/narrator.json).

export function createNarrator() {
  return {
    t: 0, // temps de jeu écoulé (s)
    lastSpoke: -Infinity,
    said: {}, // id de réplique → moment où elle a été dite
    seen: {}, // moment → nombre d'occurrences
    done: {}, // moments « once » déjà dits
    // Réplique en cours d'affichage
    line: null,
    shown: 0, // nombre de lettres visibles
    hold: 0, // temps restant affiché une fois le texte complet
    // Inactivité, bout du rayon
    idle: 0,
  };
}

// Un moment du jeu arrive : renvoie la réplique à dire (et la commence), ou null.
export function narrate(n, data, trigger, p) {
  const tr = data.triggers[trigger];
  if (!tr || !p.enabled) return null;
  const count = (n.seen[trigger] = (n.seen[trigger] ?? 0) + 1);
  if (tr.once && n.done[trigger]) return null;
  if (tr.every && (count - 1) % tr.every !== 0) return null;
  if (n.line && !tr.strong) return null; // il parle déjà : on ne coupe pas
  if (!tr.strong && n.t - n.lastSpoke < p.minGap) return null;
  let best = null;
  let bestT = Infinity;
  for (const l of data.lines) {
    if (l.trigger !== trigger) continue;
    const when = n.said[l.id] ?? -Infinity;
    if (n.t - when < p.lineCooldown) continue;
    if (when < bestT) {
      best = l;
      bestT = when;
    }
  }
  if (!best) return null;
  if (tr.once) n.done[trigger] = true;
  n.said[best.id] = n.t;
  n.lastSpoke = n.t;
  n.line = best;
  n.shown = 0;
  n.hold = 0;
  return best;
}

// Durée d'affichage une fois le texte complet.
function holdFor(text, p) {
  return p.hold + text.length * p.holdPerChar;
}

// Avance d'un pas de temps. Renvoie le nombre de lettres apparues pendant ce pas (pour les petits bips).
export function stepNarrator(n, dt, p) {
  n.t += dt;
  if (!n.line) return 0;
  const len = n.line.text.length;
  if (n.shown < len) {
    const before = Math.floor(n.shown);
    n.shown = Math.min(len, n.shown + dt * p.speed);
    if (n.shown >= len) n.hold = holdFor(n.line.text, p);
    return Math.floor(n.shown) - before;
  }
  n.hold -= dt;
  if (n.hold <= 0) {
    n.line = null;
    n.lastSpoke = n.t; // l'écart minimal compte à partir de la fin de la réplique
  }
  return 0;
}

// Le joueur touche la bande : la première fois le texte s'affiche en entier, la suivante il disparaît.
export function skipNarrator(n, p) {
  if (!n.line) return;
  if (n.shown < n.line.text.length) {
    n.shown = n.line.text.length;
    n.hold = holdFor(n.line.text, p);
  } else {
    n.line = null;
    n.lastSpoke = n.t;
  }
}

// Inactivité : renvoie true une fois quand le joueur n'a rien fait depuis p.inactivity secondes.
export function stepIdle(n, dt, active, p) {
  if (active) {
    n.idle = 0;
    return false;
  }
  const before = n.idle;
  n.idle += dt;
  return before < p.inactivity && n.idle >= p.inactivity;
}
