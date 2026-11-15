# Plan des prototypes

> Texte de l'auteur, recopié **mot pour mot** de `PROMPT_CLAUDE_CODE.md` (sections 6 et 5) le 14/11/2026, pour qu'il ne se perde pas.
> Seuls ajouts : l'état de chaque étape et les décisions prises depuis (encadré ci-dessous). Ce fichier ne change qu'à la demande de l'auteur.
> **Économie de lecture** : lire seulement la partie de l'étape en cours.

## État et décisions depuis le plan initial

| Étape | État |
|---|---|
| A1 | ✅ validée : `1445d25` |
| A2 | ✅ validée : `6be7130` |
| A3 | ✅ validée : `630fec0` (avec double toucher ; essai de scan sur une table et dans le caddie en cours) |
| A4 | construite (séances 32-35) ; **pas encore validée** (séance 36) : l'aparté doit devenir un moment rare et marquant (héros face caméra avec un dessin d'émotion, zoom de la caméra, effet visuel et sonore) |
| **A5 — Scanette et panier à main** | Étape ajoutée par l'auteur (séances 29 et 36, ancien « A5a ») : accueil provisoire au début du rayon, Scanette et panier pris en libre-service, capacité limitée, échange quand le panier est plein. Construite (séances 36 à 49), à valider. |
| **A6 — L'accueil** | Ordre fixé par l'auteur (séance 50). **Un lieu séparé du rayon** : grand hall d'entrée, portes automatiques, portiques de sécurité, agent de sécurité (forme provisoire). Le présentoir de Scanettes et de paniers y est déplacé. Quand le héros s'approche d'un portique pour sortir : l'agent vient se placer devant **ce portique-là** et bloque le passage ; le narrateur interdit la sortie (« Les sorties sont réservées aux clients ayant réglé leurs achats. » [TEMP]) ; le héros se dit « Hum… étrange… » (une **pensée** dans une bulle, pas un aparté : pas d'effet dramatique, ne compte pas dans la rareté des apartés). Le héros va librement de l'accueil au rayon et revient. Règles techniques des lieux : `docs/ARCHITECTURE.md` §11. |
| **A7 — Le deuxième rayon** | Ordre fixé par l'auteur (séance 50). Accessible par **deux entrées** du premier rayon ; chaque entrée fait arriver **du bon côté** du rayon 2. |
| **A8 — Le caddie** | Ordre fixé par l'auteur (séance 50), ancien « A5b » : l'échange du panier contre le caddie se fait **au comptoir de l'accueil**. Détails : `docs/GAME_DESIGN.md`. |
| B, C, D | à faire |

Décision de l'auteur (séance 6) : **saut libre** avec un bouton, après le prototype A (voir docs/SUIVI.md).

---

## Les prototypes (section 6 du texte initial)

Un prototype peut prendre plusieurs séances : on avance **étape par étape**. Si je ne précise rien, commence par **A**.

**A — Le rayon** · *Question : est-ce agréable de marcher dans un rayon et de transformer un produit en carte ?*
- **Un décor de rayon façon Baten Kaitos**, plus large que l'écran (la caméra glisse doucement pour suivre le personnage). Plusieurs calques : fond (rayons qui se perdent au loin, sensation de magasin infini), plan du personnage, premier plan (une étagère ou un pilier qui passe devant lui).
- Un **masque de zone de marche** invisible (où l'on peut aller, où l'on bute), défini dans les données, et un mode debug qui l'affiche.
- **Le personnage en papier façon Paper Mario**, provisoire, en **dessins entiers** (pas de découpage en morceaux) :
  - 2 vues, trois quarts face et trois quarts dos, retournées en miroir pour la gauche et la droite (4 directions) ;
  - **l'effet de feuille qui pivote** quand il change de sens ;
  - pour commencer, **un seul dessin par vue**, rendu vivant par le code : petit rebond en marchant, légère respiration à l'arrêt, écrasement et étirement au sursaut ;
  - le système doit déjà accepter des **animations image par image** (plusieurs dessins par animation : marche, scan, surprise…) que j'ajouterai ensuite, sans changer le code ;
  - **plus petit quand il s'éloigne** vers le fond, et ordre d'affichage correct devant ou derrière les éléments du décor ;
  - une ombre au sol séparée du dessin, et le contour de papier découpé.
- Contrôles :
  - PC : ZQSD et flèches, ou clic à l'endroit où aller ; Entrée ou Espace pour agir ;
  - manette : stick gauche pour marcher, A pour agir ;
  - téléphone en paysage : toucher l'endroit où aller (et option joystick virtuel), bouton d'action.
- Une dizaine de **produits** sur les étagères (points d'intérêt) : banane, lait, steak, baguette, glace, pile, céréales, bière, plante… Quand le personnage s'approche, le produit le plus proche est mis en évidence.
- **Scanner** : action près d'un produit. Le personnage lève sa Scanette *(ex-« douchette », vocabulaire mis à jour en séance 36)*, laser, *bip* (son provisoire synthétique), le produit se dissout en particules aspirées par la douchette, puis une **carte** apparaît avec une petite animation satisfaisante et rejoint le Panier.
- Une carte affiche au moins : nom, puissance, stade (Frais, Mûr, Pourri) et ses propriétés (liquide, froid…). Les 3 stades se distinguent par **une icône de forme différente en plus de la couleur**.
- Un écran **Panier** simple pour voir ses cartes.
- Le **narrateur** : une bande de texte façon annonce au haut-parleur, effet machine à écrire, une dizaine de répliques `[TEMP]` (arrivée dans le rayon, premier scan, inactivité, produit déjà scanné…).
- Critère de réussite : marcher dans le rayon est agréable sur PC et sur téléphone, le personnage a déjà du charme, et scanner un produit me donne envie d'en scanner un autre.

**Ordre de construction du prototype A** (chaque étape est jouable et commitée) :

| Étape | Ce que le joueur doit ressentir | Résultat | Arrêt pour validation ? |
|---|---|---|---|
| A1 | Le personnage est agréable à déplacer | Décor provisoire simple, personnage en papier, déplacement au clavier, à la souris, à la manette et au doigt, zone de marche, machine à états de base (jeu / pause), boucle à pas fixe, panneau de réglages de base (vitesse, accélération), **diagnostic intégré simple** (images/s, pire image, rapport copiable) | **Oui : fin de la première séance.** Je teste la sensation de marche. |
| A2 | Le personnage semble vraiment évoluer dans un décor profond | Profondeur (échelle, ordre d'affichage, premier plan), caméra qui glisse, parallaxe, ombre, pivot de la feuille, rebond et respiration, **banc d'essai** (parcours automatique du rayon) et premier **test des comptages** | Oui |
| A3 | Scanner un produit est satisfaisant et donne envie de recommencer | Produits sur les étagères, mise en évidence du plus proche, scanner, particules, création d'une carte, Panier | Oui |
| A4 | Le rayon a une personnalité | Narrateur, finitions, réglages complets, vérifications de performance | Fin du prototype A |

A1 privilégie **la sensation de déplacement** : décor volontairement simple, zone de marche peu complexe, déplacement en ligne droite vers l'endroit touché ou cliqué (le personnage s'arrête contre un obstacle). **Pas de recherche de chemin** à ce stade. Si une fonctionnalité secondaire retarde la validation de la marche, propose-moi de la reporter.

Après chaque étape validée, la séance suivante reprend à l'étape d'après, en tenant compte de mes retours.

**B — Le combat** · *Question : est-ce fun de faire pourrir ses cartes et de les lancer ?*
- À la Baten Kaitos : le personnage et un ennemi en papier face à face dans le décor. L'ennemi **annonce son prochain coup**.
- Points de vie des deux côtés. Panier de 12 cartes, main de 5, jusqu'à 3 cartes jouées par tour, tour par tour sans chrono.
- Chaque carte jouée fait vieillir les autres ; le **stade change le rôle** de la carte (fraîche : soin ou protection ; mûre : meilleur effet ; pourrie : arme ou poison lancé sur l'ennemi). Une carte en main qui change de stade se retourne sous nos yeux.
- 2 ou 3 combos à découvrir en jouant certaines cartes ensemble dans un même tour, avec un moment de découverte marquant (le nom se révèle, le narrateur réagit).
- ~10 répliques `[TEMP]` du narrateur sur le combat. Toutes les valeurs dans le panneau de réglages.
- **Avant de coder B**, propose-moi en une page les règles exactes du combat et 12 cartes de départ, et attends ma validation. Pistes à me soumettre, pas à imposer : seules les actions du joueur font vieillir les cartes (pas le tour de l'ennemi ni les menus) ; une règle « Surgelé » (longtemps Frais, Mûr très brièvement, puis Pourri). Si `docs/archive/` contient l'ancien `GAME_DESIGN.md`, puises-y aussi des idées.
- Une fois les règles validées, un petit **script de simulation** qui joue des centaines de combats aide à régler PV, dégâts et vitesse de pourrissement. Il complète le réglage en jouant, il ne le remplace pas.

**C — La découverte** · combos par propriétés et recettes secrètes, carnet, évolutions cachées, jauge épique et première attaque ultime mise en scène.

**D — Le dessin** · intégration de mes premiers dessins (le personnage de trois quarts face et de trois quarts dos, un décor de rayon en calques, un produit en 3 stades) pour valider la chaîne dessin → scan → IA → jeu. Prépare-moi la liste exacte des dessins et `docs/IMAGES.md` une séance à l'avance. C'est ce lieu d'essai qui valide le style avant toute production d'autres lieux.

---

## Méthode pour les images (extrait de la section 5 du texte initial, à détailler dans `docs/IMAGES.md` avant le prototype D)

- Je veux du **plaisir à itérer** : des séances courtes, un résultat jouable à chaque fois, des choses à essayer et à ressentir.
- Le **panneau de réglages** est essentiel : je dois pouvoir ajuster vitesse de marche, échelle du personnage, PV, dégâts, vitesse de pourrissement, etc. **en jouant**, sans te redemander.
- Quand tu as besoin de moi (choix de jeu, dessins, sons, textes), **dis-le clairement et à l'avance**, avec le format attendu (taille, fond, nombre de dessins, poses, nommage des fichiers).
- Mes dessins : au crayon sur papier blanc, scannés ou photographiés, puis améliorés par IA. **Avant de me demander le moindre dessin**, rédige `docs/IMAGES.md`, le cahier des charges des images, et fais-le-moi valider. Il doit dire, pour chaque type d'image (personnage, produit, calque de décor, ennemi, petits éléments) : fond attendu (transparent après détourage), cadrage, **une taille fixe par type**, largeur maximale (par exemple 2048 px), zone vide rognée, format final WebP, nommage des fichiers, et ce que je dois éviter (ombres dessinées sous le personnage, poussières, texte). Les petits éléments sont regroupés sur une seule planche. Quand les dessins arrivent, c'est toi qui les passes dans l'outil de conversion et qui les intègres.
- **Méthode pour les images** (à détailler dans `docs/IMAGES.md`) :
  1. **Une fiche de référence d'abord** : avant tout autre dessin, je dessine le personnage de face, de dos et à côté d'un produit et d'un caddie, pour fixer ses proportions par rapport au décor. Tu l'intègres dans le jeu provisoire pour vérifier l'échelle.
  2. **Dessin** : crayon sur papier blanc, un sujet par feuille, trait net, pas d'ombre au sol, cadrage dans un repère simple que tu me fourniras (gabarit imprimable avec un cadre et une ligne de sol).
  3. **Numérisation** : scanner à plat (300 ppp) ou application de scan du téléphone (lumière du jour, sans ombre portée, feuille bien à plat).
  4. **Amélioration par IA** : toujours **la même consigne écrite**, que tu me rédiges et que je réutilise mot pour mot, pour garder une cohérence de style d'une image à l'autre. L'IA améliore le rendu sans changer la silhouette, les proportions ni le cadrage.
  5. **Dépôt** : je dépose les fichiers (originaux et versions améliorées) dans `art/source/` du dépôt, par le site GitHub (possible depuis mon téléphone), avec les noms prévus par `docs/IMAGES.md`. Les originaux ne sont jamais modifiés.
  6. **Conversion et intégration** : tu passes les fichiers dans l'outil de conversion, tu les intègres, et tu me montres le résultat dans le jeu avec une capture.
  7. **Validation dans le jeu**, jamais seulement sur l'image : je valide un seul personnage, ou un seul calque, avant d'en produire d'autres. Si le format pose problème, on corrige la méthode avant de continuer.
  Si un dessin ne convient pas (traits trop fins pour le détourage, proportions, éclairage), dis-moi précisément quoi refaire et pourquoi.
- **Je teste sur mon vrai téléphone après chaque étape** : je joue avec le diagnostic ouvert (puis je lance le banc d'essai, dès l'étape A2) et je te colle le rapport.
