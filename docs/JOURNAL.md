# Journal des séances

Le rapport le plus récent est en haut. Les étapes validées par l'auteur y sont inscrites avec leur commit (points de retour sûrs).

## Étapes validées

| Étape | Commit | Date |
|---|---|---|
| — | — | — |

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
