# Journal des séances

Le rapport le plus récent est en haut. Les étapes validées par l'auteur y sont inscrites avec leur commit (points de retour sûrs).

## Étapes validées

| Étape | Commit | Date |
|---|---|---|
| A1 — le personnage est agréable à déplacer | `1445d25` (« A1 validée : 1445d25 ») | 12/11/2026 |

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
