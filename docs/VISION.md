# Paper Cart: The Final Checkout — Vision (v3, validée)

> Ce document ne change qu'à la demande de l'auteur.

## Le jeu

Un RPG à la **Baten Kaitos** dans un supermarché sans fin. Dans le jeu, le magasin s'appelle provisoirement **Maxi-Gouffre**. On cherche à en sortir en **atteignant la caisse finale**, d'où le sous-titre *The Final Checkout* (« check out » veut aussi dire « partir » et « mourir » en argot anglais).

- Chaque lieu est un **grand décor en diorama origami / papier découpé** (généré par IA puis détouré, retouché et monté à la main dans Krita ; en attendant, formes provisoires pour les éléments restants), vu à la troisième personne. *(Méthode assumée par l'auteur, séance 80 : déclaration de contenu pré-généré par IA prévue sur Steam.)*
- On y fait marcher un **personnage en papier façon Paper Mario**.
- Le personnage tient une **Scanette** (le scanner en libre-service des supermarchés, prise à l'accueil ; *vocabulaire de l'auteur, séance 36*) : il vise un produit dans le rayon et en extrait l'**essence**, qui devient une **carte**.
- On combat avec ces cartes en **tour par tour sans chrono**, le personnage et l'ennemi face à face dans le décor, les cartes en bas de l'écran.
- Les cartes **pourrissent** avec le temps et **changent de rôle** : fraîches, elles soignent ou protègent ; mûres, elles ont leur meilleur effet ; pourries, elles deviennent des armes ou des poisons à lancer. *(Précision de l'auteur, séance 32 : toutes les cartes ne pourrissent pas ; il y a 4 familles d'évolution — stables, périssables, évolutives, à potentiel de fusion — détaillées dans `docs/REGLES_CARTES_COMBAT.md`.)*
- On **découvre** des combos et des évolutions **inconnus à l'avance**, par hasard ou par logique d'après la nature des cartes.
- Des **moments épiques à la Final Fantasy VII, VIII et X** : une jauge, puis une attaque ultime mise en scène comme une invocation, mais avec des objets du supermarché.
- Un **narrateur odieux** (le haut-parleur du magasin) commente tout, sans savoir qu'il y a un joueur. Le **joueur est « l'Épaisseur »** que le héros a perdue en devenant papier : c'est le héros qui, parfois, brise le 4ᵉ mur et lui parle *(précision de l'auteur, séance 33 ; le principe est validé, la façon de briser le 4ᵉ mur est à l'essai, voir `docs/HISTOIRE.md`)*.

## Ton

Étrange (Backrooms, magasin infini) et rigolo (humour noir, absurde).

- Aucune marque réelle.
- Pas d'esthétique « jeu généré par IA » générique : pas de néons génériques sur fond noir, pas de coffres, pas de capacités « bateau » — chaque visuel généré est retravaillé, harmonisé et monté à la main (Krita) dans la direction artistique papier / origami du jeu.

## Direction visuelle

Inspirée de Paper Mario et de Baten Kaitos : personnages et produits plats en papier découpé, dans des décors en diorama à plusieurs calques, générés par IA et retouchés/assemblés à la main. Le détail (pivot de la feuille, ombre, texture, couleurs des zones) est dans `docs/DIRECTION_ARTISTIQUE.md`.

## Piliers

1. **La pourriture change le rôle d'une carte** : la jouer maintenant ou attendre ?
2. **La découverte** : combos par propriétés (liquide, poudre, froid, électrique, gras…) et quelques recettes secrètes nommées ; évolutions cachées (« ? ») tant qu'elles n'ont pas été vues ; un carnet qui se remplit.
3. **Combats lisibles** : l'ennemi annonce son prochain coup ; pas de hasard injuste.
4. **Épique absurde** : une jauge, puis une attaque ultime mise en scène.
5. **Le narrateur** commente, se moque et récompense les découvertes.

## Méthode

On ne sait pas encore si le thème sera fun : **on le vérifie par de petits prototypes jouables** avant de produire du contenu.

| Prototype | Question |
|---|---|
| A — Le rayon | Est-ce agréable de marcher dans un rayon et de transformer un produit en carte ? |
| B — Le combat | Est-ce fun de faire pourrir ses cartes et de les lancer ? |
| C — La découverte | Combos par propriétés, recettes secrètes, carnet, évolutions cachées, jauge épique et première attaque ultime. |
| D — Le dessin | La chaîne dessin → scan → IA → jeu fonctionne-t-elle, et le style tient-il sur un lieu d'essai ? |
