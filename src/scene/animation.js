// Animations image par image, décrites dans les données (aucun code à changer pour en ajouter).
// Une animation : { "frames": [...], "fps": n } ou { "frames": [...], "stride": px }.
//  - une image peut être un simple chemin, ou { "src": chemin, "ms": durée } pour la tenir plus longtemps
//    (exemple : yeux ouverts 2,6 s puis fermés 0,12 s = un clignement) ;
//  - "stride" : l'image change tous les `stride` pixels parcourus (les pas suivent la vitesse de marche) ;
//  - une image peut déclencher un son et un effet quand elle apparaît :
//    { "src": chemin, "sound": "pas", "effect": "poussiere" } ;
//  - une seule image : elle reste affichée.

export function frameSrc(frame) {
  return typeof frame === 'string' ? frame : frame.src;
}

export function compileAnimation(def) {
  const n = def.frames.length;
  const defaultMs = def.fps > 0 ? 1000 / def.fps : 0;
  const ends = new Float64Array(n); // fin de chaque image dans le cycle (ms)
  let total = 0;
  def.frames.forEach((f, i) => {
    total += typeof f === 'object' && f.ms > 0 ? f.ms : defaultMs;
    ends[i] = total;
  });
  const sounds = def.frames.map((f) => (typeof f === 'object' && f.sound) || null);
  const effects = def.frames.map((f) => (typeof f === 'object' && f.effect) || null);
  // Décalage de phase du contact de référence (même jambe devant sur les 8 directions).
  const firstContact = sounds.findIndex((s, i) => Boolean(s || effects[i]));
  const contactOffset = Number.isInteger(def.phaseOffset) ? def.phaseOffset : (firstContact >= 0 ? firstContact : 0);
  return { count: n, stride: def.stride > 0 ? def.stride : 0, ends, total, sounds, effects, contactOffset };
}

// Numéro de l'image à montrer. elapsedMs : temps écoulé dans l'animation ; distance : pixels parcourus.
// syncPhase : aligne l'image 0 du cycle de marche sur le premier contact au sol (cohérence entre 8 directions).
export function frameIndex(anim, elapsedMs, distance, speed = 1, syncPhase = false) {
  if (anim.count <= 1) return 0;
  if (anim.stride > 0) {
    const step = Math.floor((Math.max(0, distance) * speed) / anim.stride);
    return (step + (syncPhase ? anim.contactOffset : 0)) % anim.count;
  }
  if (anim.total <= 0) return 0;
  const t = (elapsedMs * speed) % anim.total;
  for (let i = 0; i < anim.count; i++) if (t < anim.ends[i]) return i;
  return anim.count - 1;
}

// Retournement de la feuille de papier (pivot) : renvoie la largeur apparente
// pour une progression p de 0 à 1.
// - Courbe remappée edge + (1 - edge) * |cos(pπ)| pour que l'épaisseur de tranche soit perceptible ;
// - Léger « snap » cartonné (+5,5 %) à la réouverture (p > 0.5) comme dans Paper Mario.
export function flipWidth(p, edge) {
  const c = Math.max(0, Math.min(1, p));
  const w = edge + (1 - edge) * Math.abs(Math.cos(c * Math.PI));
  if (c > 0.5 && c < 1) {
    const q = (c - 0.5) * 2;
    return w + 0.055 * Math.sin(Math.PI * q) * q;
  }
  return w;
}

// Effets visuels du retournement papier (fonction pure, écrit dans `out`) :
//  - lift       : léger soulèvement de la feuille pendant le pivot (px) ;
//  - brightness : ombrage de la feuille quand elle s'incline (1 → 0.80) puis bref éclat clair
//                 à la réouverture face à la lumière (1.16 → 1), strictement sur la silhouette.
export function flipEffects(out, p) {
  const c = Math.max(0, Math.min(1, p));
  out.lift = 3.5 * Math.sin(c * Math.PI);
  if (c <= 0.5) {
    out.brightness = 1 - 0.2 * Math.sin(c * Math.PI);
  } else {
    const q = (c - 0.5) * 2; // 0 → 1
    out.brightness = 1 + 0.16 * Math.sin(Math.PI * q);
  }
  return out;
}

// Mouvement du corps en papier, calculé à partir de l'état (fonction pure, écrit dans `out`) :
//  - en marchant : petit rebond à chaque pas, léger écrasement quand le pied se pose ;
//  - à l'arrêt : respiration (la feuille s'étire et se tasse doucement) ;
//  - à l'arrêt juste après avoir marché : petit écrasement d'atterrissage.
// p : réglages (config.character) ; stepLen : distance parcourue pendant un pas (px).
export function bodyMotion(out, p, moving, distance, stepLen, idleTime, stopAge) {
  out.lift = 0;
  out.sx = 1;
  out.sy = 1;
  if (moving) {
    const s = Math.abs(Math.sin((Math.PI * distance) / stepLen));
    out.lift = p.bounceHeight * s;
    const contact = (1 - s) * (1 - s);
    out.sy = 1 - p.walkSquash * contact;
    out.sx = 1 + p.walkSquash * 0.6 * contact;
    return out;
  }
  const breath = Math.sin(2 * Math.PI * p.breathRate * idleTime);
  out.sy = 1 + p.breathAmount * breath;
  out.sx = 1 - p.breathAmount * 0.5 * breath;
  if (stopAge >= 0 && stopAge < p.stopDuration) {
    const q = stopAge / p.stopDuration;
    const k = p.stopSquash * Math.sin(Math.PI * q) * (1 - q);
    out.sy *= 1 - k;
    out.sx *= 1 + k * 0.7;
  }
  return out;
}
