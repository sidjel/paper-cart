// Animations image par image, décrites dans les données (aucun code à changer pour en ajouter).
// Une animation : { "frames": [...], "fps": n } ou { "frames": [...], "stride": px }.
//  - une image peut être un simple chemin, ou { "src": chemin, "ms": durée } pour la tenir plus longtemps
//    (exemple : yeux ouverts 2,6 s puis fermés 0,12 s = un clignement) ;
//  - "stride" : l'image change tous les `stride` pixels parcourus (les pas suivent la vitesse de marche) ;
//  - une image peut déclencher un son quand elle apparaît : { "src": chemin, "sound": "pas" } ;
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
  return { count: n, stride: def.stride > 0 ? def.stride : 0, ends, total, sounds };
}

// Numéro de l'image à montrer. elapsedMs : temps écoulé dans l'animation ; distance : pixels parcourus.
export function frameIndex(anim, elapsedMs, distance, speed = 1) {
  if (anim.count <= 1) return 0;
  if (anim.stride > 0) return Math.floor((distance * speed) / anim.stride) % anim.count;
  if (anim.total <= 0) return 0;
  const t = (elapsedMs * speed) % anim.total;
  for (let i = 0; i < anim.count; i++) if (t < anim.ends[i]) return i;
  return anim.count - 1;
}

// Retournement de la feuille de papier (pivot) : renvoie la largeur apparente (0 à 1)
// pour une progression p de 0 à 1. La feuille s'amincit, passe par sa tranche, se rouvre.
export function flipWidth(p, edge) {
  return Math.max(edge, Math.abs(Math.cos(p * Math.PI)));
}
