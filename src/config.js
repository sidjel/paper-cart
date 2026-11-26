// Toutes les valeurs réglables du jeu, à un seul endroit.
// Chaque valeur listée dans TUNABLES apparaît dans le panneau de réglages (F2 ou ⚙).

import playerFile from './data/joueur.json';
import { OTHER, MAX_NAME, cleanName } from './core/names.js';

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
    smoothTurns: true, // comparaison A/B : active l'hystérésis (±7°), le mini-pivot papier 45° et la conservation/synchro de phase (même jambe devant)
    turnStepDuration: 0.08, // durée (s) du mini-pivot papier 45° (cardinale ↔ diagonale)
    walkAnimSpeed: 1, // vitesse des images de marche (× ; plus grand = pas plus rapides)
    bounceHeight: 7, // hauteur du rebond à chaque pas (px)
    walkSquash: 0.05, // écrasement quand le pied se pose (part de la hauteur)
    breathAmount: 0.018, // ampleur de la respiration à l'arrêt
    breathRate: 0.35, // respirations par seconde
    stopSquash: 0.09, // petit écrasement quand il s'arrête
    stopDuration: 0.2, // durée de cet écrasement (s)
    shadowOpacity: 0.5, // opacité de l'ombre au sol
    shadowSize: 1, // taille de l'ombre (×)
    contactShadow: 0.6, // ombre de contact : petite zone sombre juste sous les pieds (0 = aucune)
    footSink: 4, // pieds enfoncés dans le sol (px du dessin) : le contour blanc sous la semelle touche le sol
    dust: true, // petit nuage de poussière à chaque pas
    dustSize: 1.3, // taille du nuage (×)
    dustDuration: 0.45, // durée de vie du nuage (s)
    dustOpacity: 0.85, // opacité de départ du nuage
  },
  dizzy: {
    enabled: true, // le tournis : trop de demi-tours, trop vite → étoiles et plainte du héros
    flips: 6, // demi-tours (changements de sens en marchant)…
    window: 3, // … en moins de N secondes
    duration: 3.5, // étoiles autour de la tête (s)
    cooldown: 60, // avant que ça puisse revenir (s)
  },
  player: {
    name: 'epaisseur', // comment le héros appelle le joueur (data/joueur.json), ou 'autre' : le nom tapé
    customName: '', // le nom tapé par le joueur (choix « Autre »)
  },
  guard: {
    speed: 260, // agent de sécurité du hall : vitesse de marche, quand il va de son poste à sa place au début (px/s)
  },
  places: {
    fade: 0.34, // changement de lieu : durée de la transition (fondu enchaîné ou effet papier, s) ; 0 = direct
    style: 'mist', // effet : 'mist' (fondu enchaîné + brume), 'dissolve' (fondu enchaîné), 'flip', 'double', 'strips', 'wipe'
    waitAfter: 0.3, // chargement plus long que ça (s) : un petit signe d'attente apparaît
    prefetchDelay: 2.5, // délai avant pré-téléchargement réseau silencieux des lieux voisins (s)
  },
  intro: {
    enabled: true, // texte d'introduction après « Commencer »
    fadeIn: 0.9, // apparition d'une ligne (s)
    fadeOut: 0.7, // disparition d'une ligne (s)
    endFade: 1.8, // fondu final du noir vers la partie (s) : fait par l'écran noir des changements de lieu (séance 68)
  },
  carry: {
    panier: 6, // [TEMP] capacité du panier à main (nombre de cartes) — à régler par l'auteur
    chariot: 12, // [TEMP] capacité du chariot (A8) — à régler par l'auteur
  },
  chariot: {
    offset: 125, // distance entre le héros et le milieu du chariot qu'il pousse (px du monde)
    front: 95, // distance entre le milieu du chariot et son avant (il bute par là)
    speed: 0.8, // vitesse du héros qui pousse (× vitesse de marche)
    weight: 0.35, // lourdeur : démarrage et freinage (× ceux du héros seul ; plus petit = plus lourd)
    flipTime: 0.3, // durée du retournement du chariot quand le héros fait demi-tour (s)
    range: 200, // distance pour le prendre ou le lâcher (px du monde)
    size: 0.8, // [TEMP] taille du chariot à côté du héros
    drift: 22, // roue folle : il tire vers le fond en poussant de côté (px/s à pleine vitesse ; 0 = roue réparée)
    bumpCount: 3, // chocs contre le décor avant que le haut-parleur s'en mêle…
    bumpWindow: 4, // …en moins de tant de secondes
  },
  pile: {
    reach: 30, // distance à laquelle on touche la pile (devant le héros, ou devant le chariot) (px)
    handTime: 1.5, // à la main (ou chariot poussé doucement) : temps à pousser avant qu'elle tombe (s)
    ramSpeed: 260, // élan du chariot qui la renverse d'un coup (vitesse du héros, px/s)
    fallTime: 0.45, // durée de la chute (s)
    wobble: 4, // vacillement pendant qu'on pousse (degrés)
  },
  access: {
    textSize: 'normale', // taille du texte de l'interface : petite, normale, grande
    vibration: true, // vibrations (téléphone, manette) : scan, carte, aparté, question
    brightness: 1, // luminosité du jeu (1 = normale) ; autre que 1 : un filtre qui coûte un peu sur téléphone
    contrast: 1, // contraste du jeu (1 = normal)
  },
  narrator: {
    enabled: true, // le narrateur parle
    speed: 38, // lettres par seconde (effet machine à écrire)
    hold: 1.8, // temps affiché une fois le texte complet (s)…
    timedMin: 2.5, // bulle qui se ferme seule (agent) : ouverte au moins ce temps (s)… [TEMP]
    timedPerChar: 0.05, // … et ce temps par lettre (s) : la durée suit la longueur du texte [TEMP]
    timedMax: 6, // … et jamais plus que ce temps (s) (choix A de l'auteur, séance 69)
    holdPerChar: 0.035, // … plus ce temps par lettre (les longues répliques restent plus longtemps)
    minGap: 20, // écart minimal entre deux prises de parole (s), sauf moments forts
    lineCooldown: 600, // une même réplique ne revient pas avant (s)
    inactivity: 30, // délai d'inactivité avant une remarque (s)
    blipEvery: 2, // un petit bip toutes les N lettres (0 = aucun)
    heroBlipEvery: 8, // héros (apartés, pensées) : un petit bip toutes les N lettres, ≈ 5 par seconde (séance 66, choix de l'auteur ; 0 = aucun)
    // Apartés du héros (il se tourne vers l'écran et parle au joueur)
    asides: true, // le héros fait des apartés
    asideGap: 150, // écart minimal entre deux apartés (s) : un moment rare
    asideZoom: 1.35, // zoom de la caméra sur le héros pendant un aparté (× ; 1 = aucun)
    asideZoomTime: 0.6, // durée du zoom (entrée et sortie) (s)
    asideDim: 0.5, // assombrissement des bords de l'écran pendant un aparté (0 à 1)
    breath: 4, // silence minimal avant un aparté (s), sauf enchaîné à une réplique
    glanceGap: 25, // petits regards caméra (sans texte) : au plus un toutes les N secondes
    followWait: 20, // un aparté enchaîné attend que le héros s'arrête, au plus N secondes
    sceneWait: true, // conversation : chaque réplique attend un toucher du joueur (sinon, elle passe seule)
    meetZ: 20, // conversation : profondeur du point de rencontre (milieu de l'écran, un peu en avant)
    walkTimeout: 8, // conversation : une marche qui n'arrive pas (obstacle) se termine au bout de N s
    veilTime: 1.2, // voile de la rencontre (bords flous, vagues violettes) : apparition en N s
    veilBlur: 0, // flou réel des bords (px), coûteux sur téléphone ; 0 = sans flou (vagues et lueur violettes seulement)
    screenFx: 'vague', // la voix du joueur (l'écran qui parle) : 'vague' (mots qui ondulent), 'souffle' (la ligne respire) ou 'aucun'
    logMax: 40, // historique des dialogues (Pause → Dialogues) : nombre de répliques gardées (fixé au chargement)
    followDelay: 0.8, // délai avant une réplique enchaînée (aparté après l'accueil, réaction du haut-parleur) (s)
  },
  scan: {
    exchangeSpares: 6, // images préparées par lieu pour les échanges avec un produit venu d'un autre lieu (A7)
    range: 150, // distance (le long du rayon) à laquelle un produit est à portée (px)
    minDepth: 150, // il faut être assez près de l'étagère du fond (profondeur minimale)
    // Produits posés ailleurs (table, chariot) : portée autour du produit, sur le sol.
    looseRange: 170, // écart maximal le long du rayon (px)
    looseDepth: 90, // écart maximal en profondeur
    awayDepth: 30, // produit plus loin que ça en profondeur : le personnage se met de dos pour le scanner
    raise: 0.15, // durée : lever la Scanette (s)
    laser: 0.22, // durée : le laser part vers le produit (s)
    dissolve: 0.55, // durée : le produit se dissout et est aspiré (s)
    card: 1.0, // durée : la carte apparaît puis file dans le Panier (s)
    particles: 14, // nombre de confettis
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
    foregroundOpacity: 1, // opacité par défaut du rayon du premier plan (opaque + transparence dynamique quand le héros passe derrière)
    hallForegroundOpacity: 1, // opacité du premier plan du hall (plantes en pots Krita)
    behindPlantsOpacity: 0.45, // opacité des plantes quand le héros passe derrière
    maxPixelRatio: 2, // plafond de densité de pixels des images (coût mémoire et carte graphique)
    // Profil de qualité (ARCHITECTURE §14) : 'leger', 'normal' ou 'fin'. [TEMP] « Fin » par défaut (comme
    // avant les profils) en attendant le choix automatique au premier lancement (étape suivante).
    profile: 'fin',
    profiles: {
      leger: { density: 1, dust: false, farParallax: false },
      normal: { density: 1.5, dust: true, farParallax: true },
      fin: { density: 2, dust: true, farParallax: true },
    },
    // Objets du décor (chariot, présentoirs) sur leur propre calque, en permanence. Sans cela, le
    // navigateur leur crée un calque quand le personnage passe derrière et le retire ensuite :
    // à chaque bascule l'objet est redessiné et peut disparaître un instant (clignotement).
    propLayers: true,
    // Plein écran : 'auto' (téléphone : oui, en paysage, en touchant « Commencer » ; PC : non), 'oui', 'non'.
    fullscreenMode: 'auto',
    narratorAlpha: 0.78, // opacité du fond des annonces du haut-parleur (1 = opaque)
    menuAlpha: 0.94, // opacité du fond des menus (⚙, Pause, Options, Panier ; 1 = opaque)
    crt: false, // filtre « écran cathodique » (lignes de balayage, bords sombres) ; coûte un peu sur téléphone
    crtStrength: 0.6, // force du filtre cathodique (0 à 1)
  },
  audio: {
    muted: false, // couper tout le son
    master: 0.8, // volume général
    music: 0.4, // volume de la musique
    steps: 0.35, // volume des pas
    birdsVolume: 0.4, // volume des corbeaux / oiseaux dehors
    scanVolume: 0.6, // volume des sons du scanner (bip, aspiration, carte)
    voiceVolume: 0.5, // volume du narrateur (annonce, petits bips du texte)
    heroVolume: 0.5, // volume des sons du héros (bips, froissement, aparté) ; plus dans le panneau (séance 66, demande de l'auteur : remplacé par les deux interrupteurs ci-dessous)
    heroBlips: true, // petits bips d'écriture du héros (apartés, pensées)
    // Nombre maximum de sons en même temps, par famille (le plus ancien s'arrête ; une famille ne coupe jamais une autre).
    maxPas: 2,
    maxTexte: 3, // bips du texte (haut-parleur, héros)
    maxPapier: 2, // froissement, carte qui se retourne
    maxScanner: 4, // bip, aspiration, carte, prise
    maxVoix: 2, // annonce, ding
    maxAparte: 1,
    maxAmbiance: 2, // pluie, portes
    rustle: false, // froissement de papier : début des pensées du héros et réponses du joueur (séance 66 : désactivé, choix de l'auteur)
    pauseMusic: 0.35, // volume de la musique en pause (× volume de la musique)
    preparedSounds: true, // essai : sons courts préparés une fois (oui) ou fabriqués à chaque fois comme avant (non)
    // Taille de la réserve de son du navigateur : plus grande = moins de risque de grésillement,
    // mais les pas sonnent un tout petit peu plus tard.
    latency: 'balanced',
  },
  input: {
    virtualJoystick: false, // téléphone : joystick virtuel à gauche de l'écran
    joystickRadius: 60, // rayon du joystick virtuel (px d'écran)
    stickDeadZone: 0.2, // manette : zone morte du stick (0 à 1)
    doubleTapTime: 0.35, // double toucher : délai maximal entre les deux touchers (s)
    doubleTapDistance: 50, // double toucher : écart maximal entre les deux touchers (px d'écran)
    doubleTapMargin: 50, // double toucher : marge autour du dessin d'un produit posé ailleurs (px de scène)
  },
  bench: {
    passes: 3, // nombre de tours mesurés
    warmup: 3, // secondes de chauffe, non mesurées
    soundMinutes: 5, // essai son long : durée (le parcours se répète)
    // Interrupteurs d'essai : rejouer le même parcours sans une option, pour comparer deux rapports.
    noForeground: false,
    noFarLayer: false,
    noDust: false,
    noShadow: false,
    fixedCamera: false,
  },
  quick: {
    warmup: 30, // test rapide : chauffe (s)
    block: 20, // durée d'un bloc (s)
    settle: 2, // début de bloc ignoré après un changement de variante (s)
    rounds: 4, // nombre de tours (chaque tour mesure les 5 conditions)
  },
  debug: {
    showWalkMask: false, // affiche la zone de marche (vert) et les obstacles (rouge)
    showPerspective: false, // affiche la grille de perspective (lignes de fuite, horizon, profondeur z)
    devMode: true, // outils de développement visibles hors des réglages (écran titre : « Départ ») ; à couper pour la version vendue
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
  { group: 'Personnage', key: 'character.smoothTurns', label: 'Virages fluides 8 dir. (A/B)', type: 'bool' },
  { group: 'Personnage', key: 'character.turnStepDuration', label: 'Durée d’étape de virage', min: 0, max: 0.25, step: 0.01, unit: 's' },
  { group: 'Personnage', key: 'character.bounceHeight', label: 'Rebond en marchant', min: 0, max: 30, step: 1, unit: 'px' },
  { group: 'Personnage', key: 'character.walkSquash', label: 'Écrasement à chaque pas', min: 0, max: 0.2, step: 0.01 },
  { group: 'Personnage', key: 'character.breathAmount', label: 'Respiration (ampleur)', min: 0, max: 0.06, step: 0.002 },
  { group: 'Personnage', key: 'character.breathRate', label: 'Respiration (rythme)', min: 0.1, max: 1.2, step: 0.05, unit: '/s' },
  { group: 'Personnage', key: 'character.stopSquash', label: "Écrasement à l'arrêt", min: 0, max: 0.3, step: 0.01 },
  { group: 'Personnage', key: 'character.stopDuration', label: "Durée de l'écrasement", min: 0.05, max: 0.6, step: 0.01, unit: 's' },
  { group: 'Personnage', key: 'character.shadowOpacity', label: "Opacité de l'ombre", min: 0, max: 0.8, step: 0.02 },
  { group: 'Personnage', key: 'character.contactShadow', label: 'Ombre de contact sous les pieds', min: 0, max: 1, step: 0.05 },
  { group: 'Personnage', key: 'character.footSink', label: 'Pieds enfoncés dans le sol', min: 0, max: 12, step: 1, unit: 'px' },
  { group: 'Personnage', key: 'character.shadowSize', label: "Taille de l'ombre", min: 0.3, max: 2, step: 0.05, unit: '×' },
  { group: 'Personnage', key: 'scene.depthScale', label: 'Plus petit au fond (force)', min: 0, max: 2, step: 0.05, unit: '×' },
  { group: 'Personnage', key: 'character.dust', label: 'Poussière à chaque pas', type: 'bool' },
  { group: 'Personnage', key: 'character.dustSize', label: 'Taille de la poussière', min: 0.3, max: 2.5, step: 0.05, unit: '×' },
  { group: 'Personnage', key: 'character.dustDuration', label: 'Durée de la poussière', min: 0.15, max: 1.5, step: 0.05, unit: 's' },
  { group: 'Personnage', key: 'character.dustOpacity', label: 'Opacité de la poussière', min: 0.1, max: 1, step: 0.05 },
  { group: 'Personnage', key: 'character.walkAnimSpeed', label: 'Vitesse des pas (images)', min: 0.4, max: 2.5, step: 0.05, unit: '×' },
  { group: 'Contrôles', key: 'input.virtualJoystick', label: 'Joystick virtuel (téléphone)', type: 'bool' },
  { group: 'Contrôles', key: 'input.joystickRadius', label: 'Taille du joystick', min: 30, max: 120, step: 5, unit: 'px' },
  { group: 'Contrôles', key: 'input.doubleTapTime', label: 'Double toucher : délai max', min: 0.15, max: 0.7, step: 0.05, unit: 's' },
  { group: 'Contrôles', key: 'input.doubleTapDistance', label: 'Double toucher : écart max', min: 10, max: 150, step: 5, unit: 'px' },
  { group: 'Contrôles', key: 'input.doubleTapMargin', label: 'Double toucher : marge autour d’un produit', min: 0, max: 150, step: 5, unit: 'px' },
  { group: 'Contrôles', key: 'input.stickDeadZone', label: 'Zone morte du stick', min: 0, max: 0.6, step: 0.02 },
  { group: 'Son', key: 'audio.muted', label: 'Couper le son', type: 'bool' },
  { group: 'Son', key: 'audio.master', label: 'Volume général', min: 0, max: 1, step: 0.05 },
  { group: 'Son', key: 'audio.music', label: 'Musique', min: 0, max: 1, step: 0.05 },
  { group: 'Son', key: 'audio.maxPas', label: 'Sons en même temps : pas', min: 1, max: 6, step: 1 },
  { group: 'Son', key: 'audio.maxTexte', label: 'Sons en même temps : bips du texte', min: 1, max: 8, step: 1 },
  { group: 'Son', key: 'audio.maxPapier', label: 'Sons en même temps : papier', min: 1, max: 6, step: 1 },
  { group: 'Son', key: 'audio.maxScanner', label: 'Sons en même temps : scanner', min: 1, max: 8, step: 1 },
  { group: 'Son', key: 'audio.maxVoix', label: 'Sons en même temps : haut-parleur', min: 1, max: 4, step: 1 },
  { group: 'Son', key: 'audio.heroBlips', label: 'Bips d’écriture du héros', type: 'bool' },
  { group: 'Son', key: 'audio.rustle', label: 'Froissement de papier', type: 'bool' },
  { group: 'Son', key: 'audio.preparedSounds', label: 'Essai : sons courts préparés', type: 'bool' },
  { group: 'Son', key: 'audio.steps', label: 'Bruits de pas', min: 0, max: 1, step: 0.05 },
  { group: 'Son', key: 'audio.birdsVolume', label: 'Corbeaux / oiseaux dehors', min: 0, max: 1, step: 0.05 },
  {
    group: 'Son', key: 'audio.latency', label: 'Réserve de son (anti-grésillement)', type: 'choice', reload: true,
    options: [['interactive', 'Petite (réactive)'], ['balanced', 'Moyenne'], ['playback', 'Grande (la plus stable)']],
  },
  { group: 'Son', key: 'audio.pauseMusic', label: 'Musique en pause', min: 0, max: 1, step: 0.05, unit: '×' },
  { group: 'Affichage', key: 'display.foregroundOpacity', label: 'Opacité du rayon de devant', min: 0, max: 1, step: 0.05 },
  { group: 'Affichage', key: 'display.hallForegroundOpacity', label: 'Opacité du premier plan du hall', min: 0, max: 1, step: 0.05 },
  { group: 'Affichage', key: 'display.behindPlantsOpacity', label: 'Opacité du premier plan devant le héros', min: 0.15, max: 1, step: 0.05 },
  { group: 'Scanner', key: 'carry.panier', label: 'Capacité du panier (cartes)', min: 1, max: 30, step: 1 },
  { group: 'Chariot', key: 'carry.chariot', label: 'Capacité du chariot (cartes)', min: 1, max: 40, step: 1 },
  { group: 'Chariot', key: 'chariot.offset', label: 'Distance au héros', min: 60, max: 220, step: 5, unit: 'px' },
  { group: 'Chariot', key: 'chariot.front', label: 'Longueur avant (butée)', min: 0, max: 160, step: 5, unit: 'px' },
  { group: 'Chariot', key: 'chariot.speed', label: 'Vitesse en poussant (× marche)', min: 0.4, max: 1.2, step: 0.05 },
  { group: 'Chariot', key: 'chariot.weight', label: 'Lourdeur (démarrage, freinage ; petit = lourd)', min: 0.1, max: 1, step: 0.05 },
  { group: 'Chariot', key: 'chariot.flipTime', label: 'Retournement du chariot', min: 0, max: 0.8, step: 0.05, unit: 's' },
  { group: 'Pile de cartons', key: 'pile.handTime', label: 'À la main : temps pour la renverser', min: 0.3, max: 5, step: 0.1, unit: 's' },
  { group: 'Pile de cartons', key: 'pile.ramSpeed', label: 'Élan du chariot pour la renverser d’un coup', min: 50, max: 500, step: 10, unit: 'px/s' },
  { group: 'Pile de cartons', key: 'pile.fallTime', label: 'Durée de la chute', min: 0.1, max: 1.5, step: 0.05, unit: 's' },
  { group: 'Pile de cartons', key: 'pile.wobble', label: 'Vacillement', min: 0, max: 12, step: 0.5, unit: '°' },
  { group: 'Chariot', key: 'chariot.drift', label: 'Roue folle (0 = réparée)', min: 0, max: 80, step: 2, unit: 'px/s' },
  { group: 'Chariot', key: 'chariot.size', label: 'Taille du chariot', min: 0.4, max: 1.4, step: 0.05 },
  { group: 'Chariot', key: 'chariot.range', label: 'Portée pour le prendre ou le lâcher', min: 50, max: 350, step: 10, unit: 'px' },
  { group: 'Scanner', key: 'scan.range', label: 'Portée du scanner', min: 40, max: 400, step: 10, unit: 'px' },
  { group: 'Scanner', key: 'scan.minDepth', label: 'Proximité de l’étagère (profondeur mini)', min: 0, max: 260, step: 5 },
  { group: 'Scanner', key: 'scan.looseRange', label: 'Produit sur table ou chariot : portée de côté', min: 60, max: 300, step: 10, unit: 'px' },
  { group: 'Scanner', key: 'scan.looseDepth', label: 'Produit sur table ou chariot : portée en profondeur', min: 30, max: 200, step: 5 },
  { group: 'Scanner', key: 'scan.raise', label: 'Lever la Scanette', min: 0.05, max: 0.6, step: 0.01, unit: 's' },
  { group: 'Scanner', key: 'scan.laser', label: 'Laser', min: 0.05, max: 0.8, step: 0.01, unit: 's' },
  { group: 'Scanner', key: 'scan.dissolve', label: 'Dissolution du produit', min: 0.1, max: 1.5, step: 0.05, unit: 's' },
  { group: 'Scanner', key: 'scan.card', label: 'Apparition de la carte', min: 0.3, max: 2.5, step: 0.05, unit: 's' },
  { group: 'Scanner', key: 'scan.exchangeSpares', label: 'Échanges entre rayons : images préparées', min: 0, max: 12, step: 1, reload: true },
  { group: 'Scanner', key: 'scan.particles', label: 'Nombre de confettis', min: 0, max: 24, step: 1, reload: true },
  { group: 'Son', key: 'audio.scanVolume', label: 'Sons du scanner', min: 0, max: 1, step: 0.05 },
  { group: 'Son', key: 'audio.voiceVolume', label: 'Narrateur (annonce, bips)', min: 0, max: 1, step: 0.05 },
  { group: 'Narrateur', key: 'intro.enabled', label: 'Introduction après « Commencer »', type: 'bool' },
  { group: 'Narrateur', key: 'intro.fadeIn', label: 'Intro : apparition d’une ligne', min: 0.1, max: 3, step: 0.1, unit: 's' },
  { group: 'Narrateur', key: 'intro.endFade', label: 'Intro : fondu final', min: 0.2, max: 5, step: 0.1, unit: 's' },
  { group: 'Narrateur', key: 'narrator.enabled', label: 'Le narrateur parle', type: 'bool' },
  {
    group: 'Accessibilité', key: 'access.textSize', label: 'Taille du texte', type: 'choice',
    options: [['petite', 'Petite'], ['normale', 'Normale'], ['grande', 'Grande'], ['tres-grande', 'Très grande']],
  },
  { group: 'Accessibilité', key: 'narrator.speed', label: 'Vitesse du texte', min: 10, max: 120, step: 2, unit: 'lettres/s' },
  { group: 'Accessibilité', key: 'access.vibration', label: 'Vibrations (téléphone, manette)', type: 'bool' },
  { group: 'Accessibilité', key: 'access.brightness', label: 'Luminosité', min: 0.6, max: 1.4, step: 0.05, unit: '×' },
  { group: 'Accessibilité', key: 'access.contrast', label: 'Contraste', min: 0.6, max: 1.4, step: 0.05, unit: '×' },
  { group: 'Accessibilité', key: 'display.reduceMotion', label: 'Réduire les animations', type: 'bool' },
  { group: 'Narrateur', key: 'narrator.timedMin', label: 'Bulle qui se ferme seule : au moins', min: 1, max: 6, step: 0.5, unit: 's' },
  { group: 'Narrateur', key: 'narrator.timedPerChar', label: 'Bulle qui se ferme seule : par lettre', min: 0, max: 0.15, step: 0.01, unit: 's' },
  { group: 'Narrateur', key: 'narrator.timedMax', label: 'Bulle qui se ferme seule : au plus', min: 3, max: 15, step: 0.5, unit: 's' },
  { group: 'Narrateur', key: 'narrator.hold', label: 'Temps affiché après le texte', min: 0.5, max: 6, step: 0.1, unit: 's' },
  { group: 'Narrateur', key: 'narrator.holdPerChar', label: '… plus, par lettre', min: 0, max: 0.1, step: 0.005, unit: 's' },
  { group: 'Narrateur', key: 'narrator.minGap', label: 'Écart minimal entre deux répliques', min: 0, max: 120, step: 5, unit: 's' },
  { group: 'Narrateur', key: 'narrator.lineCooldown', label: 'Une même réplique revient après', min: 0, max: 1800, step: 30, unit: 's' },
  { group: 'Narrateur', key: 'narrator.inactivity', label: 'Remarque d’inactivité après', min: 5, max: 180, step: 5, unit: 's' },
  { group: 'Narrateur', key: 'narrator.asides', label: 'Apartés du héros', type: 'bool' },
  { group: 'Narrateur', key: 'narrator.asideGap', label: 'Écart minimal entre deux apartés', min: 10, max: 600, step: 10, unit: 's' },
  { group: 'Narrateur', key: 'narrator.asideZoom', label: 'Aparté : zoom sur le héros', min: 1, max: 2, step: 0.05, unit: '×' },
  { group: 'Narrateur', key: 'narrator.asideZoomTime', label: 'Aparté : durée du zoom', min: 0.1, max: 2, step: 0.05, unit: 's' },
  { group: 'Narrateur', key: 'narrator.asideDim', label: 'Aparté : assombrissement des bords', min: 0, max: 1, step: 0.05 },
  { group: 'Narrateur', key: 'narrator.glanceGap', label: 'Petits regards caméra : au plus un toutes les', min: 5, max: 300, step: 5, unit: 's' },
  { group: 'Narrateur', key: 'narrator.breath', label: 'Silence avant un aparté', min: 0, max: 30, step: 1, unit: 's' },
  { group: 'Personnage', key: 'dizzy.enabled', label: 'Tournis (trop de demi-tours, trop vite)', type: 'bool' },
  { group: 'Personnage', key: 'dizzy.flips', label: 'Tournis : nombre de demi-tours', min: 3, max: 12, step: 1 },
  { group: 'Personnage', key: 'dizzy.window', label: 'Tournis : en moins de', min: 1, max: 8, step: 0.5, unit: 's' },
  { group: 'Personnage', key: 'dizzy.duration', label: 'Tournis : étoiles pendant', min: 1, max: 8, step: 0.5, unit: 's' },
  { group: 'Personnage', key: 'dizzy.cooldown', label: 'Tournis : pas avant (la fois suivante)', min: 5, max: 300, step: 5, unit: 's' },
  { group: 'Narrateur', key: 'narrator.meetZ', label: 'Rencontre : profondeur du point de rencontre', min: -150, max: 250, step: 10 },
  { group: 'Narrateur', key: 'narrator.walkTimeout', label: 'Rencontre : marche abandonnée au bout de', min: 2, max: 20, step: 1, unit: 's' },
  { group: 'Narrateur', key: 'narrator.veilTime', label: 'Rencontre : apparition du voile', min: 0.2, max: 4, step: 0.1, unit: 's' },
  { group: 'Narrateur', key: 'narrator.veilBlur', label: 'Rencontre : flou des bords (0 = sans flou)', min: 0, max: 16, step: 1, unit: 'px' },
  {
    group: 'Narrateur', key: 'narrator.screenFx', label: 'Voix du joueur (l’écran qui parle) : effet', type: 'choice',
    options: [['vague', 'Vague (les mots ondulent)'], ['souffle', 'Souffle (la ligne respire, moins coûteux)'], ['aucun', 'Aucun']],
  },
  {
    group: 'Narrateur', key: 'player.name', label: 'Ton nom (comment le héros t’appelle)', type: 'choice',
    options: [...playerFile.names.map((n) => [n.id, n.name]), [OTHER, 'Autre : ton propre nom']],
  },
  { group: 'Narrateur', key: 'player.customName', label: 'Ton propre nom (choix « Autre »)', type: 'text', maxLength: MAX_NAME },
  { group: 'Narrateur', key: 'narrator.sceneWait', label: 'Conversation : attendre un toucher entre les répliques', type: 'bool' },
  { group: 'Narrateur', key: 'narrator.followWait', label: 'Aparté enchaîné : attendre que le héros s’arrête (max)', min: 0, max: 60, step: 1, unit: 's' },
  { group: 'Narrateur', key: 'narrator.followDelay', label: 'Délai d’une réplique enchaînée', min: 0, max: 5, step: 0.1, unit: 's' },
  { group: 'Narrateur', key: 'narrator.blipEvery', label: 'Petit bip toutes les N lettres (0 = aucun)', min: 0, max: 6, step: 1 },
  { group: 'Narrateur', key: 'narrator.heroBlipEvery', label: 'Héros : petit bip toutes les N lettres (0 = aucun)', min: 0, max: 16, step: 1 },
  { group: 'Marche', key: 'guard.speed', label: 'Agent de sécurité : vitesse', min: 50, max: 1500, step: 10, unit: 'px/s' },
  { group: 'Caméra', key: 'places.waitAfter', label: 'Changement de lieu : signe d’attente après', min: 0, max: 2, step: 0.1, unit: 's' },
  { group: 'Caméra', key: 'places.prefetchDelay', label: 'Préchargement des lieux voisins après', min: 0, max: 10, step: 0.5, unit: 's' },
  { group: 'Caméra', key: 'places.fade', label: 'Changement de lieu : durée du volet papier (0 = direct)', min: 0, max: 1, step: 0.01, unit: 's' },
  {
    group: 'Caméra', key: 'places.style', label: 'Changement de lieu : style de transition (test)', type: 'choice',
    options: [
      ['mist', 'Cross-dissolve + brume lumineuse'],
      ['dissolve', 'Cross-dissolve (fondu enchaîné pur)'],
      ['flip', '3A · Feuille origami qui se retourne'],
      ['double', '3B · Double-volet origami'],
      ['strips', 'Lignes blanches → cartes liseré bleu'],
      ['wipe', '2A · Volet papier glissant'],
    ],
  },
  { group: 'Caméra', key: 'camera.zoom', label: 'Zoom (netteté au rechargement)', min: 1, max: 1.8, step: 0.05, unit: '×' },
  { group: 'Caméra', key: 'camera.follow', label: 'Vitesse de suivi', min: 0.5, max: 20, step: 0.5 },
  { group: 'Caméra', key: 'camera.lookAhead', label: 'Regard devant le personnage', min: 0, max: 500, step: 10, unit: 'px' },
  { group: 'Caméra', key: 'camera.deadZone', label: 'Zone sans mouvement', min: 0, max: 0.4, step: 0.01 },
  {
    group: 'Affichage', key: 'display.fullscreenMode', label: 'Plein écran', type: 'choice',
    options: [['auto', 'Automatique (téléphone : oui)'], ['oui', 'Oui'], ['non', 'Non']],
  },
  { group: 'Affichage', key: 'display.narratorAlpha', label: 'Opacité des annonces du haut-parleur', min: 0.3, max: 1, step: 0.05 },
  { group: 'Affichage', key: 'display.menuAlpha', label: 'Opacité des menus', min: 0.25, max: 1, step: 0.05 },
  { group: 'Affichage', key: 'display.crt', label: 'Filtre écran cathodique', type: 'bool' },
  { group: 'Affichage', key: 'display.crtStrength', label: 'Force du filtre cathodique', min: 0.1, max: 1, step: 0.05 },
  { group: 'Affichage', key: 'display.propLayers', label: 'Objets sur calque fixe (anti-clignotement)', type: 'bool' },
  {
    group: 'Affichage', key: 'display.profile', label: 'Qualité (profil)', type: 'choice', reload: true,
    options: [['leger', 'Légère (téléphones modestes, PC anciens)'], ['normal', 'Normale'], ['fin', 'Fine (appareils rapides)']],
  },
  { group: 'Affichage', key: 'display.maxPixelRatio', label: 'Densité de pixels max', min: 0.5, max: 3, step: 0.25, reload: true },
  { group: 'Technique', key: 'loop.stepHz', label: 'Pas fixe de la logique', min: 30, max: 240, step: 10, unit: 'Hz' },
  { group: 'Diagnostic', key: 'debug.devMode', label: 'Mode dev (écran titre : « Départ »)', type: 'bool', reload: true },
  { group: 'Diagnostic', key: 'bench.passes', label: 'Banc : nombre de tours', min: 1, max: 10, step: 1 },
  { group: 'Diagnostic', key: 'bench.soundMinutes', label: 'Essai son long : durée', min: 1, max: 20, step: 1, unit: 'min' },
  { group: 'Diagnostic', key: 'bench.warmup', label: 'Banc : chauffe', min: 0, max: 10, step: 1, unit: 's' },
  { group: 'Diagnostic', key: 'bench.noForeground', label: 'Essai sans rayon de devant', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.noFarLayer', label: 'Essai sans rayons lointains', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.noDust', label: 'Essai sans poussière', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.noShadow', label: 'Essai sans ombre', type: 'bool' },
  { group: 'Diagnostic', key: 'bench.fixedCamera', label: 'Essai caméra immobile', type: 'bool' },
  { group: 'Diagnostic', key: 'quick.warmup', label: 'Test rapide : chauffe', min: 0, max: 120, step: 5, unit: 's' },
  { group: 'Diagnostic', key: 'quick.block', label: 'Test rapide : durée d’un bloc', min: 5, max: 60, step: 5, unit: 's' },
  { group: 'Diagnostic', key: 'quick.settle', label: 'Test rapide : début de bloc ignoré', min: 0, max: 5, step: 0.5, unit: 's' },
  { group: 'Diagnostic', key: 'quick.rounds', label: 'Test rapide : nombre de tours', min: 1, max: 10, step: 1 },
  { group: 'Debug', key: 'debug.showWalkMask', label: 'Afficher la zone de marche (F4)', type: 'bool' },
  { group: 'Debug', key: 'debug.showPerspective', label: 'Afficher la grille de perspective (F6)', type: 'bool' },
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
  if (t.type === 'text') return typeof value === 'string' ? cleanName(value) : undefined;
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
