// Boucle à pas fixe : la logique avance toujours par pas égaux (1/60 s par défaut),
// quel que soit le rythme de l'écran (60, 90, 144 Hz…). L'affichage interpole entre
// les deux derniers pas grâce à `alpha`.

export function createStepper(stepHz, maxSteps) {
  return {
    step: 1 / stepHz,
    maxSteps,
    acc: 0,
    alpha: 0,
    time: 0, // temps de jeu écoulé (s), figé en pause
    setRate(hz) {
      this.step = 1 / hz;
      this.acc = 0;
    },
    // Ajoute le temps réel écoulé ; renvoie le nombre de pas de logique à jouer.
    advance(elapsed) {
      this.acc += Math.max(0, elapsed);
      let n = Math.floor(this.acc / this.step);
      if (n > this.maxSteps) {
        n = this.maxSteps;
        this.acc = 0; // trop de retard : on l'abandonne
      } else {
        this.acc -= n * this.step;
      }
      this.time += n * this.step;
      this.alpha = this.acc / this.step;
      return n;
    },
    reset() {
      this.acc = 0;
      this.alpha = 0;
    },
  };
}
