# Journal des séances

Le rapport le plus récent est en haut. Les étapes validées par l'auteur y sont inscrites avec leur commit (points de retour sûrs).

## Étapes validées

| Étape | Commit | Date |
|---|---|---|
| A1 — le personnage est agréable à déplacer | `1445d25` (« A1 validée : 1445d25 ») | 12/11/2026 |

---

## Séance 12 — 13/11/2026 — Analyse du diagnostic en 4 configurations ; plan des tests T0, T1, T2

**Mesures sur le téléphone (921b78d, Oppo Reno 2, en charge 70 → 78 %)** — images > 20 ms par minute (essais 1/2/3) :
1. immobile, caméra fixe : 11 (6/13/14) ;
2. marche, caméra fixe : 22 (18/26/21) ;
3. immobile, caméra mobile : 125 (117/129/130) ;
4. marche, caméra mobile : 162 (154/154/179).

Images > 33 ms : 0 / 0,7 / 5,7 / 4,7 par minute ; aucune > 50 ms. Calcul du jeu 0,5 à 0,7 ms ; rendu de la page 3,3 à 3,9 ms ; ménage mémoire 91 fois, lié à environ 1 % des images lentes seulement.

**Comptages du navigateur de test** (organisation du rendu ; ne prouvent rien sur la carte graphique du téléphone) :
- personnage redessiné environ 60 fois/s dans les 4 configurations, même immobile ;
- poussière redessinée 64 fois/s en marchant ;
- mises en page 1/s à l'arrêt, 17/s en marche ;
- la caméra mobile n'ajoute aucun redessin.

**Démontré (téléphone)** : le problème est reproductible ; la caméra mobile multiplie les images lentes par 11 ; ce sont des images ratées (exactement 2 ou 3 rafraîchissements), pas des calculs longs ; la caméra n'augmente pas le rendu côté page ; le ménage mémoire n'est pas la cause ; aucun chargement d'image pendant les mesures.

**Probable** : la caméra oblige la carte graphique à recomposer tout l'écran à pleine finesse (2400×1080), plusieurs calques empilés ; le redessin du personnage à chaque image pèse sur toutes les configurations.

**Inconnu** : temps réel de la carte graphique ; effet de la chaleur et de l'ordre des configurations ; pics isolés de la mesure de rendu ; part respective du dessin du personnage et de la poussière ; gain réel d'un passage à PixiJS.

**Décision de l'auteur** : mesurer avant de corriger. Tests sur le téléphone sans changer le code :
- T0 : référence, réglages par défaut ;
- T1 : « Réduire les animations » (coupe rebond, respiration, écrasements, retournement et poussière ; vérifié par comptage : personnage redessiné 1 fois/s à l'arrêt, 13 fois/s en marche, poussière 0) ;
- T2 : opacité du rayon de devant à 0.

Conditions identiques : téléphone débranché, refroidi, économie d'énergie coupée, « Ne pas déranger », mêmes durées (chauffe 30 s, 3 × 60 s). Ensuite : corrections une à une, avec comparaison avant/après. Pas de PixiJS pour l'instant.

---

## Séance 11 — 12/11/2026 — Diagnostic fiable en 4 configurations (aucune correction)

**Demande de l'auteur** : consolider le diagnostic avant tout essai PixiJS, sans modifier le moteur ni l'architecture. Quatre configurations (marche oui/non × caméra mobile oui/non) ; 60 s de chauffe, 3 mesures de 60 s chacune ; relever images/s, images > 20, 33 et 50 ms, p95, calcul du jeu, rendu si possible ; vérifier que les conditions sont identiques ; examiner les causes possibles (ménage mémoire, chargement d'images, caméra, autre traitement du navigateur). Ne pas commencer PixiJS avant d'avoir examiné les résultats ensemble.

**Construit (diagnostic seulement, le jeu normal ne change pas)**
- ⚙ → Diagnostic → **« Lancer le diagnostic complet »** : les 4 configurations s'enchaînent toutes seules, en 16 min environ. L'écran est maintenu allumé, un bandeau indique l'avancement et le temps restant.
- **Conditions identiques** : même endroit du rayon (aller-retour entre x 1300 et 2300 à la même profondeur), même vitesse, ligne droite (aucun calcul de chemin). Le personnage immobile est au milieu de cet aller-retour. La caméra fixe est centrée sur l'aller-retour. La caméra mobile suit le personnage (config. 4) ou un « fantôme » invisible qui fait le même aller-retour (config. 3), donc la même trajectoire de caméra.
- **Par mesure** : images/s, images > 20, > 33 et > 50 ms, médiane, p95, pire ; calcul du jeu moy/p95/pire ; **rendu côté page** moy/p95/pire (approximation : temps entre la fin du calcul et la fin de la préparation de l'image par le navigateur ; le travail de la carte graphique n'est pas mesurable depuis la page) ; images > 50 ms signalées par le navigateur (LoAF) ; tâches longues du navigateur.
- **Causes examinées** : pour chaque image lente, le rapport indique ce qui venait de se passer : ménage de la mémoire (détecté par des « objets témoins » que le navigateur signale quand il les jette ; la mesure de mémoire du navigateur s'est révélée figée, donc inutilisable), changement de dessin du personnage, retournement, poussière, mouvement de caméra. Il donne aussi la part normale de ces moments, pour distinguer un vrai lien d'une coïncidence. Il compte les images chargées pendant les mesures (doit être 0).
- **Contrôle des conditions** : taille de fenêtre, plein écran, densité, passage en arrière-plan, touchers pendant la mesure, batterie au début et à la fin. Toute mesure dont les conditions ont changé est marquée.

**Vérifié** : 63 tests de logique (ordre des phases, durée totale 16 min, chaque configuration fait bouger exactement ce qu'elle doit, aller-retour en ligne droite sur un trajet sans obstacle) ; 34 tests navigateur, dont un diagnostic raccourci complet (rapport à 4 configurations, 8 mesures, conditions inchangées). Les temps du navigateur de test ne valent rien.

**À faire par l'auteur** : lancer le diagnostic complet sur le téléphone et coller le rapport. Ensuite : tableau comparatif et bilan « démontré / probable / inconnu ».

---

## Séance 10 — 12/11/2026 — Analyse des saccades (deux bancs d'essai)

**Rapports de l'auteur (5973115, Oppo Reno 2, plein écran)**

| | Normal | Caméra immobile |
|---|---|---|
| Images/s moyennes | 58,8 | 60,1 |
| Médiane / p95 / p99 | 16,4 / 16,5 / 32,8 ms | 16,4 / 16,5 / 32,8 ms |
| Images > 20 ms | 124 (3,7 %) | 47 (1,4 %) |
| Images > 33 ms | 3 | 3 |
| Calcul JS pire | 15,0 ms | 8,9 ms |
| Rafales | 122 épisodes, 2 images au plus | 45 épisodes, 3 images au plus |
| Chargement | 1,2 s | 1,2 s |

**Ce que les mesures prouvent**
1. **Le défilement de la caméra cause environ 60 % des images lentes** (124 → 47 quand elle ne bouge plus).
2. **Il reste une autre cause** (47 images lentes caméra immobile, en marche comme à l'arrêt). Elle n'est pas encore identifiée.
3. Les saccades sont **isolées** : une image saute un rafraîchissement, pas de longue rafale.
4. Le **calcul du jeu** est très faible (0,7 ms), avec de rares pics à 9–15 ms, probablement le nettoyage automatique de la mémoire du navigateur (non prouvé).
5. Le calcul du chemin n'est pas la cause principale (3 images lentes sur 42).

**Ce que cela veut dire** : la technique d'affichage actuelle (DOM + CSS) tient 60 images/s en moyenne, mais ne tient pas encore l'objectif « aucune image > 33 ms ». C'est le point de décision prévu avant A3 : essayer PixiJS (WebGL), chiffres à l'appui.

**Décision demandée à l'auteur** : voir les options proposées en séance 10.

---

## Séance 9 — 12/11/2026 — Premier banc d'essai sur le téléphone : mesurer la cause des saccades

**Rapport de l'auteur (9756425, Oppo Reno 2, plein écran)** : 58,0 images/s ; médiane 16,4 ms ; p95 16,6 ms ; **p99 32,9 ms** ; pire 49,3 ms ; **5 images > 33 ms (0,15 %)** ; **163 images > 20 ms (5 %)** ; calcul JS moyen 0,74 ms, **pire 21,3 ms** ; chargement 3,9 s.

**Lecture** : 95 % des images sont parfaites. Environ 1 image sur 20 « saute » un rafraîchissement : elle dure 33 ms au lieu de 16. C'est une petite saccade, peut-être visible. Le calcul du jeu est presque toujours minuscule (0,7 ms), mais au moins une image a demandé 21 ms de calcul. Les objectifs ne sont donc pas tenus.

**Ce qui a été fait (mesure seulement, aucune correction)**
- Le rapport du banc classe maintenant les images lentes (> 20 ms) selon le moment : caméra en mouvement ou immobile, personnage en marche ou à l'arrêt, image où un chemin est calculé. Il dit si elles arrivent isolées ou en rafales, et à quel moment a eu lieu le calcul le plus long.
- Il indique aussi les images les plus lentes à préparer au chargement.
- Nouvel interrupteur d'essai : **caméra immobile**, pour prouver ou écarter le défilement du décor comme cause.

**Vérifié** : 58 tests de logique, 33 tests navigateur ; banc lancé dans le navigateur de test (nouvelles lignes du rapport correctes).

**À faire par l'auteur** : deux bancs d'essai sur le téléphone (un normal, un avec « Essai caméra immobile »), puis coller les deux rapports.

---

## Séance 8 — 12/11/2026 — Banc d'essai et test des comptages (fin de A2)

**Retours de l'auteur** : changements de la séance 7 validés ; joystick désactivé par défaut (il l'était déjà ; un test le garantit désormais).

**Jouable maintenant**
- **Banc d'essai** : ⚙ → onglet Diagnostic → « Lancer le banc d'essai ». Le personnage parcourt seul le rayon : derrière les présentoirs, derrière le caddie, en bas de l'écran derrière le rayon de devant, avec des allers-retours (retournements) et des arrêts (respiration), et toujours le même trajet. Il commence par 3 s de chauffe, puis fait 3 tours, soit environ une minute. Un bandeau indique l'avancement. À la fin, un rapport s'affiche avec « Copier le rapport » : images/s moyennes, temps d'image (médiane, 95e et 99e percentiles, pire), nombre d'images > 33 ms, calcul JavaScript séparé du temps total. Échap ou ⏸ annule, et le rapport indique alors « annulé ».
- **Interrupteurs d'essai** (même onglet) : refaire le même parcours sans rayon de devant, sans rayons lointains, sans poussière ou sans ombre, pour comparer deux rapports. Ils ne s'appliquent que pendant le banc.
- Réglages du banc : nombre de tours, durée de la chauffe.

**Vérifié, et comment**
- 58 tests de logique, dont le banc : chaque point du parcours est praticable et réellement atteint, le trajet est identique d'une fois à l'autre, chauffe puis tours, puis fin ; nouvel état « banc d'essai » dans la machine à états.
- 33 tests navigateur, dont :
  - le lancement depuis l'onglet Diagnostic, l'annulation et le rapport ;
  - le **test des comptages** pendant un tour complet : 39 éléments dans la scène, 4 calques, 10 images visibles au plus, surface d'image 1,85 × l'écran, 17 images (5,5 Mpx). Pendant le jeu : 0 élément créé, 0 canevas, 0 nœud ajouté, 0 lecture de pixels. Les limites sont fixées avec une petite marge ; le test échoue si une modification les dépasse.
- Banc complet lancé dans le navigateur de test : il dure environ 57 s et le rapport est correct. Ses temps ne valent rien (pas de carte graphique) ; seul le rapport du téléphone compte.
- **Limite honnête** : les « objets créés à chaque image » ne sont pas comptés directement (le navigateur ne le permet pas de façon fiable). On compte les éléments, images et canevas créés pendant le jeu (zéro). Seuls de petits textes de position sont recréés à chaque image, ce qui est inévitable avec l'affichage DOM.

**À faire par l'auteur** : lancer le banc d'essai sur le téléphone (plein écran, ne rien toucher pendant une minute), puis coller le rapport.

**Proposition pour la séance suivante** : si le rapport du téléphone est bon, validation de A2, puis étape A3 : les produits sur les étagères, le scanner et les premières cartes.

---

## Séance 7 — 12/11/2026 — Bords de la zone au doigt, zone agrandie, réglages en onglets

**Retours de l'auteur**
- Ce qui plaît : tout le travail de la séance 6 est validé.
- Ce qui gêne : difficile de viser le bord de la zone de marche au doigt.
- Ce qui manque : zone de marche encore plus grande en haut et en bas ; réglages en onglets par thème.
- Question : le plein écran marche-t-il sur d'autres écrans ?

**Jouable maintenant**
- **Toucher hors du sol** (sur une étagère, sur le rayon de devant, sur le plafond) : le personnage va jusqu'au bord de la zone de marche, au plus près de l'endroit touché. Ce comportement existait, il est rendu plus fiable (le point visé est placé juste à l'intérieur du bord).
- **Zone de marche agrandie** : jusqu'au pied de l'étagère du fond, et jusqu'au bord bas de l'écran.
- **Réglages en onglets** : Marche, Personnage, Contrôles, Son, Affichage, Caméra, Technique, Debug. Le dernier onglet ouvert est retenu.

**Vérifié, et comment**
- 52 tests de logique, 31 tests navigateur, sans erreur console. Nouveaux : toucher l'étagère du fond puis le bas de l'écran (au doigt et à la souris) amène bien au bord ; onglets (un seul par thème) ; formes d'écran 4:3, 16:10 et 21:9 (toute la hauteur, personnage et boutons visibles).
- Capture des onglets en téléphone simulé regardée.

**Proposition pour la séance suivante** : fin de A2 : banc d'essai et test automatique des comptages, puis validation de A2.

---

## Séance 6 — 12/11/2026 — A2 : profondeur, corps vivant, caméra et parallaxe

**Retours de l'auteur**
- A1 validée (1445d25). Saut : choix B (saut libre), après le prototype A. La musique ne grésille plus.
- Rapport du téléphone : 61 images/s, p95 16,5 ms, chargement 1,4 s (le décor du fond prend 0,44 s).
- Question : le plein écran cache une partie du décor (écran 20:9).

**Jouable maintenant**
- **Profondeur** : le personnage rapetisse en allant vers le fond et grandit un peu tout devant.
- **Ombre au sol**, séparée du dessin, qui s'amenuise quand il s'élève.
- **Corps vivant** : rebond à chaque pas avec léger écrasement au contact, respiration à l'arrêt, petit écrasement en s'arrêtant.
- **Rayon long (3600 px)** et **caméra** qui glisse pour le suivre. Elle regarde un peu devant lui et reste immobile tant qu'il est au centre.
- **Parallaxe** : par deux ouvertures dans l'étagère du fond, on voit des rayons lointains (« RAYON 41 », « RAYON ∞ »…) qui glissent plus lentement ; le rayon de devant glisse plus vite.
- **Plus rien n'est coupé** : toute la hauteur du décor est visible, quel que soit l'écran. Un écran allongé montre simplement plus de rayon. L'ancien choix « remplir / tout montrer » est remplacé par un zoom.

**Vérifié, et comment**
- 52 tests de logique : taille selon la profondeur, rebond, respiration, écrasement, caméra (placement, glissement, zone sans mouvement, bout du rayon, zoom).
- 22 tests navigateur (PC et téléphone simulé), sans erreur console. Nouveaux tests : ombre et taille au fond ; la caméra suit et les rayons lointains glissent moins vite ; toute la hauteur visible.
- Captures PC et téléphone simulé regardées.
- **À vérifier par l'auteur** : la sensation sur le téléphone, la fluidité (rapport DBG), le temps de chargement (le décor est plus grand).

**Décisions prises seul (détails mineurs)**
- Zoom 1 par défaut : sur téléphone, le personnage paraît environ 20 % plus petit qu'avant, en échange d'un décor entier. Réglage « Zoom » dans ⚙ → Caméra.
- Un deuxième présentoir Crousti-Gouffre plus loin dans le rayon (même image).

**Proposition pour la séance suivante** : fin de l'étape A2 : banc d'essai (parcours automatique du rayon, rapport à copier) et test automatique des comptages. Puis validation de A2.

---

## Séance 5 — 12/11/2026 — Poussière, profil Paper Mario par défaut, son et chargement

**Retours de l'auteur**
- Ce qui plaît : profil « Paper Mario » ; pas validés ; contournement validé.
- Ce qui gêne : la musique grésille sur le téléphone.
- Ce qui manque : un petit nuage de poussière à chaque pas ; la respiration (prévue en A2).
- Questions : faut-il dessiner avant l'étape suivante (non) ; le saut (décision en attente).
- Rapport du téléphone (ec1a29f) : 61 images/s, p95 16,5 ms, 4 images > 33 ms sur 2206, calcul 0,57 ms en moyenne (pire 4,8 ms), **chargement 8,2 s**.

**Jouable maintenant**
- **Poussière** : un petit nuage de papier se dégage derrière le pied à chaque pas, recule et s'efface.
- **Profil Paper Mario par défaut**, mis en évidence (✓) dans ⚙ → Marche. Les autres profils restent disponibles.
- **Son** : graves très basses coupées (elles font vibrer les petits haut-parleurs), limiteur en sortie, réserve de son « moyenne ». Nouveau réglage « Réserve de son ».
- **Rapport de diagnostic** : il indique maintenant les images les plus lentes à préparer et l'état du son.

**Vérifié, et comment**
- 43 tests de logique et 18 tests navigateur réussis (PC et téléphone simulé), sans erreur console. Nouveaux tests : la poussière apparaît en marchant puis disparaît ; le profil Paper Mario est sélectionné par défaut.
- Capture de la poussière regardée.
- **Pas vérifiable ici** : le grésillement (pas de haut-parleur) et le temps de chargement réel du téléphone (le PC de test charge en 0,4 s).

**Décisions prises seul (détails mineurs)**
- Poussière désactivée par l'option « réduire les animations ».
- Réserve de son « moyenne » par défaut.

**Proposition pour la séance suivante** : A2, avec en premier l'échelle selon la profondeur, l'ombre, le rebond et la respiration.

---

## Séance 4 — 12/11/2026 — Contournement des objets, pas plus doux, profils de marche, suivi

**Retours de l'auteur**
- Décisions : contourner seul les objets (A) ; A1 pas encore validée (marche encore en test) ; retournement face/dos gardé.
- Ce qui gêne : les pas, désagréables et pas assez discrets.
- À revoir plus tard : la musique, la durée du retournement.
- Question de l'auteur : quel comportement de marche serait agréable et moderne, façon Paper Mario ?
- Nouvelles règles : noter tous les changements (docs/SUIVI.md) ; donner le lien pour jouer à chaque fin de conversation.

**Jouable maintenant**
- **Toucher ou cliquer derrière un objet** : le personnage le contourne seul par le chemin le plus court. Un toucher sur l'objet lui-même l'envoie juste à côté.
- **Pas plus doux** : un frottement étouffé de semelle souple, sans claquement, à volume réduit de moitié (0,35).
- **Profils de marche** dans ⚙ → Marche : « Doux » (actuel), « Paper Mario », « Moderne ». Un toucher règle vitesse, accélération et freinage d'un coup.

**Vérifié, et comment**
- 41 tests de logique réussis, dont la recherche de chemin : ligne droite si rien ne gêne, contournement du présentoir et du caddie, point ramené hors d'un objet, chemin suivi jusqu'au bout.
- 15 tests navigateur réussis (PC et téléphone simulé, au doigt), sans erreur console. Nouveau test : toucher derrière le présentoir, il y arrive et passe derrière.
- **Pas vérifiable ici** : l'écoute des nouveaux pas. **À vérifier par l'auteur** : les profils de marche, le contournement au doigt.

**Comment tester**
1. Touche (ou clique) le sol derrière le caddie : il en fait le tour.
2. ⚙ → Marche → Profil : essaie « Paper Mario » puis « Moderne » ; marche quelques secondes avec chacun.
3. Écoute les pas.

**Quoi essayer**
1. Quel profil de marche te plaît le plus ?
2. Les pas sont-ils devenus assez discrets ?

**Décisions prises seul (détails mineurs)**
- Les profils ne changent pas les valeurs par défaut : c'est l'auteur qui choisira.

**Proposition pour la séance suivante** : une fois la marche validée (A1), suite de l'étape A2 (échelle selon la profondeur, ombre, rebond et respiration, caméra qui glisse, banc d'essai).

---

## Séance 3 — 12/11/2026 — Visage de profil, rayon du premier plan, vraie marche, sons

**Retours de l'auteur**
- Ce qui gêne : de dos, en allant sur le côté, on voyait l'arrière de sa tête ; les jambes faisaient du « moonwalk ».
- Ce qui manque : marcher jusqu'en bas de l'écran ; un rayon devant, en transparence ; des bruits de pas et une petite musique.

**Jouable maintenant**
- **Côté = visage** : il n'est de dos que quand il va vers le fond. Dès qu'il va à gauche ou à droite, on voit son visage, avec le retournement de la feuille.
- **Zone de marche agrandie** jusqu'en bas de l'écran.
- **Rayon du premier plan** en bas de l'écran, en transparence : le personnage marche entre deux rayons et passe derrière celui de devant.
- **Marche corrigée** : le pied posé recule sous le corps pendant que l'autre, levé, passe devant. Plus de « moonwalk ».
- **Son** : un bruit de pas chaque fois qu'un pied se pose, et une petite bossa de supermarché provisoire, un peu étouffée comme par les haut-parleurs du plafond, plus douce en pause. Tout est fabriqué par le jeu, aucun fichier audio. Le son démarre au premier geste (exigence des navigateurs). Bouton ♪ pour couper ou remettre le son.

**Vérifié, et comment**
- 36 tests de logique (Vitest) réussis. Ils couvrent le visage de face sur le côté, la zone jusqu'en bas, la partition de la musique et les pas sur les bonnes images.
- 14 tests navigateur (PC et téléphone simulé) réussis, sans erreur console. Nouveau test : descendre en bas, monter, aller sur le côté (il se remet de face), le son a démarré.
- Captures regardées : bas de l'écran derrière le rayon transparent, vue téléphone simulé.
- **Pas vérifiable ici** : l'écoute du son (le navigateur de test n'a pas de haut-parleur). **À vérifier par l'auteur** : le son, le volume sur téléphone, la sensation, la fluidité (rapport DBG).

**Comment tester**
1. Touche une touche ou le sol : la musique démarre.
2. Marche : un bruit de pas à chaque pied posé.
3. Monte vers le fond, puis va à droite : il se tourne de face.
4. Descends tout en bas : il passe derrière le rayon transparent.
5. ♪ coupe le son ; F2 → « Son » pour les volumes.

**Quoi essayer**
1. La musique : agréable, ou lassante au bout de quelques minutes ? Trop forte ?
2. Les pas : bien synchronisés avec les jambes, assez discrets ?
3. Le rayon de devant : assez transparent ? (réglage « Opacité du rayon de devant »)

**Nouveaux réglages (F2 ou ⚙)** : Son (couper, volume général, musique, pas, musique en pause) ; Affichage (opacité du rayon de devant).

**Décisions prises seul (détails mineurs)**
- En diagonale vers le fond, il reste de dos ; seul un mouvement surtout horizontal le remet de face.
- En mode « remplir l'écran », le cadrage privilégie le bas de la scène, pour que le rayon de devant et le sol restent visibles. Le haut (panneau « Rayon 7 ») est un peu coupé sur téléphone.
- Les images, la musique et les pas provisoires sont inscrits dans `CREDITS.md`.

**À préparer par l'auteur** : rien pour l'instant.

**Proposition pour la séance suivante** : suite de l'étape A2 (échelle selon la profondeur, ombre, rebond et respiration, caméra qui glisse, banc d'essai).

---

## Séance 2 — 12/11/2026 — Retournement, marche, clignement, passer derrière les objets

**Retours de l'auteur sur A1**
- Ce qui manque : retournement de la feuille façon Paper Mario ; images de marche et de clignement ; pouvoir passer derrière le caddie et le présentoir.

**Jouable maintenant**
- **Retournement** : quand le personnage change de côté, la feuille s'amincit jusqu'à sa tranche, puis se rouvre de l'autre côté. Même chose quand il passe de face à dos.
- **Marche** : 4 images de marche de face et 4 de dos. Les pas suivent la distance parcourue, donc les pieds ne glissent pas, même si on change la vitesse.
- **Clignement** : à l'arrêt et de face, il cligne des yeux, avec un double clignement de temps en temps.
- **Passer derrière** : le caddie et le présentoir « -30 % » sont maintenant des objets à part, décollés de l'étagère. Le personnage passe derrière eux : seule sa tête dépasse du présentoir, et on le voit à travers la grille du caddie.

**Vérifié, et comment**
- 31 tests de logique (Vitest) réussis. Ils couvrent les animations, le retournement, l'ordre devant/derrière, les couloirs derrière les objets et la distance parcourue.
- 13 tests navigateur (Playwright, PC et téléphone simulé) réussis, sans erreur console. Deux nouveaux tests : passer derrière le présentoir puis revenir devant ; la feuille passe par une largeur réduite puis finit retournée.
- Captures regardées : derrière le caddie, derrière le présentoir, retournement ralenti à mi-chemin, 4 instants de marche.
- **Reste à vérifier par l'auteur** : la sensation sur le vrai téléphone, la manette, la fluidité (rapport DBG).

**Comment tester**
1. Marche à gauche puis à droite : la feuille se retourne.
2. Reste immobile de face quelques secondes : il cligne des yeux.
3. Monte vers les étagères (Z ou flèche haut), puis longe le rayon : il passe derrière le présentoir et derrière le caddie.
4. F4 montre la zone de marche, avec en pointillés bleus la ligne où il passe de devant à derrière chaque objet.

**Quoi essayer**
1. Le retournement (0,18 s) : trop rapide, trop lent ? Et sur le passage face/dos, gardé ou gênant ?
2. Le rythme des pas : est-ce que les jambes vont trop vite ou trop lentement par rapport au déplacement ?
3. Toucher derrière un objet sur téléphone : il bute contre l'objet (pas de contournement automatique). Est-ce gênant ? (voir questions)

**Nouveaux réglages (F2 ou ⚙)**
- Personnage : durée du retournement, épaisseur de la tranche, retournement face/dos, vitesse des pas.
- Affichage : réduire les animations (retournement instantané).

**Décisions prises seul (détails mineurs)**
- L'ordre devant/derrière se décide par une ligne de profondeur par objet (données du lieu). Le personnage ne change de plan qu'en la franchissant.
- Le personnage ne rapetisse pas encore en s'éloignant : c'est prévu en A2, avec la caméra.
- Les nouvelles images sont provisoires et générées. Le format des animations accepte une durée par image, ce qui permet le clignement sans code.

**À préparer par l'auteur** : rien pour l'instant.

**Proposition pour la séance suivante** : suite de l'étape A2 (échelle selon la profondeur, ombre, rebond et respiration, caméra qui glisse, banc d'essai).

---

## Séance 1 — 12/11/2026 — Socle et étape A1 (« le personnage est agréable à déplacer »)

**Jouable maintenant** : un rayon provisoire en papier découpé (Rayon 7). Un petit personnage en papier y marche, accélère et freine en douceur, se tourne (face/dos, gauche/droite en miroir) et bute contre la tête de gondole et le caddie. Pause, réglages en jeu, diagnostic, version affichée.

**Vérifié, et comment**
- Tests automatiques de la logique (Vitest) : 19 tests verts (accélération, freinage, arrivée pile au point visé sans dépasser, arrêt contre un obstacle, glissement le long d'un obstacle, pas fixe, machine à états, réglages).
- Tests dans un navigateur Chromium (Playwright) : 11 tests verts en taille PC (1600×900) et en téléphone simulé (914×411, densité 2,625, tactile, comme un Reno 2 dans Chrome). Couverts : clavier, clic, toucher, pause, réglages, diagnostic, **aucune erreur ni alerte dans la console**.
- Captures PC et téléphone simulé regardées à l'œil.
- Les temps mesurés par ce navigateur de test (sans carte graphique) **ne valent rien** et n'ont servi à aucune décision.
- **Pas vérifié ici, à faire par l'auteur** : le vrai téléphone (fluidité, toucher, plein écran), la manette (aucune manette ici), Firefox et Edge, et la publication sur GitHub Pages (outils GitHub indisponibles pendant la séance).

**Comment tester**
- PC : ZQSD ou flèches, ou clic sur le sol (garder le bouton appuyé pour guider). Échap : pause. F2 : réglages. F3 : diagnostic. F4 : zone de marche.
- Manette : stick gauche ou croix pour marcher, Start pour la pause.
- Téléphone, en paysage : bouton ⛶ pour le plein écran, puis toucher le sol (garder le doigt pour guider). Joystick virtuel en option dans ⚙ (moitié gauche de l'écran).
- Diagnostic : DBG → jouer une minute → « Copier le rapport » → coller dans la conversation.

**Quoi essayer**
1. La vitesse de marche (480) : trop lente, trop rapide pour traverser le rayon ?
2. Le démarrage et l'arrêt : vifs ou « savonneux » ? (Accélération 3600, freinage 4800.)
3. Sur téléphone : toucher pour aller, ou joystick virtuel ?

**Réglages disponibles (F2 ou ⚙)** : vitesse de marche, accélération, freinage, vitesse vers le fond, précision d'arrivée, joystick virtuel (taille), zone morte du stick, cadrage (remplir / tout montrer), densité de pixels max, pas fixe de la logique, affichage de la zone de marche. Les réglages modifiés sont gardés dans le navigateur ; « Copier mes réglages » permet de me les envoyer pour en faire les valeurs par défaut.

**Décisions prises seul (détails mineurs)**
- Les images sont redessinées une fois au chargement, à la résolution utile, plafonnée (densité 2 au plus). C'est ce qui rend le plafond réel avec un affichage DOM. Sur le Reno 2 en plein écran, cela donne environ 1,9 Mpx d'images en mémoire.
- Logique à 60 pas par seconde, et affichage lissé entre deux pas : le jeu est aussi fluide sur un écran 120 ou 144 Hz.
- Un clic hors du sol (sur l'étagère) vise le bord du sol le plus proche.
- Les touches sont lues par position : ZQSD (AZERTY) et WASD (QWERTY) fonctionnent toutes les deux.
- Pas encore de planificateur de délais ni de file de travail lourd : rien n'en a besoin en A1. Ils arriveront avec le scanner (A3).
- Le panneau de réglages ne se pilote pas encore à la manette (souris, doigt et clavier seulement).
- Profondeur (taille selon la distance), ombre, rebond, respiration et pivot de la feuille sont prévus en A2, comme convenu. Le changement de sens est donc instantané pour l'instant.

**À préparer par l'auteur** : rien pour l'instant.

**Proposition pour la séance suivante** : étape A2. Le personnage rapetisse vers le fond, avec ombre au sol, pivot de la feuille, rebond et respiration. La caméra glisse dans un rayon plus large que l'écran, avec parallaxe et un pilier au premier plan. Banc d'essai et premier test des comptages.
