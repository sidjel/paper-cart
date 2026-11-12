// Toutes les valeurs réglables du jeu, à un seul endroit.
// Chaque valeur listée dans TUNABLES apparaît dans le panneau de réglages (F2 ou ⚙).

export const config = {
  loop: {
    stepHz: 60, // pas fixe de la logique (déplacements), indépendant de l'affichage
    maxStepsPerFrame: 5, // au-delà (onglet en veille…), on abandonne le retard plutôt que d'accélérer
  },
  walk: {
    maxSpeed: 480, // vitesse de marche, en pixels de scène par seconde
    acceleration: 3600, // pour atteindre la vitesse max (px/s²)
    deceleration: 4800, // pour s'arrêter quand on lâche (px/s²)
    depthFactor: 0.8, // vitesse quand on va vers le fond ou vers l'avant (× vitesse de marche)
    arrivalRadius: 4, // distance à laquelle on considère être arrivé au point touché (px)
  },
  character: {
    flipDuration: 0.18, // durée du retournement de la feuille (s) ; 0 = instantané
    edgeThickness: 0.06, // épaisseur minimale de la feuille vue de profil (tranche), en part de sa largeur
    flipOnFrontBack: true, // retournement aussi quand il passe de face à dos
    walkAnimSpeed: 1, // vitesse des images de marche (× ; plus grand = pas plus rapides)
  },
  display: {
    reduceMotion: false, // réduire les animations (retournement instantané)
    fitMode: 'fill', // 'fill' : remplir l'écran (bords un peu coupés) ; 'fit' : tout montrer (bandes)
    maxPixelRatio: 2, // plafond de densité de pixels des images (coût mémoire et carte graphique)
  },
  input: {
    virtualJoystick: false, // téléphone : joystick virtuel à gauche de l'écran
    joystickRadius: 60, // rayon du joystick virtuel (px d'écran)
    stickDeadZone: 0.2, // manette : zone morte du stick (0 à 1)
  },
  debug: {
    showWalkMask: false, // affiche la zone de marche (vert) et les obstacles (rouge)
  },
};

// Description des réglages exposés dans le panneau.
// reload : la valeur ne s'applique qu'au rechargement du jeu.
export const TUNABLES = [
  { group: 'Marche', key: 'walk.maxSpeed', label: 'Vitesse de marche', min: 100, max: 1200, step: 10, unit: 'px/s' },
  { group: 'Marche', key: 'walk.acceleration', label: 'Accélération', min: 300, max: 20000, step: 100, unit: 'px/s²' },
  { group: 'Marche', key: 'walk.deceleration', label: 'Freinage', min: 300, max: 20000, step: 100, unit: 'px/s²' },
  { group: 'Marche', key: 'walk.depthFactor', label: 'Vitesse vers le fond', min: 0.3, max: 1.5, step: 0.05, unit: '×' },
  { group: 'Marche', key: 'walk.arrivalRadius', label: "Précision d'arrivée", min: 1, max: 40, step: 1, unit: 'px' },
  { group: 'Personnage', key: 'character.flipDuration', label: 'Durée du retournement', min: 0, max: 0.6, step: 0.01, unit: 's' },
  { group: 'Personnage', key: 'character.edgeThickness', label: 'Épaisseur de la tranche', min: 0, max: 0.25, step: 0.01 },
  { group: 'Personnage', key: 'character.flipOnFrontBack', label: 'Retournement face/dos aussi', type: 'bool' },
  { group: 'Personnage', key: 'character.walkAnimSpeed', label: 'Vitesse des pas (images)', min: 0.4, max: 2.5, step: 0.05, unit: '×' },
  { group: 'Contrôles', key: 'input.virtualJoystick', label: 'Joystick virtuel (téléphone)', type: 'bool' },
  { group: 'Contrôles', key: 'input.joystickRadius', label: 'Taille du joystick', min: 30, max: 120, step: 5, unit: 'px' },
  { group: 'Contrôles', key: 'input.stickDeadZone', label: 'Zone morte du stick', min: 0, max: 0.6, step: 0.02 },
  { group: 'Affichage', key: 'display.reduceMotion', label: 'Réduire les animations', type: 'bool' },
  {
    group: 'Affichage', key: 'display.fitMode', label: 'Cadrage', type: 'choice',
    options: [['fill', "Remplir l'écran"], ['fit', 'Tout montrer']],
  },
  { group: 'Affichage', key: 'display.maxPixelRatio', label: 'Densité de pixels max', min: 0.5, max: 3, step: 0.25, reload: true },
  { group: 'Technique', key: 'loop.stepHz', label: 'Pas fixe de la logique', min: 30, max: 240, step: 10, unit: 'Hz' },
  { group: 'Debug', key: 'debug.showWalkMask', label: 'Afficher la zone de marche (F4)', type: 'bool' },
];

const DEFAULTS = structuredClone(config);
const listeners = [];

export function getValue(key, from = config) {
  const [section, name] = key.split('.');
  return from[section][name];
}

export function getDefault(key) {
  return getValue(key, DEFAULTS);
}

function tunable(key) {
  return TUNABLES.find((t) => t.key === key);
}

// Ramène une valeur dans les limites prévues ; renvoie undefined si elle est invalide.
export function sanitize(key, value) {
  const t = tunable(key);
  if (!t) return undefined;
  if (t.type === 'bool') return typeof value === 'boolean' ? value : undefined;
  if (t.type === 'choice') return t.options.some(([v]) => v === value) ? value : undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(t.max, Math.max(t.min, n));
}

export function setValue(key, value) {
  const v = sanitize(key, value);
  if (v === undefined) return false;
  const [section, name] = key.split('.');
  config[section][name] = v;
  for (const fn of listeners) fn(key, v);
  return true;
}

export function onConfigChange(fn) {
  listeners.push(fn);
}

// Réglages qui diffèrent des valeurs par défaut (pour les sauvegarder ou les copier).
export function overrides() {
  const out = {};
  for (const t of TUNABLES) {
    if (getValue(t.key) !== getDefault(t.key)) out[t.key] = getValue(t.key);
  }
  return out;
}

export function applyOverrides(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, value] of Object.entries(obj)) setValue(key, value);
}

export function resetAll() {
  for (const t of TUNABLES) setValue(t.key, getDefault(t.key));
}
