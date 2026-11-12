// Toutes les valeurs réglables du jeu, à un seul endroit.
// Chaque valeur listée dans TUNABLES apparaît dans le panneau de réglages (F2 ou ⚙).

export const config = {
  loop: {
    stepHz: 60, // pas fixe de la logique (déplacements), indépendant de l'affichage
    maxStepsPerFrame: 5, // au-delà (onglet en veille…), on abandonne le retard plutôt que d'accélérer
  },
  walk: {
    // Valeurs du profil « Paper Mario » (choisi par l'auteur, séance 5) : démarrage et arrêt vifs.
    maxSpeed: 520, // vitesse de marche, en pixels de scène par seconde
    acceleration: 10000, // pour atteindre la vitesse max (px/s²)
    deceleration: 12000, // pour s'arrêter quand on lâche (px/s²)
    depthFactor: 0.8, // vitesse quand on va vers le fond ou vers l'avant (× vitesse de marche)
    arrivalRadius: 4, // distance à laquelle on considère être arrivé au point touché (px)
  },
  character: {
    flipDuration: 0.18, // durée du retournement de la feuille (s) ; 0 = instantané
    edgeThickness: 0.06, // épaisseur minimale de la feuille vue de profil (tranche), en part de sa largeur
    flipOnFrontBack: true, // retournement aussi quand il passe de face à dos
    walkAnimSpeed: 1, // vitesse des images de marche (× ; plus grand = pas plus rapides)
    bounceHeight: 7, // hauteur du rebond à chaque pas (px)
    walkSquash: 0.05, // écrasement quand le pied se pose (part de la hauteur)
    breathAmount: 0.018, // ampleur de la respiration à l'arrêt
    breathRate: 0.35, // respirations par seconde
    stopSquash: 0.09, // petit écrasement quand il s'arrête
    stopDuration: 0.2, // durée de cet écrasement (s)
    shadowOpacity: 0.5, // opacité de l'ombre au sol
    shadowSize: 1, // taille de l'ombre (×)
    dust: true, // petit nuage de poussière à chaque pas
    dustSize: 1.3, // taille du nuage (×)
    dustDuration: 0.45, // durée de vie du nuage (s)
    dustOpacity: 0.85, // opacité de départ du nuage
  },
  camera: {
    zoom: 1, // 1 = toute la hauteur du décor visible ; plus grand = plus près (le haut et le bas sont coupés)
    follow: 5, // vitesse à laquelle la caméra rattrape le personnage
    lookAhead: 140, // la caméra regarde un peu devant le personnage (px)
    deadZone: 0.12, // zone centrale où la caméra ne bouge pas (part de la largeur visible)
  },
  scene: {
    depthScale: 1, // force de l'effet « plus petit au fond » (0 = aucun, 1 = normal)
  },
  display: {
    reduceMotion: false, // réduire les animations (retournement instantané)
    foregroundOpacity: 0.55, // opacité du rayon du premier plan (0 = invisible, 1 = opaque)
    maxPixelRatio: 2, // plafond de densité de pixels des images (coût mémoire et carte graphique)
  },
  audio: {
    muted: false, // couper tout le son
    master: 0.8, // volume général
    music: 0.4, // volume de la musique
    steps: 0.35, // volume des pas
    pauseMusic: 0.35, // volume de la musique en pause (× volume de la musique)
    // Taille de la réserve de son du navigateur : plus grande = moins de risque de grésillement,
    // mais les pas sonnent un tout petit peu plus tard.
    latency: 'balanced',
  },
  input: {
    virtualJoystick: false, // téléphone : joystick virtuel à gauche de l'écran
    joystickRadius: 60, // rayon du joystick virtuel (px d'écran)
    stickDeadZone: 0.2, // manette : zone morte du stick (0 à 1)
  },
  bench: {
    passes: 3, // nombre de tours mesurés
    warmup: 3, // secondes de chauffe, non mesurées
    // Interrupteurs d'essai : rejouer le même parcours sans une option, pour comparer deux rapports.
    noForeground: false,
    noFarLayer: false,
    noDust: false,
    noShadow: false,
    fixedCamera: false,
  },
  protocol: {
    warmup: 60, // diagnostic complet : chauffe par configuration (s)
    measure: 60, // durée d'une mesure (s)
    repeats: 3, // nombre de mesures par configuration
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
  { group: 'Personnage', key: 'character.bounceHeight', label: 'Rebond en marchant', min: 0, max: 30, step: 1, unit: 'px' },
  { group: 'Personnage', key: 'character.walkSquash', label: 'Écrasement à chaque pas', min: 0, max: 0.2, step: 0.01 },
  { group: 'Personnage', key: 'character.breathAmount', label: 'Respiration (ampleur)', min: 0, max: 0.06, step: 0.002 },
  { group: 'Personnage', key: 'character.breathRate', label: 'Respiration (rythme)', min: 0.1, max: 1.2, step: 0.05, unit: '/s' },
  { group: 'Personnage', key: 'character.stopSquash', label: "Écrasement à l'arrêt", min: 0, max: 0.3, step: 0.01 },
  { group: 'Personnage', key: 'character.stopDuration', label: "Durée de l'écrasement", min: 0.05, max: 0.6, step: 0.01, unit: 's' },
  { group: 'Personnage', key: 'character.shadowOpacity', label: "Opacité de l'ombre", min: 0, max: 0.8, step: 0.02 },
  { group: 'Personnage', key: 'character.shadowSize', label: "Taille de l'ombre", min: 0.3, max: 2, step: 0.05, unit: '×' },
  { group: 'Personnage', key: 'scene.depthScale', label: 'Plus petit au fond (force)', min: 0, max: 2, step: 0.05, unit: '×' },
  { group: 'Personnage', key: 'character.dust', label: 'Poussière à chaque pas', type: 'bool' },
  { group: 'Personnage', key: 'character.dustSize', label: 'Taille de la poussière', min: 0.3, max: 2.5, step: 0.05, unit: '×' },
  { group: 'Personnage', key: 'character.dustDuration', label: 'Durée de la poussière', min: 0.15, max: 1.5, step: 0.05, unit: 's' },
  { group: 'Personnage', key: 'character.dustOpacity', label: 'Opacité de la poussière', min: 0.1, max: 1, step: 0.05 },
  { group: 'Personnage', key: 'character.walkAnimSpeed', label: 'Vitesse des pas (images)', min: 0.4, max: 2.5, step: 0.05, unit: '×' },
  { group: 'Contrôles', key: 'input.virtualJoystick', label: 'Joystick virtuel (téléphone)', type: 'bool' },
  { group: 'Contrôles', key: 'input.joystickRadius', label: 'Taille du joystick', min: 30, max: 120, step: 5, unit: 'px' },
  { group: 'Contrôles', key: 'input.stickDeadZone', label: 'Zone morte du stick', min: 0, max: 0.6, step: 0.02 },
  { group: 'Son', key: 'audio.muted', label: 'Couper le son', type: 'bool' },
  { group: 'Son', key: 'audio.master', label: 'Volume général', min: 0, max: 1, step: 0.05 },
  { group: 'Son', key: 'audio.music', label: 'Musique', min: 0, max: 1, step: 0.05 },
  { group: 'Son', key: 'audio.steps', label: 'Bruits de pas', min: 0, max: 1, step: 0.05 },
  {
    group: 'Son', key: 'audio.latency', label: 'Réserve de son (anti-grésillement)', type: 'choice', reload: true,
    options: [['interactive', 'Petite (réactive)'], ['balanced', 'Moyenne'], ['playback', 'Grande (la plus stable)']],
  },
  { group: 'Son', key: 'audio.pauseMusic', label: 'Musique en pause', min: 0, max: 1, step: 0.05, unit: '×' },
  { group: 'Affichage', key: 'display.foregroundOpacity', label: 'Opacité du rayon de devant', min: 0, max: 1, step: 0.05 },
  { group: 'Caméra', key: 'camera.zoom', label: 'Zoom (netteté au rechargement)', min: 1, max: 1.8, step: 0.05, unit: '×' },
  { group: 'Caméra', key: 'camera.follow', label: 'Vitesse de suivi', min: 0.5, max: 20, step: 0.5 },
  { group: 'Caméra', key: 'camera.lookAhead', label: 'Regard devant le personnage', min: 0, max: 500, step: 10, unit: 'px' },
  { group: 'Caméra', key: 'camera.deadZone', label: 'Zone sans mouvement', min: 0, max: 0.4, step: 0.01 },
  { group: 'Affichage', key: 'display.reduceMotion', label: 'Réduire les animations', type: 'bool' },
  { group: 'Affichage', key: 'display.maxPixelRatio', label: 'Densité de pixels max', min: 0.5, max: 3, step: 0.25, reload: true },
  { group: 'Technique', key: 'loop.stepHz', label: 'Pas fixe de la logique', min: 30, max: 240, step: 10, unit: 'Hz' },
  { group: 'Diagnostic', key: 'bench.passes', label: 'Banc : nombre de tours', min: 1, max: 10, step: 1 },
  { group: 'Diagnostic', key: 'bench.warmup', label: 'Banc : chauffe', min: 0, max: 10, step: 1, unit: 's' },
  { group: 'Diagnostic', key: 'bench.noForeground', label: 'Essai sans rayon de devant', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.noFarLayer', label: 'Essai sans rayons lointains', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.noDust', label: 'Essai sans poussière', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.noShadow', label: 'Essai sans ombre', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.fixedCamera', label: 'Essai caméra immobile', type: 'bool' },
  { group: 'Diagnostic', key: 'protocol.warmup', label: 'Diagnostic complet : chauffe', min: 5, max: 120, step: 5, unit: 's' },
  { group: 'Diagnostic', key: 'protocol.measure', label: 'Diagnostic complet : durée d’une mesure', min: 5, max: 120, step: 5, unit: 's' },
  { group: 'Diagnostic', key: 'protocol.repeats', label: 'Diagnostic complet : mesures par configuration', min: 1, max: 5, step: 1 },
  { group: 'Debug', key: 'debug.showWalkMask', label: 'Afficher la zone de marche (F4)', type: 'bool' },
];

// Profils de marche à essayer (bouton dans le panneau) : ils règlent vitesse, accélération, freinage.
export const WALK_PRESETS = [
  { name: 'Doux', values: { 'walk.maxSpeed': 480, 'walk.acceleration': 3600, 'walk.deceleration': 4800 } },
  { name: 'Paper Mario', values: { 'walk.maxSpeed': 520, 'walk.acceleration': 10000, 'walk.deceleration': 12000 } },
  { name: 'Moderne', values: { 'walk.maxSpeed': 600, 'walk.acceleration': 6000, 'walk.deceleration': 8000 } },
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
