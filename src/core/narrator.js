// Les voix du jeu : le haut-parleur du magasin (le narrateur) et les apartés du héros, qui se
// tourne vers l'écran et parle au joueur (docs/HISTOIRE.md, « Le 4ᵉ mur »).
// Quand parler, quoi dire, et l'avancement de l'effet machine à écrire. Logique pure, sans hasard :
// parmi les répliques possibles, on prend celle dite il y a le plus longtemps. Temps du jeu (figé en pause).
//
// Règles :
//  - une seule voix à la fois ;
//  - le haut-parleur passe avant le héros : une annonce peut couper un aparté, jamais l'inverse ;
//    une annonce ordinaire ne coupe pas une autre annonce ; une annonce forte (strong) coupe tout ;
//  - annonces : au moins p.minGap s entre deux (sauf fortes ou enchaînées) ;
//  - apartés : au moins p.asideGap s entre deux, et p.breath s de silence avant (sauf enchaînés) ;
//  - une même réplique ne revient pas avant p.lineCooldown s ;
//  - once : une seule fois ; every N (à partir de la from-ième occurrence, 1 par défaut) ;
//  - follows : ce moment suit la fin d'une réplique d'un autre moment (« arrivee »), ou de
//    n'importe quelle réplique d'une voix (« @heros »), après p.followDelay s.
//
// data : { triggers: { nom: { voice?, once?, every?, from?, strong?, follows? } }, lines: [{ id, trigger, text }] }

const HERO = 'heros';

export function createNarrator() {
  return {
    t: 0, // temps de jeu écoulé (s)
    lastSpoke: -Infinity, // dernière réplique (début ou fin), toutes voix
    lastAnnounce: -Infinity,
    lastAside: -Infinity,
    said: {}, // id de réplique → moment où elle a été dite
    seen: {}, // moment → nombre d'occurrences
    done: {}, // moments « once » déjà dits
    pending: null, // moment enchaîné en attente : { trigger, at }
    // Réplique en cours d'affichage
    line: null,
    voice: '',
    shown: 0, // nombre de lettres visibles
    hold: 0, // temps restant affiché une fois le texte complet
    idle: 0, // inactivité
  };
}

function voiceOf(tr) {
  return tr.voice ?? 'narrateur';
}

// Un moment du jeu arrive : renvoie la réplique à dire (et la commence), ou null.
export function narrate(n, data, trigger, p) {
  const tr = data.triggers[trigger];
  if (!tr || !p.enabled) return null;
  const voice = voiceOf(tr);
  if (voice === HERO && !p.asides) return null;
  const count = (n.seen[trigger] = (n.seen[trigger] ?? 0) + 1);
  if (tr.once && n.done[trigger]) return null;
  const from = tr.from ?? 1;
  if (count < from || (tr.every && (count - from) % tr.every !== 0)) return null;
  if (n.line) {
    if (voice === HERO) return null; // un aparté ne coupe jamais
    if (n.voice !== HERO && !tr.strong) return null; // une annonce ordinaire ne coupe pas une annonce
  }
  if (voice === HERO) {
    if (n.t - n.lastAside < p.asideGap) return null;
    if (!tr.follows && n.t - n.lastSpoke < p.breath) return null;
  } else if (!tr.strong && !tr.follows && n.t - n.lastAnnounce < p.minGap) return null;
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
  if (voice === HERO) n.lastAside = n.t;
  else n.lastAnnounce = n.t;
  n.pending = null;
  n.line = best;
  n.voice = voice;
  n.shown = 0;
  n.hold = 0;
  return best;
}

// Fin d'une réplique : silence, et peut-être un moment enchaîné.
function end(n, data, p) {
  const ended = n.line;
  const voice = n.voice;
  n.line = null;
  n.voice = '';
  n.lastSpoke = n.t;
  if (voice === HERO) n.lastAside = n.t;
  else n.lastAnnounce = n.t;
  for (const [name, tr] of Object.entries(data.triggers)) {
    if (tr.follows === ended.trigger || tr.follows === `@${voice}`) {
      n.pending = { trigger: name, at: n.t + p.followDelay };
      return;
    }
  }
}

// Durée d'affichage une fois le texte complet.
function holdFor(text, p) {
  return p.hold + text.length * p.holdPerChar;
}

// Avance d'un pas de temps. Renvoie le nombre de lettres apparues pendant ce pas (pour les petits bips).
export function stepNarrator(n, data, dt, p) {
  n.t += dt;
  if (!n.line) {
    if (n.pending && n.t >= n.pending.at) {
      const { trigger } = n.pending;
      n.pending = null;
      narrate(n, data, trigger, p);
    }
    return 0;
  }
  const len = n.line.text.length;
  if (n.shown < len) {
    const before = Math.floor(n.shown);
    n.shown = Math.min(len, n.shown + dt * p.speed);
    if (n.shown >= len) n.hold = holdFor(n.line.text, p);
    return Math.floor(n.shown) - before;
  }
  n.hold -= dt;
  if (n.hold <= 0) end(n, data, p);
  return 0;
}

// Le joueur touche la réplique : la première fois le texte s'affiche en entier, la suivante il disparaît.
export function skipNarrator(n, data, p) {
  if (!n.line) return;
  if (n.shown < n.line.text.length) {
    n.shown = n.line.text.length;
    n.hold = holdFor(n.line.text, p);
  } else end(n, data, p);
}

// Désactivation en cours de partie : tout se tait.
export function silenceNarrator(n) {
  n.line = null;
  n.voice = '';
  n.pending = null;
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
