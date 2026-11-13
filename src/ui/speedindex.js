// Indice de vitesse du téléphone : un petit calcul toujours identique, chronométré.
// Il permet de savoir dans quel état était le téléphone (rapide ou ralenti) au moment d'un essai,
// et donc de comparer des essais faits à des moments différents. Plus petit = plus rapide.
// Utilisé seulement au début et à la fin des tests de mesure, jamais pendant le jeu.

function work() {
  let x = 1234567;
  let acc = 0;
  for (let i = 0; i < 400000; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    acc += Math.sqrt((x >>> 0) % 1000) * 0.5;
  }
  return acc;
}

let sink = 0; // empêche le navigateur d'ignorer le calcul

// Renvoie la médiane de 5 mesures (après 2 essais de mise en route), en millisecondes.
export function speedIndex() {
  const t = [];
  for (let k = 0; k < 7; k++) {
    const t0 = performance.now();
    sink += work();
    if (k >= 2) t.push(performance.now() - t0);
  }
  t.sort((a, b) => a - b);
  return sink === Infinity ? NaN : t[2];
}
