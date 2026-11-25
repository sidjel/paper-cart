# Direction artistique

> Lire seulement pour le prototype D (dessins et style). Balises : ✅ VALIDÉ · 🧪 À TESTER · ❓ À DÉFINIR · [TEMP] provisoire.
> Règles techniques des images : `IMAGES.md` (à rédiger avant D). Méthode de dessin de l'auteur : `PROTOTYPES.md`.

## Style crayon de couleur et origami 🧪 À TESTER
- Deux pistes visuelles en test : **crayon de couleur** à la main (trait visible, grain du papier) et **papier découpé / origami** (décors Krita HD, nuages, oiseaux, héros 8 directions `test8dir`).
- **Cycles d'animation du héros (origami)** ✅ : **16 images uniques (0 doublon)** par cycle de marche ; toute boucle générée est vérifiée contre les doublons avant intégration.

## Pipeline sprites personnages origami ✅ VALIDÉ (8 directions 16 images + poses fixes)
Méthode éprouvée et réutilisable pour tout futur personnage / PNJ origami :
1. **Marches 8 directions (5 vues générées `S`, `SE`, `E`, `NE`, `N` + 3 miroirs `SW`, `W`, `NW`)** :
   - **Source vidéo** : format vertical `9:16` (`720×1280`, 24 ips, 6 s), fond blanc uni `#FFFFFF`, marche sur place (tapis invisible), caméra 100 % fixe (zéro zoom/pan), en joignant 1–2 frames de référence + la vue HD de l'angle ciblé.
   - **Extraction & boucle** : extraction FFmpeg native via `tools/video_to_sprites.ps1`, puis recherche automatique du meilleur cycle complet (32 à 34 frames natives, `LoopMad` minimal, `HalfMad` élevé) échantillonné en **16 images uniques** (`0 doublon`).
   - **Détourage (règle stricte)** : *flood-fill* depuis les 4 bords sur fond blanc / ombre grise claire + nettoyage d'1 px de frange **ET détection/vidage obligatoire de tous les trous internes fermés** (espaces entre bras et buste mains dans les poches, entre les jambes et chevilles) avec protection des yeux (`y < 200`) et des semelles crème ; **un liseré papier blanc continu doit entourer toute la silhouette, y compris ces contours internes** (`5.5 px` en bord externe, `4.0 px` en 2× Retina sur les trous internes vidés — soit `2.0 px` logiques — afin de garder les fenêtres transparentes bien ouvertes tout en assurant un découpage papier uniforme) ; contrôle visuel systématique sur fond sombre et fond clair avant validation.
   - **Recalibrage HSL par bande (clé anti-dérive MP4)** : mesure automatique des bandes couleur de la référence (`heros-s-walk-1.webp` : orange `H ≈ 20.4°`, bleu `H ≈ 206.9°`, peau `H ≈ 30.5°`) et recalage par bande pour supprimer le voile gris/blanchâtre des vidéos MP4 (écart `< 0.5°`).
   - **Format & netteté** : export 2× Retina (`480×680`, hauteur corps `625 px`, ligne de pieds `y = 660`), **masque de netteté 3×3 (`0.75`)** appliqué sur l'intérieur opaque *après* redimensionnement (restaure la netteté des plis origami), puis **liseré papier blanc (`5.5 px`)** et export WebP qualité `0.96`.
   - **Synchronisation** : `stride: 18.5` (identique aux 4 images `stride: 74`), son de pas + poussière placés sur les **2 poses exactes de contact au sol** (espacées de 8 frames).
2. **Poses fixes debout (`idle` + `idle-blink`)** :
   - Générées **séparément** des vidéos de marche (jamais extraites d'une marche, sinon le buste penche et un talon reste décollé) : personnage 100 % droit, **deux semelles bien à plat au sol**, mêmes mains dans les poches, même recalibrage HSL + format `480×680` + liseré blanc `5.5 px`.
   - **Clignement des yeux (`S`, `SE`, `E`)** : peint uniquement sur les paupières de l'image `idle` finale (zéro décalage du reste du corps).

## Transitions entre lieux 🧪 en validation sur téléphone
- **Styles en essai (`⚙ → Caméra`)** : fondu enchaîné avec légère brume (`mist`, par défaut en test, héros maintenu visible pendant le chargement), fondu enchaîné pur (`dissolve`), et 4 effets papier origami HD (`flip`, `double`, `strips`, `wipe` avec `public/art/ui/transition-origami.webp`, bordures nettes sans ombres floues ; repli fondu doux si *Réduire les animations* est activé). Les 5 styles non retenus seront retirés après validation sur téléphone.

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
