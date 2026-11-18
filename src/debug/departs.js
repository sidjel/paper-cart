// Points de départ pour tester vite (outil de test, pas un menu du jeu) : ⚙ → Départ, ou lien ?depart=<id>.
// Le jeu se recharge, puis se met dans l'état choisi (data/departs.json). Recalculé à partir du jeu
// actuel : reste valable après une mise à jour (ce n'est pas une sauvegarde). Sorti de main.js à la séance 54.
//
// game : { sm, equipAll(), giveCaddie(), markSaid(moment), skipArrival(), products(), capacity(), giveCard(indice), refreshCount() }

import departsFile from '../data/departs.json';
import { findDepart, cardCount, pickProducts, saidFor } from '../core/departs.js';

const params = new URLSearchParams(location.search);
const departId = params.get('depart');

// Lieu où commence la partie : celui du lien ?lieu=<id> (tests), sinon celui du point de départ demandé,
// sinon le lieu normal (fallback). ids : lieux qui existent.
export function startPlaceId(ids, fallback) {
  const asked = params.get('lieu') ?? (departId ? findDepart(departsFile.departs, departId)?.place : null);
  return ids.includes(asked) ? asked : fallback;
}

function goToDepart(id) {
  const url = new URL(location.href);
  if (id === 'debut') url.searchParams.delete('depart');
  else url.searchParams.set('depart', id);
  location.replace(url.href); // rechargement : on part d'un jeu propre
}

// Un bouton par point de départ (onglet « Départ » des réglages, et écran titre en mode dev).
export function departButtons(className = '') {
  return departsFile.departs.map((d) => {
    const b = document.createElement('button');
    b.textContent = d.label;
    b.dataset.depart = d.id;
    if (className) b.className = className;
    if (d.id === (departId ?? 'debut')) b.classList.add('current');
    b.addEventListener('click', () => goToDepart(d.id));
    return b;
  });
}

export function createDepartTools(game) {
  // Onglet « Départ » des réglages : choisir où commencer (le jeu se recharge).
  const el = document.createElement('div');
  el.className = 'depart-tools';
  const note = document.createElement('p');
  note.className = 'settings-note';
  note.textContent = 'Pour tester vite : le jeu se recharge et commence à ce point. Lien direct : ajouter ?depart=<nom> à l’adresse.';
  el.appendChild(note);
  el.append(...departButtons());

  function apply(def) {
    game.sm.go('play'); // sans écran titre ni intro
    if (def.equip) game.equipAll();
    if (def.caddie) game.giveCaddie();
    for (const t of saidFor(def)) game.markSaid(t);
    if (def.equip) game.skipArrival(); // pas d'annonce d'arrivée ni de premières pensées
    // Cartes déjà dans le panier : des produits du rayon, retirés de l'étagère (sans effet de scan).
    const free = game.products().map((it, i) => ({ i, category: it.def.category ?? 'alimentaire', ok: !it.scanned })).filter((x) => x.ok);
    for (const k of pickProducts(free, cardCount(def, game.capacity()))) game.giveCard(free[k].i);
    game.refreshCount();
  }

  return {
    el,
    // Le point de départ demandé par l'adresse (ou null) : à appliquer une fois le jeu prêt.
    requested: () => (departId ? findDepart(departsFile.departs, departId) : null),
    apply,
  };
}
