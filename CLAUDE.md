# Paper Cart: The Final Checkout — règles de travail

## Qui fait quoi
- L'auteur décide du jeu, teste sur PC et téléphone, valide. Amateur : explique simplement.
- Claude code, teste, propose. Il ne décide jamais seul d'une règle qui change l'expérience de jeu.

## Une séance
1. Relire ce fichier, docs/VISION.md, **seulement le dernier rapport** en tête de docs/JOURNAL.md et la section « Ouvert » de docs/SUIVI.md. Selon la tâche, et seulement la partie utile : docs/PROTOTYPES.md (l'étape en cours), docs/ARCHITECTURE.md (avant de toucher au code : le résumé, puis la section concernée). Ne pas relire les gros documents en entier sans raison.
   - **Documents de conception : JAMAIS en début de séance, seulement celui du sujet traité** : histoire et dialogues → `docs/HISTOIRE.md` et `docs/PERSONNAGES.md` ; panier, caddie, lieux et systèmes hors combat → `docs/GAME_DESIGN.md` ; combat, vieillissement, combos → `docs/REGLES_CARTES_COMBAT.md` ; dessins et style → `docs/DIRECTION_ARTISTIQUE.md`. Règles techniques des lieux : `docs/ARCHITECTURE.md` §11.
   - Ces fichiers restent **courts** (50 à 80 lignes au plus, listes à puces) et marquent chaque point : `✅ VALIDÉ` (décision de l'auteur), `🧪 À TESTER` (piste à essayer en prototype), `❓ À DÉFINIR` (question ouverte : ne jamais trancher à la place de l'auteur), `[TEMP]` (provisoire). `docs/archive/` : réserve d'idées, jamais appliquée d'office.
2. Annoncer en 3 à 5 lignes : **ce que le joueur va pouvoir ressentir de nouveau** (pas seulement ce qui sera codé), et ce qui va être construit. Puis enchaîner sans attendre, sauf question bloquante.
3. Chaque séance produit une **amélioration perceptible par le joueur**, pas seulement une amélioration du code. Le travail technique sert une expérience que l'auteur peut observer.
4. Finir la séance avec la skill **`fin-seance`** (vérifications, rapport, JOURNAL, SUIVI, lien pour jouer avec la version).

## Git
- On travaille directement sur `main` : chaque push publie le jeu, que l'auteur teste aussitôt sur son téléphone.
- **Ne jamais pousser une version qui ne passe pas les tests** ou qui affiche des erreurs console.
- Un commit par changement cohérent, avec un message clair en français.
- Quand l'auteur valide une étape : skill **`valider`**.
- Relecture à froid à la fin d'une étape importante (lancée par l'auteur) : skill **`audit`**.
- Une version publiée cassée se corrige par un nouveau commit ou un `git revert`. Jamais de force-push, de `reset --hard` ni de réécriture de l'historique.
- Pour un chantier risqué (gros remaniement, changement de technique d'affichage), proposer une branche à part et attendre l'accord de l'auteur.

## Communication
- **Début de séance** : l'auteur écrit librement (par exemple « Séance suivante : … », ses impressions en vrac, un rapport du diagnostic collé). Claude reformule en 2 ou 3 lignes ce qu'il a compris et ce qu'il va faire, puis enchaîne.
- **Retours de l'auteur** : les classer en « ce qui plaît / ce qui gêne / ce qui manque ». Pour un ressenti vague (« la marche est molle »), proposer 2 ou 3 réglages ou pistes concrètes à essayer plutôt qu'une longue analyse.
- **Questions** : au plus 3 à la fois, regroupées en fin de message. Choix numérotés avec une recommandation, pour que l'auteur puisse répondre « 1 » ou « B ».
- **Pendant le travail** : pas de commentaire pas à pas. Prévenir seulement en cas de blocage, de changement de plan ou de décision à prendre.
- **Vocabulaire simple**, sans jargon non expliqué : l'auteur est amateur.
- **Toujours finir** une réponse de fin de séance (et chaque fin de conversation) par le lien pour jouer avec la version : `https://sidjel.github.io/paper-cart/?v=<commit>` (détail : skill `fin-seance`).

## Progression par étapes
- Chaque prototype se construit en petites étapes, chacune jouable et commitée avant la suivante.
- Ne jamais construire toutes les fonctionnalités d'un prototype d'un coup. Une mécanique simple et agréable vaut mieux que plusieurs fonctionnalités inachevées.
- Ne pas anticiper les prototypes suivants : pas de système dont l'étape en cours n'a pas besoin.
- S'arrêter aux points de validation prévus pour que l'auteur teste le ressenti.

## Vérification honnête
- Ne jamais déclarer testé ce qui ne l'a pas été.
- Distinguer : tests automatiques, émulation téléphone dans le navigateur, test réel sur appareil (fait par l'auteur).
- Si une vérification est impossible ici, le dire clairement dans le rapport.

## Fluidité
- Le jeu se joue **sur PC et smartphone** (navigateur). Les objectifs (60 images/s, aucune image > 33 ms, 8 ms de calcul) sont vérifiés à chaque étape, pas en fin de projet, sur les **appareils de référence** (PC Core i3-8145U 4 Go, Oppo Reno 2), chacun dans son **profil de qualité** (`docs/ARCHITECTURE.md` §14).
- **Ils se jugent sur le téléphone en bon état** (décision de l'auteur, séance 24) : batterie au-dessus de 50 %, débranché, refroidi, mode normal, plein écran, et un indice de vitesse du téléphone comparable aux essais de référence. Un essai fait dans un autre état sert à comparer des variantes entre elles, pas à juger l'objectif.
- Détail du diagnostic, du banc d'essai, des comptages et du traçage Android : skill **`mesures`**.
- Le navigateur de test tourne sans carte graphique : ses **temps sont faux** et ne servent **jamais** à décider d'un correctif. Il sert à vérifier que le jeu marche, et à compter (voir plus bas). Seuls les chiffres du vrai téléphone comptent.
- **Mesurer avant de supposer** : pour un problème de fluidité, d'abord une mesure qui prouve la cause, ensuite la correction, après accord, une chose à la fois. Comparer avant/après sur le téléphone.
- Préférer des règles posées une fois (« pas de canevas créé en jeu », « travail lourd découpé ») aux correctifs au cas par cas.

## Images
- Les images de l'auteur suivent le **cahier des charges des images** (docs/IMAGES.md, **à rédiger et faire valider avant le prototype D** ; méthode de l'auteur dans docs/PROTOTYPES.md). On adapte les images au jeu, pas le jeu à chaque image.
- Toute police, image ou son intégré est inscrit dans `CREDITS.md` (auteur, source, licence), car le jeu est destiné à la vente.
- Un **seul outil de conversion** (tools/, **à créer avant le prototype D**) transforme les dessins fournis au format du jeu (détourage, rognage, taille, WebP). Pas un script par image.
- Pas de production de contenu (plusieurs lieux, beaucoup de cartes) avant que le style soit validé sur un lieu d'essai.

## Règles
- Code mort retiré dès qu'une idée est abandonnée (pour les outils de mesure : avec l'accord de l'auteur, voir docs/ARCHITECTURE.md §7).
- Organisation technique et règles de code : docs/ARCHITECTURE.md. Une logique de jeu, même petite, va dans `src/core/` avec ses tests.
- Décisions de jeu (nouvelle règle, effet, équilibrage, contenu narratif) : proposer 2 ou 3 options courtes, l'auteur choisit.
- Détails mineurs (interface, technique) : choisir l'option la plus simple et le noter dans le rapport.
- Toutes les valeurs réglables dans src/config.js et exposées dans le panneau de réglages en jeu.
- Contenu (cartes, combos, répliques, lieux) en JSON. Textes provisoires préfixés [TEMP].
- Visuels provisoires : formes simples et sobres en papier découpé, couleurs ternes de magasin, étiquettes lisibles. Ils seront remplacés par les dessins de l'auteur sans changer le code (chaque image référencée dans les données).
- Bug qui résiste à 2 tentatives : s'arrêter, expliquer, proposer des pistes.
- **Chaque bug corrigé laisse un test** qui échoue s'il revient, et une ligne dans les « Leçons » (`docs/ARCHITECTURE.md` §15 : symptôme, cause, règle). Un bug visuel ou sonore qui n'apparaît que sur l'appareil : **interrupteurs d'essai enchaînés** depuis le diagnostic (nom de la variante affiché), puis débogage Chrome par USB si besoin (skill `mesures`).
- Ne jamais modifier du code qui fonctionne hors du périmètre de la séance sans le dire.
- Aucune dépendance nouvelle ni ressource externe sans accord.
- Accessibilité : contrôles complets au clavier/souris, à la manette et au doigt ; option « réduire les animations » ; textes lisibles sur téléphone.
- docs/VISION.md ne change qu'à la demande de l'auteur.

## Où sont les règles (index)
Chaque règle n'est écrite **qu'à un seul endroit**, près de ce qu'elle concerne (deux copies finissent toujours par se contredire).
- Code d'un dossier (lu automatiquement quand on y travaille) : `src/core/CLAUDE.md`, `src/scene/CLAUDE.md` (affichage, parallaxe, lumière), `src/input/CLAUDE.md` (entrées), `src/audio/CLAUDE.md` (son), `src/ui/CLAUDE.md` (menus, bulles : code).
- Vue d'ensemble technique : `docs/ARCHITECTURE.md` (boucle §3, rendu §4, lieux et chargements §11, son §12, sauvegarde §13, appareils §14, leçons §15).
- Expérience de jeu (menus, dialogues, chargements, test du gris) : `docs/GAME_DESIGN.md`.

