// « Qui a la main ? » : à quelle fenêtre ou à quel moment du jeu vont les commandes du joueur.
// Une seule règle de priorité, écrite ici (logique pure), au lieu de conditions répétées pour chaque touche.
// state : état de la machine (core/state.js) ; f : ce qui est ouvert ou en cours
// { confirm, card, name, choice, scene } (question Oui / Non, grande carte, choix du nom, réponse attendue,
// aparté ou conversation).
// Renvoie : 'intro' | 'bench' | 'menu' | 'options' | 'title' | 'pause' | 'confirm' | 'card' | 'panier' |
// 'name' | 'choice' | 'scene' | 'play' | 'none'.

export function focusOwner(state, f) {
  if (state === 'panier') return f.confirm ? 'confirm' : f.card ? 'card' : 'panier';
  if (state === 'play') return f.name ? 'name' : f.choice ? 'choice' : f.scene ? 'scene' : 'play';
  if (state === 'loading') return 'none';
  return state; // intro, bench, menu, options, title, pause
}

// Le héros est-il libre (le joueur le dirige, peut scanner, ouvrir le Panier) ?
export function heroFree(owner) {
  return owner === 'play';
}

// Le jeu est en cours (même pendant une conversation) : Échap ou Start mettent en pause.
export function inGame(owner) {
  return owner === 'play' || owner === 'scene' || owner === 'choice' || owner === 'name';
}
