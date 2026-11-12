// Diagnostic en 4 configurations : isoler la cause des saccades en séparant
// « personnage en marche ou non » et « caméra mobile ou non », dans des conditions identiques.
// Logique pure (aucun affichage). Pour chaque configuration : chauffe, puis plusieurs mesures.
//
// Conditions identiques :
// - même endroit du rayon, même profondeur, même vitesse ;
// - marche = aller-retour en ligne droite entre deux points (aucun calcul de chemin) ;
// - caméra mobile sans marche : la caméra suit un « fantôme » invisible qui fait exactement
//   le même aller-retour que le personnage dans la configuration 4.

import { setPath, clearTarget } from './movement.js';

export const PROTOCOL_CONFIGS = [
  { id: 1, label: 'Personnage immobile · caméra fixe', walk: false, camera: 'fixed' },
  { id: 2, label: 'Personnage en marche · caméra fixe', walk: true, camera: 'fixed' },
  { id: 3, label: 'Personnage immobile · caméra mobile', walk: false, camera: 'ghost' },
  { id: 4, label: 'Personnage en marche · caméra mobile', walk: true, camera: 'hero' },
];

// def : place.diagnostic = { a: [x, z], b: [x, z], idle: [x, z] }
export function createProtocol(def, warmup, measure, repeats) {
  return {
    def,
    warmup,
    measure,
    repeats,
    ci: 0, // configuration en cours (0 à 3)
    phase: 'warmup', // 'warmup' → 'measure' (× repeats) → configuration suivante → 'done'
    run: 0,
    t: 0,
    measuring: false,
    changed: true, // vrai au pas où l'on change de phase (début de chauffe ou de mesure)
  };
}

export function protocolConfig(p) {
  return PROTOCOL_CONFIGS[Math.min(p.ci, PROTOCOL_CONFIGS.length - 1)];
}

export function totalSeconds(p) {
  return PROTOCOL_CONFIGS.length * (p.warmup + p.measure * p.repeats);
}

function place(w, [x, z]) {
  w.x = w.prevX = x;
  w.z = w.prevZ = z;
  w.vx = w.vz = 0;
  w.facing = 1;
  w.away = false;
  clearTarget(w);
}

// Position de départ d'une configuration (appelée au début de sa chauffe).
export function placeForConfig(p, hero, ghost) {
  const c = protocolConfig(p);
  place(hero, c.walk ? p.def.a : p.def.idle);
  place(ghost, p.def.a);
}

// Aller-retour : dès qu'un bout est atteint, repartir vers l'autre (ligne droite).
export function patrol(w, def) {
  if (w.hasTarget) return;
  const toB = Math.abs(w.x - def.a[0]) <= Math.abs(w.x - def.b[0]);
  const [x, z] = toB ? def.b : def.a;
  setPath(w, [[x, z]]);
}

// Un pas de logique (avant stepWalker du personnage et du fantôme).
export function stepProtocol(p, hero, ghost, dt) {
  p.changed = false;
  if (p.phase === 'done') return;
  p.t += dt;
  const dur = p.phase === 'warmup' ? p.warmup : p.measure;
  if (p.t >= dur) {
    p.t = 0;
    p.changed = true;
    if (p.phase === 'warmup') {
      p.phase = 'measure';
      p.run = 0;
    } else if (++p.run >= p.repeats) {
      p.ci++;
      if (p.ci >= PROTOCOL_CONFIGS.length) {
        p.phase = 'done';
        p.measuring = false;
        clearTarget(hero);
        return;
      }
      p.phase = 'warmup';
      placeForConfig(p, hero, ghost);
    }
  }
  p.measuring = p.phase === 'measure';
  const c = protocolConfig(p);
  if (c.walk) patrol(hero, p.def);
  if (c.camera === 'ghost') patrol(ghost, p.def);
}
