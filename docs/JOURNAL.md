# Journal des séances

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

Le rapport le plus récent est en haut. Les étapes validées par l'auteur y sont inscrites avec leur commit (points de retour sûrs).

## Étapes validées

| Étape | Commit | Date |
|---|---|---|
| — | — | — |
