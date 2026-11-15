# Suivi des demandes de l'auteur

Toutes les demandes et remarques de l'auteur, avec leur état, pour ne rien perdre. Mis à jour à chaque séance.
États : ✅ fait · 🔧 à faire · 👀 fait, à revoir · ❓ décision en attente · 🧪 à l'essai.
Les points ✅ sont dans `docs/SUIVI-archive.md` (rien n'est perdu ; déplacés tels quels à la séance 51).

## Ouvert

### Personnage
| Demande | Séance | État | Notes |
|---|---|---|---|
| Retournement de la feuille gauche/droite, façon Paper Mario | 2 | 👀 n° 1 | « C'est ok mais à voir ». Durée réglable (0,18 s). |
| Saut (secrets, monter sur des tabourets…) | 5 | 🔧 | Choix B (séance 6) : **saut libre** avec un bouton, partout, comme dans Paper Mario. À construire après le prototype A. VISION.md non modifié (à la demande de l'auteur seulement). |

### Marche et contrôles
| Demande | Séance | État | Notes |
|---|---|---|---|
| Essai : scanner un produit posé sur une table ou dans le caddie, de profil ou de face | 28 | 👀 n° 2 | Pomme sur une petite table de dégustation (fin du rayon), boîte d'œufs dans le caddie. De côté : de profil ; derrière : de face ; devant : de dos. Portées réglables (⚙ → Scanner). À tester par l'auteur. |
| Scanner naturellement au doigt par un double toucher | 27 | 👀 n° 3 | Double toucher (ou double clic) sur un produit : le personnage va devant et le scanne. Délai et écart réglables (⚙ → Contrôles). À tester par l'auteur. |

### Son
| Demande | Séance | État | Notes |
|---|---|---|---|
| Petite musique de supermarché (provisoire) | 3 | 👀 n° 4 | « On la changera plus tard. » |

### Fluidité
| Constat | Séance | État | Notes |
|---|---|---|---|
| Banc d'essai sur le téléphone (9756425) : 58 i/s, p95 16,6 ms, mais p99 32,9 ms, 5 images > 33 ms, 163 images > 20 ms (5 %), calcul JS pire 21,3 ms | 9 | 🔧 | Séance 10 : deux bancs (5973115). Normal : 124 images > 20 ms (3,7 %), 3 > 33 ms, calcul JS pire 15 ms. Caméra immobile : 47 images > 20 ms (1,4 %), 3 > 33 ms, calcul pire 8,9 ms. **Le défilement de la caméra cause environ 60 % des saccades ; le reste a une autre cause.** Saccades isolées (1 à 3 images). Séance 11 : l'auteur veut d'abord un diagnostic fiable → **diagnostic en 4 configurations** construit (marche oui/non × caméra mobile oui/non, 60 s de chauffe, 3 × 60 s par configuration). En attente du rapport. **Pas d'essai PixiJS avant d'avoir examiné les résultats ensemble.** Séance 12 : résultats analysés (voir journal). Décision de l'auteur : mesurer d'abord (tests T0, T1, T2 sur le téléphone, sans changer le code), puis corriger une chose à la fois avec comparaison avant/après. PixiJS seulement si le système actuel ne peut pas atteindre les objectifs. |
| Chargement du lieu : 3,9 s sur le téléphone avec le rayon long | 9 | 👀 n° 5 | Séance 10 : 1,2 s au rechargement (décor du fond 0,39 s). Acceptable pour l'instant. |
| Chargement du lieu : 8,2 s sur le téléphone | 5 | 👀 n° 6 | Séance 6 : 1,4 s au rechargement (le décor du fond prend 0,44 s). Les 8 s venaient sans doute du premier téléchargement. À surveiller quand les vrais dessins arriveront. |
| Son : latence de sortie 176 ms sur le téléphone | 6 | 👀 n° 7 | Les pas peuvent sonner un peu en retard. À vérifier au ressenti. |

### Réflexion pour plus tard : un rendu « intelligent » de la profondeur
Demande de l'auteur : le personnage pourra changer de plan ; garder ce qui sert la profondeur et la direction artistique sans calculer les surfaces invisibles. Principes, à confirmer par les mesures avant toute construction :
- décrire dans les données de chaque lieu les plans de profondeur et ce qui cache quoi (déjà en partie : pile de calques, points de référence) ;
- ne rien dessiner qui soit toujours caché ; mais **mesurer** chaque façon de l'éviter (T3 a montré qu'une solution logique peut coûter plus cher) ;
- éviter de multiplier les calques qui bougent ; préférer peu de calques bien choisis ;
- le changement de plan du personnage passe par l'ordre d'affichage (déjà en place), pas par de nouveaux calques.

### Histoire et sens du jeu (séance 28)
| Demande | Séance | État | Notes |
|---|---|---|---|
| Justifier le scanner dans l'histoire : scanner spécial ? quels objets ? pourquoi ? | 28 | 👀 n° 8 | Séance 31 : ✅ douchette = technologie du magasin qui extrait l'essence ; produits figés hors du temps sur l'étagère, évolution dès le scan (docs/HISTOIRE.md). Reste ❓ : scanner des êtres vivants ? |
| Voir les haut-parleurs d'où sort la voix | 35 | 👀 n° 9 | 5 haut-parleurs dessinés au plafond (décor du fond) ; celui le plus proche du héros émet des ondes, la bande s'affiche dessous avec une pointe vers lui. À tester. |
| Le personnage semble flotter au-dessus du carrelage | 35 | 👀 n° 10 | Mesuré : semelle 3 px (face) à 6 px (dos) au-dessus du point de contact ; surtout, contour blanc sous la semelle et ombre pâle. Ajouté : ombre de contact sombre sous les pieds (0,6) et pieds enfoncés de 4 px ; réglables (⚙ → Personnage). À tester. |
| A4 : l'aparté doit être un moment rare et marquant | 36 | 👀 n° 11 | Séance 37 : tête de face (3 émotions [TEMP] : inquiet, complice, blasé), zoom de la caméra, bandes « cinéma », bords assombris, son grave et musique baissée ; héros immobile pendant l'aparté (toucher = passer) ; plus rare (150 s). Publié séance 38. |
| Menu du panier : onglets « Cartes » et « Objets » | 37 | 👀 n° 12 | Séance 38 : onglet « Courses » ; on change d'onglet au doigt, au clavier (flèches gauche/droite) et à la manette (croix gauche/droite, LB/RB). Objets : unique, ne pourrit pas, ne prend pas de place, ne se jette pas (🧪, GAME_DESIGN). |
| Carte reposée : le produit retourne sur l'étagère (choix B) | 38 | 👀 n° 13 | Séance 39 : fenêtre « Échanger une carte ? Oui / Non » d'abord ; le produit reposé apparaît à la place du produit scanné (pas à sa place d'origine). |
| Objets représentés par une image + courte description | 39 | 👀 n° 14 | Icônes [TEMP] (Scanette, panier) dans data/objects.json. Onglet « Courses » renommé « Cartes ». |
| Réponses de l'aparté introuvables | 39 | 👀 n° 15 | Cause probable : l'aparté d'accueil (celui qui pose la question) était perdu si le héros marchait à la fin de l'annonce. Il attend maintenant que le héros s'arrête (20 s au plus, réglable). Seuls 2 apartés posent une question. |
| Le jeu commence parfois à la verticale sur téléphone | 39 | 👀 n° 16 | Écran titre : « Commencer » passe en plein écran paysage sur téléphone ; en portrait, la consigne propose un bouton « Passer en plein écran paysage ». À vérifier sur le vrai téléphone. |
| « Commencer » ne lançait pas le jeu | 40 | 👀 n° 17 | Cause trouvée : les Options s'ouvraient **derrière** l'écran titre (inutilisables), et le jeu restait dans les Options ; « Commencer » ne faisait alors rien. Corrigé (Options au-dessus, et « Commencer » ferme les Options si besoin) ; la partie démarre avant la demande de plein écran ; les erreurs de l'appareil sont recopiées dans le rapport du diagnostic. À confirmer sur le téléphone. |
| Options : choisir le plein écran | 40 | 👀 n° 18 | ⚙ → Affichage → « Plein écran » : Automatique (téléphone oui), Oui, Non. |
| Option filtre « écran cathodique » | 40 | 👀 n° 19 | ⚙ → Affichage : lignes de balayage, bords sombres et bombés, force réglable ; désactivé par défaut (coûte un peu sur téléphone). |
| Autres options intéressantes | 40 | 👀 n° 20 | Séance 41 (choix de l'auteur) : onglet **Accessibilité** — taille du texte (petite à très grande), vitesse du texte, vibrations (téléphone, manette), luminosité, contraste, réduire les animations. Non retenues pour l'instant : mode daltonien, bavardage. |
| La bande noire du haut-parleur restait au-dessus des menus | 41 | 👀 n° 21 | Règle posée : les voix (bande, bulle) sont toujours sous les fenêtres et menus (ordre d'empilement écrit dans style.css). |
| Le héros se déplaçait pendant un scan ou un échange (bugs visuels) | 41 | 👀 n° 22 | Pendant une action (scan, aparté), un toucher ailleurs est ignoré et aucun déplacement n'est possible. |
| Accueil : aucun produit au-dessus ni à gauche ; mur agrandi à gauche ; panneau vert de la largeur du mur | 42 | 👀 n° 23 | Pan de mur dégagé (sans étagère) au début du rayon ; mur de 32 Scanettes (x 30 à 414) ; la banane déplacée plus loin sur l'étagère. |
| Options de l'écran titre : un menu à part, assorti au titre (noir, bleu clair), sans réglages de développement | 42 | 👀 n° 24 | Son, Affichage, Accessibilité, Jeu ; doigt, souris, clavier (haut/bas, Échap), manette (croix, A, B). Le panneau ⚙ en jeu reste celui de développement. |
| Sous-onglets des cartes : Toutes / Alimentaire / Non alimentaire / Spéciales ; autres idées (non périssables, évolutives, fusions) | 43 | 👀 n° 25 | Filtres faits (chaque produit a une catégorie dans products.json). Autres filtres : ❓ quand les familles de cartes existeront (prototype B). |
| Après « Commencer » : texte blanc sur fond noir, intro courte et mystérieuse, puis fondu sur le jeu | 43 | 👀 n° 26 | 7 lignes [TEMP] (`src/data/intro.json`) avec pluie, portes, ding, haut-parleur. Toucher : ligne suivante ; « Passer ». Désactivable (Options → Jeu). |
| Annonces du haut-parleur un peu transparentes | 43 | 👀 n° 27 | Opacité du fond 78 % (Options → Affichage, « Opacité des annonces »). |
| Couleurs des menus Panier et configuration : artistiques, originales, modernes | 43 | 👀 n° 28 | Panier : sac kraft, onglet tamponné en rouge. Réglages ⚙ : ticket de caisse. À juger par l'auteur. |
| Première réflexion du héros (pourquoi il est là, questions, objectif) ; première interaction avec l'Épaisseur graduée, une découverte | 43 | 👀 n° 29 | Pensées à l'arrivée gardées ; la rencontre a été déplacée après la première carte (séance 44). Raison de l'entrée : il ne s'en souvient plus (choix B, pour le moment). |
| Correction : le premier aparté ne se déclenchait pas toujours ; il doit venir après la première carte, ne jamais être manqué, rien ne doit l'interrompre | 44 | 👀 n° 30 | Moment « important » : il attend son tour (annonce finie, héros arrêté) aussi longtemps qu'il faut ; pendant la conversation, rien ne parle, le héros ne bouge pas, chaque réplique attend un toucher (▾). |
| La rencontre : plus de répliques ; le héros se demande si le joueur est ce qui lui manque, « Qui es-tu ? » ; le joueur répond sans choix ; les choix seulement ensuite | 44 | 👀 n° 31 | 11 répliques [TEMP] (`narrator.json`, « rencontre ») ; la voix du joueur dans un cadre « Toi » en haut de l'écran (nuit et bleu clair) ; un choix à la fin. |
| Pouvoir relire un dialogue : historique | 44 | 👀 n° 32 | Pause → « Dialogues » : les 40 dernières répliques, avec les réponses du joueur. |
| Filtres de cartes futurs : vieillissement, fusions et stade (a, b et c) | 44 | ❓ | Prototype B, quand ces familles existeront. Cohérent : ce sont des axes différents (deux rangées : type, état). |
| Bouton du Panier en bas à gauche : rouge, en forme de petit panier | 44 | 👀 n° 33 | Petit panier rouge en papier découpé, le nombre de cartes sur son flanc. |
| Rencontre : le héros s'avance au milieu de l'écran en deux fois (« Hum ?… » à mi-chemin), un peu en avant ; bords flous avec vagues violettes | 45 | 👀 n° 34 | Caméra immobile pendant qu'il s'avance, puis zoom. Flou réel des bords (⚙ → Narrateur, 6 px, 0 = sans) : à mesurer sur le téléphone (règle « pas de flou sur ce qui bouge »). |
| Bords de la rencontre : pas seulement du flou ; des vagues (traits) hypnotiques, une autre dimension ; moins énergivore | 46 | 👀 n° 35 | Traits ondulés violets qui défilent sur les 4 bords (sens contraires), lueur qui palpite ; flou réel retiré par défaut (réglable). Les animations s'arrêtaient peut-être avec le réglage « animations réduites » du téléphone : désormais seule l'option du jeu les arrête. |
| Effacer l'interface (ATH) pendant les dialogues avec le joueur | 46 | 👀 n° 36 | Boutons, Panier, version, aide : effacés pendant la conversation. Pause toujours possible (Échap, Start). |
| Nom du joueur : « Épaisseur » par défaut ; propositions ; son propre nom | 46 | 👀 n° 37 | Options → Jeu (et ⚙ → Narrateur). 11 propositions [TEMP] (`data/joueur.json`) ; un nom tapé (16 lettres au plus). |
| Rayon du bas deux fois moins haut (juste les produits du haut) ; plus fluide ? | 46 | 👀 n° 38 | Fait. Mesuré ici : surface affichée 1,88 → 1,74 écran, images en mémoire 6,01 → 5,57 Mpx. Sur le téléphone (séances 23 et 25), la moitié haute coûtait ×0,70 (à confirmer avec le banc d'essai). Point de rencontre remis plus en avant. |
| Le héros propose au joueur de changer de nom pendant la rencontre (si « Épaisseur » ne lui plaît pas) ; changeable ensuite dans les options | 47 | 👀 n° 39 | Réplique « Il te faut un nom… » : les propositions s'affichent en bas (style de l'écran qui parle), « Épaisseur » d'abord, « Autre… » pour taper le sien. La suite emploie le nom choisi. |
| La main doit tenir le panier et la Scanette (de face et de profil) | 47 | 👀 n° 40 | Objets redessinés avec la main qui tient l'anse ou la poignée, passés devant le héros. Vue de dos : Scanette inchangée (cachée par le corps). |
| Tête de face : oreille et mèche mal placées | 47 | 👀 n° 41 | Têtes de face (apartés) : une oreille de chaque côté, au bord de la tête ; cheveux en frange. |
| Cartes du Panier deux fois plus petites ; toucher une carte la retourne et l'affiche deux fois plus grande, description au dos, texte net ; refermer par Fermer/Annuler (kraft foncé, en haut et en bas à droite), en touchant à côté, clavier, manette | 48 | 👀 n° 42 | Grande carte redessinée à sa taille (texte net), qui tient dans l'écran (plus petite sur un écran bas) ; toucher la grande carte la retourne (recto/verso) ; descriptions [TEMP]. Manette : haut/bas choisit la carte, A l'ouvre ou la retourne, B la referme. |
| Boutons kraft seulement en haut à droite et en bas à droite du menu (pas dans le vide) ; grande carte refermée en touchant à côté, sans bouton ; kraft marron clair | 48 | 👀 n° 43 | Fait : boutons de la grande carte retirés ; bouton du bas poussé en bas du menu ; kraft clair (#d9b382), texte foncé. |
| La carte ne doit pas être en double (grande et dans le Panier) | 48 | 👀 n° 44 | La petite carte quitte le Panier pendant qu'elle est en grand ; en refermant, elle se retourne dans l'autre sens et revient à sa place. |
| Tester sans tout refaire (sauvegarde, choix de séquence ou « passer la séquence ») | 48 | 👀 n° 45 | Choix : points de départ (⚙ → Départ, ou lien `?depart=equipe`, `libre`, `3-cartes`, `panier-plein`). Plus sûr qu'une sauvegarde tant que le jeu change à chaque version. Sauvegarde de partie : plus tard, pour les joueurs. |
| Dos de la carte qui se retourne « pas super » | 49 | 🔧 | À revoir plus tard (demande de l'auteur). |
| Tournis : déplacer le héros de droite à gauche trop vite → étoiles autour de la tête, et il dit au joueur d'arrêter ; d'autres phrases s'il recommence | 49 | 👀 n° 46 | Déclenché à 6 demi-tours en moins de 3 s ; étoiles 3,5 s ; pas avant 60 s la fois suivante (⚙ → Personnage). 5 répliques [TEMP], la plus ancienne d'abord ; c'est un aparté (il se tourne vers le joueur, zoom). |
| Bug : double clic (ou double toucher) rapide sur une carte du Panier → carte zoomée à fond | 49 | 👀 n° 47 | Cause : le second clic tombait sur la carte en vol et coupait l'animation (elle sautait d'un coup à sa grande taille) ; sur téléphone, le navigateur pouvait aussi zoomer. Corrigé : un toucher sur la carte pendant une animation est ignoré ; zoom du navigateur coupé sur cette zone. |
| Bug (suite 2) : double toucher sur la carte déjà agrandie → elle grandit encore, s'approche et disparaît | 49 | 👀 n° 48 | Cause : le 1er toucher la retourne (elle devient toute fine), le 2e tombe à côté = « refermer », et la fermeture la mesurait toute fine (agrandissement énorme). Corrigé : toucher à côté ignoré pendant toute animation ; mesure à sa taille réelle. |
| Accueil plus grand, avec un mur de Scanettes | 41 | 👀 n° 49 | Mur de 24 Scanettes et pile de 5 paniers (décor [TEMP]). Double toucher : le dessin le plus proche du doigt l'emporte. |
| Sans panier : le héros s'interroge lui-même | 41 | 👀 n° 50 | Nouvelle voix « pensée » : bulle en pointillés, il se parle à lui-même (« Et je mets ça où, moi ? »), sans mise en scène. |
| Écran titre (nom en grand, image mystérieuse, Commencer, Options ; esprit Baten Kaitos / FF) | 39 | 👀 n° 51 | Construit avec une image [TEMP] et les polices du système (aucune police ajoutée sans accord) ; police à choisir par l'auteur. |
| Confiance héros–Épaisseur : noter en détail, intégrer comme essai | 39 | 🧪 | GAME_DESIGN.md (détails ❓) ; répliques selon la confiance (haute ≥ 1, basse ≤ −1) à l'essai. |
| Apartés : magasin figé, motif de l'Épaisseur, regards caméra, réponses et confiance | 38 | 👀 n° 52 | Construit : pendant l'aparté la musique du magasin se tait, le haut-parleur se tait (il réagit après coup au client « planté devant le mur »), le repère se fige ; motif de 4 notes [TEMP] à chaque aparté ; petits regards caméra sans texte après une annonce sur deux (au plus un toutes les 25 s) ; deux réponses sur 2 apartés (confiance +1/−1/0), le héros répond. Avec « réduire les animations » : pas de zoom. |
| Panier plein : reposer une carte (choix B) | 37 | 👀 n° 53 | Construit séance 37 : écran « Panier plein », toucher une carte la repose ([TEMP] abandonnée), puis le scan se fait ; « Annuler » sinon. |
| L'accueil, un lieu à part (hall, portique, agent, comptoir) | 37 | 🔧 | Noté dans HISTOIRE, PERSONNAGES et PROTOTYPES (étape après A5, à proposer seulement après validation de A5). Rien de construit. Séance 51 : A6 en cours (1/3 construit). |
| Nom du deck (« courses » provisoire) | 36 | ❓ | Pistes proposées en séance 36 ; renommer « Panier » dans le jeu une fois choisi. |
| Capacités et panier plein | 36 | ❓ | [TEMP] panier = 6 (⚙ → Scanner) ; panier plein : scan refusé en attendant le choix de l'auteur (options proposées en séance 36). |
| Qui donne le jeton de caddie | 36 | ❓ | Pistes : le Vieux Monsieur avant sa mort ; ou rendre son caddie à la Caisse Finale pour récupérer sa pièce (le passeur des morts). |
| Apartés du héros (le joueur est son « Épaisseur ») | 33 | 👀 n° 54 | 5 apartés [TEMP] (après l'accueil, scan dans le vide, inactivité, Panier), bulle de papier + froissement + bips plus graves, pivot vers l'écran à l'arrêt ; 2 réactions du haut-parleur (« parler au mur ») ; plus rares que les annonces (90 s), jamais deux voix à la fois, l'annonce passe avant. **À tester, puis valider (🧪 dans HISTOIRE et PERSONNAGES).** |
| Narrateur A4 | 31 | 🔧 | Séance 32 : bande au haut-parleur, machine à écrire, annonce et petits bips, 12 répliques [TEMP] sur 8 moments, rare et sans répétition, fil « Client » → « Article non référencé » (choix A). **À tester par l'auteur.** Séance 33 : apartés du héros ajoutés. **Validation d'A4 proposée** (après un test rapide de fluidité si l'auteur le souhaite). |
| Pourquoi mettre des cartes dans un Panier ? | 28 | ❓ | Toujours ouvert (docs/HISTOIRE.md). Le Caddie jouable (A5) en sera la forme physique. |
| Adapter l'effet de transformation et les bruitages à l'histoire | 28 | 🔧 | Après le choix de la piste. |
| Interaction avec les cartes dans le Panier | 28 | 👀 n° 55 | Normal pour l'instant : le prototype A vérifie seulement « scanner est agréable ». Les cartes serviront au combat (prototype B). |
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
| Audit, points 2 et 4 : construire / quitter / reconstruire un lieu ; images du lieu libérées | 50 | 👀 n° 56 | `scene/placeView.js`, `loadPlace` / `unloadPlace`, `releaseImages`. Testé par 3 allers-retours (rien ne s'accumule). Banc d'essai à refaire sur le téléphone (comparer à `2aa4b77`). Transition, sorties et préchargement : avec A6. |
| Audit, point 6 : chemin recalculé à chaque mouvement du doigt | 50 | 👀 n° 57 | Au plus un calcul par image. Testé. À mesurer sur le téléphone plus tard (décision de l'auteur). Points 7 à 15 : peuvent attendre. |
| A6 (1/3) : l'accueil, lieu séparé ; aller-retour rayon ↔ accueil avec fondu | 51 | 👀 n° 58 | Hall provisoire, sorties dans les données, état « transition », lieu chargé dans le noir et ancien lieu libéré. À mesurer sur le téléphone : temps du changement (rapport DBG). Restent : présentoir déplacé et départ à l'accueil (2/3) ; agent et portiques (3/3) ; comptages et banc de l'accueil. |
| (constaté à l'audit) La première rencontre peut se dérouler cachée sous le Panier ; le Panier s'ouvre pendant la rencontre (touche I, bouton Y) | 50 | 👀 n° 59 | Corrigé (validé par l'auteur) : pas de Panier pendant un aparté ou une conversation ; hors du jeu (Panier, menus), le héros ne prend pas la parole, la rencontre attend le retour. Testé. |

### À rappeler à l'auteur : points 7 à 15 de l'audit (séance 50), pas encore traités
| Point | État | Notes |
|---|---|---|
| 7. La page est mesurée à chaque image (bulle, étoiles, doigt) | 🔧 | `scene/stage.js` : retenir la mesure une fois. Petit. |
| 8. Éléments créés en plein jeu au moment du scan (carte du Panier, carte qui vole, icône d'objet) | 🔧 | Préparer les cartes au chargement ; ajouter un scan au banc. Petit à moyen. |
| 9. Animations CSS qui continuent en pause et sous les menus | 🔧 | Les figer hors du jeu. Petit. |
| 10. La rencontre est chargée en effets (un calque par mot, 4 bandes, lueur) | 🔧 | Mesurer d'abord sur le téléphone (DBG pendant la rencontre). |
| 11. `main.js` trop gros, 7 rôles | 🔧 | Trois déplacements sans changer le comportement. Moyen. |
| 12. Logique de jeu hors de `core/` (échange du panier plein, marche de la rencontre, règles de la grande carte) | 🔧 | Petit à moyen. |
| 13. Code mort (`setTarget`, `open_`, `sprite.stats`, `dust.counter`) | 🔧 | Petit. |
| 14. Écarts documents / code (ARCHITECTURE, SUIVI, tests dans un seul fichier) | 🔧 | Petit. |
| 15. Images de plus de 4 096 pixels réels réduites sans prévenir | ❓ | Règle à décider avant de dessiner le vrai hall. |

## À trancher par l'auteur : les points 👀
Pour chacun : **validé** (→ archive), **à refaire** (→ 🔧) ou **abandonné** (→ archive, noté abandonné). Répondre par numéros, par exemple « 1 à 20 validés, 23 à refaire, 31 abandonné ».

1. Retournement de la feuille gauche/droite, façon Paper Mario *(Personnage)*
2. Essai : scanner un produit posé sur une table ou dans le caddie, de profil ou de face *(Marche et contrôles)*
3. Scanner naturellement au doigt par un double toucher *(Marche et contrôles)*
4. Petite musique de supermarché (provisoire) *(Son)*
5. Chargement du lieu : 3,9 s sur le téléphone avec le rayon long *(Fluidité)*
6. Chargement du lieu : 8,2 s sur le téléphone *(Fluidité)*
7. Son : latence de sortie 176 ms sur le téléphone *(Fluidité)*
8. Justifier le scanner dans l'histoire : scanner spécial ? quels objets ? pourquoi ? *(Histoire et sens du jeu (séance 28))*
9. Voir les haut-parleurs d'où sort la voix *(Histoire et sens du jeu (séance 28))*
10. Le personnage semble flotter au-dessus du carrelage *(Histoire et sens du jeu (séance 28))*
11. A4 : l'aparté doit être un moment rare et marquant *(Histoire et sens du jeu (séance 28))*
12. Menu du panier : onglets « Cartes » et « Objets » *(Histoire et sens du jeu (séance 28))*
13. Carte reposée : le produit retourne sur l'étagère (choix B) *(Histoire et sens du jeu (séance 28))*
14. Objets représentés par une image + courte description *(Histoire et sens du jeu (séance 28))*
15. Réponses de l'aparté introuvables *(Histoire et sens du jeu (séance 28))*
16. Le jeu commence parfois à la verticale sur téléphone *(Histoire et sens du jeu (séance 28))*
17. « Commencer » ne lançait pas le jeu *(Histoire et sens du jeu (séance 28))*
18. Options : choisir le plein écran *(Histoire et sens du jeu (séance 28))*
19. Option filtre « écran cathodique » *(Histoire et sens du jeu (séance 28))*
20. Autres options intéressantes *(Histoire et sens du jeu (séance 28))*
21. La bande noire du haut-parleur restait au-dessus des menus *(Histoire et sens du jeu (séance 28))*
22. Le héros se déplaçait pendant un scan ou un échange (bugs visuels) *(Histoire et sens du jeu (séance 28))*
23. Accueil : aucun produit au-dessus ni à gauche ; mur agrandi à gauche ; panneau vert de la… *(Histoire et sens du jeu (séance 28))*
24. Options de l'écran titre : un menu à part, assorti au titre (noir, bleu clair), sans réglages… *(Histoire et sens du jeu (séance 28))*
25. Sous-onglets des cartes : Toutes / Alimentaire / Non alimentaire / Spéciales ; autres idées… *(Histoire et sens du jeu (séance 28))*
26. Après « Commencer » : texte blanc sur fond noir, intro courte et mystérieuse, puis fondu sur… *(Histoire et sens du jeu (séance 28))*
27. Annonces du haut-parleur un peu transparentes *(Histoire et sens du jeu (séance 28))*
28. Couleurs des menus Panier et configuration : artistiques, originales, modernes *(Histoire et sens du jeu (séance 28))*
29. Première réflexion du héros (pourquoi il est là, questions, objectif) ; première interaction… *(Histoire et sens du jeu (séance 28))*
30. Correction : le premier aparté ne se déclenchait pas toujours ; il doit venir après la… *(Histoire et sens du jeu (séance 28))*
31. La rencontre : plus de répliques ; le héros se demande si le joueur est ce qui lui manque, «… *(Histoire et sens du jeu (séance 28))*
32. Pouvoir relire un dialogue : historique *(Histoire et sens du jeu (séance 28))*
33. Bouton du Panier en bas à gauche : rouge, en forme de petit panier *(Histoire et sens du jeu (séance 28))*
34. Rencontre : le héros s'avance au milieu de l'écran en deux fois (« Hum ?… » à mi-chemin), un… *(Histoire et sens du jeu (séance 28))*
35. Bords de la rencontre : pas seulement du flou ; des vagues (traits) hypnotiques, une autre… *(Histoire et sens du jeu (séance 28))*
36. Effacer l'interface (ATH) pendant les dialogues avec le joueur *(Histoire et sens du jeu (séance 28))*
37. Nom du joueur : « Épaisseur » par défaut ; propositions ; son propre nom *(Histoire et sens du jeu (séance 28))*
38. Rayon du bas deux fois moins haut (juste les produits du haut) ; plus fluide ? *(Histoire et sens du jeu (séance 28))*
39. Le héros propose au joueur de changer de nom pendant la rencontre (si « Épaisseur » ne lui… *(Histoire et sens du jeu (séance 28))*
40. La main doit tenir le panier et la Scanette (de face et de profil) *(Histoire et sens du jeu (séance 28))*
41. Tête de face : oreille et mèche mal placées *(Histoire et sens du jeu (séance 28))*
42. Cartes du Panier deux fois plus petites ; toucher une carte la retourne et l'affiche deux fois… *(Histoire et sens du jeu (séance 28))*
43. Boutons kraft seulement en haut à droite et en bas à droite du menu (pas dans le vide) ;… *(Histoire et sens du jeu (séance 28))*
44. La carte ne doit pas être en double (grande et dans le Panier) *(Histoire et sens du jeu (séance 28))*
45. Tester sans tout refaire (sauvegarde, choix de séquence ou « passer la séquence ») *(Histoire et sens du jeu (séance 28))*
46. Tournis : déplacer le héros de droite à gauche trop vite → étoiles autour de la tête, et il… *(Histoire et sens du jeu (séance 28))*
47. Bug : double clic (ou double toucher) rapide sur une carte du Panier → carte zoomée à fond *(Histoire et sens du jeu (séance 28))*
48. Bug (suite 2) : double toucher sur la carte déjà agrandie → elle grandit encore, s'approche et… *(Histoire et sens du jeu (séance 28))*
49. Accueil plus grand, avec un mur de Scanettes *(Histoire et sens du jeu (séance 28))*
50. Sans panier : le héros s'interroge lui-même *(Histoire et sens du jeu (séance 28))*
51. Écran titre (nom en grand, image mystérieuse, Commencer, Options ; esprit Baten Kaitos / FF) *(Histoire et sens du jeu (séance 28))*
52. Apartés : magasin figé, motif de l'Épaisseur, regards caméra, réponses et confiance *(Histoire et sens du jeu (séance 28))*
53. Panier plein : reposer une carte (choix B) *(Histoire et sens du jeu (séance 28))*
54. Apartés du héros (le joueur est son « Épaisseur ») *(Histoire et sens du jeu (séance 28))*
55. Interaction avec les cartes dans le Panier *(Histoire et sens du jeu (séance 28))*
56. Audit, points 2 et 4 : construire / quitter / reconstruire un lieu ; images du lieu libérées *(Documentation et architecture (séance 29))*
57. Audit, point 6 : chemin recalculé à chaque mouvement du doigt *(Documentation et architecture (séance 29))*
58. A6 (1/3) : l'accueil, lieu séparé ; aller-retour rayon ↔ accueil avec fondu *(Documentation et architecture (séance 29))*
59. (constaté à l'audit) La première rencontre peut se dérouler cachée sous le Panier ; le Panier… *(Documentation et architecture (séance 29))*

## Règles de travail ajoutées par l'auteur
- Donner le lien pour jouer à chaque fin de conversation (séance 4).
- Noter tous les changements et modifications pour ne pas se perdre : ce fichier (séance 4).
- Garder toutes les options dans le menu des réglages, même validées (séances 5 et 7).
- Économiser la lecture : ne pas relire à chaque fois de gros documents ; documentation courte et à jour avec le code (séance 29).
- Documents de conception courts (50 à 80 lignes), balisés ✅ 🧪 ❓ [TEMP], lus seulement à l'étape concernée, jamais en début de séance (séance 31).
