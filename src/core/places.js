// Changer de lieu : les sorties d'un lieu, et le déroulé du fondu (logique pure).
// Sortie (données du lieu) : { id, zone: [x1, z1, x2, z2], to, arrive: [x, z], facing }.

// La sortie dans laquelle se trouve le point (x, z), ou null.
export function exitAt(exits, x, z) {
  for (const e of exits) {
    const [x1, z1, x2, z2] = e.zone;
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) return e;
  }
  return null;
}

// Fondu : 'out' (l'écran noircit) → 'load' (noir : on change de lieu) → 'in' (le noir s'efface) → 'done'.
// p : { fade } (durée de chaque fondu, s).
export function createTransition(exit) {
  return { exit, phase: 'out', t: 0 };
}

// Avance le fondu. Renvoie 'load' une seule fois, quand l'écran est noir (c'est le moment de changer de lieu).
export function stepTransition(tr, dt, p) {
  if (tr.phase === 'load') {
    tr.t += dt; // temps passé dans le noir à charger (pour le signe d'attente)
    return '';
  }
  if (tr.phase === 'done') return '';
  tr.t += dt;
  if (tr.t < p.fade) return '';
  tr.t = 0;
  if (tr.phase === 'out') {
    tr.phase = 'load';
    return 'load';
  }
  tr.phase = 'done';
  return '';
}

// Jamais d'écran noir muet (règle de la séance 64) : si le chargement dure plus de p.waitAfter s, un petit
// signe d'attente apparaît.
export function showWait(tr, p) {
  return !!tr && tr.phase === 'load' && tr.t >= p.waitAfter;
}

// Le nouveau lieu est prêt : le noir peut s'effacer.
export function placeReady(tr) {
  if (tr.phase === 'load') {
    tr.phase = 'in';
    tr.t = 0;
  }
}

// Opacité du noir (0 à 1).
export function transitionBlack(tr, p) {
  if (tr.phase === 'out') return Math.min(1, tr.t / p.fade);
  if (tr.phase === 'load') return 1;
  if (tr.phase === 'in') return Math.max(0, 1 - tr.t / p.fade);
  return 0;
}
