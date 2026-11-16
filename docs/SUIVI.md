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
| Limites du test des comptages pour le hall d'accueil | 55 | ❓ | Le test ne couvre que le rayon. Ajouter le hall demande d'écrire dans `tests/e2e/comptages-limites.json` : accord de l'auteur requis (valeurs à proposer après mesure). |
| Peut-on entrer dans le rayon sans Scanette ? | 55 | ❓ | Aujourd'hui oui (comme avant) : le haut-parleur le rappelle près du passage, et le scan est refusé. Autre option : l'agent ou le haut-parleur bloque le passage. Décision de jeu, à l'auteur. |

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
