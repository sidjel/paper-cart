# Paper Cart: The Final Checkout — règles de travail

## Qui fait quoi
- L'auteur décide du jeu, teste sur PC et téléphone, valide. Amateur : explique simplement.
- Claude code, teste, propose. Il ne décide jamais seul d'une règle qui change l'expérience de jeu.

## Une séance
1. Relire docs/VISION.md, ce fichier et le dernier rapport dans docs/JOURNAL.md.
2. Annoncer en 3 à 5 lignes : **ce que le joueur va pouvoir ressentir de nouveau** (pas seulement ce qui sera codé), et ce qui va être construit. Puis enchaîner sans attendre, sauf question bloquante.
3. Chaque séance produit une **amélioration perceptible par le joueur**, pas seulement une amélioration du code. Le travail technique sert une expérience que l'auteur peut observer.
4. Finir avec une version JOUABLE, vérifiée (tests verts, aucune erreur console, captures en taille PC et en taille téléphone simulée), poussée sur `main` et publiée.
5. Écrire le rapport (voir plus bas), copié en tête de docs/JOURNAL.md.

## Git
- On travaille directement sur `main` : chaque push publie le jeu, que l'auteur teste aussitôt sur son téléphone.
- **Ne jamais pousser une version qui ne passe pas les tests** ou qui affiche des erreurs console.
- Un commit par changement cohérent, avec un message clair en français.
- Quand l'auteur valide une étape, l'inscrire dans `docs/JOURNAL.md` avec l'identifiant du commit (par exemple « A1 validée : abc1234 »). Ce sont les points de retour sûrs : « reviens à la version A1 validée » doit suffire. Pas de tag (les tags sont bloqués dans cet environnement).
- Une version publiée cassée se corrige par un nouveau commit ou un `git revert`. Jamais de force-push, de `reset --hard` ni de réécriture de l'historique.
- Pour un chantier risqué (gros remaniement, changement de technique d'affichage), proposer une branche à part et attendre l'accord de l'auteur.

## Communication
- **Début de séance** : l'auteur écrit librement (par exemple « Séance suivante : … », ses impressions en vrac, un rapport du diagnostic collé). Claude reformule en 2 ou 3 lignes ce qu'il a compris et ce qu'il va faire, puis enchaîne.
- **Retours de l'auteur** : les classer en « ce qui plaît / ce qui gêne / ce qui manque ». Pour un ressenti vague (« la marche est molle »), proposer 2 ou 3 réglages ou pistes concrètes à essayer plutôt qu'une longue analyse.
- **Questions** : au plus 3 à la fois, regroupées en fin de message. Choix numérotés avec une recommandation, pour que l'auteur puisse répondre « 1 » ou « B ».
- **Pendant le travail** : pas de commentaire pas à pas. Prévenir seulement en cas de blocage, de changement de plan ou de décision à prendre.
- **Vocabulaire simple**, sans jargon non expliqué : l'auteur est amateur.

## Rapport de fin de séance (court)
- Ce qui est jouable maintenant.
- **Ce qui a été vérifié, et comment** : tests automatiques, navigateur en taille téléphone simulée, mesures (images par seconde, erreurs console). **Ce qui reste à vérifier par l'auteur** sur son vrai téléphone et avec sa manette.
- Comment tester : sur PC (touches) et sur téléphone (adresse, gestes), en 5 étapes au plus.
- **Quoi essayer et à quoi faire attention** : 2 ou 3 questions de ressenti pour l'auteur.
- Réglages disponibles dans le panneau (touche F2 ou bouton « ⚙ »).
- Décisions prises seul (détails mineurs uniquement) et pourquoi.
- Ce que l'auteur doit préparer pour la suite (dessins, sons, textes), seulement si c'est utile maintenant, avec le format exact.
- Proposition pour la séance suivante (une seule).

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
- Les objectifs (60 images/s, aucune image > 33 ms, 8 ms de calcul) sont vérifiés à chaque étape, pas en fin de projet.
- Le **diagnostic intégré** (touche F3 ou bouton « DBG ») affiche images/s, pire image, temps de calcul, mémoire, et propose un bouton « Copier le rapport » : un **résumé court** (quelques milliers de caractères au plus), facile à coller dans la conversation.
- Le navigateur de test tourne sans carte graphique : ses **temps sont faux** et ne servent **jamais** à décider d'un correctif. Il sert à vérifier que le jeu marche, et à compter (voir plus bas). Seuls les chiffres du vrai téléphone comptent.
- **Banc d'essai** (Options → Diagnostic) : le personnage parcourt tout seul chaque lieu, toujours de la même façon (même trajet, même vitesse, même caméra, mêmes actions, graine fixe). Il commence par une courte chauffe et répète le parcours plusieurs fois. À la fin, le résumé s'affiche, prêt à copier : images/s moyennes, **95e percentile** des temps d'image, **nombre d'images au-delà de 33 ms**, et temps de calcul JavaScript séparé du temps d'image total. Une moyenne seule ne prouve jamais que le jeu est fluide. Des **interrupteurs d'essai** prévus d'avance permettent de rejouer le même parcours avec ou sans une option (effet, calque, résolution…). Deux rapports se comparent alors vraiment : seule la version du jeu change.
- **Test automatique des comptages** (Playwright), avec une limite par lieu, qui échoue si une modification la dépasse. On compte ce qui ne dépend pas de la machine : éléments affichés et calques, surface d'image affichée (pixels qui se recouvrent pour rien), canevas créés en jeu, objets créés à chaque image, images décodées en même temps, lectures de pixels.
- Pour une saccade sans cause visible après banc d'essai et comptages : traçage système d'Android (Options pour les développeurs → Traçage système, fichier envoyé à Claude) ou débogage à distance de Chrome par USB depuis le PC. Seulement dans ce cas.
- **Mesurer avant de supposer** : pour un problème de fluidité, d'abord une mesure qui prouve la cause, ensuite la correction, après accord, une chose à la fois. Comparer avant/après sur le téléphone.
- Préférer des règles posées une fois (« pas de canevas créé en jeu », « travail lourd découpé ») aux correctifs au cas par cas.

## Images
- Les images de l'auteur suivent le **cahier des charges des images** (docs/IMAGES.md). On adapte les images au jeu, pas le jeu à chaque image.
- Toute police, image ou son intégré est inscrit dans `CREDITS.md` (auteur, source, licence), car le jeu est destiné à la vente.
- Un **seul outil de conversion** (tools/) transforme les dessins fournis au format du jeu (détourage, rognage, taille, WebP). Pas un script par image.
- Pas de production de contenu (plusieurs lieux, beaucoup de cartes) avant que le style soit validé sur un lieu d'essai.

## Règles
- Code mort retiré dès qu'une idée est abandonnée.
- Décisions de jeu (nouvelle règle, effet, équilibrage, contenu narratif) : proposer 2 ou 3 options courtes, l'auteur choisit.
- Détails mineurs (interface, technique) : choisir l'option la plus simple et le noter dans le rapport.
- Toutes les valeurs réglables dans src/config.js et exposées dans le panneau de réglages en jeu.
- Contenu (cartes, combos, répliques, lieux) en JSON. Textes provisoires préfixés [TEMP].
- Visuels provisoires : formes simples et sobres en papier découpé, couleurs ternes de magasin, étiquettes lisibles. Ils seront remplacés par les dessins de l'auteur sans changer le code (chaque image référencée dans les données).
- Bug qui résiste à 2 tentatives : s'arrêter, expliquer, proposer des pistes.
- Ne jamais modifier du code qui fonctionne hors du périmètre de la séance sans le dire.
- Aucune dépendance nouvelle ni ressource externe sans accord.
- Accessibilité : contrôles complets au clavier/souris, à la manette et au doigt ; option « réduire les animations » ; textes lisibles sur téléphone.
- docs/VISION.md ne change qu'à la demande de l'auteur.
