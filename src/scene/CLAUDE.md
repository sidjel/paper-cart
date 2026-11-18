# src/scene/ — règles propres à ce dossier

Affichage de la scène. Vue d'ensemble et leçons des bugs passés : `docs/ARCHITECTURE.md` §4 et §15.
Chaque règle n'est écrite qu'ici (décisions de l'auteur, séances 61 et 64).

## Affichage
- On anime **seulement** `transform` et `opacity`.
- **Rien n'est créé pendant le jeu** : éléments, images et canevas sont préparés au chargement (ou à l'entrée dans un lieu), puis réutilisés.
- **Un calque par élément animé** (personnage, objet que l'on contourne), sur son conteneur, qui a **la taille du dessin**. **Jamais un calque par pose.** Les poses sont des images **déjà décodées au chargement**, à l'intérieur de ce calque, une seule montrée à la fois (`hidden`), sans `will-change` ni calque propre, **exactement comme le héros** (référence mesurée : il ne clignote pas sur le téléphone). Un seul mécanisme : `poses.js`.
- Les poses d'un même élément ont **le même cadre et le même point d'appui** (pas de saut d'une pose à l'autre) ; l'ombre suit le point d'appui et **ne change pas de taille selon la pose**.
- Un élément invisible ne prend **ni touchers ni sélection** (vaut pour la scène comme pour l'interface : `src/ui/CLAUDE.md`).
- Fondu au noir : un seul écran pour tout le jeu, les autres lui passent le relais (`docs/ARCHITECTURE.md` §11).
- **Jamais de changement d'image (`src`) en jeu** sur un personnage ou un objet de la scène : chaque image a son élément, préparé au chargement.
- **Jamais un calque séparé qui passe de l'opacité 0 à 1** (un calque caché n'est pas préparé : le téléphone le dessine à froid). Un fondu d'un personnage entier reste permis, sur son propre calque.
- **Rien n'apparaît « à froid »** : tout ce dont le **lieu actif** a besoin (bulle, effet, pose, carte) est préchargé, décodé et préparé avant que le lieu soit jouable (préchauffage : créé, et montré une fois sous le fondu). Seulement le lieu actif, pas tout le jeu. Précision : un élément caché par `hidden` perd son calque ; le préchauffage sert au décodage des images, et seul un calque qui reste en place reste prêt (d'où la règle « un calque par élément animé »).
- **Pas trop de calques** : chaque calque coûte de la mémoire graphique, surtout sur téléphone. Le test des comptages garde une limite par lieu.
- **Dans la boucle, lire la page (tailles, positions) avant de la modifier**, jamais l'inverse dans la même image (sinon le navigateur recalcule toute la mise en page). À vérifier à la relecture et dans la skill `audit`.
- Ne pas réécrire un style qui n'a pas changé (garder la dernière valeur, comparer avant d'écrire).
- Pas de règle de jeu ici : la logique vit dans `src/core/`, on ne fait que l'afficher.

## Parallaxe
- Chaque plan de parallaxe est **un seul calque** déplacé par `transform` (jamais `left`, `background-position` ni un déplacement élément par élément).
- Le coefficient de chaque plan est dans les données du lieu ; la composition des calques ne change jamais pendant le mouvement.
- Un plan lointain n'est pas plus grand que nécessaire : sa largeur se calcule d'après la course de la caméra et le coefficient (largeur visible + course × (1 − coefficient)) ; un calque presque vide a une taille (`size`) à la mesure de son contenu.
- 🧪 À TESTER, pas encore une règle : le grain et les traits fins peuvent scintiller quand un plan avance de moins d'un pixel par image ; arrondir peut créer des à-coups d'un pixel. Un arrondi éventuel se fait **au pixel physique** (échelle de la scène × densité), jamais au pixel de la scène, de préférence **seulement quand la caméra s'arrête**, avec un interrupteur d'essai (sans arrondi / à l'arrêt / permanent) : l'auteur choisit sur le téléphone.
- « Réduire les animations » diminue l'amplitude de la parallaxe (confort, mal des transports).

## Lumière et ombres
- **Pas d'éclairage calculé en direct** : la lumière est dessinée dans les images, ou posée en **calques de lumière et d'obscurité préparés** (halo, pénombre), animés seulement par l'opacité.
- **Jamais** de `filter`, `box-shadow`, flou ni `mix-blend-mode` animés ou sur de grandes surfaces en jeu. La désaturation et la saleté de la zone 2 sont **dans les images**.
- Les ombres au sol sont des éléments **séparés** du dessin, qui suivent la profondeur et la hauteur du personnage.
- Néons qui clignotent : 3 éclairs par seconde au plus, figés par l'option « réduire les clignotements ».
