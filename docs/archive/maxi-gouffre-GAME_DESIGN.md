# MAXI-GOUFFRE — GAME_DESIGN.md

> Cahier des charges de conception — **Version 1.1 (document maître)**
> À lire en entier, avec `ARCHITECTURE.md`, avant chaque étape de développement.

| Fiche | Valeur |
|---|---|
| Titre | MAXI-GOUFFRE (titre de travail : vérifier la disponibilité auprès de l'INPI/EUIPO avant commercialisation) |
| Genre | Jeu de cartes tactique au tour par tour + exploration narrative |
| Durée | ~30 minutes (une partie complète, 3 actes) |
| Plateforme V1 | Navigateur PC (HTML5 / CSS3 / JavaScript ES6), hors ligne, sans serveur |
| Plateformes ultérieures | `.exe` (Electron ou Tauri), Android (Capacitor) — hors périmètre V1 |
| Langue | Français pour tout texte affiché ; code et identifiants en anglais |
| Contrôles | Clavier, souris, manette : le jeu est 100 % jouable avec chacun |
| Public | Adulte (humour noir, absurde, graveleux) — classification d'âge à définir |
| Légende | ✅ validé par l'auteur · 🔶 valeur par défaut proposée, à confirmer (liste en §23) |

---

## 0. Mode d'emploi pour l'agent de développement

1. Ce document est la **source de vérité** du jeu. `ARCHITECTURE.md` est la source de vérité technique.
2. Si une règle manque ou est ambiguë : **ne rien inventer**. Poser la question à l'auteur et attendre sa réponse.
3. **Aucune valeur numérique en dur** dans le code : tout vit dans `src/config.js` (§18).
4. **Aucun contenu en dur** dans le code : cartes, recettes, salles, combats, répliques vivent dans des fichiers JSON (§18).
5. Les textes narratifs (répliques, blagues, descriptions) sont **écrits par l'auteur**. L'agent met des textes provisoires préfixés `[TEMP]` et ne rédige jamais le contenu final.
6. Les noms de personnages marqués « provisoire » peuvent changer : ne jamais les coder en dur.
7. L'ordre de développement est imposé en §22. Une étape à la fois.

---

## 1. Vision

**Pitch.** Vous êtes coincé dans un hypermarché infini, d'abord joyeux et trop propre, puis de plus en plus faux et dangereux. Un narrateur odieux, qui sait qu'il parle à un joueur, vous insulte, vous commente, et vous oblige à jouer à un jeu de cartes de denrées qui pourrissent pour trouver la sortie.

**Piliers**

1. **Stratégie lisible** : règles courtes, scores toujours visibles, aucune surprise cachée.
2. **Le temps qui pourrit** : chaque action fait vieillir vos cartes. Gérer la fraîcheur est le dilemme central.
3. **Étrangeté et 4ᵉ mur** : univers Backrooms, narrateur qui s'adresse au joueur, suspense et curiosité.
4. **Humour noir, absurde, potache, graveleux** : anticonformiste, assumé.
5. **Court mais fini** : menu, options, 3 actes, boss, fin, crédits. Fluide, cohérent, sans bug.

**Anti-« jeu générique d'IA »** : textes écrits par l'auteur, style visuel unique (§17), pas de coffres, pas de néons sur fond noir, aucune capacité « bateau ».

**Références** : *Baten Kaitos* (cartes périssables, 4ᵉ mur), *Gwent* (manches, passer, plateau), *The Backrooms* (étrangeté, pièces aléatoires), *Hades* (ambiance poisseuse et dangereuse de la zone 2, inspiration d'ambiance uniquement).

**Hors périmètre V1** : multijoueur, version mobile/desktop packagée, voix enregistrées, plus de 2 niveaux de difficulté, éditeur de deck libre, succès/trophées, boutique en argent réel. Voir §23.

---

## 2. Glossaire (vocabulaire obligatoire)

| Terme | Définition |
|---|---|
| **Carte** | Exemplaire d'une denrée/objet/personnage. A un identifiant unique (`uid`), un âge, et appartient à une famille. |
| **Famille** | Identité d'une carte à travers ses 3 stades (ex. `banane`). Sert aux recettes. |
| **Stade** | État de la carte : 1 Frais, 2 Mûr, 3 Pourri. Détermine nom, puissance (P), effet et image. |
| **Cran** | Unité de temps du jeu. Chaque carte a un âge en crans. |
| **Âge** | Nombre de crans accumulés par une carte (0 à 44 par défaut). |
| **Puissance (P)** | Points qu'une carte apporte au score de son camp. Peut être négative. |
| **Collection** | Ensemble des cartes possédées par le joueur. |
| **Main** | Les 10 cartes choisies dans la Collection pour un combat. |
| **Camp** | Moitié du plateau d'un joueur (5 colonnes × 2 lignes). |
| **Ligne Avant / Arrière** | Les 2 lignes d'un camp. L'Avant touche le centre du plateau. |
| **Case** | Emplacement d'une carte : colonne (1 à 5, de gauche à droite) × ligne. |
| **Voisin** | Case adjacente en haut, bas, gauche, droite. **Pas de diagonale.** Reste dans le même camp. |
| **En face** | Même colonne, même rang de ligne dans le camp adverse (Avant↔Avant, Arrière↔Arrière). |
| **Pose** | Action de placer une carte sur le plateau. |
| **Passer** | Renoncer à jouer pour le reste de la manche (définitif). |
| **Manche** | Une phase de jeu jusqu'à ce que les deux joueurs aient passé. |
| **Match** | Un combat complet : au plus 3 manches. |
| **Défausse** | Cartes retirées du plateau pendant un match, inutilisables jusqu'à la fin du match. Leur âge continue de courir. |
| **Stade verrouillé** | Tant qu'une carte est sur le plateau, c'est le stade qu'elle avait au moment de la pose qui compte pour son nom, sa P, ses effets et son image. Son âge, lui, continue de courir. |
| **Effet à la pose** | Effet qui se résout une fois, au moment de la pose. |
| **Effet continu** | Effet actif tant que la carte est sur le plateau. |
| **Malus (étiquette)** | Carte qui se pose dans le camp **adverse**. |
| **Outil** | Carte non posable aux stades 1 et 2 (Mixeur, Scotch). |
| **Fusion** | Combinaison de 2 cartes en 1 plat, uniquement en salle Cuisine. |
| **Acte / Zone / Salle** | Acte = chapitre du jeu. Zone = décor (1 Illusion, 2 Réalité). Salle = écran d'exploration. |
| **Narrateur** | Voix du magasin qui commente tout (§4, §13). |
| **PNJ** | Personnage non joueur rencontré en exploration. |
| **Horloge du magasin** | Compteur cumulé de tous les crans écoulés (décor et déclencheurs narratifs). |

---

## 3. Flux global et machine à états

```
BOOT → WARNING → PRESS_KEY → TITLE
TITLE → (Nouvelle partie) INTRO → FORM → ACTE_I
TITLE → (Continuer) reprise à la dernière salle sauvegardée
ACTE_I (Zone 1) → REVELATION → ACTE_II (Zone 2) → ACTE_III (Boss) → ENDING → CREDITS → TITLE
```

États de premier niveau : `BOOT`, `WARNING`, `PRESS_KEY`, `TITLE`, `INTRO`, `FORM`, `PLAYING`, `REVELATION`, `ENDING`, `CREDITS`, `OPTIONS` (empilable), `PAUSED` (empilable).

Sous-états de `PLAYING` : `EXPLORATION`, `DIALOGUE`, `PREP_HAND`, `COMBAT`, `KITCHEN`, `FRIDGE_ROOM`, `MERCHANT`, `EVENT`, `COLLECTION`.

Sous-états de `COMBAT` : `CHIFOUMI`, `ROUND_PLAY` (avec `PLAYER_TURN` / `OPPONENT_TURN`), `ROUND_END`, `MATCH_END`, `LOOT`.

Règles : un seul état actif à la fois (hors `OPTIONS` et `PAUSED` qui se superposent) ; chaque transition est journalisée dans le panneau de debug (F3).

---

## 4. Univers, ambiance, personnages

### 4.1 Le lieu : le Maxi-Gouffre
Un hypermarché sans fin.

- **Zone 1 — « L'Illusion »** : supermarché classique, joyeux, bizarrement idyllique. Couleurs saturées, musique d'ascenseur joyeuse. Quelque chose cloche, sans qu'on sache quoi.
- **Zone 2 — « La Réalité »** : réserves, parkings, bureaux délabrés (esprit Backrooms). Poisseux, piégeux, dangereux. Bourdonnement de néons, lumières blafardes, pièces tirées au sort.
- **La Révélation** : à la fin de l'Acte I, les lumières s'éteignent, le décor se dégrade, le narrateur change de ton.

**Horreur légère** : malaise, lumière, sons, narrateur mal à l'aise. **Pas de jump scare.**

### 4.2 Le Narrateur
- **Identité (proposition à réécrire par l'auteur)** : la voix du haut-parleur du magasin. Ça explique qu'il voie le joueur et lui parle en direct.
- **Ton** : insolent, blasé, odieux mais attachant. Il tutoie, insulte avec inventivité, commente les mauvais coups et l'inactivité, se vexe des options que le joueur change.
- **Humour** : noir, absurde, potache, graveleux, anticonformiste. 🔶 *Recommandation de prudence commerciale* : viser le joueur, le magasin, la consommation, la mort et l'absurde ; éviter les attaques contre des groupes réels (certaines boutiques refusent ces contenus).
- **Présentation** : texte à effet machine à écrire avec petits bruitages (« blips »). Pas de voix en V1.

### 4.3 Personnages (noms provisoires)

| Personnage | Rôle | Apparition | Notes |
|---|---|---|---|
| Le Narrateur | Voix off | Partout | §4.2 |
| Kévin, caissier | PNJ allié | Acte I, salle 1 | Donne la carte Kévin (Caissier) et un Mixeur Bon Marché |
| Le Vieux Monsieur | PNJ allié | Acte I, salle 4 | Gentil, bavard, donne sa meilleure carte (Grand-Mère Perdue) puis **meurt abruptement** en glissant sur une flaque d'huile : bruitage très réaliste, aucun artifice héroïque. Choc narratif voulu. |
| La Cliente pressée | Adversaire tutoriel | Acte I, salle 2 | Combat guidé d'une seule manche |
| Chad Prot' (l'Influenceur) | Adversaire | Acte I, salle 5 | Main à base d'Influenceurs |
| Le Livreur Perdu | Adversaire | Acte II | Main à base d'Objets/Outils |
| La Cheffe de Rayon Surgelés | Adversaire | Acte II | Main à base de Surgelés |
| Le Vigile Syndiqué | Adversaire | Acte II | Main à base d'Humains |
| Le Soldeur | Marchand | Acte II | Troc de cartes (§11.4) |
| Le Gérant | Boss | Acte III | Garde la Sortie (§9.10) |

---

## 5. Intro et création du profil

### 5.1 Écrans d'avant-jeu
1. **WARNING** : avertissement de contenu (langage vulgaire, mort, humour noir, lumières clignotantes) + information « vos données restent sur votre appareil » + choix « Réduire les clignotements » (oui/non). Se valide au clavier, souris ou manette.
2. **PRESS_KEY** : écran noir « Appuyez sur une touche ». Sert à débloquer le son et à détecter la manette.
3. **TITLE** : Nouvelle partie / Continuer (grisé si aucune sauvegarde) / Options / Crédits.

### 5.2 Scène d'intro (écran noir, style terminal)
- Texte vert monospace. Le narrateur insulte le joueur. 🔶 *Texte provisoire, à réécrire* : « Tu es bien assis sur ton siège gaming d'ado prépubère ? Tu crois jouer à quel jeu, là ? Éteins-moi ce PC et va jouer à ton jeu de cubes préféré. » (aucune marque réelle).
- **Bouton « Je veux jouer » qui fuit** :
  - *Souris* : le bouton s'écarte quand le curseur s'approche à moins de 80 px, **3 fois**, puis se laisse cliquer. Le narrateur soupire en texte à chaque fuite.
  - *Clavier / manette* (pas de curseur libre) : quand le focus arrive sur le bouton, il **saute à une autre position** de l'écran, 3 fois, puis se laisse valider.
  - Le comportement s'adapte automatiquement à la dernière entrée utilisée.

### 5.3 Formulaire « décharge de responsabilité »
Texte du narrateur : décharge absurde (« si tu meurs, je garde tes organes »). Champs :

| Champ | Type | Règle |
|---|---|---|
| Prénom | Texte | 1 à 20 caractères. Facultatif : s'il est vide, le narrateur dit « toi ». |
| Âge | Nombre | 1 à 120. Facultatif. |
| Sexe | Liste | Mâle / Femelle / Licorne |
| Métier | Liste | Chômeur / Influenceur raté / Développeur web dépressif / Modérateur Discord |

- Les données restent **en local** (clé `maxi-gouffre.profile`), jamais envoyées nulle part. Elles servent uniquement à personnaliser les piques du narrateur (variables `{prenom}`, `{age}`, `{sexe}`, `{metier}`).
- L'option « Effacer mes données » (§15) les supprime.

---

## 6. Vieillissement des cartes

### 6.1 Principe ✅
Chaque carte possède **son propre âge**, en crans. Son stade en découle. Il n'y a pas de barre de temps unique qui s'applique à toutes les cartes.

| Stade | Nom | Âge (STAGE_LENGTH = 15) |
|---|---|---|
| 1 | Frais | 0 à 14 |
| 2 | Mûr | 15 à 29 |
| 3 | Pourri | 30 à 44 (l'âge est plafonné à 44) |

- **Règle Surgelé** : la carte reste Frais **2× plus longtemps** (30 crans), puis reste Mûre **1 seul cran**, puis Pourrit. Irréversible : aucun effet ne la fait rajeunir (la Glacière la fige seulement). Durées par carte via `stageLengths` dans les données.
- **Plats fusionnés** : vieillissent comme une carte normale.

### 6.2 Ce qui fait avancer le temps ✅

| Événement | Crans |
|---|---|
| Une carte jouée par le joueur en combat | +1 |
| Première entrée dans une salle | +3 |
| Premier visionnage d'un dialogue de PNJ (relire = 0) | +1 |
| Défaite en combat | +5 (pénalité) |
| Menus, pause, inactivité, fusion, marchand, chifoumi, narrateur | 0 |

- Le cran d'une carte jouée s'applique **après la pose**, à toutes les cartes de la Collection sauf celles de la Glacière (y compris la carte qui vient d'être posée, dont le stade reste verrouillé).
- **Les cartes de l'IA ne vieillissent jamais** : leur stade est fixé par le combat (§18.5). Les poses de l'IA et la fin d'un tour n'ajoutent **aucun cran**. Seules les actions du joueur font avancer le temps : c'est ce qui rend chacune de ses poses coûteuse.

### 6.3 Qui vieillit ✅
- **Vieillissent** : **toutes** les cartes de la Collection, qu'elles soient en main, hors main, posées sur le plateau ou défaussées. **Seule exception : la Glacière** (§11.2). Il n'existe pas d'état « figé » pour l'âge : poser une carte ne la protège pas de la pourriture.
- **Stade verrouillé sur le plateau** : à la pose, le stade de la carte est verrouillé (`lockedStage`). Tant qu'elle est sur le plateau, son nom, sa P, ses effets et son image restent ceux de ce stade, même si son âge franchit un seuil. Le verrou disparaît quand elle quitte le plateau (défausse ou destruction) : le stade est alors recalculé d'après l'âge réel. L'écran d'inspection indique « stade verrouillé sur le plateau » et l'âge réel.
- **Cartes de l'adversaire** : jamais d'âge, stade fixe défini par le combat.
- **Changement de stade en plein match** : une carte en main change de face immédiatement (nom, P, effet, image), avec animation et déclencheur narrateur `CARD_ROTTEN` si elle passe au stade 3.

### 6.4 Rafraîchir une carte
Fusion (résultat à l'âge 0), Soldeur (troc), Glacière (fige). Voir §11.

### 6.5 Horloge du magasin
Compteur visible de tous les crans écoulés. Purement décoratif et narratif : il déclenche des répliques et des changements d'ambiance (néons) aux paliers 20, 40, 60, 80.

### 6.6 Calibrage 🔶
Budget estimé : Acte I ≈ 33 crans, Acte II ≈ 55 crans. Objectif : une carte reçue en début d'acte est **Mûre vers le milieu** et **Pourrie vers la fin**. À valider par simulation automatique (§19.8). Comme les cartes posées et défaussées continuent de vieillir, davantage de cartes changent de stade pendant un match : mesurer la part des cartes qui reviennent Pourries. L'option « Vitesse de pourrissement » modifie `STAGE_LENGTH` : Lent 20, Normal 15, Rapide 10.

---

## 7. Les cartes

### 7.1 Modèle d'une carte
Une carte (définition) = 3 stades. Chaque stade a : nom, puissance, effets, étiquettes, image, texte d'ambiance (`flavor`). Chaque exemplaire possédé par le joueur a : `uid`, `cardId`, `age`.

### 7.2 Étiquettes

| Étiquette | Signification |
|---|---|
| Aliment, Boisson, Humain, Animal, Végétal, Objet | Étiquettes de lecture, réservées aux effets et conditions |
| **Outil** | Non posable aux stades 1 et 2. Sert aux fusions. |
| **Surgelé** | Règle de durée du §6.1 |
| **Malus** | Se pose dans le camp adverse |
| **Monstre, Horreur** | Réservées, sans effet en V1 (portent seulement l'identité du stade) |
| **Fermentation** | Icône d'information : stade 3 volontairement puissant (stratégie de laisser pourrir) |

### 7.3 Les 20 cartes (P = puissance ; — = non posable)

| ID | Famille | Stade 1 (Frais) | Stade 2 (Mûr) | Stade 3 (Pourri) | Étiquettes / Notes |
|---|---|---|---|---|---|
| 01 | banane | Banane Verte **2** | Banane Parfaite **6** | Bouillie Brune **−1**, ZONE_MALUS | Aliment. S3 Malus. Recette : + Lait |
| 02 | steak | Steak Haché Eco+ **3** | Steak Douteux **5** | Bactérie Mortelle **0**, DESTROY_FACING | Aliment. Recette : + Baguette |
| 03 | lait | Lait Entier **2** | Lait Tourné **4** | Fromage Vivant **8** | Aliment. S3 Monstre + Fermentation. Recettes : + Banane, + Céréales |
| 04 | baguette | Pain Baguette **4** | Baguette Dure **7**, DESTROY_FACING (cible stade Frais seulement) | Poussière de Pain **1** | Aliment. Recettes : + Steak, + Scotch |
| 05 | glace | Glace Vanille **5** | Soupe Sucrée **2** | Flotte Collante **−2** | Aliment, Surgelé. S3 Malus |
| 06 | pizza | Pizza Ananas **4** | Pizza Tiède **3** | Scandale Culinaire **0**, CANCEL | Aliment. S3 Malus. **Ne fusionne avec rien** |
| 07 | pile | Pile LR6 Neuve **6** | Pile Faible **3** | Acide de Pile **−2** | Objet. S3 Malus. Alimente le Mixeur Surchauffé. Recette : Plante + Acide (stade 3) |
| 08 | cereales | Céréales Fluo **3** | Céréales Molles **2** | Sucre Toxique **5** | Aliment. Recette : + Lait |
| 09 | influenceur | Influenceur Fitness **5**, BOOST +1 aux voisins Frais | Influenceur Fatigué **3**, BOOST +1 aux voisins Frais | Influenceur Annulé **−5**, ZONE_MALUS | Humain. S3 Malus |
| 10 | enfant | Enfant Hurlant **2** | Enfant Épuisé **5** | Enfant Endormi **1** | Humain. Recette : + Console |
| 11 | console | Console Portable **4** | Console Rayée **2** | Console Brickée **0** | Objet. Recette : + Enfant |
| 12 | papier | Papier Toilette **1** | Dernier Rouleau **10**, PANIC | Carton Vide **0** | Objet. Monnaie de troc précieuse |
| 13 | biere | Bière Fraîche **3** | Bière Chaude **1** | Vomi de Soirée **−4** | Boisson. S3 Malus |
| 14 | kevin | Kévin (Caissier) **4** | Kévin (Démissionnaire) **2** | Kévin (Syndiqué) **8**, BOOST +1 à vos cartes de la ligne Arrière | Humain. S3 Fermentation |
| 15 | mixeur | Mixeur Bon Marché — | Mixeur Surchauffé — | Explosion Électrique **0**, DESTROY_ADJACENT | Outil. S3 Malus. Voir §11.1 |
| 16 | scotch | Scotch Gris — | Scotch Poussiéreux — | Colle Sèche **0** | Outil universel (joker, §11.1). S3 inerte |
| 17 | plante | Plante Verte **2** | Plante Florissante **6**, SCORE_BONUS +2 | Tige Morte **1** | Végétal. Recette : + Acide de Pile |
| 18 | chat | Chat Errant **4**, EAT | Gros Matou **7**, EAT | Boule de Poils **2**, EAT | Animal. EAT : détruit une Bactérie Mortelle en face |
| 19 | cassette | Cassette Maudite **5** | Bande Démagnétisée **3** | Entité Libérée **9** | Objet rare. S3 Horreur + Fermentation |
| 20 | grandmere | Grand-Mère Perdue **3** | Grand-Mère Paniquée **5** | Héritage **10**, TRANSFER | Humain, PNJ allié. S3 Fermentation |

Les effets sont définis au §8. Les valeurs de P sont des **valeurs de départ** à équilibrer par simulation (§19.8) ; elles vivent dans `cards.json`.

### 7.4 Plats fusionnés (6 cartes supplémentaires)
Un plat a 3 stades **automatiques** : P aux stades 1 et 2, puis **moitié de P (arrondie à l'inférieur)** au stade 3. Effet conservé aux stades 1 et 2, perdu au stade 3. Une seule illustration par plat, teinte selon le stade.

| Plat | P | Effet | Recette |
|---|---|---|---|
| Milkshake Protéiné | 10 | — | banane + lait |
| Burger Gras | 12 | — | steak + baguette |
| Petit-Dèj Épique | 9 | — | lait + céréales |
| Ado Muet | 8 | CANCEL_FACING | enfant + console |
| Plante Mutante | 9 | SCORE_BONUS +4 | plante + pile (stade 3) |
| Lance de Fortune | 9 | DESTROY_FACING | baguette + scotch |

### 7.5 Collection de départ 🔶
10 cartes à l'âge 0 : Banane Verte, Lait Entier, Pain Baguette, Steak Haché Eco+, Céréales Fluo, Plante Verte, Pile LR6 Neuve, Enfant Hurlant, Console Portable, Chat Errant. Les Outils arrivent par les rencontres (§12).

---

## 8. Les effets (liste fermée)

Aucun effet en dehors de cette liste ne doit être implémenté. Toute carte référence ses effets par identifiant.

### 8.1 Règles générales
- **Activation par ligne** :
  - Effets **offensifs** (DESTROY_FACING, DESTROY_ADJACENT, ZONE_MALUS, CANCEL, CANCEL_FACING, PANIC, EAT) : actifs seulement depuis la **ligne Avant** du camp où se trouve la carte.
  - Effets **passifs** (BOOST, SCORE_BONUS, TRANSFER) : actifs seulement depuis la **ligne Arrière**.
  - Carte dans la « mauvaise » ligne : effet **inactif**, mais ses points comptent. Le core renvoie pour chaque carte `effectActive` et la **raison** de l'inactivité (mauvaise ligne, neutralisé, pas de cible) ; l'interface grise ou barre l'effet et l'inspection affiche la raison.
- **Cartes Malus** : posées dans le camp adverse. Leurs effets agissent sur leurs voisins **dans ce camp**, donc sur des cartes adverses (si la carte est en ligne Avant de ce camp).
- **Cible absente** : un effet sans cible ne fait rien.
- **« En face » est un miroir strict** : DESTROY_FACING, EAT et CANCEL_FACING ne ciblent que la carte située dans la **même colonne et sur la même ligne** du camp adverse (Avant↔Avant, Arrière↔Arrière). Jamais « la première carte de la colonne », jamais à distance. Ces effets étant offensifs, ils ne sont actifs que depuis la ligne Avant : un Chat posé en ligne Arrière est **inactif** et ne mange rien.
- **Carte détruite** : va à la défausse ; ses effets continus cessent. Les bonus déjà « attachés » par TRANSFER restent.
- **Priorité de résolution** : EAT, puis CANCEL / CANCEL_FACING, puis DESTROY_*, puis les autres. **Un effet prioritaire qui détruit ou neutralise la source d'un effet moins prioritaire l'annule purement et simplement.** Exemple : si une Bactérie Mortelle est posée en face d'un Chat, EAT se résout d'abord, la Bactérie est détruite, son DESTROY_FACING ne se déclenche jamais et le Chat survit. Même résultat si le Chat est posé après la Bactérie.
- **Exemples de cartes Malus** : Scandale Culinaire (stade 3 de la Pizza) se pose chez l'adversaire, en ligne Avant : il annule les bonus de ses voisins **adverses**. Explosion Électrique (stade 3 du Mixeur) se pose chez l'adversaire, en ligne Avant : elle détruit les cartes adverses voisines. La Pizza au stade 1 n'a aucun effet CANCEL.

### 8.2 Table des effets

| ID | Nom | Moment | Ligne | Résolution |
|---|---|---|---|---|
| DESTROY_FACING | Détruire en face | À la pose | Avant | Détruit la carte en face si elle existe et respecte la condition éventuelle (ex. stade Frais) |
| DESTROY_ADJACENT | Détruire les voisins | À la pose | Avant | Détruit toutes les cartes voisines (4 directions) |
| ZONE_MALUS | Malus de zone | Continu | Avant | −1 à chaque voisin |
| CANCEL | Annuler (voisins) | Continu | Avant | Neutralise les effets continus passifs (BOOST, SCORE_BONUS) des voisins |
| CANCEL_FACING | Annuler (en face) | Continu | Avant | Neutralise tous les effets de la carte en face |
| BOOST | Boost | Continu | Arrière | +1 à une portée donnée : `neighbors` (voisins, avec condition optionnelle comme « stade Frais ») ou `backRow` (toutes vos cartes de la ligne Arrière) |
| SCORE_BONUS | Score +N | Continu | Arrière | Ajoute N au total du camp |
| PANIC | Panique | À la pose | Avant | L'adversaire ne peut pas passer à son prochain tour (s'il a au moins une carte posable) |
| TRANSFER | Transfert | À la pose | Arrière | Un voisin au choix gagne +50 % des P de la carte (arrondi à l'inférieur) tant qu'il reste sur le plateau |
| EAT | Mange | Continu | Avant | Détruit une Bactérie Mortelle placée en face (à la pose de l'une ou de l'autre) ; EAT gagne contre DESTROY_FACING |
| TRANSFORM | Transformer | — | — | **Réservé, non implémenté en V1** |

### 8.3 Ordre de résolution à la pose
1. Placer la carte sur la case choisie.
2. Résoudre ses effets « à la pose » par ordre de priorité.
3. Recalculer tous les effets continus du plateau.
4. Mettre à jour les scores.
5. Faire avancer le temps (+1 cran si c'est le joueur qui a posé).
6. Émettre les événements narrateur (§13).

---

## 9. Le combat

### 9.1 Préparer sa main (`PREP_HAND`) 🔶
Avant chaque combat, le joueur **choisit 10 cartes** dans sa Collection (les âges et stades sont visibles).
- Les Outils aux stades 1 et 2 et les cartes de la Glacière ne sont pas sélectionnables.
- S'il y a moins de 10 cartes éligibles, toutes sont prises.
- La main de l'adversaire est cachée ; seul son nombre de cartes est visible.

### 9.2 Chifoumi
- Pierre-Feuille-Ciseaux, un seul tour, rejoué en cas d'égalité. Navigation au focus (3 choix).
- Le vainqueur choisit **qui joue en premier** à la manche 1.
- Le narrateur commente.

### 9.3 Le plateau
- **Vue 2.5D** (CSS 3D, vue du dessus légèrement inclinée). Option « plateau à plat » dans les options.
- **Joueur en bas, adversaire en haut.** Chaque camp = **5 colonnes × 2 lignes** (10 cases). Ligne Avant côté centre, ligne Arrière côté bord.
- **Pose** : une carte non Malus se pose dans **son** camp ; une carte Malus se pose dans le camp **adverse**. La case doit être vide. Si le camp cible est plein, la carte n'est pas posable.
- La mise en page de l'écran de combat est décrite au §17.5.

### 9.4 Tour de jeu
À son tour, un joueur **pose une carte** OU **passe**. Si aucun coup n'est possible (main vide, camps pleins), le joueur passe automatiquement. Pas de limite de temps par tour 🔶. Il n'y a pas de limite au nombre de cartes posées par manche (dans la limite des cases libres) : **le coût d'une pose est la carte utilisée, pas le tour**, y compris pour une carte Malus.

### 9.5 Passer
- Passer est **définitif pour la manche** : on ne rejoue plus.
- On peut passer dès son premier tour (sacrifier la manche pour garder ses cartes).
- L'adversaire continue de jouer jusqu'à ce qu'il passe ou n'ait plus de carte posable.
- Effet PANIC : le joueur concerné ne peut pas passer à son prochain tour, sauf s'il n'a aucune carte posable. **Si l'adversaire a déjà passé quand PANIC est posé, PANIC est sans effet** : on ne le fait pas revenir dans la manche.

### 9.6 Fin de manche
- La manche se termine quand **les deux joueurs ont passé**.
- Le score le plus haut gagne la manche (**+1 point de manche**). **Égalité = manche nulle : personne ne marque.**
- Le plateau est vidé : toutes les cartes posées vont à la **défausse** (inutilisables jusqu'à la fin du match, leur âge continue de courir). **Aucune repioche** entre les manches (sauf effet ou événement narratif explicitement prévu).
- **Qui commence la manche suivante** : le perdant de la manche précédente ; en cas de manche nulle, celui qui n'avait pas commencé la précédente.

### 9.7 Fin de match et départage ✅
- Match en **3 manches maximum** (au meilleur des 3). Le premier à **2 manches gagnées** l'emporte immédiatement.
- Si, après 3 manches, personne n'a 2 manches gagnées (ex. 1 victoire, 1 nulle, 1 défaite), départage **en cascade** :
  1. le plus grand **total de points cumulés** sur les manches jouées (somme des scores finaux de chaque manche) ;
  2. le plus de **cartes restantes en main** ;
  3. en dernier recours, le **vainqueur du chifoumi initial**.

### 9.8 Après le match 🔶
- **Toutes les cartes jouées, détruites ou défaussées retournent dans la Collection** avec leur **âge réel**, qui a continué de courir pendant le match (rien n'est perdu par un combat, sauf les ingrédients consommés par une fusion).
- **Butin** (victoire) : le joueur choisit **1 carte parmi 3** tirées au hasard dans la main de l'adversaire, ajoutée à sa Collection à l'âge 0. Pas de butin en cas de défaite.
- Le combat tutoriel n'a pas de butin.

### 9.9 Défaite 🔶
Pas de « game over » : le narrateur se moque, le joueur **rejoue le même combat** avec la Collection d'avant le combat, **+5 crans** de pénalité. Après 3 défaites consécutives sur le même combat, le narrateur propose le mode Découverte.

### 9.10 Le boss : Le Gérant 🔶
Combat normal en 3 manches, avec une règle spéciale « Heures sup' » : **à chaque manche, il démarre avec une carte déjà posée** (définie dans `combats.json`). Pas de butin ; le combat mène à la fin du jeu.

### 9.11 Cas limites

| Situation | Règle |
|---|---|
| Main vide | Passe automatiquement |
| Camp cible plein | La carte n'est pas posable ; si aucune carte n'est posable, passe automatique |
| Score négatif | Le score d'un camp est plancher à 0 (voir §19.4) |
| Carte détruite | Va à la défausse ; ne revient qu'en fin de match |
| Chat et Bactérie face à face | Le Chat gagne (EAT prioritaire) |
| Effet dans la mauvaise ligne | Inactif ; les points comptent |
| 0-0 après 3 manches nulles | Départage en cascade (§9.7) |
| Carte qui change de stade en main | Mise à jour immédiate (§6.3) |
| Carte posée dont l'âge franchit un seuil | Stade verrouillé jusqu'à ce qu'elle quitte le plateau (§6.3) |
| PANIC posé alors que l'adversaire a déjà passé | Sans effet (§9.5) |
| Boucle de coups sans fin | Impossible par construction ; garde-fou `MAX_ACTIONS_PER_ROUND` qui lève une erreur explicite |

### 9.12 Rythme et animations
- Pose : la carte glisse de la main vers la case (durée dans `config.js`). Son lourd et « charnu ».
- Destruction : dissolution courte. Retournement de carte : CSS 3D (`rotateY`).
- Aucun effet d'impact complexe (screen shake, hit-stop, particules) avant l'étape de polish (§22, M13).

### 9.13 Garde-fou de dimensionnement (main et plateau) 🔶
- **Référence Gwent** : une main de 10 cartes sans repioche sur 3 manches est la tension de base du genre. On ne peut pas tout jouer : il faut **passer pour économiser ses cartes**. Ce n'est pas un défaut, c'est le cœur du jeu.
- **Risque réel à surveiller** : manches trop courtes (2 ou 3 cartes posées), plateau visuellement vide, effets de voisinage rares.
- **Seuils mesurés par la simulation (§19.8)** : moyenne de cartes posées par camp et par manche ≥ 3 ; matchs où un joueur n'a plus de carte avant la manche 3 ≤ 25 % ; matchs décidés au départage ≤ 10 %.
- **Si un seuil n'est pas respecté**, ajuster dans cet ordre, par la configuration seulement : 1) `HAND_SIZE` de 10 à 12 ; 2) `GRID_COLS` de 5 à 4 (plateau plus dense) ; 3) option à valider par l'auteur : repioche d'1 carte au début de la manche 3. Rien de cela n'est implémenté tant que la simulation ne l'exige pas.

---

## 10. L'IA adverse

Deux niveaux, choisis dans les options ✅. **L'IA ne voit jamais la main du joueur** et ne triche pas. Délai de « réflexion » 0,8 à 1,5 s avant chaque coup.

### 10.1 Découverte (« Je suis un Noob »)
- Joue une carte posable **au hasard**, case au hasard.
- Passe si sa main est vide, ou si elle mène de **8 points ou plus** (`AI_NOOB_PASS_LEAD`).

### 10.2 Le vrai jeu (« Je suis un Gamer »)
- Note chaque coup (carte × case) : points apportés, effets utiles (destruction d'une carte forte, annulation d'un bonus, score bonus), effets gâchés (ligne inactive).
- Garde en réserve ses cartes les plus fortes pour les manches suivantes.
- **Règles de passe** :
  - passer si l'adversaire a passé **et** qu'elle mène ;
  - sacrifier la manche 1 (passer tôt) si le retard dépasse ce que sa main peut raisonnablement rattraper ;
  - ne jamais passer en retard de peu s'il lui reste de quoi gagner la manche.
- Utilise PANIC quand l'adversaire est en retard de peu.

### 10.3 Budget des mains adverses 🔶
Somme des P des 10 cartes de la main (valeurs de départ, à calibrer) :

| Combat | Adversaire | Budget P |
|---|---|---|
| C1 (tutoriel) | La Cliente pressée | ~30 |
| C2 | Chad Prot' | ~38 |
| C3 | Le Livreur Perdu | ~42 |
| C4 | La Cheffe de Rayon Surgelés | ~46 |
| C5 | Le Vigile Syndiqué | ~50 |
| Boss | Le Gérant | ~55 |

---

## 11. Cuisine, fusion, Glacière, Soldeur

### 11.1 Salle Cuisine et fusion ✅
- La fusion n'est possible **qu'en salle Cuisine**. **1 fusion par visite.** Il y a 1 Cuisine dans l'Acte I (guidée) et 1 dans l'Acte II.
- Une fusion **consomme les 2 ingrédients** et **un Mixeur**. Le résultat est un plat à l'**âge 0** (Frais).
- Les recettes (`recipes.json`) portent sur la **famille**, quel que soit le stade des ingrédients, sauf si la recette impose un stade (Plante Mutante exige une Pile au stade 3).
- **Mixeur** :
  - Bon Marché (stade 1) : fonctionne seul.
  - Surchauffé (stade 2) : exige **en plus une Pile** (stade 1 ou 2), consommée.
  - Explosion Électrique (stade 3) : ne fusionne plus, devient une bombe jouable en combat : carte **Malus**, posée dans le camp adverse (ligne Avant) pour détruire ses cartes voisines. Le joueur arbitre donc entre fusionner et garder la bombe.
- **Scotch** (stades 1 et 2) : **joker** qui remplace un ingrédient manquant dans une recette (hors Lance de Fortune, qui l'exige déjà). Le plat obtenu perd **3 P** (`FUSION_SCOTCH_PENALTY`). Consommé. Au stade 3 (Colle Sèche), il est inerte.
- Pizza Ananas ne fusionne avec rien (Scandale Culinaire en est la blague).

### 11.2 Glacière 🔶
Dans l'Acte II, la salle « Frigo » donne une **Glacière portable** (objet clé, pas une carte). Accessible depuis l'écran Collection : **3 emplacements** (`FRIDGE_SLOTS`). Les cartes qu'elle contient **ne vieillissent plus**. Échange libre à tout moment hors combat.

### 11.3 Écran Collection
Accessible depuis le menu pause et entre les salles : liste des cartes avec stade, âge, jauge de fraîcheur, aperçu des 3 stades, filtres par famille et par étiquette, Glacière.

### 11.4 Le Soldeur (marchand) 🔶
Troc 1 contre 1, **2 échanges maximum par visite**. Le joueur donne une carte de son choix et reçoit une carte à l'âge 0 parmi **3 propositions** : tirée **au hasard**, ou **choisie** s'il donne un Papier Toilette (monnaie de troc).

### 11.5 Sources de cartes (pas de coffres ✅)
Rencontres de PNJ (don ou troc), butin de combat, fusions, Soldeur, événements absurdes. Mixeurs : Kévin (Acte I), Soldeur, un événement de l'Acte II.

---

## 12. Exploration et chronologie

### 12.1 Principe
Une **salle** = une image fixe + un texte du narrateur + 2 ou 3 choix (portes, actions). Navigation au focus, à la souris ou à la manette. Les salles de l'Acte II sont **tirées au sort** (aléatoire à graine, §ARCHITECTURE).

### 12.2 Types de salles
Combat, Rencontre (PNJ), Cuisine, Glacière (Frigo), Soldeur, Événement absurde, Révélation (scénarisée), Boss (scénarisée).

### 12.3 Structure de la partie (~30 min)

| Segment | Durée | Contenu |
|---|---|---|
| Intro | ~3 min | Avertissement, terminal, bouton qui fuit, formulaire |
| **Acte I — Zone 1 « L'Illusion »** | ~8 min | 5 salles fixes (voir ci-dessous) |
| Révélation | ~2 min | Lumières qui s'éteignent, décor qui se dégrade, narrateur qui change de ton |
| **Acte II — Zone 2 « La Réalité »** | ~14 min | 7 salles tirées au sort |
| **Acte III — Le Gérant** | ~3 min | Combat de boss à la Sortie |
| Fin | ~1 min | Monologue du narrateur, crédits |

### 12.4 Acte I (ordre fixe)
1. **Rencontre : Kévin** — recrutement. Reçoit Kévin (Caissier) et un Mixeur Bon Marché.
2. **Combat tutoriel** contre la Cliente pressée (1 seule manche, guidé).
3. **Cuisine guidée** — première fusion obligatoire ; le tiroir contient un Scotch Gris.
4. **Rencontre : le Vieux Monsieur** — donne Grand-Mère Perdue, puis meurt (glissade). Scène de choc.
5. **Combat contre Chad Prot'** (3 manches, butin).
Puis **Révélation**.

### 12.5 Acte II (tirage sans remise)
Pool de 7 salles : 3 combats (C3, C4, C5), 1 Cuisine, 1 Frigo (Glacière), 1 Soldeur, 1 Événement absurde. À chaque étape, **2 portes** sont proposées, tirées dans les salles restantes ; la salle non choisie retourne dans le pool. Les 7 salles sont donc **toutes visitées**, seul l'ordre change. Le décor de chaque salle est choisi parmi 3 variantes de la zone.

### 12.6 Événements absurdes (exemples à réécrire par l'auteur)
- Une annonce au haut-parleur qui dérape.
- Un rayon animalerie où personne ne répond.
- Un caddie qui réclame un pourboire.
- Une porte « Réservé au personnel » qui fait faire demi-tour.
Récompense : une carte, un Mixeur, ou une pénalité de crans.

### 12.7 Sauvegarde automatique
À l'entrée de chaque salle et à la fin de chaque combat. « Continuer » reprend au début de la dernière salle (§20).

---

## 13. Narrateur et dialogues

### 13.1 Format
Fichier `dialogues.json`. Chaque réplique : `id`, `trigger`, `conditions`, `text`, `weight`, `cooldownSec`, `tags`. Variables autorisées : `{prenom}`, `{age}`, `{sexe}`, `{metier}`. Si une variable est vide, la réplique est ignorée ou remplacée par une variante sans variable.

### 13.2 Déclencheurs

| Déclencheur | Moment |
|---|---|
| `PRESS_KEY`, `INTRO_*`, `FORM_*` | Écrans d'avant-jeu |
| `ROOM_ENTER` | Entrée dans une salle |
| `COMBAT_START`, `COMBAT_WIN`, `COMBAT_LOSE` | Début et fin de combat |
| `ROUND_WIN`, `ROUND_LOSE`, `ROUND_DRAW` | Fin de manche |
| `BAD_MOVE` | Mauvais coup (voir ci-dessous) |
| `CARD_ROTTEN` | Une carte passe au stade 3 |
| `FUSION_DONE` | Fusion réussie |
| `INACTIVITY_30`, `INACTIVITY_90` | 30 s / 90 s sans entrée |
| `CLOCK_20/40/60/80` | Paliers de l'horloge |
| `NPC_DEATH` | Mort du Vieux Monsieur |
| `OPTION_CHANGED` | Le joueur change une option (ex. désactive le grincement : « mauviette ») |
| `MENU_RETURN`, `DATA_ERASED` | Retour au menu, effacement des données (réplique d'adieu) |

**Mauvais coup** : détruire sa propre carte par un effet ; passer en retard de 8 points ou plus avec au moins 3 cartes en main ; poser une carte non Malus de P ≤ 1 au stade 3 sans effet actif.

### 13.3 Règles de diffusion
- Une même réplique ne revient pas avant **600 s**.
- Au plus **1 réplique spontanée toutes les 20 s**.
- Option « Bavardage du narrateur » : Discret (délais ×2, réactions spontanées désactivées), Normal, Bavard (délais ×0,5).
- Texte à effet machine à écrire ; bouton « passer » ; vitesse réglable.

### 13.4 Budget de contenu (à écrire par l'auteur)
≈ **120 répliques** : intro 15, exploration 40, combat 40, réactions 25. Dialogues de PNJ : 3 à 5 répliques, 1 choix maximum.

---

## 14. Contrôles

### 14.1 Principes ✅
- Clavier, souris et manette sont **tous trois complets** : le jeu se joue entièrement avec chacun.
- Les entités et le core ne lisent **jamais** les touches : seul `InputHandler` traduit les entrées en **actions abstraites**.
- **Un appui = un déplacement de case.** Pas de défilement continu, pas de répétition en maintenant la touche.
- **Manette** : zone morte 0,2 sur les joysticks ; un déplacement se déclenche quand l'axe dépasse 0,5, puis l'axe doit repasser sous 0,2 pour se réarmer. **Pas de diagonale** : l'axe dominant l'emporte (les diagonales ne sont pas plus rapides).
- Les glyphes affichés (touches ou boutons) s'adaptent à la **dernière entrée utilisée**.

### 14.2 Actions et correspondances par défaut

| Action | Clavier | Manette (mapping standard) | Souris |
|---|---|---|---|
| UP / DOWN / LEFT / RIGHT | Flèches ou Z Q S D | Croix directionnelle ou stick gauche | Le survol déplace le focus |
| CONFIRM | Entrée, Espace | A (bouton bas) | Clic gauche |
| CANCEL | Retour arrière | B | Bouton « Retour » |
| PASS | P | X | Bouton « Passer » |
| INSPECT | I | Y | Clic droit sur une carte |
| PAUSE | Échap | Start | Icône de pause |
| TAB_PREV / TAB_NEXT (changer de zone) | Maj+Tab / Tab | LB / RB | Clic sur la zone |
| DEBUG (panneau) | F3 | — | — |

Toutes les actions sont **remappables** dans les options (clavier et manette).

### 14.3 Navigation (FocusManager)
- **Zones** : Main (rangée horizontale), Plateau (grille 5×2 par camp), Boutons (Passer, Inspecter), Menus. Pas de focus sur le panneau du narrateur.
- **Poser une carte** : CONFIRM sur une carte de la main, puis le focus passe sur les **cases légales** (mises en évidence), CONFIRM pose, CANCEL revient à la main.
- Le focus s'arrête aux bords (pas de bouclage par défaut). Le dernier focus de chaque zone est mémorisé.
- Le focus est toujours **visible** (contour épais, fort contraste).

### 14.4 Manette
- Détectée au premier appui sur un bouton. Branchement et débranchement à chaud : message à l'écran, **pause automatique** en combat si la manette utilisée est débranchée.
- Le bouton qui fuit de l'intro suit les règles du §5.2.

---

## 15. Menus et options

### 15.1 Écrans
Avertissement, Titre, Options, Crédits, Pause, Préparer sa main, Collection, Cuisine, Soldeur, Butin, Défaite, Fin, fenêtres de confirmation.

### 15.2 Titre
Nouvelle partie (confirmation si une sauvegarde existe) · Continuer (grisé sans sauvegarde) · Options · Crédits.

### 15.3 Pause
Reprendre · Collection · Options · Retour au titre (sauvegarde automatique avant, avec confirmation). Un combat en cours interrompu reprend **au début du match** au prochain « Continuer ».

### 15.4 Options (stockées séparément de la sauvegarde)

| Catégorie | Option | Valeurs | Défaut |
|---|---|---|---|
| Audio | Volume général | 0–100 | 80 |
| Audio | Musique | 0–100 | 70 |
| Audio | Effets | 0–100 | 80 |
| Audio | Narrateur (bruitages du texte) | 0–100 | 90 |
| Audio | Grincement de porte | Activé / Désactivé | Activé |
| Affichage | Plateau | Incliné (2.5D) / À plat | Incliné |
| Affichage | Réduire les clignotements | Oui / Non | Non (proposé à l'écran d'avertissement) |
| Affichage | Plein écran | Oui / Non | Non |
| Affichage | Taille du texte | Petit / Normal / Grand / Très grand | Normal |
| Texte | Vitesse du texte | Lent / Normal / Rapide / Instantané | Normal |
| Jeu | Difficulté | Découverte (Je suis un Noob) / Le vrai jeu (Je suis un Gamer) | Découverte |
| Jeu | **Vitesse de pourrissement** | Lent (20) / Normal (15) / Rapide (10) | Normal |
| Jeu | **Bavardage du narrateur** | Discret / Normal / Bavard | Normal |
| Contrôles | Remapper clavier / manette / Réinitialiser | — | — |
| Données | **Effacer mes données** | Double confirmation | — |
| Données | Exporter / Importer la sauvegarde 🔶 (optionnel) | Fichier JSON local, validé à l'import | — |

- La difficulté s'applique au **prochain combat**. La vitesse de pourrissement ne se change que depuis le Titre ou la Pause hors combat ; les âges sont conservés (plafonnés au nouveau maximum), les stades recalculés.
- Le narrateur réagit au changement de certaines options (§13.2).

### 15.5 Fin et crédits
Fin : monologue du narrateur (texte de l'auteur), puis crédits générés depuis `CREDITS.md` (auteur, outils, assets, licences).

---

## 16. Audio

| Contexte | Piste | Ambiance |
|---|---|---|
| Titre | Boucle courte | Neutre, légèrement décalée |
| Intro | Presque silence + faible bourdonnement | Terminal |
| Zone 1 | Boucle | Musique d'ascenseur joyeuse |
| Zone 2 | Boucle | Drones + bourdonnement de néons, lumières blafardes |
| Combat | Piste dynamique | Épique, dynamique, entraînante |
| Boss | Piste dédiée | Épique, plus lourde |
| Révélation | Motif court | Rupture |
| Fin | Piste dédiée | Ironique ou grandiose (au choix de l'auteur) |

**Effets sonores** : pose de carte (lourd, charnu), destruction, passer, manche gagnée/perdue, chifoumi, fusion, **grincement de porte (2 secondes exactement)**, glissade et mort du Vieux Monsieur (réaliste), clic et déplacement de focus, bruitages du texte du narrateur, passage au stade pourri.

**Mixage** : 4 canaux (général, musique, effets, narrateur). Fondu enchaîné de 1 s entre pistes. La musique baisse de 30 % pendant une réplique. Pistes en boucle sans coupure audible.
**Règles** : le son se débloque à l'écran « Appuyez sur une touche » ; formats OGG (MP3 en secours) ; chaque son est enregistré dans `CREDITS.md` (§21).

---

## 17. Direction artistique et interface

### 17.1 Style ✅ (proposé, validé)
**« Prospectus de supermarché »** : aplats de couleur, contours épais, pastilles « PROMO », typographies d'affiche. Reconnaissable, cohérent d'une image à l'autre et peu générique. En Zone 2, le **même style** se dégrade (désaturé, taches, moisissures) : le décalage est l'ironie du jeu.

### 17.2 Palettes (définies en tokens CSS)
- **Zone 1** : couleurs saturées (jaune promo, rouge tomate, bleu frais, vert menthe).
- **Zone 2** : verdâtre et jaune malade, gris de néon, noirs poisseux.
- **Intro** : noir et vert terminal.

### 17.3 Typographies
2 polices libres (licence OFL) **hébergées localement** (jamais via un CDN) : une d'affichage, une très lisible pour le texte ; plus une monospace pour le terminal. Noms à choisir par l'auteur.

### 17.4 Anatomie d'une carte
Ratio **5:7** (base 250×350 px). De haut en bas : nom, **pastille de puissance** (coin haut gauche, grande), illustration carrée, zone d'effet (texte court + icône), étiquettes, **jauge de fraîcheur en 3 segments** avec icône de stade (forme différente pour chaque stade, pas seulement la couleur), icône Fermentation, pastille Malus.
- **Stades** : teinte CSS différente par stade, plus des surcouches (taches vertes, mouches) au stade 3. Illustrations : 1 par carte avec teintes ; l'option « 3 images par carte » reste possible (les données référencent une image par stade).
- Illustrations carrées WebP (768×768).

### 17.5 Écran de combat
- Plateau 2.5D au centre (`perspective` 1200 px, inclinaison 25°, valeurs en config), adversaire en haut, joueur en bas.
- **Main** en éventail en bas ; **panneau gauche** : scores des deux camps, points de manche (2 pastilles par joueur), numéro de manche ; **panneau droit** : boîte du narrateur et horloge du magasin ; boutons Passer et Inspecter ; **bandeau d'information** de la carte visée (nom, 3 stades, âge).
- Résolution de référence 1920×1080, mise à l'échelle proportionnelle, minimum 1280×720.

### 17.6 Écran d'exploration
Image de salle plein écran, texte du narrateur en bas, 2 ou 3 portes sous forme d'étiquettes-boutons, horloge du magasin, accès à la Collection.

### 17.7 Animations
V1 : transitions CSS simples (survol, focus, retournement, pose). L'étape de polish (M13) ajoute : léger tremblement de caméra, particules, arrêt sur image (hit-stop, conçu avec le déroulement du tour).

### 17.8 Accessibilité visuelle
Contraste ≥ 4,5:1 ; focus visible ; stades différenciés par icône **et** couleur ; néons clignotants limités à 3 flashs par seconde et désactivables ; plateau à plat ; taille de texte réglable.

---

## 18. Données et constantes

### 18.1 Règles
Les étiquettes affichées en français (ex. « Surgelé ») correspondent à des identifiants ASCII en minuscules dans les données (`surgele`, `malus`, `outil`, `fermentation`, `aliment`…).

### 18.2 `cards.json` (extrait)
```json
{
  "id": "banane",
  "family": "banane",
  "tags": ["aliment"],
  "stageLengths": null,
  "stages": [
    { "name": "Banane Verte", "power": 2, "effects": [], "tags": [], "image": "img/cards/banane_1.webp", "flavor": "[TEMP]" },
    { "name": "Banane Parfaite", "power": 6, "effects": [], "tags": [], "image": "img/cards/banane_2.webp", "flavor": "[TEMP]" },
    { "name": "Bouillie Brune", "power": -1, "effects": [{ "type": "ZONE_MALUS", "value": 1 }], "tags": ["malus"], "image": "img/cards/banane_3.webp", "flavor": "[TEMP]" }
  ]
}
```
Un Outil aux stades 1 et 2 a `"power": null` et `"placeable": false`. Pour une carte Surgelé, aucune durée n'est écrite dans les données : la règle du §6.1 est appliquée par `stageOf` grâce à l'étiquette `surgele` (le champ `stageLengths` reste `null`).

### 18.3 `recipes.json` (extrait)
```json
{ "id": "milkshake", "ingredients": [{ "family": "banane" }, { "family": "lait" }], "result": "milkshake_proteine" }
{ "id": "plante_mutante", "ingredients": [{ "family": "plante" }, { "family": "pile", "stage": 3 }], "result": "plante_mutante" }
```

### 18.4 `rooms.json` (extrait)
```json
{ "id": "z2_kitchen", "zone": 2, "type": "KITCHEN", "images": ["img/rooms/z2_kitchen_a.webp", "img/rooms/z2_kitchen_b.webp", "img/rooms/z2_kitchen_c.webp"], "narratorTags": ["room_kitchen"], "doorLabels": ["Porte grise", "Porte rouge"] }
```

### 18.5 `combats.json` (extrait)
```json
{ "id": "c2_influenceur", "name": "Chad Prot'", "handBudget": 38, "hand": [{ "card": "influenceur", "stage": 1 }], "startingBoard": [], "rules": [], "loot": { "pick": 1, "among": 3 } }
```
Le boss utilise `"startingBoard"` pour sa carte de départ « Heures sup' » (§9.10).

### 18.6 `dialogues.json` (extrait)
```json
{ "id": "inactivity_30_a", "trigger": "INACTIVITY_30", "conditions": { "states": ["EXPLORATION", "COMBAT"] }, "text": "[TEMP] Tu dors, {prenom} ?", "weight": 1, "cooldownSec": 600, "tags": ["inactivite"] }
```

### 18.7 Sauvegarde (extrait)
```json
{ "version": 1, "profile": { "prenom": "", "age": null, "sexe": "", "metier": "" }, "seed": 123456, "clock": 0, "act": 1, "step": 0, "visitedRooms": [], "doorPool": [], "collection": [{ "uid": "c001", "cardId": "banane", "age": 0 }], "fridgeUnlocked": false, "fridge": [], "defeats": 0, "seenDialogues": [], "kitchenFusionsDone": 0 }
```

### 18.8 Constantes (`src/config.js`)

| Constante | Valeur | Constante | Valeur |
|---|---|---|---|
| `HAND_SIZE` | 10 | `FRIDGE_SLOTS` | 3 |
| `GRID_COLS` / `GRID_ROWS` | 5 / 2 | `FUSIONS_PER_KITCHEN` | 1 |
| `ROUNDS_TO_WIN` / `MAX_ROUNDS` | 2 / 3 | `FUSION_SCOTCH_PENALTY` | 3 |
| `STAGE_LENGTH` | 15 (20 / 15 / 10) | `FUSED_STAGE3_RATIO` | 0,5 |
| `AGE_MAX` | 3 × STAGE_LENGTH − 1 | `TRANSFER_RATIO` | 0,5 |
| `SURGELE_FRESH_MULT` / `SURGELE_RIPE_LENGTH` | 2 / 1 | `BOOST_VALUE` / `ZONE_MALUS_VALUE` | 1 / 1 |
| `CRAN_CARD_PLAYED` | 1 | `SCORE_FLOOR` | 0 |
| `CRAN_NEW_ROOM` | 3 | `AI_NOOB_PASS_LEAD` | 8 |
| `CRAN_NEW_DIALOGUE` | 1 | `AI_DELAY_MIN` / `AI_DELAY_MAX` (ms) | 800 / 1500 |
| `CRAN_DEFEAT` | 5 | `NARRATOR_GLOBAL_COOLDOWN` (s) | 20 |
| `LOOT_AMONG` / `LOOT_PICK` | 3 / 1 | `NARRATOR_LINE_COOLDOWN` (s) | 600 |
| `SOLDEUR_TRADES` / `SOLDEUR_OFFERS` | 2 / 3 | `INACTIVITY_1` / `INACTIVITY_2` (s) | 30 / 90 |
| `DOOR_FLEE_COUNT` / `DOOR_FLEE_DISTANCE` (px) | 3 / 80 | `CLOCK_MILESTONES` | [20, 40, 60, 80] |
| `DEADZONE` / `STICK_TRIGGER` | 0,2 / 0,5 | `DEFEAT_DISCOVERY_PROPOSAL` | 3 |
| `BOARD_PERSPECTIVE` (px) / `BOARD_TILT` (°) | 1200 / 25 | `DEBUG_ENABLED` | true en développement |
| `MAX_ACTIONS_PER_ROUND` | 4 × `HAND_SIZE` | Origine de la graine | heure (nouvelle partie), base + n° de partie (simulation), saisie (debug) |

---

## 19. Formules et calculs

### 19.1 Stade d'une carte
```js
function stageOf(card, age, L = STAGE_LENGTH) {
  if (card.tags.includes('surgele')) {          // 2L frais, 1 cran mûr, puis pourri
    if (age < 2 * L) return 1;
    if (age < 2 * L + 1) return 2;
    return 3;
  }
  return 1 + Math.min(2, Math.floor(age / L));
}
```

### 19.2 Faire avancer le temps
```js
function advanceTime(state, crans) {
  for (const c of state.collection) {
    if (c.inFridge) continue;                    // seule exception : la Glacière
    c.age = Math.min(c.age + crans, AGE_MAX);    // y compris les cartes posées ou défaussées
  }
  state.clock += crans;
}

// Stade pris en compte pour le nom, la P, les effets et l'image
function activeStage(card) {
  return card.lockedStage ?? stageOf(card.def, card.age);   // lockedStage n'existe que tant que la carte est sur le plateau
}
```
Au changement de l'option « Vitesse de pourrissement », les âges sont plafonnés au nouvel `AGE_MAX`.

### 19.3 Puissance effective d'une carte
`P_eff = P(stade actif) + Σ boosts actifs − Σ malus de zone actifs + Σ transferts reçus`.
Un effet inactif (mauvaise ligne) ou neutralisé (CANCEL) ne contribue pas. `P_eff` peut être négative.

### 19.4 Score d'un camp
`score = max(SCORE_FLOOR, Σ P_eff des cartes du camp + Σ SCORE_BONUS actifs)`.
Les cartes Malus posées dans ce camp par l'adversaire comptent avec leur P (souvent négative).

### 19.5 Résultat d'une manche
`scoreJoueur > scoreAdversaire` : +1 manche pour le joueur ; `<` : +1 pour l'adversaire ; `=` : manche nulle, personne ne marque.

### 19.6 Résultat d'un match
```js
function matchWinner(m) {
  if (m.wins.player === 2) return 'player';
  if (m.wins.opponent === 2) return 'opponent';
  if (m.roundsPlayed < MAX_ROUNDS) return null;           // match en cours
  if (m.totalPoints.player !== m.totalPoints.opponent)    // 1. points cumulés
    return m.totalPoints.player > m.totalPoints.opponent ? 'player' : 'opponent';
  if (m.cardsLeft.player !== m.cardsLeft.opponent)        // 2. cartes restantes en main
    return m.cardsLeft.player > m.cardsLeft.opponent ? 'player' : 'opponent';
  return m.chifoumiWinner;                                // 3. dernier recours
}
```

### 19.7 Évaluation d'un coup par l'IA « Le vrai jeu »
`valeur = gainDeScore + valeurDesEffets − coûtDeRéserve`
- `gainDeScore` : variation de (score IA − score joueur) après le coup.
- `valeurDesEffets` : Σ P des cartes adverses détruites, bonus annulés, bonus créés.
- `coûtDeRéserve` : pendant les manches 1 et 2, poids × P de la carte (on garde les plus fortes pour plus tard).

### 19.8 Simulation et équilibrage (`tests/simulation.js`)
Simuler 1 000 matchs IA contre IA (les deux niveaux) et mesurer :
- cartes posées par camp et par manche, matchs à court de cartes, matchs au départage (seuils du §9.13) ;
- crans écoulés par acte comparés aux budgets du §6.6 (≈ 33 et ≈ 55) ;
- part des cartes jouées à chaque stade et valeur moyenne par stade ;
- part des cartes qui reviennent Pourries à la fin d'un match (effet du vieillissement continu, §6.3) ;
- **règle d'efficacité des Malus** : l'impact net moyen d'une pose Malus (points retirés à l'adversaire, effets compris) doit être **≥ 4**. Sinon, relever les P négatives des cartes Malus faibles (par exemple Flotte Collante et Acide de Pile de −2 à −3) ;
- aucune situation bloquée (partie sans fin, coup impossible non géré).

---

## 20. Sauvegarde et données personnelles

- **Clés de stockage local** : `maxi-gouffre.options`, `maxi-gouffre.profile`, `maxi-gouffre.save`. Seul `SaveManager` y accède. Son API est **asynchrone** (promesses) dès le départ, pour pouvoir brancher plus tard une sauvegarde en fichier sous Electron ou Tauri. Le jeu demande au navigateur un **stockage persistant** (`navigator.storage.persist()`). La sauvegarde ne pèse que quelques Ko : `localStorage` suffit, pas besoin d'IndexedDB. Option : **export / import** de la sauvegarde en fichier JSON, validé à l'import.
- **Sauvegarde** versionnée (`version`), avec migration. Une sauvegarde corrompue est ignorée avec un message clair, jamais un plantage.
- **Points de sauvegarde** : entrée de chaque salle, fin de chaque combat (§12.7).
- **Reproductibilité** : la graine du hasard est sauvegardée ; la même graine donne le même tirage de salles. Origine de la graine : **nouvelle partie** = tirée de l'heure ; **simulation** = graine de base + numéro de partie (parties différentes mais rejouables) ; **debug** = saisie à la main.
- **Effacer mes données** : supprime les 3 clés, après double confirmation. Le narrateur réagit.
- **Vie privée (RGPD)** : aucune collecte, aucun traceur, aucune statistique, aucune ressource externe (polices, scripts et images sont **tous locaux**). Les données saisies ne quittent jamais l'appareil.

---

## 21. Droits d'auteur et conformité

*Je ne suis pas juriste : faire valider avant publication.*

- **Aucune marque, aucun personnage, aucune personne réelle** nommés dans le jeu. Le jeu de cubes de l'intro n'est pas nommé. Les personnages sont des **archétypes originaux**.
- **Nom du jeu** : vérifier la disponibilité de « Maxi-Gouffre » (INPI, EUIPO) avant commercialisation.
- **`CREDITS.md` obligatoire** : pour chaque asset (image, son, musique, police) : fichier, auteur, source, licence, usage commercial autorisé (oui/non), date. **L'agent refuse tout asset non documenté.**
- **Images générées par IA** : vérifier les conditions d'usage commercial du générateur ; le droit d'auteur sur ces images est incertain (en France et en Europe, la création humaine compte). Conserver les consignes de génération et les images de référence, retoucher. Plusieurs boutiques demandent de déclarer l'usage d'IA.
- **Musique** : originale, ou sous licence commerciale vérifiée (libre de droits, CC0, CC-BY avec crédit).
- **Polices** : licence OFL ou équivalente.
- **Avertissements et classification** : écran d'avertissement dans le jeu ; classification d'âge à renseigner sur la boutique choisie.

---

## 22. Ordre de développement imposé

Une étape à la fois, un commit et un tag par étape validée. Détail technique dans `ARCHITECTURE.md`.

| Jalon | Contenu | Critère de validation |
|---|---|---|
| M0 | Fondations : dépôt Git, serveur local, arborescence, `config.js`, panneau debug F3, tests | La page se charge sans erreur console ; `node --test` passe ; tag `v0.0` |
| M1 | Données et âge : `cards.json` (3 cartes), `TimeManager`, `stageOf` | Tests de stade et d'âge verts (Surgelé inclus) |
| M2 | Plateau statique (DOM/CSS) : grille 5×2 × 2, 2.5D et à plat, cartes factices | Affichage correct en 1280×720 et 1920×1080 ; bascule à plat |
| M3 | Logique de combat pure : pose, passer, manches, départage, effets | Tous les tests verts, dont cas limites §9.11 et Chat/Bactérie dans les deux ordres |
| M4 | UI de combat à la souris : préparer sa main, poser, passer, scores | Un match complet jouable à la souris contre une IA factice |
| M5 | IA (2 niveaux) + chifoumi | Simulation de 1 000 matchs sans blocage ; seuils du §9.13 mesurés |
| M6 | Vieillissement dans l'interface : jauge, stades, inspection, horloge | Une carte change de face à l'écran quand son âge franchit un seuil |
| M7 | `FocusManager` et `InputHandler` : clavier, souris, manette | Un match complet jouable avec chaque entrée seule |
| M8 | Exploration : salles, portes, tirage sans remise, graine | L'Acte II visite les 7 salles dans un ordre variable et reproductible |
| M9 | Cuisine, fusion, Glacière, Soldeur, butin, retour des cartes | Fusion Milkshake correcte : ingrédients consommés, résultat à l'âge 0 |
| M10 | Narrateur : dialogues, déclencheurs, intro, formulaire, bouton qui fuit | Délais anti-répétition respectés (test) ; variables remplacées |
| M11 | Menus, options, sauvegarde, RGPD | Quitter puis relancer reprend à la bonne salle ; « Effacer mes données » vide tout ; export puis import redonnent la même partie |
| M12 | Contenu complet : 20 cartes, 6 plats, 6 combats, salles, répliques | Partie complète jouable de bout en bout |
| M13 | Audio et polish (juice) | Aucune régression (tests) ; 60 fps en combat |
| M14 | QA et conformité : simulation d'équilibrage, `CREDITS.md` complet, console propre, build | Checklist de fin d'étape de `ARCHITECTURE.md` entièrement cochée |

---

## 23. Hors périmètre et points à confirmer

### 23.1 Hors périmètre V1
Multijoueur, version packagée (`.exe`, Android), voix enregistrées, plus de 2 difficultés, éditeur de deck libre, succès, achats, effet TRANSFORM, étiquettes Monstre et Horreur avec effets.

### 23.2 Valeurs par défaut 🔶 à confirmer par l'auteur

| # | Sujet | Référence |
|---|---|---|
| 1 | Choix de la main : 10 cartes parmi la Collection | §9.1 |
| 2 | Toutes les cartes retournent à la Collection après le match | §9.8 |
| 3 | Butin : 1 carte parmi 3 de la main adverse | §9.8 |
| 4 | Collection de départ (10 cartes) | §7.5 |
| 5 | Glacière (3 emplacements) | §11.2 |
| 6 | Pile requise pour le Mixeur Surchauffé | §11.1 |
| 7 | Règles du Soldeur | §11.4 |
| 8 | Boss : carte de départ « Heures sup' » | §9.10 |
| 9 | Défaite : rejouer + 5 crans | §9.9 |
| 10 | `STAGE_LENGTH` = 15 et budgets des mains adverses | §6.6, §10.3 |
| 11 | Pas de limite de temps par tour | §9.4 |
| 12 | Main de 10 et plateau 5×2, sous réserve de la simulation | §9.13 |
| 13 | Transfert d'Héritage = 50 % des points | §8.2 |

### 23.3 Contenu à écrire par l'auteur
Répliques du narrateur (~120), textes d'ambiance des cartes, événements absurdes, noms définitifs des personnages, texte de la fin, choix des polices, direction des musiques.

### 23.4 Révisions
- **v1.0** : document initial.
- **v1.1** : vieillissement continu de toutes les cartes sauf la Glacière, avec stade verrouillé sur le plateau (§6.3) ; cartes de l'IA qui ne vieillissent jamais et aucun cran ajouté par ses poses (§6.2) ; « en face » défini comme un miroir strict, Chat inactif en ligne Arrière (§8.1) ; effet inactif renvoyé avec sa raison (§8.1) ; PANIC sans effet après un « Passer » (§9.5) ; garde-fou de dimensionnement (§9.13) ; sauvegarde asynchrone, stockage persistant, export/import optionnel (§20) ; origine de la graine du hasard (§18.8, §20).