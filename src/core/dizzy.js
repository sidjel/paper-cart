// Le tournis : si le joueur fait changer le héros de sens trop souvent, trop vite (gauche, droite,
// gauche…), des étoiles tournent autour de sa tête et il s'en plaint. Logique pure, temps du jeu.
// p : { enabled, flips (demi-tours), window (s), duration (s, étoiles), cooldown (s, avant la prochaine fois) }.

export function createDizzy() {
  return { facing: 0, times: [], until: -Infinity, next: -Infinity, count: 0 };
}

// À chaque pas : t (temps du jeu), facing (-1 ou 1), moving. Renvoie true quand le tournis commence.
export function stepDizzy(d, t, facing, moving, p) {
  if (!p.enabled) return false;
  if (d.facing && facing !== d.facing && moving) {
    d.times.push(t);
    if (d.times.length > p.flips) d.times.shift();
  }
  d.facing = facing;
  if (t < d.next || d.times.length < p.flips || t - d.times[0] > p.window) return false;
  d.times.length = 0;
  d.until = t + p.duration;
  d.next = t + p.cooldown;
  d.count++;
  return true;
}

export function dizzyActive(d, t) {
  return t < d.until;
}
