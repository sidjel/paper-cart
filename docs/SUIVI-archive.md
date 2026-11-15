# Suivi — archive des points faits (✅)

Déplacés tels quels depuis `docs/SUIVI.md` à la séance 51, sans rien perdre. Les points encore ouverts restent dans `docs/SUIVI.md`.

### Personnage
| Demande | Séance | État | Notes |
|---|---|---|---|
| Retournement aussi de face à dos | 2 | ✅ | Confirmé par l'auteur (séance 4). |
| Images de marche (4 face, 4 dos) | 2 | ✅ | Provisoires, générées. |
| Clignement des yeux à l'arrêt | 2 | ✅ | Provisoire. |
| De dos, aller à gauche/droite : voir son visage, pas l'arrière de la tête | 3 | ✅ | De dos seulement en allant vers le fond. |
| Jambes en « moonwalk » | 3 | ✅ | Le pied levé passe devant. |
| Rythme des jambes | 4 | ✅ | « Oui » (bon rythme). |
| Respiration à l'arrêt | 5 | ✅ | Faite en A2 (séance 6), avec rebond, écrasement à l'arrêt, ombre au sol et taille selon la profondeur. Tout réglable. |
| Petit nuage de poussière à chaque pas, comme dans Paper Mario | 5 | ✅ | Taille, durée, opacité réglables ; désactivable. |

### Marche et contrôles
| Demande | Séance | État | Notes |
|---|---|---|---|
| Sensation de marche (vitesse, démarrage, arrêt) | 4 | ✅ | Profil « Paper Mario » choisi (séance 5), devenu la valeur par défaut. Les autres profils restent dans le menu. |
| Toucher ou joystick virtuel sur téléphone | 4 | ✅ | Séance 8 : toucher par défaut, **joystick désactivé par défaut** (option gardée dans ⚙ → Contrôles). Vérifié par un test automatique. |
| Contourner seul les objets quand on touche derrière | 4 | ✅ | Choix A, validé en séance 5. |
| Difficile de viser le bord de la zone au doigt | 7 | ✅ | Toucher hors du sol (étagère, rayon de devant) envoie jusqu'au bord de la zone. Testé automatiquement. Validé (séance 8). |

### Décor
| Demande | Séance | État | Notes |
|---|---|---|---|
| Passer derrière le caddie et le présentoir « -30 % » | 2 | ✅ | |
| Caddie et carton « -30 % » qui clignotent ou disparaissent par moments | 27 | ✅ | Cause trouvée (séance 27) : le navigateur leur créait un calque à chaque passage du personnage derrière eux, puis le retirait. Corrigé : calque fixe. Interrupteur ⚙ → Affichage. Confirmé par l'auteur (séance 28). La bascule existait déjà en A1 et A2 (mesuré) : seule sa visibilité a changé. |
| Zone de marche jusqu'en bas de l'écran | 3 | ✅ | Séance 7 : agrandie encore, du pied de l'étagère du fond (z 264) au bord bas de l'écran (z -195). |
| Rayon en bas, en transparence (personnage entouré de rayons) | 3 | ✅ | Opacité 0,55 : « oui pour le moment ». |
| Le plein écran cachait une partie du décor (écran 20:9) | 6 | ✅ | Réglé avec la caméra : toute la hauteur est toujours visible, un écran allongé montre plus de largeur. Le personnage paraît un peu plus petit sur téléphone : réglage « Zoom ». |
| Rayon plus long que l'écran, caméra qui suit, rayons lointains (parallaxe) | 6 | ✅ | A2 (2/2). Validé par l'auteur (séance 7). |
| Plein écran sur d'autres formes d'écran | 7 | ✅ | Testé automatiquement en 4:3, 16:10, 16:9, 20:9 et 21:9 : toute la hauteur, personnage et boutons visibles. |

### Son
| Demande | Séance | État | Notes |
|---|---|---|---|
| Bruits de pas | 3 | ✅ | Son étouffé, volume 0,35 : validé en séance 5. Garder toutes les options dans le menu. |
| La musique grésille sur le téléphone | 5 | ✅ | Réglé (confirmé par l'auteur, séance 6). |

### Fluidité
| Constat | Séance | État | Notes |
|---|---|---|---|
| Téléphone : 61 images/s, p95 16,5 ms, calcul 0,6 ms en moyenne | 5 | ✅ | Objectifs presque atteints : 4 images > 33 ms sur 2206. |
| Test T3 : rayons lointains, ancien contre nouveau | 15 | ✅ | Même protocole que le test rapide (4 conditions, ≈ 6 min). |
| Test plus court mais exploitable | 13 | ✅ | **Test rapide T0/T1/T2** (≈ 7 min) : référence, « réduire les animations », rayon de devant invisible, mesurés en alternance par blocs de 20 s (ordre inversé un tour sur deux), en marche avec caméra fixe et caméra mobile. Verdict avec marge d'incertitude à 95 %. Remplace les trois tests séparés. |
| Banc d'essai (parcours automatique, rapport à copier) | 8 | ✅ | ⚙ → Diagnostic → « Lancer le banc d'essai » : chauffe 3 s + 3 tours (~1 min). Interrupteurs d'essai : sans rayon de devant, sans rayons lointains, sans poussière, sans ombre. **À lancer par l'auteur sur son téléphone.** |
| Test automatique des comptages | 8 | ✅ | À chaque publication. Mesures : 39 éléments, 4 calques, 10 images visibles, surface d'image 1,85 × l'écran, 5,5 Mpx ; rien créé pendant le jeu. Limites dans tests/e2e/comptages-limites.json. |

### Étapes
| Étape | État | Notes |
|---|---|---|
| A1 — le personnage est agréable à déplacer | ✅ | **A1 validée : 1445d25** (séance 6). |
| A2 — le personnage semble évoluer dans un décor profond | ✅ | **A2 validée : 6be7130** (séance 26). Rayon de devant gardé entier (« on verra plus tard ») ; fluidité acceptée en l'état (choix C) ; essai PixiJS non retenu pour l'instant. |
| A3 — scanner un produit est satisfaisant | ✅ | **Validée : 630fec0** (séance 28). Limites du test des comptages relevées (80/5/20/32) : validées par l'auteur. |

### Histoire et sens du jeu (séance 28)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Mémoire du héros (jusqu'aux portes automatiques, pas l'aplatissement) ; piste d'intro sans personnage en 3D | 34 | ✅ | Inscrit dans HISTOIRE.md (mémoire ✅, intro ❓) et PERSONNAGES.md. Rien de codé. |
| Documents sur l'histoire, le game design, le style | 30 | ✅ | Séance 31 : 5 fichiers courts créés (HISTOIRE, PERSONNAGES, GAME_DESIGN, REGLES_CARTES_COMBAT, DIRECTION_ARTISTIQUE), lus seulement à l'étape concernée. |
| Archiver l'ancien GAME_DESIGN.md de Maxi-Gouffre | 31 | ✅ | Séance 32 : `docs/archive/maxi-gouffre-GAME_DESIGN.md` ; 20 familles et 6 recettes listées dans REGLES_CARTES_COMBAT.md. |
| VISION.md : 4 familles de cartes, néons de magasin en zone 2 | 32 | ✅ | Choix A : deux précisions ajoutées à VISION.md à la demande de l'auteur. |
| Comment arrêter un essai de diagnostic | 35 | ✅ | Bouton II, Échap ou B (résultats partiels gardés) ; rappel affiché sur la bannière de l'essai, désormais en bas de l'écran. |
| Où le joueur trouve-t-il la Scanette ? | 35 | ✅ | Séance 36 (choix A) : Scanettes et paniers en libre-service à l'accueil. **A5a construite** : présentoir au début du rayon, on prend la Scanette (obligatoire) et un panier à main ; héros mains vides au départ. À tester. |
| « Douchette » devient « Scanette » ; l'Extracteur | 36 | ✅ | Vocabulaire changé dans les documents actifs et les textes du jeu (pas dans l'archive ni les anciens rapports). La Scanette qui casse et l'Extracteur : moments de jeu **à construire plus tard (pas avant B ou C)**, questions ouvertes dans HISTOIRE.md. |
| La Scanette apparaissait sous les pieds pendant un scan | 42 | ✅ | Cause : l'image tenue pivotait autour de son centre au lieu de l'épaule (rotation du bras levé). Corrigé. |
| Styles des menus Panier (kraft) et réglages (ticket) | 44 | ✅ | Gardés pour le moment. |
| Échange de carte : commentaire du haut-parleur en même temps que la question Oui / Non | 45 | ✅ | Le haut-parleur se tait pendant la question ; il ne commente (« panier plein ») qu'après un « Non » (choix A, séance 46). |
| (constaté) Le zoom des apartés tremblait légèrement (reculait d'un pas une image sur deux) | 45 | ✅ | Corrigé ; testé. |
| Voix du joueur : pas de cadre ni « Toi » ; en bas, centrée, en violet, qui ondule ; comme si l'écran parlait | 46 | ✅ | Principe validé, effet « vague » gardé (séance 47). | Mots qui apparaissent un à un et ondulent. Effet réglable (⚙ → Narrateur) : vague, souffle (moins coûteux), aucun. |
| Campagne de mesure « rayon de devant » (DEVANT2) : garder ? | 46 | ✅ | Retirée (séance 47, choix A de l'auteur). |
| Noms proposés pendant la rencontre : tous gardés pour le moment ; objets en main : mieux, autre modèle plus tard | 48 | ✅ | |
| Fond noir transparent qui clignote en refermant une carte ; bruitage de carte qui se retourne | 49 | ✅ | Fond assombri retiré (c'était son effacement progressif qu'on voyait). Bruitage synthétisé [TEMP] « retourne » (souffle de papier + petit claquement), à chaque retournement (ouvrir, retourner, refermer). |
| Bug (suite) : au double toucher, l'animation va plus vite et la carte s'agrandit puis rapetisse | 49 | ✅ | Cause : le second toucher tombait à côté de la petite carte qui grandit, donc compté comme « toucher à côté pour refermer ». Corrigé : pendant l'ouverture (et 0,35 s au moins), toucher à côté est ignoré. Le test reproduit le bug sur l'ancienne version. |
| Le panier ne doit être en main qu'une fois pris | 37 | ✅ | Défaut trouvé : le style des objets tenus ignorait l'attribut « caché » (panier et Scanette de dos dessinés dès le départ). Corrigé, plus une règle générale : un élément caché n'est jamais affiché. Le test vérifie maintenant ce qui est vraiment visible. |
| Lien pour jouer avec « ?v=… » à la fin de chaque message | 37 | ✅ | Inscrit dans CLAUDE.md. |
| Limites du test des comptages (A5a, aparté) | 36 | ✅ | 84 éléments, 38 images ; limites **88 éléments et 40 images validées** par l'auteur (séance 38) : priorité au PC, le téléphone sera adapté plus tard si besoin. |
| Utilité du caddie, pouvoir le pousser | 28 | ✅ | **Séance 29 : le caddie devient une étape à part, après A4 et avant le combat** (docs/PROTOTYPES.md). Séance 31 : **A5 — Caddie jouable** = Panier physique qui suit le personnage, garé et repris, visuel selon le remplissage (docs/GAME_DESIGN.md). |

### Documentation et architecture (séance 29)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Audit de l'architecture, comparaison avec l'ancien ARCHITECTURE.md de Maxi-Gouffre | 29 | ✅ | Organisation validée : docs/ARCHITECTURE.md (créé), docs/PROTOTYPES.md (plan recopié tel quel), ancien document en archive, SUIVI allégé. |
| Outils de mesure peut-être obsolètes (diagnostic en 4 configurations, campagne DEVANT2) | 29 | ✅ | Séance 30 (choix B) : **diagnostic en 4 configurations retiré** ; DEVANT2 gardée jusqu'à ce qu'on revoie le rayon de devant. |
| Nouvel ordre des étapes : A6 l'accueil (lieu séparé), A7 le deuxième rayon, A8 le caddie (ancien A5b, échange au comptoir de l'accueil) | 50 | ✅ | Inscrit dans PROTOTYPES.md et GAME_DESIGN.md. Contenu d'A6 (hall, portiques, agent qui bloque le portique visé, annonce, pensée « Hum… étrange… ») et d'A7 (deux entrées, arrivée du bon côté) noté dans PROTOTYPES.md. |
| Le caddie ne suit pas le héros d'un lieu à l'autre : il reste garé là où on l'a laissé | 50 | ✅ | GAME_DESIGN.md (pour A8). |
| Règles des lieux (données, gestionnaire avec cycle de vie, transition par la machine à états, le monde se souvient, mesures) | 50 | ✅ | Écrites dans ARCHITECTURE.md §11, avant de coder A6. |
| Audit, point 5 : règle « qui a la main ? » écrite une fois | 50 | ✅ | `core/focus.js` (testé), utilisé par le traitement des touches. État « transition » : avec A6. |
| Audit, point 3 : un seul état du monde (le monde se souvient) | 50 | ✅ | `core/world.js` (testé) ; `scene/products.js` ne fait plus qu'afficher. |

### Interface
| Demande | Séance | État | Notes |
|---|---|---|---|
| Menu des réglages rangé en onglets par thème | 7 | ✅ | Validé (séance 8). Garder toutes les options dans le menu. |

### Questions de l'auteur (réponses données)
- Faut-il dessiner les personnages avant l'étape suivante ? Non : les dessins arrivent au prototype D, préparé une séance à l'avance avec docs/IMAGES.md (séance 5).
- Pourquoi le clignotement du caddie n'existait pas avant ? Mesuré (séance 28) : la bascule de calque était déjà là en A1 et A2, de façon identique. Ce n'est pas un défaut ajouté ensuite. Ce qui a changé, c'est sans doute sa visibilité (hypothèses non prouvées : plus d'images en mémoire depuis A3, et des images lentes qui le masquaient avant).
