# Suivi des demandes de l'auteur

Toutes les demandes et remarques de l'auteur, avec leur état, pour ne rien perdre.
Mis à jour à chaque séance. États : ✅ fait · 🔧 à faire · 👀 fait, à revoir plus tard · ❓ décision en attente.

## Personnage
| Demande | Séance | État | Notes |
|---|---|---|---|
| Retournement de la feuille gauche/droite, façon Paper Mario | 2 | 👀 | « C'est ok mais à voir ». Durée réglable (0,18 s). |
| Retournement aussi de face à dos | 2 | ✅ | Confirmé par l'auteur (séance 4). |
| Images de marche (4 face, 4 dos) | 2 | ✅ | Provisoires, générées. |
| Clignement des yeux à l'arrêt | 2 | ✅ | Provisoire. |
| De dos, aller à gauche/droite : voir son visage, pas l'arrière de la tête | 3 | ✅ | De dos seulement en allant vers le fond. |
| Jambes en « moonwalk » | 3 | ✅ | Le pied levé passe devant. |
| Rythme des jambes | 4 | ✅ | « Oui » (bon rythme). |
| Respiration à l'arrêt | 5 | ✅ | Faite en A2 (séance 6), avec rebond, écrasement à l'arrêt, ombre au sol et taille selon la profondeur. Tout réglable. |
| Petit nuage de poussière à chaque pas, comme dans Paper Mario | 5 | ✅ | Taille, durée, opacité réglables ; désactivable. |
| Saut (secrets, monter sur des tabourets…) | 5 | 🔧 | Choix B (séance 6) : **saut libre** avec un bouton, partout, comme dans Paper Mario. À construire après le prototype A. VISION.md non modifié (à la demande de l'auteur seulement). |

## Marche et contrôles
| Demande | Séance | État | Notes |
|---|---|---|---|
| Sensation de marche (vitesse, démarrage, arrêt) | 4 | ✅ | Profil « Paper Mario » choisi (séance 5), devenu la valeur par défaut. Les autres profils restent dans le menu. |
| Toucher ou joystick virtuel sur téléphone | 4 | ✅ | Séance 8 : toucher par défaut, **joystick désactivé par défaut** (option gardée dans ⚙ → Contrôles). Vérifié par un test automatique. |
| Contourner seul les objets quand on touche derrière | 4 | ✅ | Choix A, validé en séance 5. |
| Difficile de viser le bord de la zone au doigt | 7 | ✅ | Toucher hors du sol (étagère, rayon de devant) envoie jusqu'au bord de la zone. Testé automatiquement. Validé (séance 8). |
| Essai : scanner un produit posé sur une table ou dans le caddie, de profil ou de face | 28 | 👀 | Pomme sur une petite table de dégustation (fin du rayon), boîte d'œufs dans le caddie. De côté : de profil ; derrière : de face ; devant : de dos. Portées réglables (⚙ → Scanner). À tester par l'auteur. |
| Scanner naturellement au doigt par un double toucher | 27 | 👀 | Double toucher (ou double clic) sur un produit : le personnage va devant et le scanne. Délai et écart réglables (⚙ → Contrôles). À tester par l'auteur. |

## Décor
| Demande | Séance | État | Notes |
|---|---|---|---|
| Passer derrière le caddie et le présentoir « -30 % » | 2 | ✅ | |
| Caddie et carton « -30 % » qui clignotent ou disparaissent par moments | 27 | ✅ | Cause trouvée (séance 27) : le navigateur leur créait un calque à chaque passage du personnage derrière eux, puis le retirait. Corrigé : calque fixe. Interrupteur ⚙ → Affichage. Confirmé par l'auteur (séance 28). La bascule existait déjà en A1 et A2 (mesuré) : seule sa visibilité a changé. |
| Zone de marche jusqu'en bas de l'écran | 3 | ✅ | Séance 7 : agrandie encore, du pied de l'étagère du fond (z 264) au bord bas de l'écran (z -195). |
| Rayon en bas, en transparence (personnage entouré de rayons) | 3 | ✅ | Opacité 0,55 : « oui pour le moment ». |
| Le plein écran cachait une partie du décor (écran 20:9) | 6 | ✅ | Réglé avec la caméra : toute la hauteur est toujours visible, un écran allongé montre plus de largeur. Le personnage paraît un peu plus petit sur téléphone : réglage « Zoom ». |
| Rayon plus long que l'écran, caméra qui suit, rayons lointains (parallaxe) | 6 | ✅ | A2 (2/2). Validé par l'auteur (séance 7). |
| Plein écran sur d'autres formes d'écran | 7 | ✅ | Testé automatiquement en 4:3, 16:10, 16:9, 20:9 et 21:9 : toute la hauteur, personnage et boutons visibles. |

## Son
| Demande | Séance | État | Notes |
|---|---|---|---|
| Bruits de pas | 3 | ✅ | Son étouffé, volume 0,35 : validé en séance 5. Garder toutes les options dans le menu. |
| Petite musique de supermarché (provisoire) | 3 | 👀 | « On la changera plus tard. » |
| La musique grésille sur le téléphone | 5 | ✅ | Réglé (confirmé par l'auteur, séance 6). |

## Fluidité
| Constat | Séance | État | Notes |
|---|---|---|---|
| Téléphone : 61 images/s, p95 16,5 ms, calcul 0,6 ms en moyenne | 5 | ✅ | Objectifs presque atteints : 4 images > 33 ms sur 2206. |
| Test T3 : rayons lointains, ancien contre nouveau | 15 | ✅ | Même protocole que le test rapide (4 conditions, ≈ 6 min). |
| Test plus court mais exploitable | 13 | ✅ | **Test rapide T0/T1/T2** (≈ 7 min) : référence, « réduire les animations », rayon de devant invisible, mesurés en alternance par blocs de 20 s (ordre inversé un tour sur deux), en marche avec caméra fixe et caméra mobile. Verdict avec marge d'incertitude à 95 %. Remplace les trois tests séparés. |
| Banc d'essai (parcours automatique, rapport à copier) | 8 | ✅ | ⚙ → Diagnostic → « Lancer le banc d'essai » : chauffe 3 s + 3 tours (~1 min). Interrupteurs d'essai : sans rayon de devant, sans rayons lointains, sans poussière, sans ombre. **À lancer par l'auteur sur son téléphone.** |
| Test automatique des comptages | 8 | ✅ | À chaque publication. Mesures : 39 éléments, 4 calques, 10 images visibles, surface d'image 1,85 × l'écran, 5,5 Mpx ; rien créé pendant le jeu. Limites dans tests/e2e/comptages-limites.json. |
| Banc d'essai sur le téléphone (9756425) : 58 i/s, p95 16,6 ms, mais p99 32,9 ms, 5 images > 33 ms, 163 images > 20 ms (5 %), calcul JS pire 21,3 ms | 9 | 🔧 | Séance 10 : deux bancs (5973115). Normal : 124 images > 20 ms (3,7 %), 3 > 33 ms, calcul JS pire 15 ms. Caméra immobile : 47 images > 20 ms (1,4 %), 3 > 33 ms, calcul pire 8,9 ms. **Le défilement de la caméra cause environ 60 % des saccades ; le reste a une autre cause.** Saccades isolées (1 à 3 images). Séance 11 : l'auteur veut d'abord un diagnostic fiable → **diagnostic en 4 configurations** construit (marche oui/non × caméra mobile oui/non, 60 s de chauffe, 3 × 60 s par configuration). En attente du rapport. **Pas d'essai PixiJS avant d'avoir examiné les résultats ensemble.** Séance 12 : résultats analysés (voir journal). Décision de l'auteur : mesurer d'abord (tests T0, T1, T2 sur le téléphone, sans changer le code), puis corriger une chose à la fois avec comparaison avant/après. PixiJS seulement si le système actuel ne peut pas atteindre les objectifs. |
| Chargement du lieu : 3,9 s sur le téléphone avec le rayon long | 9 | 👀 | Séance 10 : 1,2 s au rechargement (décor du fond 0,39 s). Acceptable pour l'instant. |
| Chargement du lieu : 8,2 s sur le téléphone | 5 | 👀 | Séance 6 : 1,4 s au rechargement (le décor du fond prend 0,44 s). Les 8 s venaient sans doute du premier téléchargement. À surveiller quand les vrais dessins arriveront. |
| Son : latence de sortie 176 ms sur le téléphone | 6 | 👀 | Les pas peuvent sonner un peu en retard. À vérifier au ressenti. |

Historique détaillé de l'enquête sur la fluidité (séances 11 à 26 : appareil, conditions, campagnes, résultats) : **annexe en bas de docs/JOURNAL.md**.

## Réflexion pour plus tard : un rendu « intelligent » de la profondeur
Demande de l'auteur : le personnage pourra changer de plan ; garder ce qui sert la profondeur et la direction artistique sans calculer les surfaces invisibles. Principes, à confirmer par les mesures avant toute construction :
- décrire dans les données de chaque lieu les plans de profondeur et ce qui cache quoi (déjà en partie : pile de calques, points de référence) ;
- ne rien dessiner qui soit toujours caché ; mais **mesurer** chaque façon de l'éviter (T3 a montré qu'une solution logique peut coûter plus cher) ;
- éviter de multiplier les calques qui bougent ; préférer peu de calques bien choisis ;
- le changement de plan du personnage passe par l'ordre d'affichage (déjà en place), pas par de nouveaux calques.

## Étapes
| Étape | État | Notes |
|---|---|---|
| A1 — le personnage est agréable à déplacer | ✅ | **A1 validée : 1445d25** (séance 6). |
| A2 — le personnage semble évoluer dans un décor profond | ✅ | **A2 validée : 6be7130** (séance 26). Rayon de devant gardé entier (« on verra plus tard ») ; fluidité acceptée en l'état (choix C) ; essai PixiJS non retenu pour l'instant. |
| A3 — scanner un produit est satisfaisant | ✅ | **Validée : 630fec0** (séance 28). Limites du test des comptages relevées (80/5/20/32) : validées par l'auteur. |

## Histoire et sens du jeu (séance 28)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Justifier le scanner dans l'histoire : scanner spécial ? quels objets ? pourquoi ? | 28 | 👀 | Séance 31 : ✅ douchette = technologie du magasin qui extrait l'essence ; produits figés hors du temps sur l'étagère, évolution dès le scan (docs/HISTOIRE.md). Reste ❓ : scanner des êtres vivants ? |
| Mémoire du héros (jusqu'aux portes automatiques, pas l'aplatissement) ; piste d'intro sans personnage en 3D | 34 | ✅ | Inscrit dans HISTOIRE.md (mémoire ✅, intro ❓) et PERSONNAGES.md. Rien de codé. |
| Documents sur l'histoire, le game design, le style | 30 | ✅ | Séance 31 : 5 fichiers courts créés (HISTOIRE, PERSONNAGES, GAME_DESIGN, REGLES_CARTES_COMBAT, DIRECTION_ARTISTIQUE), lus seulement à l'étape concernée. |
| Archiver l'ancien GAME_DESIGN.md de Maxi-Gouffre | 31 | ✅ | Séance 32 : `docs/archive/maxi-gouffre-GAME_DESIGN.md` ; 20 familles et 6 recettes listées dans REGLES_CARTES_COMBAT.md. |
| VISION.md : 4 familles de cartes, néons de magasin en zone 2 | 32 | ✅ | Choix A : deux précisions ajoutées à VISION.md à la demande de l'auteur. |
| Voir les haut-parleurs d'où sort la voix | 35 | 👀 | 5 haut-parleurs dessinés au plafond (décor du fond) ; celui le plus proche du héros émet des ondes, la bande s'affiche dessous avec une pointe vers lui. À tester. |
| Le personnage semble flotter au-dessus du carrelage | 35 | 👀 | Mesuré : semelle 3 px (face) à 6 px (dos) au-dessus du point de contact ; surtout, contour blanc sous la semelle et ombre pâle. Ajouté : ombre de contact sombre sous les pieds (0,6) et pieds enfoncés de 4 px ; réglables (⚙ → Personnage). À tester. |
| Comment arrêter un essai de diagnostic | 35 | ✅ | Bouton II, Échap ou B (résultats partiels gardés) ; rappel affiché sur la bannière de l'essai, désormais en bas de l'écran. |
| Où le joueur trouve-t-il la Scanette ? | 35 | ✅ | Séance 36 (choix A) : Scanettes et paniers en libre-service à l'accueil. **A5a construite** : présentoir au début du rayon, on prend la Scanette (obligatoire) et un panier à main ; héros mains vides au départ. À tester. |
| « Douchette » devient « Scanette » ; l'Extracteur | 36 | ✅ | Vocabulaire changé dans les documents actifs et les textes du jeu (pas dans l'archive ni les anciens rapports). La Scanette qui casse et l'Extracteur : moments de jeu **à construire plus tard (pas avant B ou C)**, questions ouvertes dans HISTOIRE.md. |
| A4 : l'aparté doit être un moment rare et marquant | 36 | 👀 | Séance 37 : tête de face (3 émotions [TEMP] : inquiet, complice, blasé), zoom de la caméra, bandes « cinéma », bords assombris, son grave et musique baissée ; héros immobile pendant l'aparté (toucher = passer) ; plus rare (150 s). Publié séance 38. |
| Menu du panier : onglets « Cartes » et « Objets » (noms provisoires) | 37 | 👀 | Construit séance 37 ; objets décrits dans data/objects.json ([TEMP]). |
| Panier plein : reposer une carte (choix B) | 37 | 👀 | Construit séance 37 : écran « Panier plein », toucher une carte la repose ([TEMP] abandonnée), puis le scan se fait ; « Annuler » sinon. |
| Le panier ne doit être en main qu'une fois pris | 37 | ✅ | Défaut trouvé : le style des objets tenus ignorait l'attribut « caché » (panier et Scanette de dos dessinés dès le départ). Corrigé, plus une règle générale : un élément caché n'est jamais affiché. Le test vérifie maintenant ce qui est vraiment visible. |
| Lien pour jouer avec « ?v=… » à la fin de chaque message | 37 | ✅ | Inscrit dans CLAUDE.md. |
| L'accueil, un lieu à part (hall, portique, agent, comptoir) | 37 | 📝 | Noté dans HISTOIRE, PERSONNAGES et PROTOTYPES (étape après A5, à proposer seulement après validation de A5). Rien de construit. |
| Nom du deck (« courses » provisoire) | 36 | ❓ | Pistes proposées en séance 36 ; renommer « Panier » dans le jeu une fois choisi. |
| Capacités et panier plein | 36 | ❓ | [TEMP] panier = 6 (⚙ → Scanner) ; panier plein : scan refusé en attendant le choix de l'auteur (options proposées en séance 36). |
| Qui donne le jeton de caddie | 36 | ❓ | Pistes : le Vieux Monsieur avant sa mort ; ou rendre son caddie à la Caisse Finale pour récupérer sa pièce (le passeur des morts). |
| Limites du test des comptages (A5a, aparté) | 36 | ✅ | 84 éléments, 38 images ; limites **88 éléments et 40 images validées** par l'auteur (séance 38) : priorité au PC, le téléphone sera adapté plus tard si besoin. |
| Apartés du héros (le joueur est son « Épaisseur ») | 33 | 👀 | 5 apartés [TEMP] (après l'accueil, scan dans le vide, inactivité, Panier), bulle de papier + froissement + bips plus graves, pivot vers l'écran à l'arrêt ; 2 réactions du haut-parleur (« parler au mur ») ; plus rares que les annonces (90 s), jamais deux voix à la fois, l'annonce passe avant. **À tester, puis valider (🧪 dans HISTOIRE et PERSONNAGES).** |
| Narrateur A4 | 31 | 🔧 | Séance 32 : bande au haut-parleur, machine à écrire, annonce et petits bips, 12 répliques [TEMP] sur 8 moments, rare et sans répétition, fil « Client » → « Article non référencé » (choix A). **À tester par l'auteur.** Séance 33 : apartés du héros ajoutés. **Validation d'A4 proposée** (après un test rapide de fluidité si l'auteur le souhaite). |
| Pourquoi mettre des cartes dans un Panier ? | 28 | ❓ | Toujours ouvert (docs/HISTOIRE.md). Le Caddie jouable (A5) en sera la forme physique. |
| Adapter l'effet de transformation et les bruitages à l'histoire | 28 | 🔧 | Après le choix de la piste. |
| Interaction avec les cartes dans le Panier | 28 | 👀 | Normal pour l'instant : le prototype A vérifie seulement « scanner est agréable ». Les cartes serviront au combat (prototype B). |
| Utilité du caddie, pouvoir le pousser | 28 | ✅ | **Séance 29 : le caddie devient une étape à part, après A4 et avant le combat** (docs/PROTOTYPES.md). Séance 31 : **A5 — Caddie jouable** = Panier physique qui suit le personnage, garé et repris, visuel selon le remplissage (docs/GAME_DESIGN.md). |
| Style des décors | 29 | 🧪 | Crayon de couleur pour personnages, produits et décors : à tester au prototype D (docs/DIRECTION_ARTISTIQUE.md). |

## Questions à poser plus tard (séance 33, sans trancher)
| Question | Séance | État | Notes |
|---|---|---|---|
| Le Mixeur et le Scotch sont rangés dans « Stables » alors qu'ils changent de stade | 33 | ❓ | À voir avec la page de règles du prototype B. |
| L'étiquette « malus » (« se pose chez l'adversaire ») vient du plateau | 33 | ❓ | À redéfinir pour le face à face (ex. « carte à lancer sur l'ennemi »), dans la page de règles du prototype B. |

## Documentation et architecture (séance 29)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Audit de l'architecture, comparaison avec l'ancien ARCHITECTURE.md de Maxi-Gouffre | 29 | ✅ | Organisation validée : docs/ARCHITECTURE.md (créé), docs/PROTOTYPES.md (plan recopié tel quel), ancien document en archive, SUIVI allégé. |
| Outils de mesure peut-être obsolètes (diagnostic en 4 configurations, campagne DEVANT2) | 29 | ✅ | Séance 30 (choix B) : **diagnostic en 4 configurations retiré** ; DEVANT2 gardée jusqu'à ce qu'on revoie le rayon de devant. |
| Découper src/main.js (≈ 590 lignes depuis la séance 30) | 29 | 🔧 | À la prochaine séance qui le touche beaucoup (A4 probablement). |

## Interface
| Demande | Séance | État | Notes |
|---|---|---|---|
| Menu des réglages rangé en onglets par thème | 7 | ✅ | Validé (séance 8). Garder toutes les options dans le menu. |

## Règles de travail ajoutées par l'auteur
- Donner le lien pour jouer à chaque fin de conversation (séance 4).
- Noter tous les changements et modifications pour ne pas se perdre : ce fichier (séance 4).
- Garder toutes les options dans le menu des réglages, même validées (séances 5 et 7).
- Économiser la lecture : ne pas relire à chaque fois de gros documents ; documentation courte et à jour avec le code (séance 29).
- Documents de conception courts (50 à 80 lignes), balisés ✅ 🧪 ❓ [TEMP], lus seulement à l'étape concernée, jamais en début de séance (séance 31).

## Questions de l'auteur (réponses données)
- Faut-il dessiner les personnages avant l'étape suivante ? Non : les dessins arrivent au prototype D, préparé une séance à l'avance avec docs/IMAGES.md (séance 5).
- Pourquoi le clignotement du caddie n'existait pas avant ? Mesuré (séance 28) : la bascule de calque était déjà là en A1 et A2, de façon identique. Ce n'est pas un défaut ajouté ensuite. Ce qui a changé, c'est sans doute sa visibilité (hypothèses non prouvées : plus d'images en mémoire depuis A3, et des images lentes qui le masquaient avant).
