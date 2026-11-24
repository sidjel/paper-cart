# Direction artistique

> Lire seulement pour le prototype D (dessins et style). Balises : ✅ VALIDÉ · 🧪 À TESTER · ❓ À DÉFINIR · [TEMP] provisoire.
> Règles techniques des images : `IMAGES.md` (à rédiger avant D). Méthode de dessin de l'auteur : `PROTOTYPES.md`.

## Style crayon de couleur et origami 🧪 À TESTER
- Deux pistes visuelles en test : **crayon de couleur** à la main (trait visible, grain du papier) et **papier découpé / origami** (décors Krita HD, nuages, oiseaux, héros 8 directions `test8dir`).
- **Cycles d'animation du héros (origami)** ✅ : **16 images uniques (0 doublon)** par cycle de marche ; toute boucle générée est vérifiée contre les doublons avant intégration.

## Transitions entre lieux ✅ principe · 🧪 visuel [TEMP]
- **Principe validé** ✅ : transition en **volet / feuille de papier directionnelle** dans le sens de la marche (repli en fondu doux si *Réduire les animations* est activé).
- **Visuel à affiner** 🧪 [TEMP] : la feuille CSS crème actuelle est provisoire (à remplacer par une vraie texture papier HD / liseré blanc découpé et/ou effet de feuille qui se retourne / se plie en origami). Dans la zone 2 (*La Réalité*), la feuille pourra se salir et s'assombrir.

## Direction visuelle ✅ VALIDÉ (texte de `VISION.md`, recopié mot pour mot, séance 51)
Inspirée de Paper Mario et de Baten Kaitos.
- **Personnages et produits plats**, comme des illustrations découpées dans du papier, posés dans un décor qui a de la profondeur. **Contour de papier découpé** (fin liseré clair autour de la silhouette) et option de **tranche visible** : une fine épaisseur de papier qui apparaît quand la feuille pivote.
- **Décors en diorama** : plusieurs calques dessinés (fond, plans intermédiaires, plan de jeu, premier plan), avec un léger effet de parallaxe quand la caméra glisse. La profondeur vient des calques, de l'échelle et des décalages, pas d'une vraie 3D.
- **Pivot de la feuille** : pour changer de sens, le dessin s'amincit jusqu'à presque disparaître, l'image est remplacée par l'autre orientation, puis la feuille se rouvre. On utilise `scaleX`, jamais un `rotateY` à 180°, qui montrerait le dessin à l'envers.
- **Animations expressives de papier** : rebond, écrasement et étirement. Plus tard : s'aplatir en tombant, se plier en sautant, se mettre de profil pour passer dans un passage étroit.
- **Ombre séparée du dessin**, jamais incluse dans l'image : une ellipse douce au sol, plus petite et plus diffuse quand le personnage s'élève.
- **Texture dessinée à la main** : trait de crayon visible, grain du papier, contours légèrement irréguliers, ombrages simples.
- **Couleurs** : franches et joyeuses dans la zone 1 (« L'Illusion »). Elles se salissent, se désaturent et verdissent dans la zone 2 (« La Réalité »), où les **néons du magasin** (qui bourdonnent, clignotent) sont permis, avec l'option « Réduire les clignotements » *(précision de l'auteur, séance 32 ; l'interdit ci-dessus vise les néons génériques sur fond noir)*. Pas d'ambiance de conte de fées générique.

## Lisibilité des cartes ✅ VALIDÉ
- Les 3 stades (Frais, Mûr, Pourri) se distinguent par une **icône de forme différente** en plus de la couleur (déjà en place : cercle, triangle, carré).

## Lumière ✅ VALIDÉ (séance 64)
- **Pas d'éclairage calculé** : la lumière est **dessinée dans les images** ou posée en calques de lumière et d'obscurité préparés (halo de néon, pénombre). Règles techniques : `src/scene/CLAUDE.md`.
- Chaque lieu a une **direction de lumière**, notée ici et dans ses données, que suivent les dessins et les ombres. ❓ À DÉFINIR : hall d'accueil, rayon d'essai.
- Néons qui clignotent : **3 éclairs par seconde au plus**, figés par l'option « Réduire les clignotements » (personnes sensibles).

## Questions ouvertes ❓ À DÉFINIR
- Résultat de l'essai crayon de couleur (lieu d'essai du prototype D).
