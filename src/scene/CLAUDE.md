# src/scene/ — règles propres à ce dossier

Affichage de la scène (vue d'ensemble : `docs/ARCHITECTURE.md` §4).
- On anime **seulement** `transform` et `opacity`. Pas de `filter`, de flou ni de grande ombre sur ce qui bouge.
- **Rien n'est créé pendant le jeu** : éléments, images et canevas sont préparés au chargement (ou à l'entrée dans un lieu), puis réutilisés.
- Ne pas réécrire un style qui n'a pas changé (garder la dernière valeur, comparer avant d'écrire).
- Pas de règle de jeu ici : la logique vit dans `src/core/`, on ne fait que l'afficher.
