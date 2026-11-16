# src/ui/ — règles propres à ce dossier

Interface : menus, bulles, Panier, diagnostic. L'expérience voulue (menus, dialogues, chargements) est
décrite dans `docs/GAME_DESIGN.md` (« Interface, menus, dialogues ») ; ici, seulement les règles de code
(séance 64), écrites ici seulement.

- Une fenêtre qui s'ouvre **déclare un état** (`core/state.js`) ; ce qui s'ouvre **dans** un état est arbitré par `core/focus.js` (« qui a la main ? »), qui garde aussi la **sélection visible** et la dernière position.
- **Fermer** passe toujours par la même action abstraite (`back` : Échap, B, toucher à côté, ou le bouton qui l'a ouvert). Une confirmation (`confirm.js`) fermée = **annulée**, et la sélection revient au bouton qui l'a ouverte.
- **Délai anti-faux-clic** : le geste qui fait apparaître une bulle ou un choix ne peut pas le fermer ni le choisir.
- **Placer une bulle** : lire la page (tailles, positions) avant de la modifier, jamais l'inverse dans la même image (`src/scene/CLAUDE.md`). La bulle reste dans l'écran, sa pointe vers celui qui parle.
- **Rien n'est créé en jeu** : fenêtres, bulles et cartes sont préparées au chargement et remplies ; un texte change sans recréer son nœud. Écart connu : la petite carte ajoutée au Panier à chaque scan (`docs/SUIVI.md`).
- Textes venant des données : `textContent` ; `innerHTML` seulement pour du balisage fixe.
