# Paper Cart: The Final Checkout — Vision (v3, validée)

> Ce document ne change qu'à la demande de l'auteur.

## Le jeu

Un RPG à la **Baten Kaitos** dans un supermarché sans fin. Dans le jeu, le magasin s'appelle provisoirement **Maxi-Gouffre**. On cherche à en sortir en **atteignant la caisse finale**, d'où le sous-titre *The Final Checkout* (« check out » veut aussi dire « partir » et « mourir » en argot anglais).

- Chaque lieu est un **grand décor dessiné à la main** (par l'auteur, puis amélioré par IA ; en attendant, formes provisoires), vu à la troisième personne.
- On y fait marcher un **personnage en papier façon Paper Mario**.
- Le personnage tient une **douchette de scanner** : il vise un produit dans le rayon et en extrait l'**essence**, qui devient une **carte**.
- On combat avec ces cartes en **tour par tour sans chrono**, le personnage et l'ennemi face à face dans le décor, les cartes en bas de l'écran.
- Les cartes **pourrissent** avec le temps et **changent de rôle** : fraîches, elles soignent ou protègent ; mûres, elles ont leur meilleur effet ; pourries, elles deviennent des armes ou des poisons à lancer.
- On **découvre** des combos et des évolutions **inconnus à l'avance**, par hasard ou par logique d'après la nature des cartes.
- Des **moments épiques à la Final Fantasy VII, VIII et X** : une jauge, puis une attaque ultime mise en scène comme une invocation, mais avec des objets du supermarché.
- Un **narrateur odieux** brise le 4ᵉ mur et commente tout.

## Ton

Étrange (Backrooms, magasin infini) et rigolo (humour noir, absurde).

- Aucune marque réelle.
- Pas d'esthétique « jeu généré par IA » : pas de néons génériques sur fond noir, pas de coffres, pas de capacités « bateau ».

## Direction visuelle

Inspirée de Paper Mario et de Baten Kaitos.

- **Personnages et produits plats**, comme des illustrations découpées dans du papier, posés dans un décor qui a de la profondeur. **Contour de papier découpé** (fin liseré clair autour de la silhouette) et option de **tranche visible** : une fine épaisseur de papier qui apparaît quand la feuille pivote.
- **Décors en diorama** : plusieurs calques dessinés (fond, plans intermédiaires, plan de jeu, premier plan), avec un léger effet de parallaxe quand la caméra glisse. La profondeur vient des calques, de l'échelle et des décalages, pas d'une vraie 3D.
- **Pivot de la feuille** : pour changer de sens, le dessin s'amincit jusqu'à presque disparaître, l'image est remplacée par l'autre orientation, puis la feuille se rouvre. On utilise `scaleX`, jamais un `rotateY` à 180°, qui montrerait le dessin à l'envers.
- **Animations expressives de papier** : rebond, écrasement et étirement. Plus tard : s'aplatir en tombant, se plier en sautant, se mettre de profil pour passer dans un passage étroit.
- **Ombre séparée du dessin**, jamais incluse dans l'image : une ellipse douce au sol, plus petite et plus diffuse quand le personnage s'élève.
- **Texture dessinée à la main** : trait de crayon visible, grain du papier, contours légèrement irréguliers, ombrages simples.
- **Couleurs** : franches et joyeuses dans la zone 1 (« L'Illusion »). Elles se salissent, se désaturent et verdissent dans la zone 2 (« La Réalité »). Pas d'ambiance de conte de fées générique.

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
