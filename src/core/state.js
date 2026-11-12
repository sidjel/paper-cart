// La machine à états unique du jeu.
// Son, déplacements, affichage et interface lisent cet état ; une nouvelle fenêtre
// déclare un état ici plutôt que d'ajouter une condition ailleurs.

export const TRANSITIONS = {
  loading: ['play'],
  play: ['pause', 'menu'],
  pause: ['play', 'menu'],
  menu: ['play', 'pause', 'bench'],
  bench: ['play'], // banc d'essai : le personnage se déplace tout seul, on mesure
};

export function createStateMachine(initial = 'loading') {
  let current = initial;
  let previous = null;
  const listeners = [];

  return {
    get: () => current,
    is: (name) => current === name,
    can: (name) => TRANSITIONS[current]?.includes(name) ?? false,
    go(name) {
      if (!(TRANSITIONS[current]?.includes(name))) return false;
      previous = current;
      current = name;
      for (const fn of listeners) fn(current, previous);
      return true;
    },
    // Revenir à l'état d'avant (par exemple en fermant le menu).
    back() {
      return previous ? this.go(previous) : false;
    },
    onChange(fn) {
      listeners.push(fn);
    },
  };
}
