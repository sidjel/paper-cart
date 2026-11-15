# Journal des séances

Le rapport le plus récent est en haut. Les étapes validées par l'auteur y sont inscrites avec leur commit (points de retour sûrs).

## Étapes validées

| Étape | Commit | Date |
|---|---|---|
| A1 — le personnage est agréable à déplacer | `1445d25` (« A1 validée : 1445d25 ») | 12/11/2026 |
| A2 — le personnage semble évoluer dans un décor profond | `6be7130` (« A2 validée : 6be7130 ») — rayon de devant gardé entier, fluidité acceptée en l'état (choix C de l'auteur) | 13/11/2026 |
| A3 — scanner un produit est satisfaisant | `630fec0` (« A3 validée : 630fec0 ») — avec le double toucher et la fin du clignotement ; l'histoire du scanner, des cartes et du Panier reste à écrire | 13/11/2026 |

---

## Séance 50 — 15/11/2026 — Nouvel ordre des étapes ; audit avant les lieux (aucun code modifié)

**Décisions de l'auteur** (inscrites dans les documents) :
- Ordre : **A6 l'accueil** (lieu séparé), **A7 le deuxième rayon**, **A8 le caddie** (ancien A5b, échange au comptoir de l'accueil) → `PROTOTYPES.md`.
- Caddie : il ne suit pas le héros d'un lieu à l'autre, il reste garé (✅) ; plan du magasin pour le retrouver (❓) → `GAME_DESIGN.md`.
- Règles des lieux → `ARCHITECTURE.md` §11.

**Audit** : tout `src/` et `tests/` lus, ainsi que les documents techniques. Aucun fichier de code modifié. Deux défauts soupçonnés à la lecture ont été reproduits en jouant (script hors du projet).

**Priorité 1 — défaut pour le joueur (reproduit)**
1. La première rencontre peut se dérouler **cachée sous le Panier** (ouvrir le Panier juste après la première carte), et le Panier s'ouvre **pendant** la rencontre (touche I, bouton Y). Cause : sous le Panier, les voix continuent d'avancer. Effort : petit.

**Priorité 2 — ce qui bloque le passage à plusieurs lieux**
2. Le lieu est câblé en dur : `import place` dans `main.js` (≈ 25 usages), tout est créé une fois sans pouvoir être détruit ; calques nommés en dur dans le banc ; règles propres au rayon dans `main.js` (rappel de la Scanette à x = 900, bout du rayon, présentoir). Effort : gros (c'est le premier pas d'A6).
3. La mémoire du monde est éparpillée et en double : produits tenus à la fois par la scène et par `main.js`, recopiés à la main en 3 endroits ; une carte retient un numéro de produit valable seulement dans le lieu courant. Effort : moyen.
4. Les images ne sont jamais libérées (adresses jamais révoquées, compteurs cumulés, héros et lieu chargés ensemble). Effort : petit à moyen.
5. Machine à états : pas d'état « transition » ; 7 sous-états vivent hors de la machine (question Oui / Non, grande carte, mode du Panier, choix du nom, conversation, fondu d'intro, test rapide), arbitrés par une chaîne de conditions ordonnée. Le défaut n° 1 vient de là. Effort : moyen.

**Priorité 3 — fluidité visible à la lecture (à mesurer sur le téléphone, une chose à la fois)**
6. Le chemin est recalculé à **chaque mouvement du doigt** maintenu (plusieurs fois par image), lourd quand un objet barre la ligne droite. Effort : petit.
7. La page est mesurée (`getBoundingClientRect`) à chaque image où une bulle ou les étoiles sont affichées, et à chaque mouvement du doigt. Effort : petit.
8. Des éléments sont créés en plein jeu au moment du scan (carte du Panier, carte qui vole, icône d'objet) : contraire à la règle, et invisible pour le test des comptages (le banc ne scanne pas). Effort : petit à moyen.
9. Les animations CSS (voile, étoiles, mots, ▾) continuent en pause et sous les menus. Effort : petit.
10. La rencontre empile jusqu'à 60 calques animés (un par mot, halo flou), 4 bandes masquées et une lueur plein écran : jamais mesuré sur le téléphone. Mesurer d'abord.

**Priorité 4 — entretien**
11. `main.js` : 1 247 lignes, 7 rôles (le document dit « ≈ 590, à découper »). Effort : moyen.
12. Logique hors de `core/` : panier plein et échange, points à prendre, marche de la rencontre, règles de la grande carte (`ui/cards.js`, 488 lignes ; 3 bugs en séance 49, non testables sans navigateur). Effort : petit à moyen.
13. Code mort : `setTarget`, `playerOptions.open_`, `sprite.stats`, `dust.counter`. Effort : petit.
14. Écarts documents / code : ARCHITECTURE (modules récents absents, « main.js ≈ 590 », « seule exception au temps de jeu : le double toucher », « rien n'est créé pendant le jeu », état vérifié séance 29) ; SUIVI (« panier plein : scan refusé », périmé) ; tous les tests navigateur dans `a1.spec.js` (969 lignes). Effort : petit.
15. Une image de plus de 4 096 pixels réels est réduite sans prévenir : le fond du rayon est déjà adouci sur un écran de PC à haute densité ; un hall très large le serait aussi sur téléphone. Règle à décider avant de dessiner A6. Effort : moyen.

**Recommandation** : avant A6, les points 1, 5, 3, 2 + 4 (ensemble, premier pas d'A6, sans changement visible), puis 6. Le reste peut attendre.

**Vérifié** : aucun code modifié (dépôt identique à `0f56835` avant les documents) ; 140 tests de logique relancés, verts. Tests navigateur non relancés (code inchangé depuis leur dernier passage, 76 verts).

**Décision prise seul** : dans PROTOTYPES.md, l'ancien « A5a » est appelé « A5 — Scanette et panier à main ».

---

## Séance 49 (suite) — Bug du double clic sur une carte

**Retour de l'auteur** : un double clic (ou un double toucher) rapide sur une carte du Panier donne une carte zoomée à fond.

**Cause (reproduite)** : le second clic tombait sur la carte encore en vol et coupait l'animation d'ouverture : la carte sautait d'un coup à sa grande taille. Sur téléphone, le navigateur pouvait aussi zoomer la page.

**Corrigé** :
- Un toucher sur la carte pendant une animation est ignoré : l'animation va jusqu'au bout.
- Le zoom du navigateur au double toucher est coupé sur cette zone.
- Toucher à côté referme toujours, même pendant un retournement.

**Vérifié** : 140 tests de logique, 74 tests navigateur sans erreur console. Nouveau test : double clic (PC) et double toucher (téléphone simulé) ; la carte s'ouvre normalement, une seule fois.

**Suite (retour de l'auteur : au double toucher, la carte s'agrandit puis rapetisse aussitôt)** :
- Cause : le second toucher tombait à côté de la petite carte qui commence à grandir. Il était compris comme « toucher à côté pour refermer ».
- Corrigé : pendant l'ouverture (et au moins 0,35 s), toucher à côté est ignoré.
- Le test complété échoue sur l'ancienne version et passe sur la nouvelle.

**Suite 2 (double toucher sur la carte déjà agrandie : elle grandit encore, s'approche, disparaît)** :
- Cause : le premier toucher la retourne, et à demi retournée elle est toute fine. Le second toucher tombait à côté, donc « refermer ». En plus, la fermeture mesurait la carte toute fine et calculait un agrandissement énorme.
- Corrigé : toucher à côté est ignoré pendant toute animation, et la carte est mesurée à sa taille réelle.
- Nouveau test (échoue sur l'ancienne version en PC) ; 76 tests navigateur verts.

---

## Séance 49 (suite) — Le tournis

**Retours de l'auteur** :
- Validé : le Panier (le dos de la carte sera revu plus tard).
- Ce qui manque : le tournis. Si le joueur fait aller le héros de droite à gauche trop vite, des étoiles tournent autour de sa tête et il se plaint, avec d'autres phrases s'il recommence.

**Jouable maintenant** :
- **6 demi-tours en marchant, en moins de 3 secondes** : des étoiles tournent autour de la tête pendant 3,5 s.
- Dès qu'il s'arrête, il se tourne vers le joueur (aparté) et se plaint : « Hé ! Stop !… J'ai la tête qui tourne ! Tu vas me faire vomir… ».
- Les fois suivantes, d'autres répliques [TEMP] (girouette, trois Caisses Finales, le carrelage…).
- Pas avant 60 s la fois d'après. Tout est réglable dans ⚙ → Personnage.

**Vérifié** :
- 140 tests de logique : déclenchement, demi-tours lents, attente, arrêt.
- 72 tests navigateur sans erreur console : lent → rien ; vite → étoiles, puis la plainte.
- Comptages inchangés.

**Décision prise seul** : la plainte est un aparté (il parle au joueur), donc avec la mise en scène habituelle (zoom, bandes). À dire si c'est trop pour un gag.

---

## Séance 49 — 15/11/2026 — Panier : plus de clignotement, bruitage de carte

**Retours de l'auteur** :
- Ce qui gêne : en refermant une carte, le fond noir transparent clignote.
- Ce qui manque : un bruitage quand une carte se retourne.

**Constaté (enregistrement image par image)** : en refermant, le fond assombri s'effaçait progressivement pendant que la carte revenait. C'est ce qui se voyait comme un clignotement.

**Jouable maintenant** :
- Plus de fond assombri : la grande carte s'affiche directement sur le Panier.
- Bruitage [TEMP] (synthétisé) à chaque retournement : ouvrir, retourner, refermer. C'est un petit souffle de papier puis un léger claquement. Volume : celui du scanner.

**Vérifié** : 136 tests de logique ; 71 tests navigateur PC et téléphone simulé, sans erreur console (bruitage déclenché, plus de fond). **Non vérifiable ici** : le son lui-même (à écouter sur le téléphone).

---

## Séance 48 (suite) — Points de départ pour tester vite

**Demande de l'auteur** : tester sans refaire tout le début (Scanette, panier, rencontre, nom, 6 scans…). Sauvegarde, choix de séquence, ou « passer la séquence » ?

**Choix** : des **points de départ**. Une sauvegarde casserait à chaque mise à jour, et « passer la séquence » n'évite que les dialogues. Les départs sont recalculés à chaque chargement à partir du jeu actuel.

**Jouable maintenant** : ⚙ → onglet **Départ**. Le jeu se recharge et commence au point choisi :
- Début normal ;
- Scanette et panier pris (la rencontre viendra au premier scan) ;
- Équipé, rencontre faite ;
- 3 cartes ;
- Panier plein (6 cartes, dont la pile et la plante).

Ou par lien direct : `?depart=equipe`, `libre`, `3-cartes`, `panier-plein`.

**Vérifié** : 136 tests de logique (choix des produits, moments déjà passés) ; 71 tests navigateur PC et téléphone simulé, sans erreur console (liens directs, lien inconnu → début normal, onglet Départ qui recharge au bon point).

---

## Séance 48 — 15/11/2026 — Panier : petites cartes, grande carte qui se retourne

**Retours de l'auteur** :
- 1 : tous les noms gardés.
- 2 : objets en main mieux (un autre modèle viendra plus tard).
- Cartes du Panier : deux fois plus petites. Une carte touchée doit se retourner et s'afficher en grand, avec sa description au dos. On doit pouvoir la refermer.

**Jouable maintenant** :
- **Petites cartes** (66 px au lieu de 132) : puissance, stade (couleur et forme), image, nom.
- **Toucher une carte** : elle part de sa place, grandit et se retourne comme une feuille (pliée de profil, puis dépliée).
  - Elle montre son dos : catégorie, puissance, nom, description [TEMP], propriétés, stade.
  - La grande carte est dessinée à sa taille (texte net). Elle est deux fois plus grande que les cartes d'avant, ou moins si l'écran est trop bas pour qu'elle tienne.
  - Toucher la grande carte la retourne (recto, verso).
- **Refermer** : toucher à côté, ou Échap / B.
  - Clavier : Entrée ouvre. Manette : haut/bas choisit une carte, A ouvre ou retourne.
- « Réduire les animations » : la carte s'affiche sans se retourner.

**Vérifié** :
- 132 tests de logique, dont : chaque produit a une description.
- 66 tests navigateur PC et téléphone simulé, sans erreur console, dont :
  - petite carte ;
  - grande carte au dos, qui tient dans l'écran, texte de taille réelle ;
  - retournement ;
  - toucher à côté ;
  - Échap puis Échap.
- Comptages inchangés.
- Captures des petites cartes et de la grande carte (PC, téléphone).

**Corrections demandées dans la même séance** :
- Plus de carte en double : la petite carte quitte le Panier pendant qu'elle est affichée en grand. En refermant, elle se retourne dans l'autre sens, rapetisse et revient à sa place.
- La grande carte n'a plus de boutons : elle se referme en touchant à côté (ou Échap, B).
- Les boutons Fermer/Annuler du Panier sont seulement en haut à droite et en bas à droite du menu (celui du bas est poussé en bas). Ils sont en kraft marron clair, texte foncé.

**Décisions prises seul** :
- En mode « panier plein », toucher une carte la repose toujours (pas de grande carte).

---

## Séance 47 — 15/11/2026 — Le héros propose de changer de nom ; les mains tiennent vraiment le panier et la Scanette ; têtes de face corrigées

**Retours de l'auteur** :
- Validé : l'effet de vague de la voix du joueur (principe validé).
- Ce qui manque : pendant la rencontre, le héros propose un autre nom si « Épaisseur » ne plaît pas.
- Ce qui gêne :
  - les mains ne tiennent ni le panier ni la Scanette ;
  - l'oreille et la mèche des têtes de face sont mal placées.
- Réponse : 3 A (retirer la campagne DEVANT2).

**Jouable maintenant** :
- **Pendant la rencontre**, le héros dit : « Il te faut un nom. Moi, je t'appellerais bien… mon Épaisseur. À moins que tu préfères autre chose ? »
  - Les propositions s'affichent en bas, dans le style de l'écran qui parle : Épaisseur d'abord, puis les autres, et « Autre… » pour taper le sien.
  - La suite emploie le nom choisi (« Ma… Moitié. D'accord. On trouve la sortie ensemble ? »).
  - Le nom est enregistré, et reste changeable dans Options → Jeu.
- **Les mains tiennent les objets** :
  - le panier par l'anse, la Scanette par la poignée (tête au-dessus, nez vers l'avant) ;
  - les deux passent devant le héros, de face et de profil (marche, scan) ;
  - vue de dos : le panier aussi ; la Scanette reste cachée par le corps.
- **Têtes de face** (apartés) : une oreille de chaque côté, au bord de la tête ; cheveux en frange (plus de mèche sur le côté).
- **Campagne DEVANT2 retirée** (outil de mesure) : le test rapide T0/T1/T2 reste.

**Vérifié** :
- 131 tests de logique, dont le choix du nom dans une conversation.
- 64 tests navigateur PC et téléphone simulé, sans erreur console : la rencontre jusqu'au choix « Moitié », puis la réplique avec le nom et le nom enregistré.
- Comptages inchangés.
- Captures du choix du nom ; montage des poses (face, scan, marche, dos) avec les objets.

**Décision prise seul** : juste après l'apparition des propositions, un appui de 0,35 s est ignoré. Sinon, appuyer sur Entrée pour faire défiler le texte choisissait « Épaisseur » sans le vouloir (constaté par le test).

---

## Séance 46 — 15/11/2026 — L'écran qui parle, bords hypnotiques, nom du joueur, rayon du bas deux fois moins haut

**Retours de l'auteur** :
- Ce qui gêne :
  - le cadre « Toi » ;
  - aucune animation visible sur les bords ;
  - le flou coûteux ;
  - l'interface pendant les dialogues.
- Ce qui manque :
  - une voix du joueur en bas, en violet, qui ondule, comme si l'écran parlait ;
  - des vagues hypnotiques ;
  - le choix du nom du joueur ;
  - un rayon du bas deux fois moins haut.
- Réponses : 2 A (commentaire seulement après un « Non »).

**Jouable maintenant** :
- **La voix du joueur** : ni cadre ni nom. Des mots violets lumineux, centrés en bas dans la bande violette, apparaissent un à un et ondulent doucement. Effet au choix (⚙ → Narrateur) : vague, souffle (moins coûteux), aucun.
- **Les bords de la rencontre** : traits ondulés violets qui défilent sur les quatre bords, en sens contraires (l'œil croit voir tourner), lueur violette qui palpite, bandes « cinéma » violet nuit. Le flou réel est retiré par défaut (il reste réglable).
- **Interface effacée** pendant la conversation : boutons, Panier, version.
- **Nom du joueur** (Options → Jeu) : Épaisseur par défaut, 11 propositions [TEMP], ou son propre nom. Le héros l'emploie (« Hé, ma Moitié… », « … Sid. C'est comme ça que je vais t'appeler »).
- **Rayon du bas deux fois moins haut** (seulement les produits du haut), posé au bas de l'écran. Point de rencontre remis plus en avant.

**Vérifié** :
- 133 tests de logique, dont : nom et repères dans les répliques, nom tapé nettoyé.
- 65 tests navigateur PC et téléphone simulé, sans erreur console, dont :
  - la voix du joueur sans cadre, centrée en bas ;
  - l'interface effacée ;
  - un nom tapé sans déclencher de commande ;
  - le nom enregistré.
- Comptages, avant puis après : surface affichée 1,88 → 1,74 écran ; images en mémoire 6,01 → 5,57 Mpx ; le reste inchangé.

**À vérifier par l'auteur** :
- la fluidité pendant la rencontre (vagues), sur le téléphone ;
- le gain du rayon du bas, avec le banc d'essai. Sur le téléphone, la moitié haute du rayon coûtait ×0,70 (séances 23 et 25).

**Décisions prises seul** :
- Police de la voix du joueur : une police à empattements déjà présente sur le téléphone (aucune nouvelle ressource).
- Dans le remplissage des noms, un nom tapé s'emploie seul (« Sid », sans « mon »).

---

## Séance 45 — 15/11/2026 — La rencontre : il s'avance au milieu de l'écran, voile flou et violet ; plus de double message pendant l'échange

**Retours de l'auteur** :
- La rencontre : le héros doit s'avancer au milieu de l'écran en deux fois, avec « Hum ?… » à mi-chemin, et les bords de l'écran doivent être flous, avec des vagues violettes.
- Panier plein : le commentaire du haut-parleur arrive en même temps que la question Oui / Non.

**Jouable maintenant** :
- **La rencontre** :
  - après la première carte, la caméra s'immobilise ;
  - le héros s'avance vers le milieu de l'image, s'arrête à mi-chemin (« Hum ?… », bulle de pensée), puis repart un peu en avant ;
  - ensuite seulement viennent le regard, le zoom et la conversation ;
  - pendant toute la scène, les bords de l'écran sont flous, avec des vagues violettes qui roulent vers le centre (immobiles avec « réduire les animations ») ;
  - le bouton « Scanner » est caché pendant la scène.
- **Panier plein** : pendant la question « Échanger une carte ? », le haut-parleur se tait. Il ne commente (« Votre panier est plein… ») qu'après un « Non ».
- **Correction** : le zoom des apartés reculait d'un pas une image sur deux (léger tremblement). Corrigé.

**Vérifié** :
- 129 tests de logique, dont : marche de conversation, « auto », zoom sans tremblement.
- 63 tests navigateur PC et téléphone simulé, sans erreur console : la rencontre entière, et pas de commentaire pendant la question de l'échange.
- Comptages inchangés.
- Captures de « Hum ? », de la rencontre et du cadre « Toi ».

**Non vérifiable ici** : le coût du flou sur le téléphone (le navigateur de test n'a pas de carte graphique).

**Décisions prises seul** :
- Point de rencontre à mi-profondeur de l'allée (réglable : ⚙ → Narrateur), pour que ses jambes ne passent pas derrière le rayon de devant.
- Une marche bloquée par un obstacle s'arrête au bout de 8 s (réglable).

---

## Séance 44 — 15/11/2026 — La première rencontre après la première carte, jamais manquée ; historique des dialogues ; bouton Panier en petit panier rouge

**Retours de l'auteur** :
- Ce qui gêne : le premier aparté ne se déclenchait pas toujours.
- Ce qui manque :
  - il doit venir après la première carte, plus long, sans interruption possible ;
  - le joueur doit répondre (sans choix) avant tout choix ;
  - un historique pour relire les dialogues ;
  - le bouton Panier en petit panier rouge.
- Réponses : 1 B (il ne se souvient plus pourquoi il est entré, pour le moment) ; 2 a, b et c ; 3 styles gardés.

**Jouable maintenant** :
- **Arrivée** : l'annonce puis les 4 pensées du héros (sans aparté).
- **La première carte déclenche la rencontre**. Elle attend que l'annonce soit finie et que le héros soit arrêté, aussi longtemps qu'il le faut : elle n'est plus jamais perdue (avant, elle se perdait si le héros marchait trop longtemps). Pendant la conversation :
  - rien ne parle, le héros ne bouge pas, rien ne scanne ;
  - chaque réplique attend un toucher (petit ▾) ;
  - déroulé : regard muet → le héros (le bip, ce n'est pas lui qui a décidé, il la sent là-haut, plat comme une feuille, « est-ce toi ce qui me manque ? une partie de moi ? », « Qui es-tu ? ») → **toi**, dans un cadre « Toi » en haut de l'écran (perdu aussi, tu vois d'en haut et le fais marcher, il te manque un corps, mais tu penses, décides, agis) → il comprend → un choix à la fin.
- **Pause → « Dialogues »** : les 40 dernières répliques, avec tes réponses.
- **Bouton Panier** : un petit panier rouge, le nombre de cartes sur son flanc.

**Vérifié** :
- 127 tests de logique, dont :
  - un moment important attend son tour et n'est jamais perdu ;
  - rien n'interrompt une conversation ;
  - attente du toucher ;
  - historique ;
  - narrateur coupé puis remis : la conversation recommence.
- 63 tests navigateur PC et téléphone simulé, sans erreur console. Le test de la rencontre fait au doigt et au clavier : la conversation entière, le choix, puis la relecture dans la Pause.
- Comptages inchangés.
- Captures de la rencontre, du cadre « Toi », de l'historique et du bouton.

**À vérifier par l'auteur** : le rythme (toucher entre chaque réplique), la lisibilité du cadre « Toi » sur le téléphone.

**Décisions prises seul** :
- L'historique est dans la Pause (accessible tout le temps, même sans panier).
- La voix du joueur n'a pas de petits bips (ce sont ses pensées).
- Si le narrateur est coupé pendant la conversation, elle reprendra depuis le début.
- Réglage ⚙ → Narrateur : « Conversation : attendre un toucher entre les répliques ».

---

## Séance 43 — 15/11/2026 — Intro au noir, premières pensées du héros, rencontre graduée avec l'Épaisseur, menus restylés

**Retours de l'auteur** : sous-onglets des cartes ; intro blanc sur noir après « Commencer », puis fondu ; annonces un peu transparentes ; couleurs des menus Panier et réglages ; première réflexion du héros et première rencontre graduée avec son Épaisseur.

**Jouable maintenant** :
- **Intro** : après « Commencer », écran noir, 7 lignes blanches une à une [TEMP] (pluie, parking, l'enseigne, les portes, « ding », le trou noir, puis le haut-parleur : « Nous avons pris la liberté d'optimiser votre format. »), avec les sons. Toucher, clic, Entrée ou A : ligne suivante ; « Passer » ou Échap : tout passer. Puis fondu lent sur le rayon. Désactivable (Options → Jeu).
- **Première rencontre, graduée** : annonce d'arrivée → 4 pensées du héros (bulle en pointillés : le trou de mémoire, « pourquoi je me sens si plat ? », l'objectif — trouver la Caisse Finale et rentrer —, « il me manque quelque chose… on me regarde. D'en haut. ») → un regard muet vers l'écran → premier aparté : « Toi. Là-haut. Tu me vois ? C'est toi… ce qui me manque ? » (deux réponses ; il nomme son Épaisseur dans sa réponse).
- **Annonces un peu transparentes** (fond à 78 %, réglable : Options → Affichage).
- **Panier** façon sac kraft, onglet actif tamponné en rouge ; **filtres des cartes** : Toutes · Alimentaire · Non alimentaire · Spéciales.
- **Réglages ⚙** façon ticket de caisse (police machine, pointillés).

**Vérifié** : 122 tests de logique (dont : déroulé de l'intro ; une suite écrite survit à une annonce qui s'intercale) ; 61 tests navigateur PC et téléphone simulé, sans erreur console (dont : intro au doigt, au clavier, « Passer » ; pensées puis aparté puis réponse) ; comptages inchangés ; captures de l'intro, des pensées, de l'aparté, du Panier et des réglages. **À vérifier par l'auteur** : le rythme de l'intro et des pensées sur le vrai téléphone, les sons de l'intro.

**Décisions prises seul** : le filtre « Spéciales » reste vide tant qu'aucune carte spéciale n'existe ; l'intro se règle aussi dans ⚙ → Narrateur (durées des fondus).

---

## Séance 42 — 15/11/2026 — Accueil dégagé, Options du joueur assorties au titre, Scanette du scan corrigée

**Retours de l'auteur** :
- pas d'article au-dessus ni à gauche du mur de Scanettes ; mur agrandi à gauche ; panneau vert de la même largeur que le mur ;
- des Options de l'écran titre distinctes du panneau de développement, assorties au titre (noir, bleu clair) ;
- la Scanette apparaît sous les pieds pendant un scan.

**Jouable maintenant** :
- **Accueil** : un pan de mur dégagé au début du rayon (plus d'étagère ni de produits au-dessus ou à gauche), un **mur de 32 Scanettes** élargi à gauche, le **panneau vert de la même largeur**, la pile de paniers à droite. La banane est déplacée plus loin sur l'étagère.
- **Options de l'écran titre** : un menu à part, **noir avec des touches de bleu clair**, avec seulement les réglages du joueur :
  - Son (volumes en %) ;
  - Affichage (plein écran, filtre cathodique) ;
  - Accessibilité (taille et vitesse du texte, vibrations, luminosité, contraste, réduire les animations) ;
  - Jeu (narrateur, joystick virtuel).

  Il se commande au doigt, à la souris, au clavier (haut/bas, gauche/droite, Échap) et à la manette (croix, A, B). Le panneau ⚙ en jeu reste celui de développement.
- **Scanette pendant le scan** : elle suit maintenant la main levée. Cause : l'image tenue pivotait autour de son centre et non de l'épaule ; sans rotation (marche) ça ne se voyait pas.

**Vérifié** : 118 tests de logique et 61 tests navigateur PC et téléphone simulé, sans erreur console (dont : options du joueur au doigt et au clavier, aucun réglage de développement, accueil, panier plein avec la banane déplacée) ; comptages inchangés ; captures de l'accueil, des options, de la Scanette pendant le scan.

---

## Séance 41 — 15/11/2026 — Menus au-dessus des voix, pas de déplacement pendant une action, accueil agrandi, accessibilité

**Retours de l'auteur** (avec une capture du téléphone) :
- la bande noire du haut-parleur reste au-dessus quand on ouvre un menu ;
- le héros se déplace pendant un scan ou un échange ;
- l'accueil doit être plus grand, avec un mur de Scanettes ;
- sans panier, le héros doit s'interroger lui-même ;
- options validées : taille du texte, vibrations, luminosité et contraste, vitesse du texte.

**Jouable maintenant** :
- **Les menus sont toujours au-dessus** (Panier, question Oui / Non, pause, réglages, écran titre). Les voix (bande, bulle) restent derrière. L'ordre d'empilement est écrit une fois pour toutes dans `style.css`.
- **Pendant un scan ou un aparté, le héros ne bouge pas** : un toucher ailleurs est ignoré, le clavier aussi.
- **Accueil agrandi** : un mur de 24 Scanettes et une pile de 5 paniers (décor [TEMP]).
- **Sans panier**, essayer de scanner fait parler le héros **à lui-même**, dans une bulle en pointillés et sans mise en scène : « Euh… et je mets ça où, moi ? Il me faudrait un panier. » C'est une nouvelle voix, la « pensée ».
- **Onglet Accessibilité** (⚙) : taille du texte (petite, normale, grande, très grande), vitesse du texte, vibrations (téléphone et manette : prise d'objet, carte obtenue, aparté, panier plein), luminosité, contraste, réduire les animations.

**Vérifié** : 118 tests de logique (pensée, double toucher entre deux dessins) ; 58 tests navigateur PC et téléphone simulé, sans erreur console ; captures de l'accueil et de la superposition menu / bande. **Non vérifiable ici** : les vibrations, la manette.

**Décisions prises seul** :
- Luminosité et contraste : un filtre seulement s'ils ne valent pas 1 (il coûte un peu sur téléphone).
- « Réduire les animations » est rangé dans Accessibilité.

---

## Séance 40 — 15/11/2026 — « Commencer » réparé, plein écran au choix, filtre écran cathodique

**Retours de l'auteur** : « Commencer » ne lance pas le jeu ; pouvoir choisir le plein écran dans les options ; un filtre écran cathodique ; d'autres idées d'options.

**Cause trouvée** :
- la fenêtre des Options s'ouvrait **derrière** l'écran titre : visible en partie, mais impossible à utiliser ;
- le jeu restait dans l'état « Options », donc « Commencer » ne faisait rien ;
- mon test passait parce qu'il fermait les Options au clavier.

Ce que j'ai corrigé :
- les Options passent au-dessus de l'écran titre ;
- « Commencer » ferme les Options si elles sont ouvertes ;
- la partie démarre **avant** la demande de plein écran, dont un éventuel refus ne bloque plus rien ;
- les erreurs survenues sur l'appareil sont recopiées dans le rapport du diagnostic (ligne « Erreurs relevées »).

**Jouable maintenant** :
- ⚙ → Affichage → **Plein écran** : Automatique (téléphone : oui, en paysage, en touchant Commencer), Oui, Non. Le choix s'applique tout de suite.
- **Filtre écran cathodique** (désactivé par défaut) : lignes de balayage, bords sombres et bombés, force réglable. Il est par-dessus tout, même l'écran titre, sans gêner les clics.

**Vérifié** : 116 tests de logique et 56 tests navigateur PC et téléphone simulé sans erreur console, dont : Options ouvertes depuis le titre (onglet Affichage, plein écran, filtre), retour au titre, puis Commencer ; captures du filtre en jeu et sur le titre. **Non vérifiable ici** : le vrai plein écran du téléphone.

---

## Séance 39 — 15/11/2026 — Écran titre, objets illustrés, échange de cartes, confiance à l'essai

**Demandes de l'auteur** :
- objets illustrés dans l'onglet Objets ;
- fenêtre Oui / Non avant d'échanger une carte, et le produit reposé à la place du produit scanné ;
- réponses de l'aparté jamais vues ;
- l'onglet « Courses » renommé « Cartes » ;
- le jeu qui démarre parfois à la verticale ;
- un écran titre (esprit Baten Kaitos / FF) ;
- la confiance, à noter et à intégrer comme essai.

**Jouable maintenant**
- **Écran titre** : « PAPER CART — The Final Checkout » en grand, sur une image [TEMP] d'un rayon sans fin qui file vers une lueur (caddie abandonné, petite silhouette de papier). Boutons **Commencer** et **Options**, au doigt, à la souris, au clavier et à la manette.
- **Sur téléphone**, « Commencer » passe en **plein écran paysage**. En portrait, la consigne « Tourne ton téléphone » propose un bouton pour passer en paysage.
- **Onglet Objets** : chaque objet a une **icône** et une courte description. Onglet « **Cartes** » (au lieu de « Courses »).
- **Panier plein** :
  - une fenêtre demande « **Échanger une carte contre ce produit ? Oui / Non** » ;
  - Oui : on choisit la carte, et son produit **apparaît à la place du produit scanné** ;
  - Non : rien ne change.
- **Aparté d'accueil** : s'il arrive pendant que le héros marche, il **attend qu'il s'arrête** (20 s au plus) au lieu d'être perdu. C'est lui qui pose la première question.
- **Confiance à l'essai** : deux nouvelles répliques d'inactivité n'existent qu'avec une confiance haute (complice) ou basse (blessé).

**Vérifié** : 116 passed tests de logique (dont l'attente de l'aparté et les répliques selon la confiance) ; 54 tests navigateur PC et téléphone simulé sans erreur console, dont l'écran titre (Commencer, Options, clavier), la question Oui / Non et l'échange de place ; comptages ; captures PC et téléphone simulé. **Non vérifiable ici** : le plein écran paysage sur un vrai téléphone, la manette.

**Décisions prises seul** :
- Polices du système en attendant une police choisie (aucune ressource ajoutée sans accord).
- Icônes et image de titre [TEMP].
- En plein écran paysage seulement depuis « Commencer » (le navigateur l'exige après un geste).

---

## Séance 38 — 15/11/2026 — Publication, carte reposée sur l'étagère, apartés enrichis

**Décisions de l'auteur** :
- limites des comptages validées (88 éléments, 40 images ; priorité au PC) ;
- carte reposée : le produit retourne sur l'étagère (B) ;
- émotions validées pour l'essai ;
- précisions sur les apartés (✅ rares et importants, réponses à deux choix et confiance ; 🧪 magasin figé, motif de l'Épaisseur, regards caméra, « réduire les animations ») et sur l'onglet « Objets » (✅ deux onglets ; 🧪 nature des objets ; ❓ objets en combat).

**Publié d'abord** : la séance 37 (7b5b843), avec les nouvelles limites.

**Jouable maintenant**
- **Panier plein** : la carte reposée fait **revenir le produit sur l'étagère**, on peut le rescanner.
- **Onglets « Courses » et « Objets »**, à changer au doigt, au clavier (flèches gauche/droite) et à la manette (croix, LB/RB).
- **Apartés** :
  - le **temps du magasin se fige** (sa musique se tait, le haut-parleur se tait, le repère s'arrête), puis le haut-parleur réagit au client « planté devant le mur » ;
  - un **motif de l'Épaisseur** (4 notes [TEMP]) revient à chaque aparté ;
  - **deux réponses** sur l'aparté d'accueil et sur « c'est par où, la sortie ? » : la **confiance** évolue (+1, −1 ou 0) et le héros répond (doigt, souris, 1 et 2, flèches + Entrée, manette).
- **Petits regards caméra sans texte** : après une annonce sur deux, le héros regarde le joueur (blasé ou complice), au plus un toutes les 25 s.

**Vérifié** : 114 passed tests de logique (voix, réponses, confiance, regards, données) et 51 tests navigateur PC et téléphone simulé, sans erreur console ; comptages dans les limites ; captures PC et téléphone simulé.

**Décisions prises seul** :
- Réponses [TEMP] sur 2 apartés seulement (« parfois »).
- La confiance n'est pas affichée : elle se lit dans le diagnostic de test.
- Pendant une question, toucher ailleurs ne la fait pas disparaître : il faut répondre.

---

## Séance 37 — 15/11/2026 — Panier à deux onglets, reposer une carte, aparté refait (A4)

**Décisions de l'auteur** :
- menu du panier à deux onglets (Cartes, Objets) ;
- panier plein : reposer une carte (B) ;
- lien avec `?v=` en fin de message ;
- panier en main seulement une fois pris ;
- l'accueil, futur lieu à part, avec l'agent de sécurité (même personnage que le Vigile Syndiqué, à l'essai) ;
- étape « L'accueil, premier vrai deuxième lieu » après A5 ;
- A4 à refaire.

**Construit (pas encore publié)**
- **Défaut corrigé** : le style des objets tenus ignorait l'attribut « caché ». Le panier et la Scanette de dos étaient donc dessinés dès le départ. Ajout d'une règle générale : un élément caché n'est jamais affiché. Le test contrôle ce qui est vraiment visible.
- **Panier à deux onglets** : « Cartes » et « Objets » (Scanette, Panier à main ; textes [TEMP] dans `data/objects.json`).
- **Panier plein** : écran « Panier plein ». Toucher (ou Entrée sur) une carte la repose, puis le scan se fait. « Annuler » sinon. [TEMP] La carte reposée est abandonnée.
- **Aparté refait** :
  - le héros se tourne **tête de face**, avec 3 émotions [TEMP] (inquiet, complice, blasé) choisies par la réplique ;
  - la **caméra zoome** sur lui (×1,35) ;
  - **bandes « cinéma »** et bords assombris ;
  - **son grave** et **musique baissée** ;
  - le héros reste immobile, et un toucher fait passer la réplique ;
  - plus rare (150 s entre deux apartés), et seulement quand il est à l'arrêt.
- Documents : lien `?v=` (CLAUDE.md), accueil lieu à part (HISTOIRE, PERSONNAGES, PROTOTYPES), deux onglets et panier plein (GAME_DESIGN).

**Vérifié** :
- 112 tests de logique et 50 tests navigateur verts, sauf le test des comptages : **38 images pour une limite de 36** (déjà relevée de 32 à 36 en séance 36, et pas encore validée par l'auteur).
- Le relèvement de la limite à 40 a été refusé par le garde-fou de l'environnement, faute d'accord de l'auteur, comme le veut notre règle.
- **Rien n'a été publié** : le travail est gardé sur la branche de travail en attendant la décision de l'auteur.

---

## Séance 36 — 15/11/2026 — La Scanette ; A5a : l'accueil en libre-service

**Décisions de l'auteur** :
- la « douchette » devient la **Scanette**, qui pourra casser et devenir l'**Extracteur** ;
- l'accueil en libre-service (choix A), à construire maintenant (A5a) ;
- A4 **pas encore validée** : l'aparté doit devenir un moment rare et marquant (face caméra, zoom, effet visuel et sonore) ;
- panier, deck (« courses »), jeton et caddie : voir `GAME_DESIGN.md`.

**Jouable maintenant (A5a)**
- Le héros commence **les mains vides**. Au début du rayon, un **présentoir « Accueil · libre-service »** (dessiné dans le décor) avec des Scanettes et une pile de paniers à main.
- Devant le présentoir, le bouton devient **« Prendre »** (Entrée, Espace, A, ou double toucher sur le présentoir). Le héros prend la Scanette puis le panier, avec un petit son. Il les **tient en main** : Scanette à droite, panier rouge à gauche, qui suivent les bras en marchant et pendant le scan.
- Sans Scanette ou sans panier, **le scan est refusé** et le haut-parleur explique. S'il s'éloigne sans Scanette, il le rappelle.
- Le bouton du Panier apparaît avec le panier, et affiche la capacité (**0/6**, provisoire). Panier plein : scan refusé (règle provisoire).
- 6 nouvelles répliques [TEMP] du haut-parleur.

**Technique** :
- La Scanette a été retirée des 13 dessins du héros. Elle est dessinée à part (vues de face et de dos), comme le panier : objets tenus, posés derrière le dessin, la main passant devant.
- Nouveau `core/gear.js` (ce que porte le héros), testé.
- Les anciens tests de scan commencent équipés.

**Vérifié** :
- 110 tests de logique, 50 tests navigateur sans erreur console, dont : accueil au clavier, double toucher sur le présentoir, scan refusé sans Scanette, panier plein.
- Captures PC et téléphone simulé.
- **Comptages : 81 éléments, 35 images**, à cause des 3 objets tenus. Limites relevées à 88 et 36 : **à valider par l'auteur**.

**Décisions prises seul (provisoires)** :
- Capacité du panier : 6 (réglable).
- Panier plein : scan refusé, en attendant le choix de l'auteur.
- Présentoir dessiné dans le décor, contre l'étagère, au début du rayon.
- On prend chaque objet séparément.

---

## Séance 35 — 15/11/2026 — Haut-parleurs visibles, personnage mieux posé au sol

**Demandes de l'auteur** : voir les haut-parleurs d'où sort la voix ; comment arrêter un essai de diagnostic ; qui donne la douchette ; le personnage semble flotter.

**Jouable maintenant**
- **5 haut-parleurs** dessinés au plafond (décor du fond, provisoire). Quand le narrateur parle, celui **le plus proche du héros émet des ondes**, et l'annonce s'affiche **juste dessous**, avec une pointe vers lui. Elle ne passe jamais sous les boutons du haut.
- **Personnage mieux posé au sol** :
  - **ombre de contact** : une petite zone sombre juste sous les pieds, dans la même ombre (aucun élément de plus) ;
  - **pieds enfoncés de 4 px** du dessin, pour que le contour blanc sous la semelle touche le sol.

  Mesure qui l'explique : la semelle dessinée était 3 px (de face) à 6 px (de dos) au-dessus du point de contact. Surtout, le contour blanc et l'ombre pâle faisaient comme un vide sous les pieds.
- **Essais de diagnostic** : la bannière rappelle comment arrêter (bouton II, Échap ou B, résultats partiels gardés). Elle est désormais en bas de l'écran, pour ne plus passer sous les boutons.

**Vérifié** :
- 105 tests de logique et 47 tests navigateur, sans erreur console.
- Comptages : 78 éléments, dans la limite de 80. Le premier dessin des ondes en ajoutait 10, refusé par le test ; il est refait en un seul élément.
- Captures : haut-parleur et bande en téléphone simulé ; pieds avant et après.
- **Non vérifiable ici** : le ressenti sur le téléphone.

**Décisions prises seul** :
- La voix sort du haut-parleur **le plus proche du héros**, le même jusqu'à la fin de la réplique.
- Les haut-parleurs sont **dessinés dans le décor** : l'auteur les dessinera avec le décor ; seules leurs positions sont dans les données.

---

## Séance 33 — 14/11/2026 — A4 (2/2) : le héros parle à son « Épaisseur »

**Décisions de l'auteur** : le joueur est « l'Épaisseur » du héros (✅ terme et principe) ; seul le héros brise le 4ᵉ mur, le haut-parleur ne sait pas qu'il y a un joueur (🧪) ; pistes ❓ notées (Révélation, Caisse Finale, Panier, êtres vivants) ; corrections de cohérence (Gwent retiré, « Steak Haché Premier Prix », état réel du jeu) ; deux questions de règles notées pour B.

**Jouable maintenant**
- **Apartés du héros** (5 répliques [TEMP], il tutoie « mon Épaisseur », « toi, là-haut ») :
  - juste après l'accueil ;
  - un scan dans le vide, quand le haut-parleur se tait ;
  - la 1re inactivité ;
  - les ouvertures du Panier après la première.
- **On voit qui parle** : le haut-parleur garde sa bande sombre et son « ding-dong » ; le héros a une **bulle de papier au-dessus de sa tête, qui le suit**, un **froissement de papier**, des bips plus graves, et il **se tourne vers l'écran** s'il est à l'arrêt (pivot habituel).
- **Le haut-parleur réagit** une fois sur deux après un aparté : « l'article non référencé du rayon 7 est prié de cesser de parler au mur ».
- **Rareté et priorités** :
  - au moins 90 s entre deux apartés, et 4 s de silence avant ;
  - jamais deux voix à la fois ;
  - une annonce passe avant un aparté (et peut le couper), jamais l'inverse.
- Typographie : espaces insécables à la française (plus de « ? » seul en début de ligne).
- L'inactivité compte maintenant aussi les touches et les touchers, pas seulement la marche.

**Vérifié** :
- 105 tests de logique : priorités, enchaînements, délais, apartés désactivés, tutoiement du héros et vouvoiement du haut-parleur dans les données.
- 47 tests navigateur sans erreur console, comptages inchangés : accueil → aparté en bulle, héros tourné vers l'écran → réaction du haut-parleur ; inactivité → aparté.
- Captures PC et téléphone simulé.
- **Non vérifiable ici** : les sons, la fluidité sur le téléphone.

**Décisions prises seul** :
- Pas de hasard : il n'est pas nécessaire, les règles « une fois sur N » et « la réplique la plus ancienne » suffisent. Le générateur à graine reste prévu pour le jour où le jeu tirera au hasard.
- Le héros se tourne vers l'écran seulement s'il est à l'arrêt et ne scanne pas.
- La bulle reste dans l'écran.

---

## Séance 32 — 14/11/2026 — A4 (1/2) : le narrateur prend la parole

**Décisions de l'auteur** : ancien GAME_DESIGN.md fourni (archivé) ; VISION.md complété (4 familles de cartes, néons de magasin en zone 2) ; fil « Client » → « Article non référencé » essayé dès A4 (choix A).

**Jouable maintenant**
- Une **bande « haut-parleur »** en haut à gauche : petit « ding-dong » d'annonce, puis le texte s'écrit lettre par lettre avec de petits bips.
- **8 moments** le font parler :
  - l'arrivée ;
  - le premier scan ;
  - un scan sur trois ensuite ;
  - « scanner » sans rien à portée ;
  - 30 s sans rien faire ;
  - la première ouverture du Panier ;
  - le bout du rayon ;
  - un retour de pause sur trois.
- **12 répliques [TEMP]**, sans le préfixe à l'écran.
- **Il reste rare** : 20 s au moins entre deux prises de parole, aucune réplique répétée avant 10 min. Les moments forts (l'arrivée, le premier scan) passent toujours et coupent la réplique en cours.
- **Toucher ou cliquer la bande** : le texte s'affiche en entier, puis la bande disparaît.
- La pause fige le narrateur. Il continue de parler dans le Panier. Il se tait pendant les mesures.

**Vérifié** :
- 99 tests de logique : règles de prise de parole, machine à écrire, inactivité, données des répliques.
- 47 tests navigateur sans erreur console, comptages inchangés : accueil, bande qui ne recouvre pas les boutons, toucher qui complète puis ferme, premier scan commenté même pendant l'accueil, « rien à scanner », inactivité, désactivation.
- Captures PC et téléphone simulé.
- **Non vérifiable ici** : les sons (annonce, bips) et la fluidité sur le téléphone.

**Décisions prises seul** :
- Le narrateur vouvoie, comme une annonce de magasin. C'est un contenu [TEMP], que l'auteur peut faire passer au tutoiement.
- Le choix des répliques est sans hasard : il prend celle qui n'a pas été dite depuis le plus longtemps.
- La bande est en haut à gauche, dans la zone sûre.

---

## Séance 31 — 14/11/2026 — Documents de conception courts, lecture à la demande

**Décisions de l'auteur** : A4 codé à la séance suivante (bases écrites d'abord) ; 5 documents de conception courts, lus seulement à l'étape concernée ; **A5 — Caddie jouable** défini (Panier physique qui suit le personnage) ; univers, douchette et stase des rayons, structure en 3 actes, combat face à face et 4 familles de cartes ✅.

**Fait (documentation seulement, aucun fichier de code touché)**
- Créés dans `docs/` : `HISTOIRE.md` (43 lignes), `PERSONNAGES.md` (32), `GAME_DESIGN.md` (26), `REGLES_CARTES_COMBAT.md` (31), `DIRECTION_ARTISTIQUE.md` (22), avec les balises ✅ 🧪 ❓ [TEMP]. Contenu repris du texte de l'auteur, sans ajout de règle.
- `CLAUDE.md` : règle de lecture à la demande (quel fichier pour quelle étape, jamais en début de séance), longueur maximale, balises.
- `README.md`, `PROTOTYPES.md` (étape A5), `ARCHITECTURE.md` (renvoi), `SUIVI.md` à jour.

**Non fait** : archivage de l'ancien `GAME_DESIGN.md` de Maxi-Gouffre : **fichier non reçu**. La liste des 20 familles et 6 recettes attend ce fichier.

---

## Séance 30 — 14/11/2026 — Diagnostic en 4 configurations retiré, documents de conception

**Décisions de l'auteur** : outils de mesure, choix B (retirer le diagnostic en 4 configurations, garder la campagne DEVANT2 jusqu'à ce qu'on revoie le rayon de devant) ; histoire du scanner : pas de choix pour le moment ; suite : A4, le narrateur.

**Fait**
- Retiré : `core/protocol.js`, `ui/protocol.js`, leurs tests, leurs réglages (onglet Diagnostic), le « fantôme » de caméra et le point `idle` du lieu. Le test rapide garde son aller-retour (déplacé dans `core/quicktest.js`). `main.js` : 589 lignes au lieu de 704.
- ARCHITECTURE et SUIVI mis à jour.

**Vérifié** : 87 tests de logique (les tests du diagnostic retiré sont partis avec lui), 43 tests navigateur sans erreur console, comptages inchangés, vérification automatique : aucun nom orphelin.

---

## Séance 29 — 14/11/2026 — Audit de l'architecture, documentation remise à jour

**Décisions de l'auteur** : organisation de la documentation validée (1 : A) ; ancien ARCHITECTURE.md de Maxi-Gouffre fourni et archivé (2 : A) ; **le caddie devient une étape à part, après A4 et avant le combat** (3 : A) ; style des décors pressenti : crayon de couleur, comme le personnage (à confirmer et tester) ; documentation courte, pour économiser la lecture.

**Documentation**
- Créé `docs/ARCHITECTURE.md` : l'état réel du code, les règles techniques (celles du texte initial de l'auteur, confrontées au code), les outils de mesure, ce qui est prévu mais pas construit, et ce qui est repris ou non de Maxi-Gouffre. Résumé de 8 lignes à lire en premier.
- Créé `docs/PROTOTYPES.md` : le plan des prototypes, recopié mot pour mot du texte initial, avec l'état des étapes et l'étape caddie.
- Archivé `docs/archive/maxi-gouffre-ARCHITECTURE.md` (réserve d'idées, pas une référence).
- `CLAUDE.md` :
  - lecture allégée en début de séance ;
  - renvoi vers ARCHITECTURE et PROTOTYPES ;
  - IMAGES.md et `tools/` marqués « à créer avant le prototype D » ;
  - phrase sur le test des comptages corrigée : elle annonçait des comptages qui n'existent pas.
- `README.md` : tableau d'organisation à jour.
- `docs/SUIVI.md` allégé (98 lignes au lieu de 180) : l'historique de l'enquête sur la fluidité est en annexe, en bas de ce journal.

**Code (sans changement de jeu)**
- La logique du double toucher (produit visé, où aller, scanner ou annuler à l'arrivée) est passée de `main.js` à `core/scan.js`, avec 4 tests de logique.
- Noms clarifiés : `shelf` → `products`, `createShelfProducts` → `createProducts`, `faceShelf` → `faceProduct`, `productNear` → `shelfProductNear`, classe `.shelf-product` → `.product`.
- La marge du double toucher autour d'un produit est maintenant réglable (⚙ → Contrôles).
- Nouveau `tests/unit/data.test.js` : vérifie que chaque image, produit et objet cité dans les données existe. Une référence cassée échoue au test au lieu de planter le jeu.

**Vérifié** : 92 tests de logique, 44 tests navigateur sans erreur console, comptages inchangés (0 bascule de calque). Liens entre documents vérifiés : seul `docs/IMAGES.md` manque, et c'est voulu (avant D).

**Non fait, en attente de l'auteur** : retirer ou garder les outils de mesure peut-être obsolètes ; découper `main.js` (prévu à la prochaine séance qui le touche beaucoup).

---

## Séance 28 — 13/11/2026 — A3 validée, essai de scan hors de l'étagère, pistes pour l'histoire

**Décisions de l'auteur** : clignotement corrigé (confirmé) ; nouvelles limites du test des comptages validées ; **A3 validée : 630fec0**.

**« Pourquoi il n'y avait pas ce problème avant ? »**
- Mesure : j'ai rejoué le même trajet (passer deux fois derrière le présentoir) sur les versions A1 (1445d25), A2 (6be7130) et A3 (e5efbc8). Les trois versions donnent exactement les mêmes 4 bascules de calque. La nouvelle version n'en donne aucune.
- Ce n'est donc pas un défaut ajouté ensuite : la cause existait dès A1. Ce qui a changé, c'est sans doute sa **visibilité**. Deux hypothèses, que je ne peux pas prouver car seule la dernière version est en ligne :
  - depuis A3, le jeu garde 29 images en mémoire au lieu de 17, donc le téléphone met plus de temps à redessiner le caddie ;
  - avant, les images lentes masquaient peut-être ce petit trou.

**Jouable maintenant : essai de scan hors de l'étagère**
- Une **pomme** sur une petite table de dégustation (au bout du rayon) et une **boîte d'œufs** dans le caddie.
- On les scanne de n'importe quel côté : **à côté, de profil** ; **derrière, de face** ; devant, de dos.
- Double toucher (ou double clic) sur le produit : le personnage va à l'endroit prévu le plus proche, sur le côté de préférence.
- Le produit est dessiné juste au-dessus de son support. On peut passer derrière la table et le caddie, et ils ne clignotent pas (calque fixe).

**Vérifié, et comment**
- 85 tests de logique, dont la portée de tous les côtés, l'endroit où se placer et la pose (profil, face ou dos).
- 44 tests navigateur sans erreur console, dont le scan de la boîte d'œufs de profil au doigt et à la souris.
- Captures en téléphone simulé : profil au caddie, puis à la table de côté, derrière et devant.
- Comptages : 77 éléments, 18 images visibles, 32 images chargées (la limite est atteinte : un nouveau contenu demandera de la relever), toujours aucune bascule de calque.

**Décisions prises seul (détails mineurs)** : une table « dégustation » (elle a sa place dans un magasin), placée au bout du rayon pour ne pas gêner le banc d'essai ni le test rapide ; une pomme et des œufs comme produits d'essai ; devant la table, le personnage se met de dos (c'est la seule pose possible) et cache un peu la pomme.

---

## Séance 27 — 13/11/2026 — Clignotement du caddie corrigé, scan par double toucher

**Retours de l'auteur** : rapport du diagnostic sur e5efbc8 : 61 images/s, aucune image au-delà de 33 ms sur les 600 dernières (30 depuis la remise à zéro, sur 7047 images), calcul moyen 0,67 ms. Deux demandes : le caddie et le carton « -30 % » clignotent ou disparaissent par moments ; pouvoir scanner au doigt par un double toucher.

**Le clignotement : cause trouvée par la mesure**
- J'ai lu l'organisation des calques du moteur du navigateur pendant le banc d'essai. Chaque fois que le personnage passe **derrière** un objet, le navigateur crée un calque séparé pour cet objet : il doit être dessiné par-dessus le personnage, qui a son propre calque. Quand le personnage ressort, ce calque est supprimé et l'objet est remis dans le décor. Mesuré : une bascule à l'entrée et une à la sortie, pour chaque objet.
- À chaque bascule, l'objet doit être redessiné. Sur le téléphone, ce nouveau dessin peut ne pas être prêt pour l'image suivante : l'objet disparaît un instant.
- **Correction** : les objets du décor ont maintenant leur propre calque en permanence. Mesuré après correction : plus aucune bascule pendant le parcours. Interrupteur ⚙ → Affichage → « Objets sur calque fixe (anti-clignotement) » (activé par défaut), pour comparer.
- **Règle posée une fois** : le test des comptages vérifie maintenant qu'aucun objet du décor ne change de calque pendant le parcours (limite : 0).
- Effet possible sur la fluidité : 3 petits calques de plus, dessinés une seule fois et ensuite seulement déplacés. Il faut le vérifier sur le téléphone : un test rapide, si tu le souhaites.

**Double toucher pour scanner**
- Touche **deux fois** un produit (ou l'étagère juste à côté) : le personnage va au pied de l'étagère, devant ce produit, et le scanne à l'arrivée. S'il est déjà devant, il scanne tout de suite.
- Fonctionne aussi au **double clic** à la souris.
- Un simple toucher ne scanne pas : il fait seulement marcher. Si le joueur reprend la main pendant l'approche (clavier, manette, nouveau toucher), le scan est annulé.
- Réglages ⚙ → Contrôles : délai maximal entre les deux touchers (0,35 s) et écart maximal entre eux (50 px).

**Vérifié, et comment**
- 81 tests de logique (dont produit visé par un double toucher, produit à portée).
- 42 tests navigateur, sans erreur console :
  - double toucher sur un produit lointain (le personnage y va et le scanne) ;
  - simple toucher sans scan ;
  - double clic à la souris ;
  - approche annulée au clavier.
- Test des comptages avec la nouvelle règle : 0 changement de calque avec la correction (8 passages de suite), 6 quand on la coupe. La règle détecte donc bien le problème. Les autres comptages sont inchangés (72 éléments, 17 images visibles, rien créé en jeu).
- Captures PC et téléphone simulé regardées.
- **Non vérifiable ici** : le clignotement lui-même. Le navigateur de test dessine chaque image entièrement avant de l'afficher, donc il ne clignote jamais. J'ai vérifié la cause (les bascules), pas le symptôme. À confirmer sur le téléphone.

**Décisions prises seul (détails mineurs)**
- Le double toucher vise le produit le plus proche du doigt (à la portée du scanner près). S'il n'y a aucun produit près du doigt, il fait seulement marcher.
- Après un double toucher, le point visé ne suit plus le doigt (pour qu'un léger glissé n'annule pas le scan).

---

## Séance 26 — 13/11/2026 — Étape A3 : le scanner, les cartes et le Panier

**Décisions de l'auteur** : rayon de devant gardé entier (« on verra plus tard ») ; fluidité acceptée en l'état et passage à A3 (choix C). **A2 validée : 6be7130.**

**Jouable maintenant**
- **10 produits** sur l'étagère du fond, le long du rayon : banane, lait, céréales, baguette, steak, pile, glace, bière, plante, fromage (dessins provisoires).
- Au pied de l'étagère, le **produit le plus proche est mis en évidence** par un repère en papier qui flotte au-dessus. Un bouton « Scanner » apparaît.
- **Scanner** (Entrée, Espace, bouton A de la manette, ou bouton « Scanner » au doigt) : le personnage s'arrête et se tourne vers l'étagère, lève sa douchette (nouvelle pose, face et dos). Puis viennent le **laser** et le ***bip***, la **dissolution du produit en confettis** aspirés par la douchette (avec un son d'aspiration), et une **carte** qui apparaît avec un petit rebond, reste un instant, puis **file dans le Panier**. Le compteur du Panier sautille.
- **Panier** (bouton en bas à gauche, touche I, bouton Y de la manette) : les cartes, avec nom, puissance, stade et propriétés. Le stade se lit à la **couleur et à la forme** de son icône : Frais = cercle vert, Mûr = triangle doré, Pourri = carré brun. Fermer : Échap, bouton B ou « Fermer ».
- Pendant un scan, le personnage ne bouge pas. La pause fige tout le scan (délais liés à la boucle de jeu, sans minuterie).
- Un produit scanné quitte l'étagère.

**Vérifié, et comment**
- 79 tests de logique, dont : produit à portée, déroulé du scan (bip → aspiration → carte → fin), scan figé sans temps qui passe, cartes et Panier, chaque produit du rayon scannable depuis le sol, Panier dans la machine à états.
- 39 tests navigateur, sans erreur console : scan au clavier (repère, bouton, immobilité, carte dans le Panier, produit retiré, Panier ouvert et fermé) ; scan au doigt en téléphone simulé ; pause qui fige un scan.
- Captures PC et téléphone simulé regardées (repère, laser et confettis, carte, Panier).
- **Test des comptages** : 72 éléments (contre 39), 5 calques déclarés (le nouveau « produits »), 17 images visibles (contre 10), 29 images chargées (contre 17). Surface affichée presque inchangée (1,87 contre 1,85) ; rien n'est créé pendant le jeu. **Limites relevées en conséquence (80, 5, 20, 32) : à valider par l'auteur.**
- **Non vérifiable ici** : les sons (pas de haut-parleur), la manette, la fluidité sur le téléphone.

**Décisions prises seul (détails mineurs)**
- Les noms provisoires sont préfixés [TEMP] dans les données, mais affichés sans le préfixe sur les cartes.
- Stades de départ : la plupart des produits donnent une carte Fraîche, la banane et le fromage une carte Mûre (pour voir les deux icônes). Le vieillissement des cartes viendra avec le combat (prototype B).
- Le personnage se met de dos pour scanner (l'étagère est au fond).
- Les produits sont limités en hauteur par l'écart entre deux tablettes : ils sont un peu petits. Les dessins de l'auteur les rendront plus lisibles.

**Proposition pour la séance suivante** : après tes retours, étape A4 : le narrateur (bande « haut-parleur », effet machine à écrire, une dizaine de répliques [TEMP]), des finitions et une vérification de la fluidité avec le test rapide.

---

## Séance 25 — 13/11/2026 — Campagne « rayon de devant » n° 2 : bilan de l'optimisation DOM

**Conditions** : 00fd429 ; batterie 57 → 55 %, débranché, plein écran, mode normal, écran maintenu allumé ; indice de vitesse 4,1 → 4,3 ms. Le téléphone est donc « en bon état » selon la règle de la séance 24.

**Mesuré** — images > 20 ms par minute (blocs min–max) / > 33 / > 50 / calcul pire :
- T0 98,0 (87–110) / 7 / 0 / 13,8 ms ;
- G4 68,8 (57–83) / 3 / 1 / 14,8 ms ;
- G3 128,9 (103–157) / 15 / 0 / 14,5 ms.

**Démontré**
- Moitié haute du rayon de devant : ×0,70 (0,58–0,86), reproduit (×0,68 en séance 23).
- Rayon de devant qui glisse à la vitesse du sol : **×1,31 (1,11–1,56), dégradation**. Mon hypothèse « il coûte parce qu'il glisse plus vite » est réfutée.
- **Objectifs non atteints sur un téléphone en bon état**, ni en T0 ni en G4.

**Bilan des campagnes DOM (séances 14 à 25)**
- Leviers démontrés et reproduits : rayon de devant (entier ×0,35 s'il est retiré, ×0,70 en moitié haute ; le coût suit sa surface). Les calques ajoutés coûtent (×1,41).
- Sans effet : réduire la boîte du calque, l'opacité.
- Contre-intuitif, plusieurs fois : réduire les animations (×1,20), faire glisser le rayon à la vitesse du sol (×1,31), réduire la surface des rayons lointains avec des fenêtres. Retirer du travail peut dégrader : cause inconnue (gestion d'énergie du téléphone ? façon dont le navigateur organise ses calques ?).
- Pics de calcul de 12 à 18 ms dans toutes les variantes : ils ne viennent pas de l'affichage.
- L'indice de vitesse (calcul pur) est resté autour de 4,1–4,3 ms aussi bien dans un état « 85 images lentes/min » que dans celui-ci (98) : il ne suffit pas, seul, à repérer l'état du téléphone qui compte pour l'affichage.

**Conclusion** : avec la technique actuelle (DOM/CSS), les leviers qui restent touchent à l'aspect du rayon de devant, et aucun ne suffit à atteindre l'objectif. C'est le moment prévu par le cahier des charges pour proposer un essai comparatif PixiJS, chiffres à l'appui. Décisions demandées à l'auteur.

---

## Séance 24 — 13/11/2026 — Campagne « rayon de devant » n° 2 (G4, G3)

**Décisions de l'auteur** : chemin A (campagne courte, puis aspect et validation de A2) ; l'objectif « aucune image > 33 ms » est gardé, mais jugé sur un téléphone en bon état (batterie > 50 %, indice de vitesse comparable). Règle ajoutée à CLAUDE.md.

**G5 abandonnée avant mesure** : l'idée était de faire envoyer l'image du rayon de devant telle quelle à la carte graphique, au lieu de la redessiner par morceaux. Le navigateur de test montre que ça ne marche pas (redessin par morceaux ≈ 14/s, contre ≈ 15/s en T0). La mesurer n'aurait rien appris. Une vraie « définition réduite » demanderait une autre technique de dessin pour ce rayon.

**Campagne n° 2** (⚙ → Diagnostic, premier bouton) : T0, G4 (moitié haute, pour confirmer), G3 (rayon entier, glisse à la vitesse du sol) ; caméra mobile ; 8 tours ; 144 s par variante ; ≈ 8 min 30. Comparaisons G4/T0, G3/T0. Variantes appliquées seulement pendant la mesure ; code des variantes G1, G2 et « image » retiré.

**Vérifié** : 70 tests de logique, 36 tests navigateur (chaque variante appliquée puis jeu rétabli ; en G3 le rayon de devant ne se décale plus par rapport au sol). Comptages du jeu inchangés.

---

## Séance 23 — 13/11/2026 — Résultats de la campagne « rayon de devant »

**Conditions** : 18874a6 (bonne version), mode normal, plein écran, débranché, **batterie basse (25 → 22 %)**, écran maintenu allumé. Vitesse du téléphone : 4,3 ms au début comme à la fin (premier relevé : servira de repère).

**Mesuré** — images > 20 ms par minute (blocs min–max) / > 33 ms / calcul pire :
- T0 85,1 (63–100) / 3 / 17,8 ms ;
- T2 31,7 (23–40) / 1 / 12,1 ms ;
- G1 92,9 (57–137) / 3 / 12,2 ms ;
- G4 63,4 (43–83) / 4 / 15,5 ms ;
- G2 93,4 (70–120) / 2 / 14,1 ms.

**Démontré**
- Rayon de devant invisible : ×0,37 (marge 0,27–0,50), pour la troisième fois.
- **Moitié de hauteur contre calque réduit (G4/G1) : ×0,68 (0,54–0,87).** La surface dessinée du rayon de devant compte. Par rapport à T0 : ×0,75.
- G1 ne récupère pas le gain de T2 (×2,93).

**Non démontré (pas d'effet visible à cette précision)**
- Calque réduit à la taille de l'image (G1) : ×1,09 (0,88–1,36). La zone transparente inutile ne coûte pas.
- Rayon opaque (G2) : ×1,10 (0,88–1,37). La transparence n'est pas ce qui coûte, comme prévu.

**Hypothèses (non démontrées)**
- Le coût du rayon de devant semble à peu près proportionnel à sa surface dessinée (rien : ×0,37 ; moitié : ×0,75 ; entier : ×1).
- Par pixel d'écran, il coûte bien plus que la bande des rayons lointains : environ 0,3 écran pour un effet de ×0,37, contre environ 0,7 écran pour ×0,77. Pistes : il glisse plus vite que le reste (×1,25), donc de nouveaux morceaux doivent être dessinés plus vite quand la caméra bouge ; il est dessiné en dernier, par-dessus le personnage. **Ma prévision de la séance 21 (« une parallaxe moins forte ne changera rien ») est donc remise en question.**
- Les pics de calcul (12 à 18 ms) sont présents dans toutes les variantes : ils ne viennent pas du rendu graphique.

**Remarques** : la batterie était basse (25 %), contrairement au conseil. La référence (85,1) est plus basse que lors de la passe précédente (122,9), à batterie pourtant plus basse : l'état du téléphone varie sans lien simple avec la batterie. L'indice de vitesse permettra de mieux le suivre.

---

## Séance 22 — 13/11/2026 — Répétition involontaire de la campagne F0–F3 (version en cache)

Le téléphone a lancé l'ancienne version (ea49561, code identique à aa84366) au lieu de 18874a6 : c'est donc **une deuxième passe de la campagne de vérification**, dans les mêmes conditions (mode normal, plein écran, débranché 32 → 28 %, écran maintenu allumé).

**Mesuré (passe 2)** — images > 20 ms par minute / > 33 ms / > 50 ms : T0 122,9 / 4 / 1 · T1 149,0 / 12 / 0 · T2 46,1 / 1 / 0 · F0 107,2 / 8 / 4 · F1 160,7 / 21 / 4 · F2 180,2 / 27 / 8 · F3 166,3 / 43 / 23.

**Les deux passes réunies** (216 s par variante ; marge à 95 %) :

| Comparaison | Passe 1 | Passe 2 | Les deux |
|---|---|---|---|
| T1 (animations réduites) / T0 | ×1,18 | ×1,21 | ×1,20 [1,05–1,37] |
| T2 (rayon de devant invisible) / T0 | ×0,32 | ×0,38 | ×0,35 [0,29–0,42] |
| F0 (sans rayons lointains) / T0 | ×0,65 | ×0,87 | ×0,77 [0,67–0,89] |
| F2 (deux calques ajoutés) / T0 | ×1,34 | ×1,47 | ×1,41 [1,24–1,60] |
| F1 / F2 (bande retirée, calques gardés) | ×1,05 | ×0,89 | ×0,96 [0,85–1,08] |
| F1 (ancien T3) / T0 | ×1,41 | ×1,31 | ×1,35 [1,19–1,54] |
| F3 (fenêtres dans le décor) / T0 | ×1,23 | ×1,35 | ×1,30 [1,14–1,48] |

**Démontré et reproduit** : rayon de devant (×0,35) ; coût des deux calques ajoutés (×1,41) ; ancien T3 (×1,35) ; F3 (×1,30, avec beaucoup d'images > 33 et > 50 ms dans les deux passes) ; aucun gain à retirer la bande quand les fenêtres existent.
**Nouveau** : réduire les animations dégrade légèrement (×1,20, démontré une fois les deux passes réunies). On garde les animations.
**À nuancer** : sans rayons lointains (F0) aide, mais moins que ne le laissait croire la passe 1 (×0,77 au total, ×0,87 seule dans la passe 2).
**État du téléphone** : référence encore plus haute (122,9 contre 101,8), batterie plus basse (32 % contre 42 %).

La campagne « rayon de devant » (18874a6) reste à lancer.

---

## Séance 21 — 13/11/2026 — Campagne « rayon de devant », nettoyage, indice de vitesse

**Avis sur les suggestions de ChatGPT (transmises par l'auteur)** : réduire la surface réelle sans changer l'apparence = G1, retenue. Plusieurs opacités (0,35, 0,20) : coût prévu identique à 0,55, seule l'opacité 1 ou 0 change la nature du travail, donc écartées. Intégrer le rayon au décor : impossible avec la technique actuelle, puisqu'il passe devant le personnage, qui a son propre calque. Une parallaxe moins forte : coût prévu identique, car le calque bouge à l'écran de toute façon ; ma propre variante G3 est retirée pour la même raison.

**Décision de l'auteur** : variantes T0, T2, G1, G4, G2 ; retrait du code F1 à F3 ; indice de vitesse.

**Fait (diagnostic seulement, le jeu ne change pas)**
- Code des variantes F1 à F3 retiré : les fichiers stage.js, style.css et les données du lieu sont revenus exactement à leur état d'avant la campagne de la séance 19.
- Nouvelle campagne ⚙ → Diagnostic → « Lancer la campagne « rayon de devant » » : 5 variantes, caméra mobile, 6 tours, ≈ 11 min. Comparaisons : T2/T0, G1/T0, G4/G1, G2/T0, G1/T2.
- **Indice de vitesse du téléphone** dans les rapports des tests rapides : un calcul fixe chronométré au début et à la fin (plus petit = plus rapide), pour comparer l'état du téléphone d'un essai à l'autre.

**Vérifié** : 70 tests de logique, 37 tests navigateur (variantes appliquées puis jeu rétabli ; G1 donne la même image ; rapport avec indice de vitesse). Comptages du jeu revenus à leurs valeurs d'origine. Navigateur de test : G1 réduit le calque (4300×1080 → 4300×300) mais presque pas la surface dessinée (3,39 → 3,37), car ce navigateur ignore déjà les zones transparentes ; G4 la réduit (3,23). À vérifier sur le téléphone.

---

## Séance 20 — 13/11/2026 — Résultats de la campagne de vérification

**Conditions** : aa84366, mode normal, débranché (42 → 37 %), plein écran, écran maintenu allumé. Campagne de 23 min (de 10 h 11 à 10 h 34), 6 tours, 108 s mesurées par variante, en alternance.

**Mesuré (téléphone)** — images > 20 ms par minute (blocs min–max), images > 33 ms, images > 50 ms, calcul pire :
- T0 101,8 (70–143) · 3 · 0 · 18,3 ms ;
- T1 120,1 (100–153) · 4 · 0 · 26,3 ms ;
- T2 32,2 (20–43) · 0 · 0 · 13,6 ms ;
- F0 66,2 (53–93) · 3 · 0 · 12,8 ms ;
- F1 143,4 (117–173) · 18 · 6 · 13,9 ms ;
- F2 136,8 (110–167) · 16 · 6 · 11,0 ms ;
- F3 125,6 (103–134) · 41 · 21 · 12,7 ms.

**Démontré (téléphone, comparaisons dans le même essai)**
- Rayon de devant invisible : ×0,32 (marge 0,24–0,43) ; les blocs ne se chevauchent pas. C'est le levier le plus fort, retrouvé à chaque test (×0,45 en séance 14).
- Sans rayons lointains : ×0,65 (0,52–0,82).
- Deux calques ajoutés, surface inchangée (F2) : ×1,34 (1,11–1,63).
- Ancien T3 (F1) : ×1,41 (1,17–1,70). **Le résultat de T3 est confirmé** dans l'état actuel.
- Fenêtres dessinées dans le décor (F3) : ×1,23 (1,02–1,50), et surtout **41 images > 33 ms et 21 > 50 ms** (contre 3 et 0 pour T0).
- **La dégradation de T3 venait des deux calques ajoutés, pas de la réduction de surface** : F2 montre leur coût ; F1 contre F2 (bande retirée, calques gardés) ne montre aucun gain (×1,05, marge 0,88–1,25).

**Non démontré** : effet des animations (×1,18, marge 0,97–1,44). Aucun bénéfice à les réduire.

**Constat sur l'état du téléphone** : la référence est revenue à environ 100 images lentes par minute (contre 10 lors de la séance 18, 1 h 30 plus tôt), et les pics de calcul aussi (18 à 26 ms). Le redémarrage n'a donc donné qu'une amélioration temporaire. Causes possibles, non démontrées : chaleur après une heure de tests, niveau de batterie, temps écoulé depuis le redémarrage. Les comparaisons à l'intérieur d'un même essai restent valables ; les niveaux absolus varient d'un moment à l'autre.

**Hypothèses techniques (navigateur de test : organisation du rendu)**
- Un calque mobile placé sous le décor du fond (la bande ou les fenêtres) oblige le navigateur à donner au décor son propre grand calque. Sans rien dessous (F0, F3), le décor rejoint le calque de la scène. Nombre de grands calques : T0 5, F0 4, F1 6, F2 7, F3 4.
- Sur le téléphone, la fluidité suit à peu près ce nombre (F0 < T0 < F2), sauf F3, où redessiner le décor à chaque mouvement provoque de longues saccades.
- Les fenêtres en calques provoquent aussi plus d'images > 33 et > 50 ms (18/6 et 16/6 contre 3/0) : peut-être le dessin à la volée des parties de l'image qui entrent dans la fenêtre en glissant. Non démontré.

**Conséquences proposées** : abandonner les variantes F1, F2, F3 (code de diagnostic à retirer) ; garder les animations ; travailler en priorité le rayon de devant, avec des variantes qui respectent la direction artistique, mesurées par la même campagne ; ajouter aux rapports un indice de vitesse du téléphone pour suivre son état d'un essai à l'autre.

---

## Séance 19 — 13/11/2026 — Campagne de vérification dans l'état actuel du téléphone

**Vérification de l'auteur** : chrome://gpu → « Compositing : Hardware accelerated ».

**Demande de l'auteur** : les anciens T1 et T3 ont été mesurés sur un téléphone en état dégradé. Il veut les refaire dans l'état actuel (mode normal, même mémoire, débranché, refroidi, plein écran, caméra mobile, même trajet, variantes alternées, une seule modification par comparaison), et comprendre si la dégradation de T3 venait de la réduction de surface ou des deux calques ajoutés. Il demande aussi une variante qui réduise la surface sans calque ajouté. Pas d'A3 avant la validation définitive de A2.

**Construit (diagnostic seulement ; le jeu dessine toujours la bande entière)** : ⚙ → Diagnostic → « Lancer la campagne de vérification » (7 variantes, 6 tours, ≈ 15 min) : T0, T1, T2, F0 (sans rayons lointains), F1 (fenêtres en calques, ancien T3), F2 (bande + fenêtres en calques), F3 (fenêtres dessinées dans le décor). Comparaisons : T1/T0, T2/T0, F0/T0, F2/T0, F1/F2, F1/T0, F3/T0.

**Vérifications (navigateur de test ; organisation du rendu, pas performances)**
- Image : F1, F2, F3 identiques à T0 à 0,1 % de pixels près (écart maximal 14/255, lissage). F0 retire les rayons lointains, volontairement. Test automatique ajouté.
- Caractérisation pendant les mouvements de caméra :

  | Variante | Calques qui dessinent | Surface par image | Rendus de pixels/s |
  |---|---|---|---|
  | T0 | 10 | 3,39 | 182 |
  | F0 | 9 | 2,68 | 147 |
  | F1 | 11 | 2,76 | 153 |
  | F2 | 12 | 3,47 | 181 |
  | F3 | 9 | 2,68 | 292 |

  F0 retire aussi un calque (celui de la bande), en plus de la surface. F3 évite les calques ajoutés mais fait redessiner le décor aux ouvertures à chaque mouvement de caméra.
- Comptages du jeu inchangés (5 éléments masqués de plus pour le diagnostic : 44, pour une limite de 45).
- 70 tests de logique, 37 tests navigateur.

**À faire par l'auteur** : lancer la campagne et coller le rapport.

---

## Séance 18 — 13/11/2026 — Test de confirmation en mode normal : surprise

**Conditions** : mode haute performance désactivé, sans redémarrer ; extension de RAM toujours active ; plein écran, débranché (52 → 50 %), écran maintenu allumé.

**Résultats (images > 20 ms par minute)** : A-T0 1,7 ; A-T1 4,2 ; B-T0 10,0 ; B-T1 24,2 ; B-T2 5,8. Aucune image > 33 ms ; 60,6 à 61,0 i/s ; calcul du jeu 0,3–0,4 ms en moyenne, 7,2 ms au pire.

**Démontré**
- En mode normal, dans l'état actuel du téléphone, le jeu atteint les trois objectifs.
- Le mode haute performance n'était pas la cause principale de l'amélioration : en mode normal, la caméra mobile passe à 10 images lentes par minute, contre environ 130 lors des tests précédents en mode normal. Il apporte un gain supplémentaire, de 10 à 0,8.
- « Réduire les animations » dégrade la caméra mobile (×2,42, marge 1,23–4,74).

**Correction de mon analyse de la séance 17** : j'avais présenté la gestion d'énergie comme cause probable des saccades. Elle n'en explique qu'une petite partie. L'essentiel vient d'un autre changement, survenu entre la séance 16 et la séance 17.

**Probable** : l'état du téléphone avant le redémarrage (longue durée sans redémarrage, applications en arrière-plan, mémoire, ou un Chrome en mode dégradé). Le calcul du jeu s'est amélioré lui aussi (pire 13–22 ms → 6–7 ms), ce qui va dans le sens d'un téléphone globalement plus disponible.

**Inconnu** : quel changement compte (redémarrage, extension de RAM) ; si les saccades reviennent avec le temps.

**Propositions** (sans rien modifier dans le jeu) : vérifier chrome://gpu sur le téléphone ; refaire le test rapide après quelques jours sans redémarrer, ou dès qu'une saccade se fait sentir ; décider de la validation de A2.

---

## Séance 17 — 13/11/2026 — Mode haute performance : objectifs atteints

**Conditions** : l'auteur a activé le mode haute performance et l'extension de RAM (8 Go + 3 Go), puis redémarré le téléphone. Plein écran, débranché (56 → 53 %), écran maintenu allumé. Le réglage « Essai caméra immobile » restait coché (sans effet sur ce test).

**Résultats (images > 20 ms par minute)** : A-T0 0,8 ; A-T1 1,7 ; B-T0 0,8 ; B-T1 0,0 ; B-T2 2,5. Aucune image > 33 ms, 61 i/s partout, calcul du jeu 0,3 ms en moyenne, 4,3 ms au pire.

**Comparaison avec les séances précédentes (mode normal)** :

| | Mode normal (séances 14 et 16) | Mode haute performance |
|---|---|---|
| Caméra mobile, images lentes/min | 137,6 et 132,6 | **0,8** |
| Caméra fixe, images lentes/min | 21,7 et 23,4 | **0,8** |
| Images > 33 ms (caméra mobile) | 11 et 10 | **0** |
| Calcul du jeu, pire | 17,5 et 13,9 ms | **4,3 ms** |

**Démontré** (sur ce test) : dans ces conditions, le jeu atteint les trois objectifs du cahier des charges, caméra mobile comprise.

**Probable** : les saccades viennent de la gestion d'énergie du téléphone. En mode normal, il fait tourner le navigateur à des fréquences basses (ou sur ses petits cœurs), parce que le jeu est peu exigeant. Cela expliquerait aussi le paradoxe de T1 et T3 : retirer du travail dégradait.

**Pas encore démontré** : laquelle des trois modifications compte (mode haute performance, extension de RAM, redémarrage). L'extension de RAM est très peu probable, le redémarrage possible, le mode haute performance le plus probable.

**Test de confirmation proposé** : le même test, mode haute performance désactivé, sans redémarrer ni rien changer d'autre.

---

## Séance 16 — 13/11/2026 — T3 rejeté, retour à l'ancien rendu, investigation de la caméra

**Rapport T3 (bdc02db, plein écran, débranché 66 → 64 %, écran maintenu allumé)**, images > 20 ms par minute (blocs min–max) :
- A-ancien 23,4 (13–40) ; A-nouveau 22,5 (17–27) ;
- B-ancien 132,6 (113–153), > 33 ms : 10 ;
- B-nouveau 171,8 (154–197), > 33 ms : 20, > 50 ms : 4.

Comparaisons : nouveau/ancien en caméra mobile ×1,30 (marge 1,05–1,59) → **dégradation démontrée** (les 4 blocs du nouveau sont tous plus mauvais que les 4 de l'ancien) ; caméra fixe ×0,96 (pas de différence, contrôle cohérent) ; caméra mobile/fixe ×5,7.

**Décision** : optimisation rejetée. Code rétabli à l'identique de 1543360 (commit 859e158) ; tests repassés (67 + 35) ; comptages revenus aux valeurs d'avant.

**Leçons**
1. Pour la deuxième fois, les comptages du navigateur de test annonçaient un gain (surface dessinée −19 %) que le téléphone n'a pas confirmé. Le moteur de test ne modélise pas le coût réel de la carte graphique du téléphone.
2. La mesure elle-même est fiable : B-ancien (132,6) reproduit B-T0 de la séance 14 (137,6).
3. Deux changements qui retirent du travail (T1, T3) dégradent tous deux la caméra mobile d'environ ×1,3. Possible effet non linéaire (fréquence de la carte graphique, rythme d'affichage), non démontré.
4. T3 n'a pas seulement réduit la surface : il a aussi ajouté deux calques découpés qui bougent. Il ne prouve donc pas, à lui seul, que la surface cachée est sans effet.

**Investigation de la caméra (lecture du code + comptages déjà relevés ; aucune modification)** : voir le tableau « Investigation de la caméra » dans docs/SUIVI.md. Prochaine étape proposée : un traçage pris sur le téléphone, puis des variantes isolées dans le test rapide. Rien n'est construit avant validation.

---

## Séance 15 — 13/11/2026 — Correction n° 1 : rayons lointains limités aux ouvertures, et test T3

**Décision de l'auteur** : proposition A validée. Ne modifier que le rendu des rayons lointains ; garder l'ancien pour comparer ; même protocole ; vérifier la surface réellement rendue ; ne pas tenir le mécanisme GPU pour acquis ; ne toucher ni au rayon de devant, ni aux animations, ni à la poussière.

**Modification (seulement les rayons lointains)**
- Avant : une bande de 3600×470 dessinée entière, presque entièrement cachée par l'étagère du fond.
- Après : deux « fenêtres » placées sur les ouvertures de l'étagère (montants compris, avec une marge), qui découpent la même image. Elle y glisse avec la même parallaxe. Fenêtres décrites dans les données du lieu.
- L'ancien rendu reste disponible (réglage Diagnostic « Rayons lointains limités aux ouvertures », activé par défaut) ; un seul des deux est affiché à la fois.

**Vérifications (navigateur de test : organisation du rendu, pas une mesure de la carte graphique)**
- **Image identique** : hors des ouvertures, identique au pixel près ; dans les ouvertures, aucun décalage, seulement de légers écarts de lissage sur les contours (médiane 2/255). Test automatique ajouté.
- **Surface réellement dessinée par le compositeur** (rectangles dessinés, après découpage) : rayons lointains 0,71 → 0,06 écran (téléphone simulé) et 0,85 → 0,07 (PC) ; total par image 3,38 → 2,73 et 3,40 → 2,62. Les autres calques sont inchangés.
- Les fenêtres sont bien des calques à part : le décor du fond n'est pas redessiné quand la caméra bouge (redessin des grands calques 17,9 → 5 par seconde).
- Test des comptages : surface d'image affichée 1,85 → 1,51 écran (calcul corrigé pour tenir compte du découpage par les fenêtres) ; calques affichés : 4 ; rien créé pendant le jeu.

**Test T3** (⚙ → Diagnostic, premier bouton) : même protocole que le test rapide (chauffe 30 s, blocs de 20 s, 2 s ignorées, 4 tours, ordre inversé un tour sur deux, 72 s mesurées par condition). Conditions : A-ancien, A-nouveau (caméra fixe, contrôle), B-ancien, B-nouveau (caméra mobile). Mêmes indicateurs et même calcul de marge. Durée ≈ 6 min.

**Vérifié** : 70 tests de logique, 37 tests navigateur (dont T3 court : chaque variante affiche le bon rendu et tout est remis en place ; identité de l'image).

**À faire par l'auteur** : lancer T3 en plein écran, téléphone débranché, « Essai caméra immobile » décoché.

---

## Séance 14 — 13/11/2026 — Analyse du test rapide T0 / T1 / T2 (téléphone)

**Conditions** : téléphone débranché (89 → 87 %), écran maintenu allumé (oui), **pas en plein écran** (zone de jeu 800×272, 3002 px de rayon visibles). Les comparaisons entre variantes restent valables (même essai, même alternance), mais les chiffres absolus ne se comparent pas aux tests en plein écran. Le réglage « Essai caméra immobile » restait coché ; il ne joue pas sur le test rapide.

**Résultats (images > 20 ms par minute, blocs min–max)**
- A-T0 (marche, caméra fixe) : 21,7 (13–30) ; > 33 ms : 0.
- A-T1 (sans animations) : 32,5 (23–43) ; > 33 ms : 1.
- B-T0 (marche, caméra mobile) : 137,6 (113–177) ; > 33 ms : 11 ; > 50 ms : 2.
- B-T1 (sans animations) : 179,3 (167–197) ; > 33 ms : 14.
- B-T2 (sans rayon de devant) : 61,7 (57–67) ; > 33 ms : 2.
- Calcul du jeu : 0,6–0,7 ms en moyenne ; pires 14,6–22 ms.

**Démontré (téléphone)**
1. La caméra mobile multiplie les images lentes (×6,3, marge 4,2–9,6) : confirmé une troisième fois.
2. Le rayon de premier plan transparent pèse lourd en caméra mobile : sans lui, ×0,45 (marge 0,34–0,59). Les blocs ne se chevauchent pas (57–67 contre 113–177). Images > 33 ms : 11 → 2.
3. Couper les animations du personnage et la poussière **n'améliore pas** la fluidité en marche. L'hypothèse tirée des comptages du navigateur de test (personnage redessiné 60 fois/s) ne se traduit pas en coût réel sur ce téléphone.

**Probable** : le téléphone est limité par la quantité de pixels que la carte graphique doit assembler à chaque image quand tout l'écran bouge. Retirer environ 28 % de l'écran en pixels transparents suffit à diviser les saccades par deux : le travail est juste à la limite des 16 ms.

**Inconnu** : la cause de la légère dégradation avec T1 (peut-être le hasard : la marge suppose des images lentes indépendantes, et les blocs varient) ; l'effet de T1 personnage immobile ; la cause des pics de calcul (14–22 ms) ; le gain réel d'une correction des rayons lointains.

**Leçon** : les comptages du navigateur de test décrivent l'organisation du rendu, pas son coût sur le téléphone. Seules les mesures du téléphone décident.

---

## Séance 13 — 13/11/2026 — Test rapide T0 / T1 / T2 (≈ 7 min)

**Demande de l'auteur** : un test sur mesure, plus court mais exploitable.

**Construit (diagnostic seulement)** : ⚙ → Diagnostic → « Lancer le test rapide T0 / T1 / T2 ».
- Un seul essai : 30 s de chauffe, puis 4 tours. À chaque tour, 5 conditions de 20 s (les 2 premières secondes de chaque bloc sont ignorées).
- Conditions : A = marche, caméra fixe ; B = marche, caméra mobile ; T0 = référence, T1 = réduire les animations, T2 = rayon de devant invisible → A-T0, A-T1, B-T0, B-T1, B-T2.
- **Alternance** : l'ordre des conditions est inversé un tour sur deux. La chaleur et l'état du téléphone pèsent donc pareil sur toutes les variantes, ce qui est plus fiable que trois tests successifs, et sans rien régler à la main. Les variantes sont appliquées en mémoire seulement, puis tout est remis comme avant.
- Rapport : par condition, images, i/s, images > 20 ms par minute (avec l'écart entre blocs), > 33, > 50, p95, calcul du jeu. Puis 4 comparaisons (T1/T0 caméra fixe, T1/T0 caméra mobile, T2/T0 caméra mobile, caméra mobile/fixe) : rapport ×, marge d'incertitude à 95 %, et verdict « démontré » ou non. On y lit aussi la batterie (en charge ou non) et le maintien de l'écran, relevé au début.

**Puissance attendue**, d'après les mesures précédentes : environ 26 images lentes par condition en caméra fixe et environ 195 en caméra mobile. Un effet de moitié en caméra fixe est à la limite du démontrable ; si besoin, on passe à 6 tours (≈ 10 min).

**Vérifié** : 67 tests de logique (durée 430 s, même temps de mesure par condition, ordre alterné, marche continue sur l'aller-retour, calcul de la marge) ; 35 tests navigateur, dont un test rapide court complet (rayon de devant bien invisible pendant B-T2, réglages remis, rien d'enregistré).

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

---

# Annexe : enquête sur la fluidité (séances 11 à 26)

> Déplacé depuis docs/SUIVI.md (séance 29) sans changement, pour garder le suivi court. Les titres sont descendus d'un niveau.

### Points techniques à corriger (en attente des tests T0–T2)
| Constat | Source | État |
|---|---|---|
| Le personnage est redessiné pixel par pixel à chaque image, même immobile (respiration, rebond, retournement appliqués à un élément sans calque propre) | Comptages du navigateur de test (organisation du rendu) | 👀 Séance 14 : **réfuté comme cause sur le téléphone**. « Réduire les animations » n'améliore rien en marche (caméra fixe ×1,50, marge 0,91–2,46 ; caméra mobile ×1,30, marge 1,06–1,60). Pas prioritaire. Effet à l'arrêt non mesuré. |
| La poussière est redessinée à chaque image tant qu'elle est visible | Comptages du navigateur de test | 👀 Même conclusion (testée avec les animations dans T1) |
| Rayon de premier plan transparent : très coûteux quand la caméra bouge | **Téléphone**, test rapide 11f9d39 | ✅ Démontré : l'enlever divise par 2,2 les images lentes en caméra mobile (×0,45, marge 0,34–0,59 ; images > 33 ms : 11 → 2). Décision de l'auteur attendue (aspect visuel). |
| Rayons lointains dessinés sur toute une bande (3600×470) alors qu'on ne les voit que par deux ouvertures | Lecture du code + surface dessinée dans le navigateur de test | ❌ Séance 16 : **optimisation rejetée**. T3 sur le téléphone : caméra mobile ×1,30 d'images lentes (marge 1,05–1,59, blocs sans chevauchement), images > 33 ms 10 → 20. Code revenu à 1543360 (commit 859e158). |
| Observation (non traitée) : fond de page et calque de l'interface comptent pour environ 1,36 écran de surface dessinée par image (navigateur de test) | Journal du moteur | ❓ À étudier plus tard, seulement avec l'accord de l'auteur |
| Pics rares de calcul du jeu (14 à 22 ms, objectif ≤ 8 ms) | Téléphone | 🔧 Cause inconnue, à étudier séparément |
| Le rapport affiche toujours « écran maintenu allumé : non » : le maintien est relâché avant d'écrire le rapport (erreur du rapport, pas forcément du maintien) | Lecture du code | 🔧 Petite correction du rapport, à faire avec l'accord de l'auteur |

### Investigation de la caméra (séance 16, sans modification)
| Piste | Confiance | Test proposé |
|---|---|---|
| La caméra oblige à recomposer tout l'écran à chaque image | Démontré (×5,7 à ×6,3) | — |
| Le rayon de devant (opacité 0,55, parallaxe 1,25, boîte de 4300×1080 pour une image de 300 px de haut) | Démontré qu'il pèse ; quelle propriété : inconnu | Variantes : opaque / 0,55 / invisible ; boîte ajustée à l'image |
| Effet non linéaire (fréquence de la carte graphique, rythme du pipeline) : T1 et T3 retirent du travail et dégradent tous deux d'environ ×1,3 | Faible à moyenne | Traçage sur le téléphone |
| Nombre de calques qui bougent | Faible | Variante « parallaxe coupée » |
| Surface cachée (fond de page, bande lointaine sous le décor) | Faible (T3 ne l'a pas confirmée, mais T3 ajoutait aussi deux calques) | Variante « sans rayons lointains » |
| Calcul, mise en page, redessin, ménage mémoire | Écarté (mesures) | — |

### Appareil de référence et conditions de test
- OPPO Reno2 (CPH1907), Qualcomm SDM730G (Snapdragon 730G), Android 11, ColorOS 11.1, 8 Go de RAM. Le navigateur annonce « Android 10 » : c'est normal, Chrome fige cette information.
- Séance 17 : l'auteur active le **mode haute performance** et l'**extension de RAM** (8 Go + 3 Go pris sur le stockage), puis redémarre. Les tests suivants sont donc faits dans des conditions différentes des précédents (séances 10 à 16, mode normal).

### Résultat clé (séances 17 et 18)
| Test rapide, caméra mobile (B-T0) | Images > 20 ms/min | > 33 ms | Calcul pire |
|---|---|---|---|
| Mode normal, avant redémarrage (séances 14, 16) | 137,6 et 132,6 | 11 et 10 | 17,5 et 13,9 ms |
| Haute performance, après redémarrage + extension de RAM (séance 17) | 0,8 | 0 | 4,3 ms |
| **Mode normal, après redémarrage + extension de RAM (séance 18)** | **10,0** | **0** | **5,8 ms** |

- **En mode normal, après le redémarrage, les trois objectifs sont atteints** (60,8 i/s, aucune image > 33 ms, calcul ≤ 8 ms). Il reste environ 10 images ratées par minute quand la caméra bouge (0,3 % des images).
- Le mode haute performance n'explique qu'une petite partie (10 → 0,8). L'essentiel du gain (≈ 130 → 10) vient d'un autre changement : redémarrage (le plus probable), extension de RAM, ou état du téléphone avant redémarrage. Non démontré.
- « Réduire les animations » dégrade la caméra mobile en mode normal (×2,42, démontré ; ×1,30 en séance 14), mais pas en haute performance. Cela va dans le sens d'un effet de la gestion d'énergie : moins de travail, fréquence plus basse.
- Les mesures des séances 10 à 16 ont probablement été prises dans un état dégradé du téléphone : leurs valeurs absolues sont à relativiser.
- **PixiJS non justifié. Aucune optimisation nécessaire pour atteindre les objectifs dans l'état actuel.**

### Campagne de vérification (séance 19, téléphone dans son état actuel)
Demandée par l'auteur : refaire T1, T2, T3 dans l'état actuel (après redémarrage), et séparer les deux effets de l'ancien T3. Tout en caméra mobile, variantes alternées, 6 tours (≈ 15 min), rien de changé dans le jeu.
| Variante | Rayons lointains | Isole |
|---|---|---|
| T0 | bande entière (jeu) | référence |
| T1 | — | animations réduites |
| T2 | — | rayon de devant invisible |
| F0 | aucun (diagnostic) | surface en moins (et un calque en moins), sans calque ajouté |
| F1 | 2 fenêtres en calques à part | ancien T3 |
| F2 | bande + 2 fenêtres en calques à part | coût de 2 calques ajoutés, surface inchangée |
| F3 | 2 fenêtres dessinées dans le décor | surface en moins sans calque ajouté, mais décor redessiné aux ouvertures à chaque mouvement |
État : ✅ faite (séance 20). Résultats ci-dessous ; A2 pas encore validée.

**Résultats (aa84366, mode normal, débranché 42 → 37 %, plein écran)** — images > 20 ms par minute (blocs min–max) / > 33 ms / > 50 ms :
T0 101,8 (70–143) / 3 / 0 · T1 120,1 / 4 / 0 · **T2 32,2 (20–43) / 0 / 0** · **F0 66,2 (53–93) / 3 / 0** · F1 143,4 / 18 / 6 · F2 136,8 / 16 / 6 · F3 125,6 / 41 / 21.
- Démontré : rayon de devant invisible ×0,32 ; sans rayons lointains ×0,65 ; deux calques ajoutés ×1,34 ; ancien T3 ×1,41 (confirmé) ; fenêtres dessinées dans le décor ×1,23, avec beaucoup d'images > 33 et > 50 ms.
- Non démontré : animations (×1,18, marge 0,97–1,44) ; retirer la bande quand les fenêtres existent (×1,05).
- **La dégradation de l'ancien T3 venait des deux calques ajoutés, pas de la réduction de surface.**
- **L'état du téléphone est revenu dégradé** (T0 ≈ 100/min contre 10/min 1 h 30 plus tôt) : le redémarrage n'est pas une solution durable.

### Campagne « rayon de devant » (séance 21)
Choix de l'auteur : variantes A (T0, T2, G1, G4, G2) ; retrait du code des variantes F1 à F3 ; indice de vitesse du téléphone ajouté aux rapports.
| Variante | Ce qui change | Visible ? | Navigateur de test (organisation) |
|---|---|---|---|
| T0 | rien | — | calque 4300×1080, 3,39 écrans dessinés/image |
| T2 | rayon de devant invisible | oui (test) | — |
| G1 | calque réduit à la taille de l'image | **non** (même image vérifiée) | calque 4300×300, 3,37 écrans |
| G4 | comme G1, moitié de hauteur | oui (un peu) | calque 4300×150, 3,23 écrans |
| G2 | rayon de devant opaque | oui | 3,38 écrans |
Prévisions (non démontrées) : opacité 0,35 ou 0,20 ≈ 0,55 en coût (écartées) ; parallaxe moins forte sans effet (G3 retirée) ; intégrer le rayon au décor impossible (il passe devant le personnage).
**Résultats (séance 23, 18874a6, batterie 25 → 22 %, vitesse du téléphone 4,3 ms au début comme à la fin)** — images > 20 ms par minute : T0 85,1 · T2 31,7 · G1 92,9 · G4 63,4 · G2 93,4.
- Démontré : T2 ×0,37 (troisième fois) ; **G4 (moitié de hauteur) contre G1 ×0,68** : la surface dessinée du rayon de devant compte.
- Non démontré : G1 ×1,09 (réduire la boîte du calque n'aide pas) ; G2 ×1,10 (la transparence n'est pas ce qui coûte).
- Constat : par pixel d'écran, le rayon de devant coûte bien plus cher que la bande des rayons lointains. Cause inconnue ; pistes : il glisse plus vite (×1,25) et doit faire dessiner plus vite les morceaux qui apparaissent ; il est dessiné en dernier, par-dessus le personnage.
- Ma prévision « parallaxe sans effet » est donc remise en question.

**Campagne n° 2 (séance 24)** : choix de l'auteur A. Variantes T0, G4 (moitié haute), G3 (glisse à la vitesse du sol) ; 8 tours (≈ 8 min 30, 144 s par variante). G5 (« image directe ») abandonnée avant mesure : le navigateur de test montre que l'image reste redessinée par morceaux (≈ 14/s, contre ≈ 15/s en T0), donc elle ne testerait rien. Constat du navigateur de test : le rayon de devant est redessiné par morceaux pendant que la caméra bouge (≈ 15/s ; ≈ 4/s pour la moitié haute). **Résultats (séance 25, 00fd429, batterie 57 → 55 %, indice de vitesse 4,1 → 4,3 ms : téléphone « en bon état » selon la règle)** — images > 20 ms/min : T0 98,0 (87–110), > 33 ms : 7 · G4 68,8 (57–83), > 33 ms : 3, > 50 ms : 1 · G3 128,9 (103–157), > 33 ms : 15.
- Démontré et reproduit : moitié haute ×0,70 (0,58–0,86) ; deuxième fois après ×0,68.
- Démontré : glisser à la vitesse du sol **dégrade** (×1,31, 1,11–1,56). L'hypothèse « il coûte parce qu'il glisse plus vite » est réfutée.
- Objectifs, téléphone en bon état : **non atteints**, ni en T0 (59,3 i/s, 7 images > 33 ms, calcul pire 13,8 ms) ni en G4.

**Décision de l'auteur sur l'objectif « aucune image > 33 ms »** : le garder, mais le juger avec le téléphone en bon état (batterie > 50 %, indice de vitesse comparable). Inscrit dans CLAUDE.md.
