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
| Menu du panier : onglets « Cartes » et « Objets » | 37 | 👀 | Séance 38 : onglet « Courses » ; on change d'onglet au doigt, au clavier (flèches gauche/droite) et à la manette (croix gauche/droite, LB/RB). Objets : unique, ne pourrit pas, ne prend pas de place, ne se jette pas (🧪, GAME_DESIGN). |
| Carte reposée : le produit retourne sur l'étagère (choix B) | 38 | 👀 | Séance 39 : fenêtre « Échanger une carte ? Oui / Non » d'abord ; le produit reposé apparaît à la place du produit scanné (pas à sa place d'origine). |
| Objets représentés par une image + courte description | 39 | 👀 | Icônes [TEMP] (Scanette, panier) dans data/objects.json. Onglet « Courses » renommé « Cartes ». |
| Réponses de l'aparté introuvables | 39 | 👀 | Cause probable : l'aparté d'accueil (celui qui pose la question) était perdu si le héros marchait à la fin de l'annonce. Il attend maintenant que le héros s'arrête (20 s au plus, réglable). Seuls 2 apartés posent une question. |
| Le jeu commence parfois à la verticale sur téléphone | 39 | 👀 | Écran titre : « Commencer » passe en plein écran paysage sur téléphone ; en portrait, la consigne propose un bouton « Passer en plein écran paysage ». À vérifier sur le vrai téléphone. |
| « Commencer » ne lançait pas le jeu | 40 | 👀 | Cause trouvée : les Options s'ouvraient **derrière** l'écran titre (inutilisables), et le jeu restait dans les Options ; « Commencer » ne faisait alors rien. Corrigé (Options au-dessus, et « Commencer » ferme les Options si besoin) ; la partie démarre avant la demande de plein écran ; les erreurs de l'appareil sont recopiées dans le rapport du diagnostic. À confirmer sur le téléphone. |
| Options : choisir le plein écran | 40 | 👀 | ⚙ → Affichage → « Plein écran » : Automatique (téléphone oui), Oui, Non. |
| Option filtre « écran cathodique » | 40 | 👀 | ⚙ → Affichage : lignes de balayage, bords sombres et bombés, force réglable ; désactivé par défaut (coûte un peu sur téléphone). |
| Autres options intéressantes | 40 | 👀 | Séance 41 (choix de l'auteur) : onglet **Accessibilité** — taille du texte (petite à très grande), vitesse du texte, vibrations (téléphone, manette), luminosité, contraste, réduire les animations. Non retenues pour l'instant : mode daltonien, bavardage. |
| La bande noire du haut-parleur restait au-dessus des menus | 41 | 👀 | Règle posée : les voix (bande, bulle) sont toujours sous les fenêtres et menus (ordre d'empilement écrit dans style.css). |
| Le héros se déplaçait pendant un scan ou un échange (bugs visuels) | 41 | 👀 | Pendant une action (scan, aparté), un toucher ailleurs est ignoré et aucun déplacement n'est possible. |
| Accueil : aucun produit au-dessus ni à gauche ; mur agrandi à gauche ; panneau vert de la largeur du mur | 42 | 👀 | Pan de mur dégagé (sans étagère) au début du rayon ; mur de 32 Scanettes (x 30 à 414) ; la banane déplacée plus loin sur l'étagère. |
| Options de l'écran titre : un menu à part, assorti au titre (noir, bleu clair), sans réglages de développement | 42 | 👀 | Son, Affichage, Accessibilité, Jeu ; doigt, souris, clavier (haut/bas, Échap), manette (croix, A, B). Le panneau ⚙ en jeu reste celui de développement. |
| La Scanette apparaissait sous les pieds pendant un scan | 42 | ✅ | Cause : l'image tenue pivotait autour de son centre au lieu de l'épaule (rotation du bras levé). Corrigé. |
| Sous-onglets des cartes : Toutes / Alimentaire / Non alimentaire / Spéciales ; autres idées (non périssables, évolutives, fusions) | 43 | 👀 | Filtres faits (chaque produit a une catégorie dans products.json). Autres filtres : ❓ quand les familles de cartes existeront (prototype B). |
| Après « Commencer » : texte blanc sur fond noir, intro courte et mystérieuse, puis fondu sur le jeu | 43 | 👀 | 7 lignes [TEMP] (`src/data/intro.json`) avec pluie, portes, ding, haut-parleur. Toucher : ligne suivante ; « Passer ». Désactivable (Options → Jeu). |
| Annonces du haut-parleur un peu transparentes | 43 | 👀 | Opacité du fond 78 % (Options → Affichage, « Opacité des annonces »). |
| Couleurs des menus Panier et configuration : artistiques, originales, modernes | 43 | 👀 | Panier : sac kraft, onglet tamponné en rouge. Réglages ⚙ : ticket de caisse. À juger par l'auteur. |
| Première réflexion du héros (pourquoi il est là, questions, objectif) ; première interaction avec l'Épaisseur graduée, une découverte | 43 | 👀 | Pensées à l'arrivée gardées ; la rencontre a été déplacée après la première carte (séance 44). Raison de l'entrée : il ne s'en souvient plus (choix B, pour le moment). |
| Correction : le premier aparté ne se déclenchait pas toujours ; il doit venir après la première carte, ne jamais être manqué, rien ne doit l'interrompre | 44 | 👀 | Moment « important » : il attend son tour (annonce finie, héros arrêté) aussi longtemps qu'il faut ; pendant la conversation, rien ne parle, le héros ne bouge pas, chaque réplique attend un toucher (▾). |
| La rencontre : plus de répliques ; le héros se demande si le joueur est ce qui lui manque, « Qui es-tu ? » ; le joueur répond sans choix ; les choix seulement ensuite | 44 | 👀 | 11 répliques [TEMP] (`narrator.json`, « rencontre ») ; la voix du joueur dans un cadre « Toi » en haut de l'écran (nuit et bleu clair) ; un choix à la fin. |
| Pouvoir relire un dialogue : historique | 44 | 👀 | Pause → « Dialogues » : les 40 dernières répliques, avec les réponses du joueur. |
| Filtres de cartes futurs : vieillissement, fusions et stade (a, b et c) | 44 | ❓ | Prototype B, quand ces familles existeront. Cohérent : ce sont des axes différents (deux rangées : type, état). |
| Styles des menus Panier (kraft) et réglages (ticket) | 44 | ✅ | Gardés pour le moment. |
| Bouton du Panier en bas à gauche : rouge, en forme de petit panier | 44 | 👀 | Petit panier rouge en papier découpé, le nombre de cartes sur son flanc. |
| Rencontre : le héros s'avance au milieu de l'écran en deux fois (« Hum ?… » à mi-chemin), un peu en avant ; bords flous avec vagues violettes | 45 | 👀 | Caméra immobile pendant qu'il s'avance, puis zoom. Flou réel des bords (⚙ → Narrateur, 6 px, 0 = sans) : à mesurer sur le téléphone (règle « pas de flou sur ce qui bouge »). |
| Échange de carte : commentaire du haut-parleur en même temps que la question Oui / Non | 45 | ✅ | Le haut-parleur se tait pendant la question ; il ne commente (« panier plein ») qu'après un « Non » (choix A, séance 46). |
| (constaté) Le zoom des apartés tremblait légèrement (reculait d'un pas une image sur deux) | 45 | ✅ | Corrigé ; testé. |
| Voix du joueur : pas de cadre ni « Toi » ; en bas, centrée, en violet, qui ondule ; comme si l'écran parlait | 46 | ✅ | Principe validé, effet « vague » gardé (séance 47). | Mots qui apparaissent un à un et ondulent. Effet réglable (⚙ → Narrateur) : vague, souffle (moins coûteux), aucun. |
| Bords de la rencontre : pas seulement du flou ; des vagues (traits) hypnotiques, une autre dimension ; moins énergivore | 46 | 👀 | Traits ondulés violets qui défilent sur les 4 bords (sens contraires), lueur qui palpite ; flou réel retiré par défaut (réglable). Les animations s'arrêtaient peut-être avec le réglage « animations réduites » du téléphone : désormais seule l'option du jeu les arrête. |
| Effacer l'interface (ATH) pendant les dialogues avec le joueur | 46 | 👀 | Boutons, Panier, version, aide : effacés pendant la conversation. Pause toujours possible (Échap, Start). |
| Nom du joueur : « Épaisseur » par défaut ; propositions ; son propre nom | 46 | 👀 | Options → Jeu (et ⚙ → Narrateur). 11 propositions [TEMP] (`data/joueur.json`) ; un nom tapé (16 lettres au plus). |
| Rayon du bas deux fois moins haut (juste les produits du haut) ; plus fluide ? | 46 | 👀 | Fait. Mesuré ici : surface affichée 1,88 → 1,74 écran, images en mémoire 6,01 → 5,57 Mpx. Sur le téléphone (séances 23 et 25), la moitié haute coûtait ×0,70 (à confirmer avec le banc d'essai). Point de rencontre remis plus en avant. |
| Campagne de mesure « rayon de devant » (DEVANT2) : garder ? | 46 | ✅ | Retirée (séance 47, choix A de l'auteur). |
| Le héros propose au joueur de changer de nom pendant la rencontre (si « Épaisseur » ne lui plaît pas) ; changeable ensuite dans les options | 47 | 👀 | Réplique « Il te faut un nom… » : les propositions s'affichent en bas (style de l'écran qui parle), « Épaisseur » d'abord, « Autre… » pour taper le sien. La suite emploie le nom choisi. |
| La main doit tenir le panier et la Scanette (de face et de profil) | 47 | 👀 | Objets redessinés avec la main qui tient l'anse ou la poignée, passés devant le héros. Vue de dos : Scanette inchangée (cachée par le corps). |
| Tête de face : oreille et mèche mal placées | 47 | 👀 | Têtes de face (apartés) : une oreille de chaque côté, au bord de la tête ; cheveux en frange. |
| Noms proposés pendant la rencontre : tous gardés pour le moment ; objets en main : mieux, autre modèle plus tard | 48 | ✅ | |
| Cartes du Panier deux fois plus petites ; toucher une carte la retourne et l'affiche deux fois plus grande, description au dos, texte net ; refermer par Fermer/Annuler (kraft foncé, en haut et en bas à droite), en touchant à côté, clavier, manette | 48 | 👀 | Grande carte redessinée à sa taille (texte net), qui tient dans l'écran (plus petite sur un écran bas) ; toucher la grande carte la retourne (recto/verso) ; descriptions [TEMP]. Manette : haut/bas choisit la carte, A l'ouvre ou la retourne, B la referme. |
| Boutons kraft seulement en haut à droite et en bas à droite du menu (pas dans le vide) ; grande carte refermée en touchant à côté, sans bouton ; kraft marron clair | 48 | 👀 | Fait : boutons de la grande carte retirés ; bouton du bas poussé en bas du menu ; kraft clair (#d9b382), texte foncé. |
| Accueil plus grand, avec un mur de Scanettes | 41 | 👀 | Mur de 24 Scanettes et pile de 5 paniers (décor [TEMP]). Double toucher : le dessin le plus proche du doigt l'emporte. |
| Sans panier : le héros s'interroge lui-même | 41 | 👀 | Nouvelle voix « pensée » : bulle en pointillés, il se parle à lui-même (« Et je mets ça où, moi ? »), sans mise en scène. |
| Écran titre (nom en grand, image mystérieuse, Commencer, Options ; esprit Baten Kaitos / FF) | 39 | 👀 | Construit avec une image [TEMP] et les polices du système (aucune police ajoutée sans accord) ; police à choisir par l'auteur. |
| Confiance héros–Épaisseur : noter en détail, intégrer comme essai | 39 | 🧪 | GAME_DESIGN.md (détails ❓) ; répliques selon la confiance (haute ≥ 1, basse ≤ −1) à l'essai. |
| Apartés : magasin figé, motif de l'Épaisseur, regards caméra, réponses et confiance | 38 | 👀 | Construit : pendant l'aparté la musique du magasin se tait, le haut-parleur se tait (il réagit après coup au client « planté devant le mur »), le repère se fige ; motif de 4 notes [TEMP] à chaque aparté ; petits regards caméra sans texte après une annonce sur deux (au plus un toutes les 25 s) ; deux réponses sur 2 apartés (confiance +1/−1/0), le héros répond. Avec « réduire les animations » : pas de zoom. |
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
