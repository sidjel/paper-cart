---
trigger: model_decision
description: "À lire et appliquer obligatoirement avant toute tâche dans src/ui/ : états et focus, fermeture unifiée, anti-faux-clic, lire avant d'écrire, calques permanents au-dessus de la scène, rien créé en jeu."
---

# src/ui/ — règles propres à ce dossier

Interface : menus, bulles, Panier, diagnostic. L'expérience voulue (menus, dialogues, chargements) est décrite dans `docs/GAME_DESIGN.md` (« Interface, menus, dialogues ») ; ici, seulement les règles de code (séance 64), écrites ici seulement.

- Une fenêtre qui s'ouvre **déclare un état** (`core/state.js`) ; ce qui s'ouvre **dans** un état est arbitré par `core/focus.js` (« qui a la main ? »), qui garde aussi la **sélection visible** et la dernière position.
- **Fermer** passe toujours par la même action abstraite (`back` : Échap, B, toucher à côté, ou le bouton qui l'a ouvert). Une confirmation (`confirm.js`) fermée = **annulée**, et la sélection revient au bouton qui l'a ouverte.
- **Délai anti-faux-clic** : le geste qui fait apparaître une bulle ou un choix ne peut pas le fermer ni le choisir.
- **Lire la page avant de la modifier** (ex. placer une bulle) : dans la boucle, lire la page (tailles, positions) avant de la modifier, jamais l'inverse dans la même image (sinon le navigateur recalcule toute la mise en page). La bulle reste dans l'écran, sa pointe vers celui qui parle.
- **Ce qui passe par-dessus la scène** (bande du haut-parleur, bulles) **garde son calque en permanence** (séance 68) : jamais retiré de la page (`[hidden]` le laisse en place, presque transparent, sans toucher), jamais de fondu d'opacité (un fondu crée un calque à chaque apparition, et le téléphone redessine la scène : le héros et la bande clignotaient). Un élément invisible ne prend ni touchers ni sélection (règle générale : `.agents/rules/scene.md`) ; ici, `pointer-events: none` prioritaire sur `#ui > *`.
- **Rien n'est créé en jeu** : fenêtres, bulles et cartes sont préparées au chargement et remplies ; un texte change sans recréer son nœud. Écart connu : la petite carte ajoutée au Panier à chaque scan (`docs/SUIVI.md`).
- Textes venant des données : `textContent` ; `innerHTML` seulement pour du balisage fixe.
