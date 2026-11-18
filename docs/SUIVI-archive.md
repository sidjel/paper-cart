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

### Remise en ordre (séance 52)
| Demande | Séance | État | Notes |
|---|---|---|---|
| A4 et A5 validées | 52 | ✅ | `c32eedd` (JOURNAL, PROTOTYPES). |
| Séance 1 de remise en ordre : documentation (ARCHITECTURE, HISTOIRE, REGLES, DIRECTION_ARTISTIQUE, SUIVI, JOURNAL, CLAUDE.md, skills, CLAUDE.md de dossier) | 52 | ✅ | Un commit par point. VISION.md en attente de l'accord de l'auteur. |

## Points 👀 validés à la séance 53 (l'auteur m'a laissé trancher)

### Personnage
| Demande | Séance | État | Notes |
|---|---|---|---|
| Retournement de la feuille gauche/droite, façon Paper Mario | 2 | ✅ | « C'est ok mais à voir ». Durée réglable (0,18 s). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |

### Marche et contrôles
| Demande | Séance | État | Notes |
|---|---|---|---|
| Essai : scanner un produit posé sur une table ou dans le caddie, de profil ou de face | 28 | ✅ | Pomme sur une petite table de dégustation (fin du rayon), boîte d'œufs dans le caddie. De côté : de profil ; derrière : de face ; devant : de dos. Portées réglables (⚙ → Scanner). À tester par l'auteur. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Scanner naturellement au doigt par un double toucher | 27 | ✅ | Double toucher (ou double clic) sur un produit : le personnage va devant et le scanne. Délai et écart réglables (⚙ → Contrôles). À tester par l'auteur. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |

### Son
| Demande | Séance | État | Notes |
|---|---|---|---|
| Petite musique de supermarché (provisoire) | 3 | ✅ | « On la changera plus tard. » Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |

### Histoire et sens du jeu (séance 28)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Justifier le scanner dans l'histoire : scanner spécial ? quels objets ? pourquoi ? | 28 | ✅ | Séance 31 : ✅ douchette = technologie du magasin qui extrait l'essence ; produits figés hors du temps sur l'étagère, évolution dès le scan (docs/HISTOIRE.md). Reste ❓ : scanner des êtres vivants ? Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Voir les haut-parleurs d'où sort la voix | 35 | ✅ | 5 haut-parleurs dessinés au plafond (décor du fond) ; celui le plus proche du héros émet des ondes, la bande s'affiche dessous avec une pointe vers lui. À tester. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Le personnage semble flotter au-dessus du carrelage | 35 | ✅ | Mesuré : semelle 3 px (face) à 6 px (dos) au-dessus du point de contact ; surtout, contour blanc sous la semelle et ombre pâle. Ajouté : ombre de contact sombre sous les pieds (0,6) et pieds enfoncés de 4 px ; réglables (⚙ → Personnage). À tester. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| A4 : l'aparté doit être un moment rare et marquant | 36 | ✅ | Séance 37 : tête de face (3 émotions [TEMP] : inquiet, complice, blasé), zoom de la caméra, bandes « cinéma », bords assombris, son grave et musique baissée ; héros immobile pendant l'aparté (toucher = passer) ; plus rare (150 s). Publié séance 38. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Menu du panier : onglets « Cartes » et « Objets » | 37 | ✅ | Séance 38 : onglet « Courses » ; on change d'onglet au doigt, au clavier (flèches gauche/droite) et à la manette (croix gauche/droite, LB/RB). Objets : unique, ne pourrit pas, ne prend pas de place, ne se jette pas (🧪, GAME_DESIGN). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Carte reposée : le produit retourne sur l'étagère (choix B) | 38 | ✅ | Séance 39 : fenêtre « Échanger une carte ? Oui / Non » d'abord ; le produit reposé apparaît à la place du produit scanné (pas à sa place d'origine). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Objets représentés par une image + courte description | 39 | ✅ | Icônes [TEMP] (Scanette, panier) dans data/objects.json. Onglet « Courses » renommé « Cartes ». Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Réponses de l'aparté introuvables | 39 | ✅ | Cause probable : l'aparté d'accueil (celui qui pose la question) était perdu si le héros marchait à la fin de l'annonce. Il attend maintenant que le héros s'arrête (20 s au plus, réglable). Seuls 2 apartés posent une question. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Le jeu commence parfois à la verticale sur téléphone | 39 | ✅ | Écran titre : « Commencer » passe en plein écran paysage sur téléphone ; en portrait, la consigne propose un bouton « Passer en plein écran paysage ». À vérifier sur le vrai téléphone. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| « Commencer » ne lançait pas le jeu | 40 | ✅ | Cause trouvée : les Options s'ouvraient **derrière** l'écran titre (inutilisables), et le jeu restait dans les Options ; « Commencer » ne faisait alors rien. Corrigé (Options au-dessus, et « Commencer » ferme les Options si besoin) ; la partie démarre avant la demande de plein écran ; les erreurs de l'appareil sont recopiées dans le rapport du diagnostic. À confirmer sur le téléphone. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Options : choisir le plein écran | 40 | ✅ | ⚙ → Affichage → « Plein écran » : Automatique (téléphone oui), Oui, Non. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Option filtre « écran cathodique » | 40 | ✅ | ⚙ → Affichage : lignes de balayage, bords sombres et bombés, force réglable ; désactivé par défaut (coûte un peu sur téléphone). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Autres options intéressantes | 40 | ✅ | Séance 41 (choix de l'auteur) : onglet **Accessibilité** — taille du texte (petite à très grande), vitesse du texte, vibrations (téléphone, manette), luminosité, contraste, réduire les animations. Non retenues pour l'instant : mode daltonien, bavardage. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| La bande noire du haut-parleur restait au-dessus des menus | 41 | ✅ | Règle posée : les voix (bande, bulle) sont toujours sous les fenêtres et menus (ordre d'empilement écrit dans style.css). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Le héros se déplaçait pendant un scan ou un échange (bugs visuels) | 41 | ✅ | Pendant une action (scan, aparté), un toucher ailleurs est ignoré et aucun déplacement n'est possible. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Accueil : aucun produit au-dessus ni à gauche ; mur agrandi à gauche ; panneau vert de la largeur du mur | 42 | ✅ | Pan de mur dégagé (sans étagère) au début du rayon ; mur de 32 Scanettes (x 30 à 414) ; la banane déplacée plus loin sur l'étagère. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Options de l'écran titre : un menu à part, assorti au titre (noir, bleu clair), sans réglages de développement | 42 | ✅ | Son, Affichage, Accessibilité, Jeu ; doigt, souris, clavier (haut/bas, Échap), manette (croix, A, B). Le panneau ⚙ en jeu reste celui de développement. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Sous-onglets des cartes : Toutes / Alimentaire / Non alimentaire / Spéciales ; autres idées (non périssables, évolutives, fusions) | 43 | ✅ | Filtres faits (chaque produit a une catégorie dans products.json). Autres filtres : ❓ quand les familles de cartes existeront (prototype B). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Après « Commencer » : texte blanc sur fond noir, intro courte et mystérieuse, puis fondu sur le jeu | 43 | ✅ | 7 lignes [TEMP] (`src/data/intro.json`) avec pluie, portes, ding, haut-parleur. Toucher : ligne suivante ; « Passer ». Désactivable (Options → Jeu). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Annonces du haut-parleur un peu transparentes | 43 | ✅ | Opacité du fond 78 % (Options → Affichage, « Opacité des annonces »). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Couleurs des menus Panier et configuration : artistiques, originales, modernes | 43 | ✅ | Panier : sac kraft, onglet tamponné en rouge. Réglages ⚙ : ticket de caisse. À juger par l'auteur. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Première réflexion du héros (pourquoi il est là, questions, objectif) ; première interaction avec l'Épaisseur graduée, une découverte | 43 | ✅ | Pensées à l'arrivée gardées ; la rencontre a été déplacée après la première carte (séance 44). Raison de l'entrée : il ne s'en souvient plus (choix B, pour le moment). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Correction : le premier aparté ne se déclenchait pas toujours ; il doit venir après la première carte, ne jamais être manqué, rien ne doit l'interrompre | 44 | ✅ | Moment « important » : il attend son tour (annonce finie, héros arrêté) aussi longtemps qu'il faut ; pendant la conversation, rien ne parle, le héros ne bouge pas, chaque réplique attend un toucher (▾). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| La rencontre : plus de répliques ; le héros se demande si le joueur est ce qui lui manque, « Qui es-tu ? » ; le joueur répond sans choix ; les choix seulement ensuite | 44 | ✅ | 11 répliques [TEMP] (`narrator.json`, « rencontre ») ; la voix du joueur dans un cadre « Toi » en haut de l'écran (nuit et bleu clair) ; un choix à la fin. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Pouvoir relire un dialogue : historique | 44 | ✅ | Pause → « Dialogues » : les 40 dernières répliques, avec les réponses du joueur. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Bouton du Panier en bas à gauche : rouge, en forme de petit panier | 44 | ✅ | Petit panier rouge en papier découpé, le nombre de cartes sur son flanc. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Rencontre : le héros s'avance au milieu de l'écran en deux fois (« Hum ?… » à mi-chemin), un peu en avant ; bords flous avec vagues violettes | 45 | ✅ | Caméra immobile pendant qu'il s'avance, puis zoom. Flou réel des bords (⚙ → Narrateur, 6 px, 0 = sans) : à mesurer sur le téléphone (règle « pas de flou sur ce qui bouge »). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Bords de la rencontre : pas seulement du flou ; des vagues (traits) hypnotiques, une autre dimension ; moins énergivore | 46 | ✅ | Traits ondulés violets qui défilent sur les 4 bords (sens contraires), lueur qui palpite ; flou réel retiré par défaut (réglable). Les animations s'arrêtaient peut-être avec le réglage « animations réduites » du téléphone : désormais seule l'option du jeu les arrête. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Effacer l'interface (ATH) pendant les dialogues avec le joueur | 46 | ✅ | Boutons, Panier, version, aide : effacés pendant la conversation. Pause toujours possible (Échap, Start). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Nom du joueur : « Épaisseur » par défaut ; propositions ; son propre nom | 46 | ✅ | Options → Jeu (et ⚙ → Narrateur). 11 propositions [TEMP] (`data/joueur.json`) ; un nom tapé (16 lettres au plus). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Rayon du bas deux fois moins haut (juste les produits du haut) ; plus fluide ? | 46 | ✅ | Fait. Mesuré ici : surface affichée 1,88 → 1,74 écran, images en mémoire 6,01 → 5,57 Mpx. Sur le téléphone (séances 23 et 25), la moitié haute coûtait ×0,70 (à confirmer avec le banc d'essai). Point de rencontre remis plus en avant. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Le héros propose au joueur de changer de nom pendant la rencontre (si « Épaisseur » ne lui plaît pas) ; changeable ensuite dans les options | 47 | ✅ | Réplique « Il te faut un nom… » : les propositions s'affichent en bas (style de l'écran qui parle), « Épaisseur » d'abord, « Autre… » pour taper le sien. La suite emploie le nom choisi. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| La main doit tenir le panier et la Scanette (de face et de profil) | 47 | ✅ | Objets redessinés avec la main qui tient l'anse ou la poignée, passés devant le héros. Vue de dos : Scanette inchangée (cachée par le corps). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Tête de face : oreille et mèche mal placées | 47 | ✅ | Têtes de face (apartés) : une oreille de chaque côté, au bord de la tête ; cheveux en frange. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Cartes du Panier deux fois plus petites ; toucher une carte la retourne et l'affiche deux fois plus grande, description au dos, texte net ; refermer par Fermer/Annuler (kraft foncé, en haut et en bas à droite), en touchant à côté, clavier, manette | 48 | ✅ | Grande carte redessinée à sa taille (texte net), qui tient dans l'écran (plus petite sur un écran bas) ; toucher la grande carte la retourne (recto/verso) ; descriptions [TEMP]. Manette : haut/bas choisit la carte, A l'ouvre ou la retourne, B la referme. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Boutons kraft seulement en haut à droite et en bas à droite du menu (pas dans le vide) ; grande carte refermée en touchant à côté, sans bouton ; kraft marron clair | 48 | ✅ | Fait : boutons de la grande carte retirés ; bouton du bas poussé en bas du menu ; kraft clair (#d9b382), texte foncé. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| La carte ne doit pas être en double (grande et dans le Panier) | 48 | ✅ | La petite carte quitte le Panier pendant qu'elle est en grand ; en refermant, elle se retourne dans l'autre sens et revient à sa place. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Tester sans tout refaire (sauvegarde, choix de séquence ou « passer la séquence ») | 48 | ✅ | Choix : points de départ (⚙ → Départ, ou lien `?depart=equipe`, `libre`, `3-cartes`, `panier-plein`). Plus sûr qu'une sauvegarde tant que le jeu change à chaque version. Sauvegarde de partie : plus tard, pour les joueurs. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Tournis : déplacer le héros de droite à gauche trop vite → étoiles autour de la tête, et il dit au joueur d'arrêter ; d'autres phrases s'il recommence | 49 | ✅ | Déclenché à 6 demi-tours en moins de 3 s ; étoiles 3,5 s ; pas avant 60 s la fois suivante (⚙ → Personnage). 5 répliques [TEMP], la plus ancienne d'abord ; c'est un aparté (il se tourne vers le joueur, zoom). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Bug : double clic (ou double toucher) rapide sur une carte du Panier → carte zoomée à fond | 49 | ✅ | Cause : le second clic tombait sur la carte en vol et coupait l'animation (elle sautait d'un coup à sa grande taille) ; sur téléphone, le navigateur pouvait aussi zoomer. Corrigé : un toucher sur la carte pendant une animation est ignoré ; zoom du navigateur coupé sur cette zone. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Bug (suite 2) : double toucher sur la carte déjà agrandie → elle grandit encore, s'approche et disparaît | 49 | ✅ | Cause : le 1er toucher la retourne (elle devient toute fine), le 2e tombe à côté = « refermer », et la fermeture la mesurait toute fine (agrandissement énorme). Corrigé : toucher à côté ignoré pendant toute animation ; mesure à sa taille réelle. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Accueil plus grand, avec un mur de Scanettes | 41 | ✅ | Mur de 24 Scanettes et pile de 5 paniers (décor [TEMP]). Double toucher : le dessin le plus proche du doigt l'emporte. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Sans panier : le héros s'interroge lui-même | 41 | ✅ | Nouvelle voix « pensée » : bulle en pointillés, il se parle à lui-même (« Et je mets ça où, moi ? »), sans mise en scène. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Écran titre (nom en grand, image mystérieuse, Commencer, Options ; esprit Baten Kaitos / FF) | 39 | ✅ | Construit avec une image [TEMP] et les polices du système (aucune police ajoutée sans accord) ; police à choisir par l'auteur. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Apartés : magasin figé, motif de l'Épaisseur, regards caméra, réponses et confiance | 38 | ✅ | Construit : pendant l'aparté la musique du magasin se tait, le haut-parleur se tait (il réagit après coup au client « planté devant le mur »), le repère se fige ; motif de 4 notes [TEMP] à chaque aparté ; petits regards caméra sans texte après une annonce sur deux (au plus un toutes les 25 s) ; deux réponses sur 2 apartés (confiance +1/−1/0), le héros répond. Avec « réduire les animations » : pas de zoom. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Panier plein : reposer une carte (choix B) | 37 | ✅ | Construit séance 37 : écran « Panier plein », toucher une carte la repose ([TEMP] abandonnée), puis le scan se fait ; « Annuler » sinon. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Apartés du héros (le joueur est son « Épaisseur ») | 33 | ✅ | 5 apartés [TEMP] (après l'accueil, scan dans le vide, inactivité, Panier), bulle de papier + froissement + bips plus graves, pivot vers l'écran à l'arrêt ; 2 réactions du haut-parleur (« parler au mur ») ; plus rares que les annonces (90 s), jamais deux voix à la fois, l'annonce passe avant. **À tester, puis valider (🧪 dans HISTOIRE et PERSONNAGES).** Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |
| Interaction avec les cartes dans le Panier | 28 | ✅ | Normal pour l'instant : le prototype A vérifie seulement « scanner est agréable ». Les cartes serviront au combat (prototype B). Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |

### Documentation et architecture (séance 29)
| Demande | Séance | État | Notes |
|---|---|---|---|
| (constaté à l'audit) La première rencontre peut se dérouler cachée sous le Panier ; le Panier s'ouvre pendant la rencontre (touche I, bouton Y) | 50 | ✅ | Corrigé (validé par l'auteur) : pas de Panier pendant un aparté ou une conversation ; hors du jeu (Panier, menus), le héros ne prend pas la parole, la rencontre attend le retour. Testé. Séance 53 : validé (fait partie d'une étape validée ou accepté ensuite par l'auteur). |

### Remise en ordre (séance 53)
| Demande | Séance | État | Notes |
|---|---|---|---|
| VISION.md : la direction visuelle renvoie à DIRECTION_ARTISTIQUE.md | 52 | ✅ | Accord de l'auteur (séance 53). |
| Flou réel optionnel des bords (rencontre) | 52 | ✅ | Gardé, désactivé par défaut, seule exception des garde-fous (choix A, séance 53). |
| Les 59 points 👀 : l'auteur m'a laissé trancher | 53 | ✅ | 53 validés, 3 à mesurer (🔧), 3 restent avec A6. |

### Séance 54
| Demande | Séance | État | Notes |
|---|---|---|---|
| Knip (code jamais utilisé) | 53 | ✅ | Installé (accord de l'auteur), liste vidée (4 « export » inutiles), ajouté à `npm test`. |
| Exception de taille pour `style.css` | 53 | ✅ | Approuvée par l'auteur (choix A). |
| Découpage de `main.js` en 3 étapes | 53 | ✅ | `src/debug/` (mesures, départs), `src/game/places.js`, `src/game/voices.js` ; 1 370 → 932 lignes ; aucun changement de comportement. |

### Séance 67 (A7), validée en séance 70
| Demande | Séance | État | Notes |
|---|---|---|---|
| A7 (1/2) : rayon 2, deux passages (les ouvertures du rayon 7), arrivée du bon côté | 67 | ✅ | Choix de détail (Claude) : les deux ouvertures déjà dessinées dans l'étagère du rayon 7 servent de passages ; on arrive en face, côté avant du rayon 2. À tester par l'auteur. | **A7 validée provisoirement par l'auteur (`215dd8f`, séance 70).**
| A7 (2/2) : échange d'une carte venue de l'autre rayon | 67 | ✅ | Fait : le produit prend la place du produit scanné, sur ce rayon-ci (règle de la séance 63). Son image est préparée et décodée pendant le choix de la carte (règle « rien n'apparaît à froid »). | **A7 validée par l'auteur (`215dd8f`, séance 70).**
