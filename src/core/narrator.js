// Les voix du jeu : le haut-parleur du magasin (le narrateur) et les apartés du héros, qui se
// tourne vers l'écran et parle au joueur (docs/HISTOIRE.md, « Le 4ᵉ mur »).
// Quand parler, quoi dire, et l'avancement de l'effet machine à écrire. Logique pure, sans hasard :
// parmi les répliques possibles, on prend celle dite il y a le plus longtemps. Temps du jeu (figé en pause).
//
// Quatre voix : le haut-parleur (« narrateur »), les apartés du héros au joueur (« heros »), ses petits
// regards caméra sans texte (« regard ») et ses pensées, quand il se parle à lui-même (« pensee »).
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
//    n'importe quelle réplique d'une voix (« @heros »), après p.followDelay s ;
//  - must : un moment important n'est jamais perdu : s'il ne peut pas commencer tout de suite (une
//    autre réplique, le héros occupé), il attend son tour, aussi longtemps qu'il le faut ;
//  - conversation (steps) : une suite de répliques (héros, joueur « epaisseur », regard) que rien
//    n'interrompt ; avec p.sceneWait, chaque réplique attend un toucher du joueur ;
//  - historique : chaque réplique dite (et chaque réponse du joueur) est gardée dans n.log
//    (p.logMax au plus), pour être relue.
//
// data : { triggers: { nom: { voice?, once?, every?, from?, strong?, follows?, must? } },
//          lines: [{ id, trigger, text, steps? }] }

const HERO = 'heros';
const GLANCE = 'regard';
const THOUGHT = 'pensee'; // le héros se parle à lui-même (pas au joueur) : une bulle, sans mise en scène
export const PLAYER = 'epaisseur'; // le joueur (son Épaisseur) répond, dans une conversation

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
    queue: [], // moments importants (must) qui attendent leur tour
    scene: null, // conversation en cours : { line, i } (line.steps : les répliques)
    log: [], // historique : [{ voice, text }]
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
// force : un moment important (must) qui sort de la file d'attente : sans écart minimal.
export function narrate(n, data, trigger, p, force = false) {
  const tr = data.triggers[trigger];
  if (!tr || !p.enabled) return null;
  const voice = voiceOf(tr);
  const hero = voice === HERO || voice === GLANCE;
  if (tr.must && !force) {
    // Important : commence dès que possible, sinon attend son tour (jamais perdu).
    if (tr.once && n.done[trigger]) return null;
    if (!n.line && (!hero || (p.asides && n.asideOk))) return narrate(n, data, trigger, p, true);
    if (!n.queue.includes(trigger)) n.queue.push(trigger);
    return null;
  }
  if (n.scene) return null; // rien n'interrompt une conversation
  if (hero && (!p.asides || !n.asideOk)) return null; // aparté, regard : seulement si le héros est disponible
  const count = (n.seen[trigger] = (n.seen[trigger] ?? 0) + 1);
  if (tr.once && n.done[trigger]) return null;
  const from = tr.from ?? 1;
  if (!force && (count < from || (tr.every && (count - from) % tr.every !== 0))) return null;
  if (force) {
    // la place est libre (vérifié par l'appelant)
  } else if (n.line) {
    if (hero || voice === THOUGHT) return null; // un aparté, un regard ou une pensée ne coupe jamais
    if (n.voice === HERO) return null; // pendant un aparté, le magasin est figé : il se tait
    // Une annonce coupe un regard ou une pensée ; une annonce ordinaire ne coupe pas une annonce.
    if (n.voice !== GLANCE && n.voice !== THOUGHT && !tr.strong) return null;
  }
  if (force) {
    // pas d'écart imposé
  } else if (voice === HERO) {
    if (n.t - n.lastAside < p.asideGap) return null;
    if (!tr.follows && n.t - n.lastSpoke < p.breath) return null;
  } else if (voice === GLANCE) {
    if (n.t - n.lastGlance < p.glanceGap) return null;
  } else if (voice === THOUGHT) {
    // pas d'écart imposé : la pensée répond à une action du joueur
  } else if (!tr.strong && !tr.follows && n.t - n.lastAnnounce < p.minGap) return null;
  const cooldown = force ? 0 : tr.cooldown ?? p.lineCooldown; // un moment important passe toujours
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
  else if (voice !== THOUGHT) n.lastAnnounce = n.t; // une pensée ne retarde pas les annonces
  if (n.pending?.trigger === trigger) n.pending = null; // un enchaînement en attente survit aux autres répliques
  if (best.steps) {
    // Conversation : les répliques s'enchaînent, rien ne l'interrompt ; ce qui attendait est oublié
    // (les pensées de l'arrivée, un regard…).
    n.pending = null;
    n.scene = { line: best, i: 0 };
    begin(n, stepLine(best, 0, '', p), best.steps[0].voice ?? voice, p);
    return n.line;
  }
  begin(n, best, voice, p);
  return best;
}

// Une réplique s'affiche : machine à écrire depuis le début, et une ligne dans l'historique.
function begin(n, line, voice, p) {
  n.answered = -1;
  n.line = line;
  n.voice = voice;
  n.shown = 0;
  n.hold = line.text.length ? 0 : holdFor(line.text, p); // regard sans texte : seulement le temps affiché
  if (line.text) addLog(n, voice, line.text, p);
}

function addLog(n, voice, text, p) {
  n.log.push({ voice, text });
  if (n.log.length > p.logMax) n.log.shift();
}

// La k-ième réplique d'une conversation, comme une réplique ordinaire. Le héros garde son
// expression d'une réplique à l'autre (prev) tant qu'une nouvelle n'est pas donnée.
function stepLine(line, k, prev, p) {
  const s = line.steps[k];
  return {
    id: `${line.id}~${k}`,
    trigger: line.trigger,
    text: s.text ?? '',
    emotion: s.emotion ?? prev,
    choices: s.choices,
    wait: p.sceneWait && !!s.text,
  };
}

// Une conversation est en cours (rien ne l'interrompt, le héros reste tourné vers le joueur).
export function inScene(n) {
  return n.scene !== null;
}

// Fin d'une réplique : silence, et peut-être un moment enchaîné.
function end(n, data, p) {
  if (n.scene && n.scene.i + 1 < n.scene.line.steps.length) {
    // Conversation : la réplique suivante, tout de suite.
    const sc = n.scene;
    sc.i++;
    begin(n, stepLine(sc.line, sc.i, n.line.emotion ?? '', p), sc.line.steps[sc.i].voice ?? HERO, p);
    return;
  }
  const ended = n.scene ? n.scene.line : n.line;
  const voice = n.scene ? voiceOf(data.triggers[ended.trigger]) : n.voice;
  n.scene = null;
  n.line = null;
  n.voice = '';
  n.lastSpoke = n.t;
  if (voice === HERO) n.lastAside = n.t;
  else if (voice === GLANCE) n.lastGlance = n.t;
  else if (voice !== THOUGHT) n.lastAnnounce = n.t; // une pensée ne retarde pas les annonces
  // Enchaînement : d'abord un moment qui suit précisément celui-ci (une suite écrite : l'arrivée, les
  // premières pensées…), qui remplace l'attente en cours ; sinon un moment qui suit toute la voix
  // (« @heros »…), seulement si rien n'attend déjà.
  const entries = Object.entries(data.triggers);
  const own = entries.find(([, tr]) => tr.follows === ended.trigger);
  const any = entries.find(([, tr]) => tr.follows === `@${voice}`);
  if (own) n.pending = { trigger: own[0], at: n.t + p.followDelay };
  else if (any && !n.pending) n.pending = { trigger: any[0], at: n.t + p.followDelay };
}

// Durée d'affichage une fois le texte complet.
function holdFor(text, p) {
  return p.hold + text.length * p.holdPerChar;
}

// Avance d'un pas de temps. Renvoie le nombre de lettres apparues pendant ce pas (pour les petits bips).
export function stepNarrator(n, data, dt, p) {
  n.t += dt;
  if (!n.line) {
    // Un moment important qui attendait son tour passe avant tout le reste.
    if (n.queue.length) {
      const v = voiceOf(data.triggers[n.queue[0]] ?? {});
      if ((v !== HERO && v !== GLANCE) || (p.asides && n.asideOk)) {
        narrate(n, data, n.queue.shift(), p, true);
        return 0;
      }
    }
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
  if (waitingAnswer(n) || n.line.wait) return 0; // la réplique attend la réponse, ou un toucher du joueur
  n.hold -= dt;
  if (n.hold <= 0) end(n, data, p);
  return 0;
}

// La réplique en cours propose deux réponses et le joueur n'a pas encore choisi (texte affiché en entier).
export function waitingAnswer(n) {
  return !!n.line?.choices && n.answered < 0 && n.shown >= n.line.text.length;
}

// Le joueur répond (k : 0 ou 1) : la confiance évolue, puis le héros répond à son tour.
export function answer(n, k, p) {
  if (!waitingAnswer(n)) return null;
  const c = n.line.choices[k];
  if (!c) return null;
  n.trust += c.trust ?? 0;
  addLog(n, PLAYER, c.text, p); // la réponse du joueur, dans l'historique
  const line = { id: `${n.line.id}#${k}`, trigger: n.line.trigger, text: c.reply, emotion: c.emotion ?? n.line.emotion, wait: n.line.wait };
  begin(n, line, n.voice, p);
  n.answered = k; // (begin remet à zéro : la réponse reste donnée)
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
// Une conversation en cours reprend depuis son début au prochain moment possible (elle n'est jamais perdue).
export function silenceNarrator(n) {
  if (n.scene) n.queue.unshift(n.scene.line.trigger);
  if (n.scene) delete n.done[n.scene.line.trigger];
  n.scene = null;
  n.answered = -1;
  n.line = null;
  n.voice = '';
  n.pending = null;
}

// La réplique en cours est entièrement écrite et attend un toucher du joueur (conversation).
export function waitingTap(n) {
  return !!n.line?.wait && n.shown >= n.line.text.length && !waitingAnswer(n);
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
