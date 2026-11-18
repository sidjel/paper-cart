# Journal des séances

Le rapport le plus récent est en haut. Les étapes validées par l'auteur y sont inscrites avec leur commit (points de retour sûrs).

## Étapes validées

| Étape | Commit | Date |
|---|---|---|
| A1 — le personnage est agréable à déplacer | `1445d25` (« A1 validée : 1445d25 ») | 12/11/2026 |
| A2 — le personnage semble évoluer dans un décor profond | `6be7130` (« A2 validée : 6be7130 ») — rayon de devant gardé entier, fluidité acceptée en l'état (choix C de l'auteur) | 13/11/2026 |
| A3 — scanner un produit est satisfaisant | `630fec0` (« A3 validée : 630fec0 ») — avec le double toucher et la fin du clignotement ; l'histoire du scanner, des cartes et du Panier reste à écrire | 13/11/2026 |
| A4 — le narrateur, les apartés et la première rencontre | `c32eedd` (« A4 validée : c32eedd ») — dernière version avant le début d'A6 | 15/11/2026 |
| A5 — Scanette et panier à main | `c32eedd` (« A5 validée : c32eedd ») — dernière version avant le début d'A6 | 15/11/2026 |
| A6 — l'accueil (hall, agent de sécurité, portiques, pluie) | `379f554` (« A6 validée : 379f554 ») — **validation temporaire, sur le principe** : l'auteur y reviendra | 17/11/2026 |
| A7 — le deuxième rayon (deux passages, arrivée du bon côté, échange d'une carte venue de l'autre rayon) | `215dd8f` (« A7 validée : 215dd8f ») — **validation provisoire** (l'auteur la testera plus tard) ; dernière version avant la séance des entrées | 18/11/2026 |

---

> Rapports plus anciens : `docs/journal/anciens-rapports.md` (déplacés tels quels à la séance 51).

## Séance 73 — 18/11/2026 — Le chariot redéfini

**Demandes de l'auteur** :
- ce que disent les documents sur le chariot (trop peu précis) ;
- quatre décisions : le nom « chariot » ; poussé par le héros ; persistant d'une pièce à l'autre et en papier 2D ; panier ou chariot, jamais les deux ;
- il doit avoir une vraie utilité et être fun.

**Fait** (`fea623b`) :
- « Caddie » devient « chariot » partout : textes du jeu, données, code, documents. Le journal et l'archive gardent l'ancien mot.
- Les décisions sont notées dans `docs/GAME_DESIGN.md` (section « Le Chariot »). L'essai de la séance 72 (le chariot qui suit derrière) est marqué abandonné ; son code sera remplacé par le chariot poussé.

**Conflit relevé** : « persistant quand il change de pièce » (séance 73) contre « il ne suit pas d'un lieu à l'autre, il reste garé » (séance 50). Question posée.

**Vérifié** : 205 tests de logique, Knip ; 84 essais navigateur (A1, A8, départs, comptages), sans erreur.

**Proposition pour la séance suivante** : le chariot poussé (1/3), selon les réponses.

---

## Séance 72 — 18/11/2026 — A8 (1/3) : le caddie qui suit

**Demande de l'auteur** : séance suivante. Rappel donné : tester A7 et les commandes sur PC.

**Fait** (`9a78d12`) :
- **Le caddie roule derrière le héros, sur son chemin.** Il passe là où le héros est passé et contourne les présentoirs avec lui ; il ne le bloque jamais.
- **Garer / Reprendre** : le bouton d'action, quand rien n'est à scanner ni à prendre (Entrée, A, ou le bouton au doigt).
- **Il ne change pas de lieu** : en partant, il reste garé là où il était, et on le retrouve au retour.
- Le menu s'appelle « Caddie » (0/12). Image : le caddie du décor, vidé.
- Ordre d'affichage : le héros et le caddie passent l'un devant l'autre selon leur profondeur.
- Pour l'instant, on l'obtient seulement par le **départ de test « caddie »** (dernier de la liste).
- Réglages : ⚙ › Caddie (capacité, distance de suivi, souplesse, portée pour garer, taille).

**Décisions prises seul** (détails) :
- garer avec le bouton d'action, le scan passant avant ;
- distance de suivi 140 px ;
- taille 0,8 ;
- l'icône du bouton reste le panier rouge.

**Vérifié** : 205 tests de logique, dont 6 nouveaux (le suivi sur le chemin, le demi-tour, garer et reprendre, la capacité) ; Knip. 116 essais navigateur (PC et téléphone simulé), dont 2 nouveaux : il suit, se gare, reste garé, se reprend ; il reste dans le rayon quand on va dans le hall. Comptages dans les limites, aucune erreur console. **Pas vérifié** : la fluidité sur le téléphone (une image de plus qui bouge).

**À vérifier par l'auteur** : le départ « caddie ». Le suivi est-il agréable (distance, souplesse) ? Garer et reprendre se trouvent-ils facilement ?

**Proposition pour la séance suivante** : A8 (2/3), le jeton et l'échange au comptoir, selon les réponses.

---

## Séance 71 — 18/11/2026 — Gestes du navigateur ; l'écran d'erreur passe le relais

**Demandes de l'auteur** : régler les gestes du navigateur selon le choix A ; l'écran d'erreur passe le relais à l'écran de fondu (règle de `docs/ARCHITECTURE.md` §11).

**Fait** (`1d84610`) :
- **Gestes du navigateur** : rien à changer dans le jeu (zoom déjà bloqué partout). Un garde-fou vérifie maintenant à chaque `npm test` que le zoom reste bloqué, que tirer l'écran ne recharge pas et que la zone de jeu ignore les gestes.
- **Écran d'erreur** (« Impossible de charger ce lieu · Réessayer ») :
  - à l'appui, le noir des changements de lieu est remis, plein, dessous ;
  - l'écran d'erreur reste devant pendant le chargement et n'est retiré que le lieu prêt ;
  - la scène se dévoile ensuite comme après un changement de lieu, au lieu d'apparaître d'un coup ;
  - un double appui ne lance qu'un essai.
- L'écran « Le jeu n'a pas pu démarrer » n'est pas concerné : il n'a rien dessous et pas de sortie.

**Vérifié** : 199 tests de logique et Knip ; 114 essais navigateur (PC et téléphone simulé), sans erreur console. L'essai « Réessayer » contrôle qu'au retrait de l'écran d'erreur, le noir est déjà plein dessous ; il échoue sans la correction. **Pas vérifiable ici** : l'absence de clignotement à l'œil. L'écran n'apparaît que si le chargement du lieu échoue deux fois, donc presque jamais en jouant.

**À vérifier par l'auteur** : rien de neuf à l'écran. **Rappel** : tester A7 et les commandes (séance 70) sur PC, avec une manette si possible.

**Proposition pour la séance suivante** : après ce test sur PC, valider définitivement A7 ou noter tes retours.

---

## Séance 70 — 18/11/2026 — A7 validée ; séance des entrées

**Demandes de l'auteur** : valider A7, puis la séance des entrées.

**Fait** :
- **A7 validée** : `215dd8f` (JOURNAL, PROTOTYPES, SUIVI) (`57bd0a4`).
- **Aides qui suivent l'appareil** : clavier et souris, doigt ou manette. L'aide du bas, l'écran Pause et la touche indiquée sur « Scanner » (« Entrée » ou « A ») changent dès qu'on se sert d'un autre appareil.
- **Rien de « collé »** : quand le jeu perd le focus ou la page (changement d'onglet, appel), tout est relâché. Au retour, il faut un nouveau geste : une touche gardée enfoncée ne refait plus marcher le héros ; la manette doit revenir au repos, y compris au branchement.
- **Manette débranchée → pause**, si c'est celle qu'on utilisait.
- Commit : `a5a393a`.

**Pas fait, en attente de l'auteur** : gestes du navigateur seulement dans la zone de jeu (question ci-dessous).

**Vérifié** : 198 tests de logique et Knip ; 114 essais navigateur (PC et téléphone simulé), dont 4 nouveaux avec une **manette simulée** (le stick fait marcher, Start met en pause, un bouton tenu au branchement ne fait rien, la manette débranchée met en pause) et 1 au clavier. Ce dernier échoue si l'on retire la correction. Captures PC et téléphone simulé, aucune erreur console. **Pas vérifié ici** : une vraie manette, un vrai téléphone.

**À vérifier par l'auteur** : avec une vraie manette sur PC, brancher, marcher, scanner (A), Panier (Y), Start, puis débrancher en marchant (→ pause). Sur PC, changer de fenêtre en gardant une flèche enfoncée : au retour, le héros reste arrêté.

**Décisions prises seul** (détails) : textes des aides manette ; le clavier et la souris partagent les mêmes aides.

**Réponses de l'auteur** : zoom bloqué partout (choix A, règle adaptée) ; pousser sur `main` (choix 1) ; A7 validée provisoirement ; tests sur PC plus tard (**à lui rappeler**).

**Proposition pour la séance suivante** : l'écran d'erreur qui passe le relais à l'écran de fondu.

---

## Séance 69 — 18/11/2026 — Règles v3 ; bulle de 6 s au plus

**Demandes de l'auteur** : compléter les règles de la séance 64 avec les nouveautés v3 (documentation seulement) ; clignotement du début validé sur son téléphone ; durée maximum des bulles : choix A (6 s).

**Fait** :
- Règles (`a699216`) : conflits entre règles (`CLAUDE.md`), écran de fondu unique (`docs/ARCHITECTURE.md` §11), précisions scène, entrées, interface (`docs/GAME_DESIGN.md`), sauvegarde (§13), profils (§14), leçons. Aucune contradiction trouvée.
- Bulle qui se ferme seule : 6 s au plus (`narrator.timedMax`, ⚙ › Narrateur) (`afa1c12`).
- SUIVI : clignotement ✅ ; écarts entre règles et code notés (zoom bloqué sur toute la page, écran d'erreur sans relais, sauvegarde pas encore construite).

**Vérifié** : tests automatiques (198) et tests dans le navigateur (PC et téléphone simulé, 107) verts. Rien de visible ne change aujourd'hui (répliques courtes). À vérifier par l'auteur : rien de neuf.

**Proposition pour la séance suivante** : validation d'A7 (rayon 2, passages, échange de carte), puis la séance des entrées (manette, gestes du navigateur seulement dans la zone de jeu).

Lien : https://sidjel.github.io/paper-cart/?v=afa1c12

---

## Séance 68 — 18/11/2026 — Rayon 2 au doigt ; écran titre ; le clignotement du début enfin expliqué

**Demandes de l'auteur** :
- A7 : ouvertures et panneaux, Départ « Rayon 2 », « Départ » sur l'écran titre (mode dev), plus de passage involontaire en longeant l'étagère, passage au doigt.
- Le héros et la bande du haut-parleur qui clignotent au tout début.

**Fait (A7, écran titre)** :
- Le sol se prolonge dans les ouvertures et le passage est au fond : longer l'étagère ne fait plus changer de rayon.
- Toucher une ouverture envoie au passage.
- Ouvertures visibles dans le rayon de devant du rayon 2, et panneaux au-dessus des passages.
- Liste des départs au centre de l'écran titre, défilante.

**Le clignotement du début** :
- Mes trois premières corrections (noir prolongé, préchauffage des poses, calques des bulles) visaient une mauvaise cause : sans effet sur le téléphone.
- À la demande de l'auteur, une **investigation différentielle sans rien modifier**. Mesure : la fin du fondu de l'intro et le premier clignement des yeux tombent à moins de 0,5 s l'un de l'autre, donc on ne pouvait pas les distinguer à l'œil. Tests proposés, un seul changement chacun.
- **Test G de l'auteur : intro désactivée → plus de clignotement.** Cause prouvée : l'écran noir de l'intro, retiré de la page à la fin de son fondu.
- **Correction (choix 1)** : l'écran noir des changements de lieu, qui ne fait pas clignoter, prend le relais, déjà plein. L'écran de l'intro est retiré dessous, 2 images plus tard, puis le noir s'efface comme après un changement de lieu.
- **Ménage (choix A)** : noir prolongé et préchauffage retirés ; calques permanents des bulles gardés.
- La leçon est corrigée (ARCHITECTURE §15).

**Vérifié** : 197 tests de logique, Knip, 107 essais navigateur. Nouvel essai sur toute la fin de l'intro : seuls le noir des lieux (arrivée, puis départ une fois transparent) et l'écran de l'intro (retiré dessous) changent de calque.

**À vérifier par l'auteur** : le début de partie, intro passée et intro vue en entier.

---

## Séance 67 — 17/11/2026 — Bulles selon le texte, signe d'attente ; A6 validée (temporairement) ; A7 le rayon 2

**Demandes de l'auteur** : continuer (bulles, chargements) ; valider A6 « temporairement, sur le principe » ; lancer A7.

**Fait** :
- **Bulles qui se ferment seules** : leur durée suit le texte (2,5 s + 50 ms par lettre). Validé par l'auteur.
- **Signe d'attente** : trois points de papier dans le noir au-delà de 0,3 s de chargement. Validé par l'auteur.
- **A6** inscrite comme validée temporairement (`379f554`).
- **A7 (1/2)** : le **rayon 2** (« Rayon 8, entretien », décor provisoire, 6 produits) est juste derrière l'étagère du rayon 7. Les deux ouvertures déjà dessinées dans cette étagère sont les **deux passages**. On arrive en face, côté avant du rayon 2 (flèches « RAYON 7 » au sol), et l'on revient au même endroit.
- **A7 (2/2)** : panier plein, une carte venue de l'autre rayon est reposée. Son produit prend la place du produit scanné, sur ce rayon-ci (règle de la séance 63). Son image est préparée et décodée pendant le choix de la carte.

**Décision prise seul** (détail) : utiliser les deux ouvertures existantes de l'étagère du rayon 7 comme passages.

**Vérifié** : 194 tests de logique, Knip, 101 essais navigateur (PC et téléphone simulé), sans erreur console. Nouveaux essais : passer par l'ouverture en marchant et revenir ; l'autre ouverture ; l'échange avec une carte du rayon 2. Comptages du rayon 2 mesurés (66 éléments, 35 images, 5,4 Mpx, rien créé en jeu).

**À vérifier par l'auteur** : A7 sur le téléphone. Les passages se trouvent-ils facilement ? Arrive-t-on bien « du bon côté » ? La fluidité dans le rayon 2 ?

---

## Séances 65-66 — 17/11/2026 — Chantier son ; profils de qualité (étape 1)

**Demandes de l'auteur** : la séance B (le chantier son, puis les profils) ; des bruits gênants signalés en jouant.

**Fait (son)** :
- **Mesure** : compteurs dans le diagnostic (nœuds actifs, sons joués, les plus joués, derniers sons, position de la musique, changements d'état, sons coupés) et « Essai son long ».
- **Correction n° 1** : chaque son libère ses nœuds à sa fin. Confirmé sur le téléphone : 3 et 31 nœuds actifs, contre 1 975 et 5 549 avant.
- **Correction n° 2** : reprise au geste après une interruption.
- **Correction n° 3** : sons courts préparés une fois au démarrage.
- **Correction n° 4** : nombre maximum de sons par famille.
- **Bruits gênants** :
  - le **shaker** de la musique : retiré (trouvé par l'auteur avec les interrupteurs d'instruments) ;
  - le **froissement** des pensées et des réponses du joueur : interrupteur « Froissement », désactivé ;
  - le réglage « Apartés du héros » est remplacé par « Bip du héros » et « Froissement » ;
  - les bips du héros sont espacés (≈ 5 par seconde) et adoucis ;
  - le joueur reste sans bip (choix de l'auteur).

**Fait (profils, étape 1)** : Léger, Normal, Fin, au choix dans les options. « Fin » par défaut, l'affichage d'avant. Sur le téléphone simulé, Léger divise par 4 la mémoire d'images (0,9 contre 3,8 millions de pixels) et éteint la pluie.

**Vérifié** : 190 tests de logique, Knip, 94 essais navigateur (PC et téléphone simulé), sans erreur console. Comptages inchangés en « Fin ».

**À vérifier par l'auteur** :
- l'écoute du son, 5 minutes ;
- le banc d'essai du hall et du rayon dans les trois profils, sur le téléphone et, si possible, sur le PC i3. Ces résultats serviront à caler le choix automatique (étape 2).

---

## Séance 64 — 17/11/2026 — Règles professionnelles (séance A : documentation et vérifications)

**Demande de l'auteur** : fichier SEANCE_REGLES. Séance A seulement : inscrire les règles, vérifier les entrées et la boucle, proposer les profils, noter le combat et les images. Pas de tablette (PC et smartphone).

**Règles inscrites, et où** (chacune à un seul endroit ; index dans `CLAUDE.md`) :
- Affichage, parallaxe, lumière et ombres → `src/scene/CLAUDE.md` (résumé : ARCHITECTURE §4 ; direction de lumière : DIRECTION_ARTISTIQUE).
- Boucle de jeu → ARCHITECTURE §3, avec un test : 60, 90, 120 et 144 Hz, et rattrapage limité.
- Entrées → `src/input/CLAUDE.md`.
- Son → `src/audio/CLAUDE.md` (vue d'ensemble : ARCHITECTURE §12).
- Sauvegarde → ARCHITECTURE §13, pour plus tard.
- Appareils → ARCHITECTURE §14 et `CLAUDE.md` (Fluidité).
- Menus, dialogues, chargements, game design → GAME_DESIGN (code : `src/ui/CLAUDE.md` ; chargements, technique : ARCHITECTURE §11).
- Méthode (un bug = un test + une leçon ; interrupteurs d'essai) → `CLAUDE.md`. Leçons des bugs passés → ARCHITECTURE §15.
- Index « Où sont les règles » → `CLAUDE.md`, vérifié par un test. La relecture (`audit`) vérifie « lire la page avant de la modifier ».

**Règles ajustées (avec la raison)** :
- « 44 px réels » → **44 px CSS** : 44 pixels physiques ne feraient que 15 px CSS sur un écran de densité 3, trop petit pour un doigt.
- Touche maintenue : pas de répétition d'action, **sauf pour se déplacer dans une liste ou un menu** (sinon il faudrait appuyer une fois par ligne).
- Préchauffage : il sert au décodage des images. Un élément caché perd son calque, donc seul un calque qui reste en place reste prêt (d'où la règle « un calque par élément animé »).
- « Jamais de changement d'image en jeu » : appliqué aux personnages et objets de la scène. Les cartes, qui montrent le produit scanné, sont notées comme écart à mesurer.
- « Une règle à un seul endroit » : les règles de code sont dans le `CLAUDE.md` du dossier (lu automatiquement) ; `ARCHITECTURE.md` les résume et y renvoie.
- La bulle de l'agent (3 s, séance 60) suit désormais la règle générale (durée selon le texte). Le code est à changer.

**Vérifié** : 177 tests de logique (dont 5 nouveaux pour la boucle et 1 pour l’index des règles), Knip. Aucun code de jeu modifié. Écarts aux nouvelles règles : `SUIVI.md` (séance 64).

**Suite** : séance B, le chantier son, puis les profils validés.

---

## Séance 63 — 16/11/2026 — Reposer une carte (décision) ; moins de créations pendant le jeu

**Demande de l'auteur** :
- Point 5 : une carte **abandonnée** retourne dans son lieu et à sa place d'origine ; une carte **échangée** voit son produit remplacé sur le rayon de l'échange, comme aujourd'hui.
- Point 6 : « on corrige si ce n'est pas risqué ».

**Fait** :
- Décisions inscrites (GAME_DESIGN). L'abandon n'existe pas encore dans le jeu. L'échange d'une carte venue d'un autre lieu se construira avec A7 : aujourd'hui seul le rayon a des produits.
- **Texte du haut-parleur** : la machine à écrire change le contenu de deux morceaux de texte préparés, au lieu d'en créer à chaque lettre (~230 par réplique avant).
- **Carte qui vole vers le Panier** : préparée une fois et remplie à chaque scan, au lieu d'être construite au moment où elle s'envole.
- **Textes et symbole de stade des cartes** : mis à jour sur place (les trois symboles sont dessinés d'avance).
- **Nouvel essai** : pendant un scan, seule la petite carte du Panier est créée (1 élément).

**Non corrigé (plus risqué)** : la petite carte du Panier, ajoutée à chaque scan dans le panneau caché. Il faudrait des cases préparées d'avance, ce qui touche la liste, les onglets et le choix au clavier. Coût faible : le panneau est caché, rien n'est dessiné.

**Vérifié** : 171 tests de logique, Knip, 92 essais navigateur (PC et téléphone simulé), sans erreur console. Capture du Panier : la carte et son symbole de stade s'affichent bien.

---
