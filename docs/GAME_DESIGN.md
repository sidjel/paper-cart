# Game design (hors combat)

> Lire seulement pour A5 (caddie) et les systèmes hors combat. Balises : ✅ VALIDÉ · 🧪 À TESTER · ❓ À DÉFINIR · [TEMP] provisoire.
> Combat, vieillissement, combos : `REGLES_CARTES_COMBAT.md`. Plan des étapes : `PROTOTYPES.md`.

## Exploration ✅ VALIDÉ
- Marche 2.5D (A1, A2), scan en rayon et Panier (A3), Narrateur (A4).

## Accueil, panier et deck ✅ VALIDÉ (séance 36)
- **L'accueil** propose en libre-service des **Scanettes** et des **paniers à main**, côte à côte. Le héros prend une Scanette (obligatoire pour scanner) et un panier. Ni pièce ni jeton : pas de caddie au début.
- Scanner un produit le transforme en carte, qui va dans le panier. Les cartes portées forment le **deck** du joueur, ses « **courses** » (nom provisoire ; ❓ nom définitif à choisir, puis la collection ne s'appellera plus « le Panier » dans le jeu).
- **Le contenant fixe le nombre de cartes portées** : peu dans le panier, plus dans le caddie. On ne peut pas tout garder : il faut choisir.
- Avec une **pièce ou un jeton de caddie**, on retourne à l'accueil échanger son panier contre un **caddie**, plus grand, qui le remplace. Le jeton est un **objet d'histoire unique**, pas une monnaie (le troc reste en Papier Toilette).
- **Panier plein** ✅ VALIDÉ (séance 37, choix B) : un petit écran propose de **reposer une carte** pour faire de la place, ou d'annuler.
- **Le menu du contenant a deux onglets** ✅ VALIDÉ (séances 37-39) : « **Cartes** » et « **Objets** » (chaque objet avec son image et une courte description).
- 🧪 À TESTER (séance 38) : un **objet** est unique et sert à l'histoire, on n'en extrait pas l'essence (la Scanette et son niveau, le jeton de caddie, plus tard la Glacière, des clés…) ; il ne pourrit pas, n'occupe pas de place dans le contenant, ne peut pas être jeté ; pas de monnaie ni de coffres ; le menu porte le nom du contenant (« Panier », puis « Caddie ») ; on change d'onglet au doigt, au clavier et à la manette.
- ❓ À DÉFINIR : certains objets pourront-ils servir en combat ?
- **Carte reposée** ✅ VALIDÉ (séances 38-39) : une fenêtre demande d'abord « Échanger une carte ? Oui / Non » ; le produit de la carte reposée apparaît **à la place du produit qu'on vient de scanner** (échange) et peut être rescanné.
- ❓ À DÉFINIR : capacités du panier et du caddie (réglables dans ⚙ ; [TEMP] panier = 6) ; qui donne le jeton (voir `HISTOIRE.md`).

## Étape A5 en deux temps ✅ VALIDÉ
- **A5a** : l'accueil au début du rayon (présentoir de Scanettes et de paniers) ; le héros prend les deux ; le panier se porte à la main, capacité limitée.
- **A5b** : un jeton posé dans le rayon pour l'essai ; retour à l'accueil pour échanger le panier contre le caddie.

## Le Caddie jouable (A5b) ✅ VALIDÉ
- **Panier physique** qui suit le personnage.
- Ne le bloque pas ; pas de physique complexe.
- Peut être **garé** et **repris**.
- Change de visuel selon son remplissage.
- Accueillera plus tard la Glacière.
- 🧪 À TESTER plus tard : interactions avec le décor (présentoirs, étagères hautes).

## Systèmes repris de l'ancien jeu 🧪 À TESTER (prototype C et suite)
- **Glacière** : 3 places qui figent l'âge des cartes.
- **Cuisine / fusions** : Mixeur, Pile, Scotch joker.
- **Soldeur** : troc.

## Décisions déjà prises (voir `SUIVI.md`)
- ✅ Profil de marche « Paper Mario » par défaut ; joystick virtuel désactivé par défaut.
- ✅ Saut libre avec un bouton, partout, après le prototype A.
- ✅ Double toucher sur un produit : le personnage va le scanner.
- 🧪 Essai : produits posés ailleurs (table, caddie), scannés de profil ou de face.

## Confiance entre le héros et son Épaisseur 🧪 À TESTER (séance 39 ; à affiner)
- ✅ Principe : le joueur répond parfois au héros (deux choix) ; la confiance évolue (voir `PERSONNAGES.md`).
- [TEMP] Une valeur qui part de **0** ; chaque réponse ajoute **+1** (présent, complice), **0** (neutre) ou **−1** (silence, esquive).
- Essai en cours : le héros a des répliques qui n'existent qu'avec une confiance **haute** (≥ 1 : complice) ou **basse** (≤ −1 : blessé) ; 2 apartés posent une question.
- Non affichée au joueur pour l'instant (visible pour les essais : fonction de test `narrator()`).
- ❓ À DÉFINIR : échelle et plafonds, poids de chaque réponse, faut-il l'afficher (et comment), conséquences (ton du héros, Révélation, fin, aide en combat ?), sauvegarde.

