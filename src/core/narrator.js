// Les voix du jeu : le haut-parleur du magasin (le narrateur) et les apartés du héros, qui se
// tourne vers l'écran et parle au joueur (docs/HISTOIRE.md, « Le 4ᵉ mur »).
// Quand parler, quoi dire, et l'avancement de l'effet machine à écrire. Logique pure, sans hasard :
// parmi les répliques possibles, on prend celle dite il y a le plus longtemps. Temps du jeu (figé en pause).
//
// Trois voix : le haut-parleur (« narrateur »), les apartés du héros (« heros ») et ses petits regards
// caméra sans texte (« regard »).
// Règles :
//  - une seule voix à la fois ;
//  - pendant un aparté, le temps du magasin se fige : le haut-parleur se tait (rien ne coupe un aparté) ;
//  - une annonce ordinaire ne coupe pas une autre annonce ; une annonce forte (strong) coupe une
//    annonce ; toute annonce coupe un petit regard ;
//  - regards : au moins p.glanceGap s entre deux ; jamais pendant une autre réplique ;
//  - une réplique peut proposer deux réponses (choices) : elle attend la réponse du joueur, qui fait
//    évoluer la confiance (n.trust), puis le héros répond (reply) ;
//  - annonces : au moins p.minGap s entre deux (sauf fortes ou enchaînées) ;
//  - apartés : au moins p.asideGap s entre deux, et p.breath s de silence avant (sauf enchaînés) ;
//  - une même réplique ne revient pas avant p.lineCooldown s (ou le cooldown de son moment) ;
//  - once : une seule fois ; every N (à partir de la from-ième occurrence, 1 par défaut) ;
//  - follows : ce moment suit la fin d'une réplique d'un autre moment (« arrivee »), ou de
//    n'importe quelle réplique d'une voix (« @heros »), après p.followDelay s.
//
// data : { triggers: { nom: { voice?, once?, every?, from?, strong?, follows? } }, lines: [{ id, trigger, text }] }

const HERO = 'heros';
const GLANCE = 'regard';

export function createNarrator() {
  return {
    t: 0, // temps de jeu écoulé (s)
    lastSpoke: -Infinity, // dernière réplique (début ou fin), toutes voix
    lastAnnounce: -Infinity,
    lastAside: -Infinity,
    lastGlance: -Infinity,
    trust: 0, // confiance entre le héros et son Épaisseur (réponses du joueur)
    said: {}, // id de réplique → moment où elle a été dite
    seen: {}, // moment → nombre d'occurrences
    done: {}, // moments « once » déjà dits
    pending: null, // moment enchaîné en attente : { trigger, at }
    answered: -1, // réponse donnée à la réplique en cours (-1 : pas encore)
    // Réplique en cours d'affichage
    line: null,
    voice: '',
    shown: 0, // nombre de lettres visibles
    hold: 0, // temps restant affiché une fois le texte complet
    idle: 0, // inactivité
    asideOk: true, // le héros peut faire un aparté (à l'arrêt, sans scanner) : fixé par le jeu à chaque image
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
  const hero = voice === HERO || voice === GLANCE;
  if (hero && (!p.asides || !n.asideOk)) return null; // aparté, regard : seulement si le héros est disponible
  const count = (n.seen[trigger] = (n.seen[trigger] ?? 0) + 1);
  if (tr.once && n.done[trigger]) return null;
  const from = tr.from ?? 1;
  if (count < from || (tr.every && (count - from) % tr.every !== 0)) return null;
  if (n.line) {
    if (hero) return null; // un aparté ou un regard ne coupe jamais
    if (n.voice === HERO) return null; // pendant un aparté, le magasin est figé : il se tait
    if (n.voice !== GLANCE && !tr.strong) return null; // une annonce ordinaire ne coupe pas une annonce
  }
  if (voice === HERO) {
    if (n.t - n.lastAside < p.asideGap) return null;
    if (!tr.follows && n.t - n.lastSpoke < p.breath) return null;
  } else if (voice === GLANCE) {
    if (n.t - n.lastGlance < p.glanceGap) return null;
  } else if (!tr.strong && !tr.follows && n.t - n.lastAnnounce < p.minGap) return null;
  const cooldown = tr.cooldown ?? p.lineCooldown;
  let best = null;
  let bestT = Infinity;
  for (const l of data.lines) {
    if (l.trigger !== trigger) continue;
    // Confiance : certaines répliques n'existent qu'au-dessus (minTrust) ou en dessous (maxTrust) d'un seuil.
    if ((l.minTrust !== undefined && n.trust < l.minTrust) || (l.maxTrust !== undefined && n.trust > l.maxTrust)) continue;
    const when = n.said[l.id] ?? -Infinity;
    if (n.t - when < cooldown) continue;
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
  else if (voice === GLANCE) n.lastGlance = n.t;
  else n.lastAnnounce = n.t;
  n.pending = null;
  n.answered = -1;
  n.line = best;
  n.voice = voice;
  n.shown = 0;
  n.hold = best.text.length ? 0 : holdFor(best.text, p); // regard sans texte : seulement le temps affiché
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
  else if (voice === GLANCE) n.lastGlance = n.t;
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
      // Un aparté (ou regard) enchaîné attend que le héros soit disponible, p.followWait s au plus.
      const v = data.triggers[trigger]?.voice;
      if ((v === HERO || v === GLANCE) && !n.asideOk && n.t < n.pending.at + p.followWait) return 0;
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
  if (waitingAnswer(n)) return 0; // la réplique attend la réponse du joueur
  n.hold -= dt;
  if (n.hold <= 0) end(n, data, p);
  return 0;
}

// La réplique en cours propose deux réponses et le joueur n'a pas encore choisi (texte affiché en entier).
export function waitingAnswer(n) {
  return !!n.line?.choices && n.answered < 0 && n.shown >= n.line.text.length;
}

// Le joueur répond (k : 0 ou 1) : la confiance évolue, puis le héros répond à son tour.
export function answer(n, k) {
  if (!waitingAnswer(n)) return null;
  const c = n.line.choices[k];
  if (!c) return null;
  n.answered = k;
  n.trust += c.trust ?? 0;
  n.line = { id: `${n.line.id}#${k}`, trigger: n.line.trigger, text: c.reply, emotion: c.emotion ?? n.line.emotion };
  n.shown = 0;
  n.hold = 0;
  return n.line;
}

// Le joueur touche la réplique : la première fois le texte s'affiche en entier, la suivante il disparaît.
export function skipNarrator(n, data, p) {
  if (!n.line || waitingAnswer(n)) return; // une question attend une réponse
  if (n.shown < n.line.text.length) {
    n.shown = n.line.text.length;
    n.hold = holdFor(n.line.text, p);
  } else end(n, data, p);
}

// Désactivation en cours de partie : tout se tait.
export function silenceNarrator(n) {
  n.answered = -1;
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

// Haut-parleur d'où sort la voix : le plus proche du personnage le long du rayon (items : [[x, y]]).
export function nearestSpeaker(items, x) {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < items.length; i++) {
    const d = Math.abs(items[i][0] - x);
    if (d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}
