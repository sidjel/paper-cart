# src/input/ — règles propres à ce dossier

Clavier, souris, manette, doigt → actions abstraites et intention de déplacement (vue d'ensemble :
`docs/ARCHITECTURE.md` §5). Règles décidées par l'auteur (séance 64), écrites ici seulement ; les écarts
constatés et leur état sont dans `docs/SUIVI.md`.

- **Toutes les commandes passent par des actions abstraites** ; le reste du jeu ne lit jamais une touche. Chaque fonction du jeu se fait au clavier et à la souris, à la manette, et au doigt. Un essai automatique par mode le vérifie sur un parcours court.
- **Un geste = une action** : sur téléphone, un toucher ne déclenche pas aussi un clic « simulé » (filtrer selon `pointerType`). Une touche maintenue ne répète pas une action ; seule exception permise : se déplacer dans une liste ou un menu.
- **Quand le jeu perd le focus** (changement d'onglet, appel, notification), toutes les touches et directions sont relâchées : le héros ne continue jamais à marcher tout seul.
- **Les aides à l'écran suivent le dernier appareil utilisé** (touches, boutons de manette ou gestes).
- **Manette** : zone morte réglable sur les sticks ; branchement et débranchement détectés à tout moment ; pause automatique si la manette utilisée est débranchée. **Une étape n'est validée qu'après un essai sur une vraie manette.**
- **Au doigt** : zones à toucher d'au moins **44 px CSS** (environ 7 mm ; pas 44 pixels physiques, qui ne feraient que 15 px CSS sur un écran de densité 3) ; aucun geste réservé au navigateur (zoom par double toucher, rafraîchissement en tirant l'écran) ne se déclenche en jeu.
