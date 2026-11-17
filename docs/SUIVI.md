# Suivi des demandes de l'auteur

Toutes les demandes et remarques de l'auteur, avec leur état, pour ne rien perdre. Mis à jour à chaque séance.
États : ✅ fait · 🔧 à faire · 👀 fait, à revoir · ❓ décision en attente · 🧪 à l'essai.
Les points ✅ sont dans `docs/SUIVI-archive.md` (rien n'est perdu ; déplacés tels quels à la séance 51).

## Ouvert

### Personnage
| Demande | Séance | État | Notes |
|---|---|---|---|
| Saut (secrets, monter sur des tabourets…) | 5 | 🔧 | Choix B (séance 6) : **saut libre** avec un bouton, partout, comme dans Paper Mario. À construire après le prototype A. VISION.md non modifié (à la demande de l'auteur seulement). |



### Fluidité
| Constat | Séance | État | Notes |
|---|---|---|---|
| Banc d'essai sur le téléphone (9756425) : 58 i/s, p95 16,6 ms, mais p99 32,9 ms, 5 images > 33 ms, 163 images > 20 ms (5 %), calcul JS pire 21,3 ms | 9 | 🔧 | Séance 10 : deux bancs (5973115). Normal : 124 images > 20 ms (3,7 %), 3 > 33 ms, calcul JS pire 15 ms. Caméra immobile : 47 images > 20 ms (1,4 %), 3 > 33 ms, calcul pire 8,9 ms. **Le défilement de la caméra cause environ 60 % des saccades ; le reste a une autre cause.** Saccades isolées (1 à 3 images). Séance 11 : l'auteur veut d'abord un diagnostic fiable → **diagnostic en 4 configurations** construit (marche oui/non × caméra mobile oui/non, 60 s de chauffe, 3 × 60 s par configuration). En attente du rapport. **Pas d'essai PixiJS avant d'avoir examiné les résultats ensemble.** Séance 12 : résultats analysés (voir journal). Décision de l'auteur : mesurer d'abord (tests T0, T1, T2 sur le téléphone, sans changer le code), puis corriger une chose à la fois avec comparaison avant/après. PixiJS seulement si le système actuel ne peut pas atteindre les objectifs. |
| Chargement du lieu : 3,9 s sur le téléphone avec le rayon long | 9 | 🔧 | Séance 10 : 1,2 s au rechargement (décor du fond 0,39 s). Acceptable pour l'instant. Séance 53 : à mesurer sur le téléphone (décision : ne peut se juger qu'en mesurant). |
| Chargement du lieu : 8,2 s sur le téléphone | 5 | 🔧 | Séance 6 : 1,4 s au rechargement (le décor du fond prend 0,44 s). Les 8 s venaient sans doute du premier téléchargement. À surveiller quand les vrais dessins arriveront. Séance 53 : à mesurer sur le téléphone (décision : ne peut se juger qu'en mesurant). |
| Rapport DBG du téléphone (a5ddd48, rayon, plein écran, ~47 s de jeu) : 61 i/s, p95 16,5 ms, 9 images > 33 ms depuis la remise à zéro (pire 82 ms), calcul JS moy 1,3 ms, pire 10,6 ms ; chargement du rayon 872 ms (fond 614 ms, dans le noir) | 63 | 🔧 | Objectifs pas atteints (images > 33 ms, une fois > 8 ms de calcul), mais la cause n'est pas connue : on ne sait pas ce qui se passait pendant les saccades, ni l'état du téléphone (batterie, branché, chaud). Prochaine mesure proposée : banc d'essai dans chaque lieu, téléphone en bon état, puis DBG remis à zéro juste avant 5 scans. Banc du rayon (b122fea, 3 tours, 57 s) : 59,6 i/s, p95 16,5 ms, p99 32,8 ms, 3 images > 33 ms (0,09 %), 73 > 20 ms (2,2 % ; séance 10 : 3,7 %), calcul JS moy 0,8 ms, pire 13 ms (caméra en mouvement, en marche). Saccades isolées (2 images de suite au plus), 2,6 fois plus fréquentes caméra en mouvement (3,4 % contre 1,3 %). Mesure des 5 scans (b122fea, ~26 s) : 3 images > 33 ms (pire 49 ms), calcul JS p95 3,5 ms (banc sans scan : 1,8), pire 12,2 ms. Saccades un peu plus fréquentes qu'en marchant seulement, mais pas attribuables précisément (le rapport ne dit pas à quel moment). En attente : banc du hall ; proposition : ajouter des scans au banc d'essai pour les classer. |
| Son : latence de sortie 176 ms sur le téléphone | 6 | 🔧 | Les pas peuvent sonner un peu en retard. À vérifier au ressenti. Séance 53 : à mesurer sur le téléphone (décision : ne peut se juger qu'en mesurant). |

### Réflexion pour plus tard : un rendu « intelligent » de la profondeur
Demande de l'auteur : le personnage pourra changer de plan ; garder ce qui sert la profondeur et la direction artistique sans calculer les surfaces invisibles. Principes, à confirmer par les mesures avant toute construction :
- décrire dans les données de chaque lieu les plans de profondeur et ce qui cache quoi (déjà en partie : pile de calques, points de référence) ;
- ne rien dessiner qui soit toujours caché ; mais **mesurer** chaque façon de l'éviter (T3 a montré qu'une solution logique peut coûter plus cher) ;
- éviter de multiplier les calques qui bougent ; préférer peu de calques bien choisis ;
- le changement de plan du personnage passe par l'ordre d'affichage (déjà en place), pas par de nouveaux calques.

### Histoire et sens du jeu (séance 28)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Filtres de cartes futurs : vieillissement, fusions et stade (a, b et c) | 44 | ❓ | Prototype B, quand ces familles existeront. Cohérent : ce sont des axes différents (deux rangées : type, état). |
| Dos de la carte qui se retourne « pas super » | 49 | 🔧 | À revoir plus tard (demande de l'auteur). |
| Confiance héros–Épaisseur : noter en détail, intégrer comme essai | 39 | 🧪 | GAME_DESIGN.md (détails ❓) ; répliques selon la confiance (haute ≥ 1, basse ≤ −1) à l'essai. |
| L'accueil, un lieu à part (hall, portique, agent, comptoir) | 37 | 🔧 | Noté dans HISTOIRE, PERSONNAGES et PROTOTYPES (étape après A5, à proposer seulement après validation de A5). Rien de construit. Séance 51 : A6 en cours (1/3 construit). |
| Nom du deck (« courses » provisoire) | 36 | ❓ | Pistes proposées en séance 36 ; renommer « Panier » dans le jeu une fois choisi. |
| Capacités et panier plein | 36 | ❓ | [TEMP] panier = 6 (⚙ → Scanner) ; panier plein : scan refusé en attendant le choix de l'auteur (options proposées en séance 36). |
| Qui donne le jeton de caddie | 36 | ❓ | Pistes : le Vieux Monsieur avant sa mort ; ou rendre son caddie à la Caisse Finale pour récupérer sa pièce (le passeur des morts). |
| Narrateur A4 | 31 | 🔧 | Séance 32 : bande au haut-parleur, machine à écrire, annonce et petits bips, 12 répliques [TEMP] sur 8 moments, rare et sans répétition, fil « Client » → « Article non référencé » (choix A). **À tester par l'auteur.** Séance 33 : apartés du héros ajoutés. **Validation d'A4 proposée** (après un test rapide de fluidité si l'auteur le souhaite). |
| Pourquoi mettre des cartes dans un Panier ? | 28 | ❓ | Toujours ouvert (docs/HISTOIRE.md). Le Caddie jouable (A5) en sera la forme physique. |
| Adapter l'effet de transformation et les bruitages à l'histoire | 28 | 🔧 | Après le choix de la piste. |
| Style des décors | 29 | 🧪 | Crayon de couleur pour personnages, produits et décors : à tester au prototype D (docs/DIRECTION_ARTISTIQUE.md). |

### Questions à poser plus tard (séance 33, sans trancher)
| Question | Séance | État | Notes |
|---|---|---|---|
| Le Mixeur et le Scotch sont rangés dans « Stables » alors qu'ils changent de stade | 33 | ❓ | À voir avec la page de règles du prototype B. |
| L'étiquette « malus » (« se pose chez l'adversaire ») vient du plateau | 33 | ❓ | À redéfinir pour le face à face (ex. « carte à lancer sur l'ennemi »), dans la page de règles du prototype B. |

### Documentation et architecture (séance 29)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Découper src/main.js (≈ 1 250 lignes à la séance 50) | 29 | 🔧 | Repris dans l'audit de la séance 50 (point 11) : en attente de validation. |
| Plan du magasin (affiche ou dépliant, dans les Objets) pour retrouver son caddie ; « plan », pas « carte » | 50 | ❓ | GAME_DESIGN.md. Plus tard. |
| Audit de l'architecture et de la fluidité avant A6 et A7, sans rien modifier | 50 | ❓ | Fait (rapport dans le JOURNAL, séance 50). 15 points ; **l'auteur valide une correction à la fois**, banc d'essai sur le téléphone avant et après pour la fluidité. |
| Audit, points 2 et 4 : construire / quitter / reconstruire un lieu ; images du lieu libérées | 50 | 👀 n° 1 | `scene/placeView.js`, `loadPlace` / `unloadPlace`, `releaseImages`. Testé par 3 allers-retours (rien ne s'accumule). Banc d'essai à refaire sur le téléphone (comparer à `2aa4b77`). Transition, sorties et préchargement : avec A6. |
| Audit, point 6 : chemin recalculé à chaque mouvement du doigt | 50 | 👀 n° 2 | Au plus un calcul par image. Testé. À mesurer sur le téléphone plus tard (décision de l'auteur). Points 7 à 15 : peuvent attendre. |
| A6 (1/3) : l'accueil, lieu séparé ; aller-retour rayon ↔ accueil avec fondu | 51 | 👀 n° 3 | Hall provisoire, sorties dans les données, état « transition », lieu chargé dans le noir et ancien lieu libéré. À mesurer sur le téléphone : temps du changement (rapport DBG). Restent : présentoir déplacé et départ à l'accueil (2/3) ; agent et portiques (3/3) ; comptages et banc de l'accueil. Séance 55 (2/3) : présentoir déplacé dans le hall (agrandi à 2 800 px, deux haut-parleurs), la partie commence dans le hall ; reste l'agent et les portiques (3/3). |

### À rappeler à l'auteur : points 7 à 15 de l'audit (séance 50), pas encore traités
| Point | État | Notes |
|---|---|---|
| 7. La page est mesurée à chaque image (bulle, étoiles, doigt) | 🔧 | `scene/stage.js` : retenir la mesure une fois. Petit. |
| 8. Éléments créés en plein jeu au moment du scan (carte du Panier, carte qui vole, icône d'objet) | 🔧 | Préparer les cartes au chargement ; ajouter un scan au banc. Petit à moyen. |
| 9. Animations CSS qui continuent en pause et sous les menus | 🔧 | Les figer hors du jeu. Petit. |
| 10. La rencontre est chargée en effets (un calque par mot, 4 bandes, lueur) | 🔧 | Mesurer d'abord sur le téléphone (DBG pendant la rencontre). |
| 11. `main.js` trop gros | 🔧 | Séance 54 : découpé en 3 étapes (1 370 → 932 lignes). Reste au-dessus de 600 : suite à décider (règles de scan et de panier plein, traitement des commandes, fonctions de test). |
| 12. Logique de jeu hors de `core/` (échange du panier plein, marche de la rencontre, règles de la grande carte) | 🔧 | Petit à moyen. |
| 13. Code mort (`setTarget`, `open_`, `sprite.stats`, `dust.counter`) | 🔧 | Séance 54 : Knip installé, aucune fonction partagée inutilisée. Ces 4 restes ne sont pas vus par Knip (membres d'objets, ou utilisés par les tests seulement). Petit. |
| 14. Écarts documents / code (ARCHITECTURE, SUIVI, tests dans un seul fichier) | 🔧 | Petit. |
| 15. Images de plus de 4 096 pixels réels réduites sans prévenir | ❓ | Règle à décider avant de dessiner le vrai hall. |

### Remise en ordre (séances 52 et 53)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Séance 2 de remise en ordre (garde-fous automatiques) | 52 | ✅ | Séance 53 : garde-fous dans npm test, mémoire après changements de lieu (fuite corrigée), sécurités Claude Code, skill audit. |

### Séance 54
| Demande | Séance | État | Notes |
|---|---|---|---|
| Découper le CSS par sujet (`style.css`, 1 198 lignes) | 54 | 🔧 | Exception de taille approuvée par l'auteur en attendant. |
| Suite du découpage de `main.js` (932 lignes, limite 600) | 54 | ❓ | Proposition : règles de scan et de panier plein dans un fichier à part de `src/game/`, puis traitement des commandes. Accord de l'auteur requis. |

### Séance 55
| Demande | Séance | État | Notes |
|---|---|---|---|
| Limites du test des comptages pour le hall d'accueil | 55 | ❓ | Séance 56 : le hall est mesuré à chaque test (60 éléments, 2 calques, 6 images visibles, surface 1,06 écran, 34 images, 3,25 Mpx, rien créé en jeu). Limites proposées à l'auteur ; à écrire dans `tests/e2e/comptages-limites.json` seulement après son accord. |
| Peut-on entrer dans le rayon sans Scanette ? | 55 | ✅ | Séance 56, réponse de l'auteur : oui (A), on garde le rappel du haut-parleur et le scan refusé. |

### Séance 56
| Demande | Séance | État | Notes |
|---|---|---|---|
| A6 (3/3) : agent de sécurité devant le portique visé, annonce d'interdiction, pensée « Hum… étrange… » | 56 | 👀 | Construit, à tester par l'auteur, puis validation d'A6. |
| Pluie animée derrière les baies vitrées du hall | 56 | 👀 | Construite. Figée avec « réduire les animations ». Fluidité à vérifier sur le téléphone. |

### Séance 57
| Demande | Séance | État | Notes |
|---|---|---|---|
| Hall refait d'après l'image de référence (mur vitré en perspective, portiques en diagonale, premier plan, départ à droite) | 57 | 👀 | Construit, à tester par l'auteur. |
| Agent : style du héros, bulle, héros figé, poussée s'il force | 57 | 👀 | Construit. Réplique [TEMP] de l'auteur. |
| Pluie, ruissellement, ronds dans les flaques, tapis mouillé, parking de nuit | 57 | 👀 | Sans Canvas : SVG et CSS. Fluidité à vérifier sur le téléphone. |
| Hôtesse au comptoir, « !! » du héros, pensée « Hum… étrange… » | 57 | ✅ | Séance 58 : « !! » fait ; pensée gardée ; hôtesse avec A8. |
| Hôtesse derrière le comptoir | 58 | 🔧 | Avec A8 (échange du caddie au comptoir). |
| Personnages et portiques qui clignotent dans le hall (téléphone) | 58 | 👀 | Séance 59 : pas la pluie (essai de l'auteur). Causes mesurées : l'agent gagnait et perdait son calque graphique à chaque pose ; il prenait le même niveau d'affichage qu'un portique. Corrigé ; un essai vérifie que ni l'agent ni les portiques ne changent de calque. À confirmer sur le téléphone. |
| Agent : une seule fois au milieu, en retrait ; « Stop ! » et demi-tour du héros | 59 | 👀 | Construit, à tester. |
| L'agent clignote à l'ouverture et à la fermeture de sa bulle | 60 | 👀 | Séance 61 : la correction de la séance 60 (un calque par pose) était la mauvaise ; diagnostic de l'auteur. L'agent change maintenant de pose comme le héros (`scene/poses.js`) ; sa boîte a la taille du dessin (sans taille, chaque pose avait son calque : mesuré). Règle écrite (ARCHITECTURE §4, src/scene/CLAUDE.md). Essai : aucun calque créé ni changé par une pose. Si l'agent ne clignote plus, l'auteur valide. |
| Demi-tour du héros seulement après la fin de la bulle de l'agent | 61 | 👀 | Fait. |
| Héros immobile tant que la bulle de l'agent est ouverte ; bulle fermée seule au bout de 3 s | 60 | 👀 | Fait. Ses répliques s'écrivent plus vite (en 1,2 s au plus) pour être lues avant. Durée : ⚙ → Narrateur. |
| Pluie qui glisse de côté ; haut de la vitre clair | 58 | 👀 | Corrigés : pluie sur un calque qui suit le mur ; plafond découpé le long du mur de côté. |
| Limites des comptages du hall | 57 | ❓ | Nouvelles mesures (83 éléments, 38 images, 4,5 Mpx) : à proposer de nouveau. |

### Séance 62 (robustesse des changements de lieu)
| Demande | Séance | État | Notes |
|---|---|---|---|
| 1. Chargement de lieu qui échoue : retour au départ, annonce, diagnostic, « Réessayer » | 62 | ✅ | Testé (image bloquée). |
| 2. Rien ne reste en mémoire après un échec (`loadImages`) | 62 | ✅ | Test unitaire. |
| 3. Historique des temps d'image remis à zéro à chaque lieu | 62 | ✅ | |
| 4. Règle d'échange du panier dans `core/world.js` | 62 | ✅ | Sans changement de comportement. |
| 5. Carte reposée qui vient d'un autre lieu : où va son produit ? | 62 | ✅ | Séance 63 : échange → le produit remplace le produit scanné, sur ce rayon-ci ; abandon (à venir) → retour au lieu et à la place d'origine (GAME_DESIGN). L'échange entre lieux se construit avec A7. |
| Échange d'une carte venue d'un autre lieu | 63 | 🔧 | Avec A7 (aujourd'hui seul le rayon a des produits). |
| 6. Éléments créés pendant le jeu par les cartes | 62 | ✅ | Séance 63 (« on corrige si ce n'est pas risqué ») : carte volante préparée une fois ; textes du haut-parleur et des cartes mis à jour sans nouveaux nœuds. Reste la petite carte ajoutée au Panier à chaque scan (panneau caché ; correction plus risquée : liste, onglets, clavier). Essai : un scan ne crée qu'elle. |
| Petite carte du Panier créée à chaque scan | 63 | ❓ | Écart restant, faible coût (panneau caché). À corriger plus tard si l'auteur le souhaite (cases préparées d'avance). |
| 7. Test de mémoire, aussi avec un échec au milieu | 62 | ✅ | |

### Séance 64 (règles professionnelles, séance A)
| Demande ou écart | Séance | État | Notes |
|---|---|---|---|
| Règles inscrites (affichage, parallaxe, lumière, boucle, entrées, son, sauvegarde, appareils, menus, dialogues, chargements, méthode, index) | 64 | ✅ | Liste et emplacements : rapport de la séance 64 (JOURNAL). |
| Profils d'appareils (PC modeste, PC rapide, smartphone) | 64 | ❓ | Options proposées ; à construire après accord (séance B). |
| Chantier son (diagnostic, essai long, corrections) | 64 | 🔧 | Séance 65 : mesure en place (diagnostic : sons joués, notes, nœuds actifs effets / musique, changements d'état ; ⚙ → Diagnostic → « Essai son long »). Constat dans le navigateur de test : en 2 s de marche, 85 nœuds d'effets et 96 de musique créés, aucun libéré. Mesure « avant » du téléphone (4c5b1e3, essai de 2 min dans le hall) : 1 975 nœuds d'effets et 5 549 de musique jamais libérés. Correction n° 1 faite (chaque son libère ses nœuds à sa fin) : en attente de la mesure « après » (essai de 5 min). Suivantes, une à la fois : reprise du son au geste après une interruption ; sons courts préparés une fois ; limite par catégorie. |
| Banc d'essai du hall (téléphone, 4c5b1e3, avec le son) : 57 i/s, p95 32,7 ms, 22 images > 33 ms (0,31 %), 6,7 % > 20 ms (rayon : 2,2 %), même caméra immobile (5,9 %) | 65 | ❓ | Le hall est nettement moins fluide que le rayon. Cause inconnue (pluie, parallaxe, son actif ?). À mesurer après le chantier son, avec les interrupteurs d'essai. |
| Entrées : pas d'essai automatique à la manette | 64 | ❓ | Clavier, souris et doigt ont leurs essais ; la manette se simule dans le navigateur de test (faux `getGamepads`). |
| Entrées : les aides à l'écran ne suivent pas le dernier appareil utilisé | 64 | ❓ | Choisies une fois au démarrage (doigt ou clavier) ; rien pour la manette. |
| Entrées : pas de pause automatique si la manette est débranchée | 64 | ❓ | Le branchement et le débranchement sont bien détectés. |
| Entrées : manette jamais essayée pour de vrai | 64 | 🔧 | Une étape n'est validée qu'après un essai sur une vraie manette. |
| Entrées : zones à toucher de moins de 44 px | 64 | ❓ | Boutons du jeu et du HUD : 44 px. Menus de réglages, onglets, diagnostic : 36 à 40 px (9 endroits). |
| Bulle qui se ferme seule : durée selon le texte (2,5 s + 50 ms par lettre) | 64 | ❓ | Le code garde la durée fixe de l'agent (3 s, séance 60) : à changer. |
| Cartes (volante, Panier) : changement d'image (`src`) en jeu | 64 | ❓ | La règle l'interdit pour les personnages et objets de la scène ; les cartes montrent l'image du produit scanné (image déjà décodée). À mesurer avant de décider. |
| « Lire la page avant de la modifier » : le compteur du Panier force une mise en page (`offsetWidth`) pour relancer son animation | 64 | ❓ | À chaque scan. Petit écart, connu. |
| Chargement : pas de signe d'attente au-delà de 0,3 s | 64 | ❓ | Le fondu reste noir pendant le chargement (0,7 à 1,4 s pour le rayon sur le téléphone). |
| Parallaxe : « réduire les animations » ne diminue pas encore son amplitude ; interrupteur d'arrondi à ajouter (🧪) | 64 | ❓ | |
| Direction de la lumière du hall et du rayon | 64 | ❓ | À définir par l'auteur (DIRECTION_ARTISTIQUE). |
| Téléphone : boutons du HUD en haut à droite, pas à portée de pouce | 64 | ❓ | Règle des menus. |
| Cahier des charges des images (`IMAGES.md`, avant D) : chaque dessin rogné au plus près du trait, avec son **point d'appui au sol** (les pieds) | 64 | 🔧 | Pour que l'ombre et l'ordre devant/derrière tombent juste sans retoucher le code. |

## Points 👀 restants (à revoir avec A6)
Séance 53 : l'auteur m'a laissé trancher. Règle appliquée : ce qui fait partie d'une étape validée (A1 à A5) ou a été accepté ensuite → ✅ validé (archive) ; ce qui ne se juge qu'en mesurant sur le téléphone (chargement, son) → 🔧 à mesurer ; ce qui fait partie d'A6, en cours → reste 👀 jusqu'à la validation d'A6. Aucun point abandonné.

1. Audit, points 2 et 4 : construire / quitter / reconstruire un lieu ; images du lieu libérées *(Documentation et architecture (séance 29))*
2. Audit, point 6 : chemin recalculé à chaque mouvement du doigt *(Documentation et architecture (séance 29))*
3. A6 (1/3) : l'accueil, lieu séparé ; aller-retour rayon ↔ accueil avec fondu *(Documentation et architecture (séance 29))*

## Règles de travail ajoutées par l'auteur
- Donner le lien pour jouer à chaque fin de conversation (séance 4).
- Noter tous les changements et modifications pour ne pas se perdre : ce fichier (séance 4).
- Garder toutes les options dans le menu des réglages, même validées (séances 5 et 7).
- Économiser la lecture : ne pas relire à chaque fois de gros documents ; documentation courte et à jour avec le code (séance 29).
- Documents de conception courts (50 à 80 lignes), balisés ✅ 🧪 ❓ [TEMP], lus seulement à l'étape concernée, jamais en début de séance (séance 31).
