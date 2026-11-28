# Paper Cart: The Final Checkout — règles de travail

## Dépôt et publication
- Travailler uniquement dans `C:\Paper Cart - krita-codex-mcp` (ne jamais toucher à `c:\Paper Cart`).
- Toujours terminer une publication (et chaque fin de conversation avec livraison) par le lien exact du commit poussé : `https://sidjel.github.io/paper-cart/?v=<commit>`, en rappelant que GitHub Pages met 2 à 3 minutes à déployer après un push.
- Vérifier que la version affichée en haut à gauche du jeu correspond bien au dernier commit poussé (en local via `vite.config.js` live au rechargement, en ligne via la synchro automatique du paramètre `?v=`).

## Qui fait quoi
- L'auteur décide du jeu, teste sur PC et téléphone, valide. Amateur : expliquer simplement.
- L'agent code, teste, propose. Il ne décide jamais seul d'une règle qui change l'expérience de jeu. L'auteur peut demander un audit externe en lecture seule.

## Une séance
1. Relire ce fichier, `docs/VISION.md`, **seulement le dernier rapport** en tête de `docs/JOURNAL.md` et la section « Ouvert » de `docs/SUIVI.md`. Selon la tâche, et seulement la partie utile : `docs/PROTOTYPES.md` (l'étape en cours), `docs/ARCHITECTURE.md` (avant de toucher au code : le résumé §1, puis la section concernée). Ne pas relire les gros documents en entier sans raison.
   - **Documents de conception : JAMAIS en début de séance, seulement celui du sujet traité** : histoire et dialogues → `docs/HISTOIRE.md` et `docs/PERSONNAGES.md` ; panier, chariot, lieux et systèmes hors combat → `docs/GAME_DESIGN.md` ; combat, vieillissement, combos → `docs/REGLES_CARTES_COMBAT.md` ; dessins et style → `docs/DIRECTION_ARTISTIQUE.md`. Règles techniques des lieux : `docs/ARCHITECTURE.md` §11.
   - Ces fichiers restent **courts** (50 à 80 lignes au plus, listes à puces) et marquent chaque point : `✅ VALIDÉ` (décision de l'auteur), `🧪 À TESTER` (piste à essayer en prototype), `❓ À DÉFINIR` (question ouverte : ne jamais trancher à la place de l'auteur), `[TEMP]` (provisoire). `docs/archive/` : réserve d'idées, jamais appliquée d'office.
2. Annoncer en 3 à 5 lignes : **ce que le joueur va pouvoir ressentir de nouveau** (pas seulement ce qui sera codé), et ce qui va être construit. Puis enchaîner sans attendre, sauf question bloquante ou chantier nécessitant un plan validé (`/plan`).
3. Chaque séance produit une **amélioration perceptible par le joueur**, pas seulement une amélioration du code. Le travail technique sert une expérience que l'auteur peut observer.
4. Finir la séance avec la procédure **`fin-seance`** (vérifications, rapport en tête de `docs/JOURNAL.md`, mise à jour de `docs/SUIVI.md`, lien pour jouer avec la version).

## Git
- On travaille directement sur `main` : chaque push publie le jeu, que l'auteur teste aussitôt sur PC et téléphone.
- **Ne jamais pousser une version qui ne passe pas les tests** ou qui affiche des erreurs console.
- Un commit par changement cohérent, avec un message clair en français.
- Quand l'auteur valide une étape : procédure **`valider`**.
- Relecture à froid à la fin d'une étape importante : l'auteur peut demander un audit externe en lecture seule.
- Une version publiée cassée se corrige par un nouveau commit ou un `git revert`. Jamais de force-push, de `reset --hard`, de `rebase`, de `commit --amend` ni de réécriture de l'historique.
- Pour un chantier risqué (gros remaniement, changement de technique d'affichage), proposer une branche à part et attendre l'accord de l'auteur.

## Communication
- **Début de séance** : l'auteur écrit librement (par exemple « Séance suivante : … », ses impressions en vrac, un rapport du diagnostic collé). L'agent reformule en 2 ou 3 lignes ce qu'il a compris et ce qu'il va faire, puis enchaîne (ou soumet un plan en mode `/plan` pour les chantiers importants).
- **Retours de l'auteur** : les classer en « ce qui plaît / ce qui gêne / ce qui manque ». Pour un ressenti vague (« la marche est molle »), proposer 2 ou 3 réglages ou pistes concrètes à essayer plutôt qu'une longue analyse.
- **Questions** (règle de l'auteur, séance 74) : **aucune limite de nombre**, mais chaque question doit être **utile et efficace** : elle complète le jeu (art, game design, histoire, ou tout autre élément qui le fait évoluer). Regroupées en fin de message, numérotées, avec des choix en lettres et une recommandation : l'auteur répond avec **une ou deux lettres** (« 1A », « 2AB »).
  - Si une partie du jeu (faite ou à faire) semble **trop limitée, pas assez développée, pas assez fun ou pas assez détaillée**, poser des questions pour **enrichir l'univers**, sans attendre qu'on le demande.
  - Toujours **cohérent** avec le jeu, **dans le scope**, logique, et **réalisable ensemble** sans difficulté extrême.
- **Pendant le travail** : pas de commentaire pas à pas. Prévenir seulement en cas de blocage, de changement de plan ou de décision à prendre.
- **Vocabulaire simple**, sans jargon non expliqué : l'auteur est amateur.
- **Toujours finir** une réponse de fin de séance (et chaque fin de conversation avec livraison) par le lien pour jouer avec la version : `https://sidjel.github.io/paper-cart/?v=<commit>` (détail : procédure `fin-seance`).

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
- Le jeu se joue **sur PC et smartphone** (navigateur). Les objectifs (60 images/s, aucune image > 33 ms, 8 ms de calcul) sont vérifiés à chaque étape, pas en fin de projet, sur les **appareils de référence** et dans leurs **profils de qualité** définis dans **`docs/ARCHITECTURE.md` §14** (source unique).
- **Priorité « PC d'abord »** (décision de l'auteur du 26/11/2026, qui remplace la décision de la séance 24 où les objectifs se jugeaient sur le téléphone) : on privilégie la qualité visuelle et la fluidité sur le PC de référence ; le téléphone tourne en bonus sur son profil `Léger`. Les **conditions « téléphone en bon état »** (batterie > 50 %, débranché, refroidi, mode normal, plein écran, indice de vitesse comparable) restent valables pour toute mesure faite sur le téléphone (`docs/ARCHITECTURE.md` §14).
- Détail du diagnostic, du banc d'essai, des comptages et du traçage Android : procédure **`mesures`**.
- Le navigateur de test sans écran (headless) tourne sans carte graphique : ses **temps sont faux** et ne servent **jamais** à décider d'un correctif. Il sert à vérifier que le jeu marche et à compter. Seuls les chiffres des vrais appareils comptent.
- **Mesurer avant de supposer** : pour un problème de fluidité, d'abord une mesure qui prouve la cause, ensuite la correction, après accord, une chose à la fois. Comparer avant/après sur l'appareil réel.
- Préférer des règles posées une fois (« pas de canevas créé en jeu », « travail lourd découpé ») aux correctifs au cas par cas.

## Images
- Les images de l'auteur suivent le **cahier des charges des images** (`docs/IMAGES.md`, **à rédiger et faire valider avant le prototype D** ; méthode de l'auteur dans `docs/PROTOTYPES.md`). On adapte les images au jeu, pas le jeu à chaque image.
- Toute police, image ou son intégré au jeu est inscrit dans `CREDITS.md` (auteur, source, licence), car le jeu est destiné à la vente. (Les ressources en réserve non intégrées restent hors `CREDITS.md`, dans `_assets_stock/`.)
- Un **seul outil de conversion** (`tools/`, déjà amorcé et **à compléter avant le prototype D**) transforme les dessins fournis au format du jeu (détourage, rognage, taille, WebP). Pas un script par image.
- Pas de production de contenu (plusieurs lieux, beaucoup de cartes) avant que le style soit validé sur un lieu d'essai.

## Règles
- Code mort retiré dès qu'une idée est abandonnée (pour les outils de mesure : avec l'accord de l'auteur, voir `docs/ARCHITECTURE.md` §7).
- Organisation technique et règles de code : `docs/ARCHITECTURE.md`. Une logique de jeu, même petite, va dans `src/core/` avec ses tests.
- Décisions de jeu (nouvelle règle, effet, équilibrage, contenu narratif) : proposer 2 ou 3 options courtes, l'auteur choisit.
- Détails mineurs (interface, technique) : choisir l'option la plus simple et le noter dans le rapport.
- Toutes les valeurs réglables dans `src/config.js` et exposées dans le panneau de réglages en jeu (garder toutes les options dans le menu, même validées).
- Contenu (cartes, combos, répliques, lieux) en JSON. Textes provisoires préfixés `[TEMP]`.
- Visuels provisoires : formes simples et sobres en papier découpé, couleurs ternes de magasin, étiquettes lisibles. Ils seront remplacés par les dessins de l'auteur sans changer le code (chaque image référencée dans les données).
- Bug qui résiste à 2 tentatives : s'arrêter, expliquer, proposer des pistes.
- **En cas de conflit** entre deux règles, ou entre une règle et une demande : ne pas choisir en silence. Citer les deux formulations et leur emplacement, expliquer l'effet concret, proposer une résolution minimale, et demander à l'auteur. Une décision récente de l'auteur passe avant une ancienne. Une mesure ou un test ne suffit pas à changer une règle validée : il permet de proposer de la changer. (On garde les balises `✅` `🧪` `❓` `[TEMP]` et les Leçons : pas d'autre système de statuts.)
- **`/learn` et règles validées** : `/learn` ne doit **jamais** créer, modifier ni supprimer une règle validée (`✅`) sans l'accord explicite de l'auteur.
- **Chaque bug corrigé laisse un test** qui échoue s'il revient, et une ligne dans les « Leçons » (`docs/ARCHITECTURE.md` §15 : symptôme, cause, règle, **hypothèses écartées et essais différentiels**). **Un test automatique ou un compteur ne prouve pas l'absence de clignotement** : seul l'essai sur l'appareil le prouve. Un incident sur un élément ne devient une règle générale qu'avec l'accord de l'auteur.
- Les outils de diagnostic ne deviennent jamais des commandes de jeu. On ne réécrit pas un système qui marche juste pour uniformiser. Un bug visuel ou sonore qui n'apparaît que sur l'appareil : **interrupteurs d'essai enchaînés** depuis le diagnostic (nom de la variante affiché), puis débogage Chrome par USB si besoin (procédure `mesures`).
- Ne jamais modifier du code qui fonctionne hors du périmètre de la séance sans le dire.
- Aucune dépendance nouvelle ni ressource externe sans accord.
- Accessibilité : contrôles complets au clavier/souris, à la manette et au doigt ; option « réduire les animations » ; textes lisibles sur téléphone.
- `docs/VISION.md` ne change qu'à la demande de l'auteur.

## Où sont les règles (index)
Chaque règle n'est écrite **qu'à un seul endroit**, près de ce qu'elle concerne (deux copies finissent toujours par se contredire).
- Code d'un dossier (règles `always_on` chargées automatiquement dès le démarrage par Antigravity) : `.agents/rules/core.md` (`src/core/`), `.agents/rules/scene.md` (`src/scene/` : affichage PixiJS v8, profondeur, parallaxe, lumière, ombres), `.agents/rules/input.md` (`src/input/` : entrées), `.agents/rules/audio.md` (`src/audio/` : son), `.agents/rules/ui.md` (`src/ui/` : menus, bulles).
- Vue d'ensemble technique : `docs/ARCHITECTURE.md` (boucle §3, rendu §4, lieux et chargements §11, son §12, sauvegarde §13, appareils §14, leçons §15).
- Expérience de jeu (menus, dialogues, chargements, test du gris) : `docs/GAME_DESIGN.md`.
