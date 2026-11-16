# src/scene/ — règles propres à ce dossier

Affichage de la scène (vue d'ensemble : `docs/ARCHITECTURE.md` §4).
- On anime **seulement** `transform` et `opacity`. Pas de `filter`, de flou ni de grande ombre sur ce qui bouge.
- **Rien n'est créé pendant le jeu** : éléments, images et canevas sont préparés au chargement (ou à l'entrée dans un lieu), puis réutilisés.
- **Un personnage ou un objet animé = un seul calque**, sur son conteneur (qui a la taille du dessin) ; ses poses à l'intérieur, une seule visible (`hidden`), sans `will-change` ni calque propre (`poses.js`). Jamais un calque par pose, jamais un calque séparé qui passe de l'opacité 0 à 1. Un fondu d'un personnage entier reste permis, sur son propre calque. Les objets que l'on contourne : un calque fixe chacun (docs/ARCHITECTURE.md §4).
- Ne pas réécrire un style qui n'a pas changé (garder la dernière valeur, comparer avant d'écrire).
- Pas de règle de jeu ici : la logique vit dans `src/core/`, on ne fait que l'afficher.
