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

---

> Rapports plus anciens : `docs/journal/anciens-rapports.md` (déplacés tels quels à la séance 51).

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

## Séance 62 — 16/11/2026 — Robustesse des changements de lieu

**Demande de l'auteur** : 7 points (fichier SEANCE_ROBUSTESSE), un commit par point, avant A7. Rien de visible quand tout va bien, jamais d'écran noir bloqué.

**Fait** :
1. **Un lieu qui ne se charge pas** : retour au lieu de départ, le héros là où il est sorti (cette sortie est ignorée tant qu'il n'en est pas ressorti). Annonce [TEMP] « Cher Client, ce rayon est momentanément inaccessible. Merci de votre compréhension. », et l'erreur est notée au diagnostic (F3). Si même le lieu de départ échoue : écran « Réessayer » (doigt, souris, Entrée, manette A), qui ramène au jeu. L'état « transition » se termine toujours.
2. **`loadImages`** libère ce qu'il avait préparé (mémoire, adresses temporaires, compteurs) avant de relancer l'erreur. Test unitaire : un échec à la 3ᵉ image.
3. **L'historique des temps d'image** repart de zéro à chaque lieu ; le diagnostic l'indique. Vérifié dans le test de mémoire.
4. **La règle d'échange du panier** est dans `core/world.js` (`planSwap`, `applySwap`), sans changer le comportement. Tests.
5. Une question pour l'auteur (ci-dessous).
6. Une mesure, sans correction (ci-dessous).
7. **Test de mémoire** : il existait ; ajout du cas avec un échec de chargement au milieu des 5 allers-retours. Images, pixels et écouteurs reviennent exactement au départ ; +12 éléments de page (marge : 30).

**Vérifié** : 171 tests de logique, Knip, 91 essais navigateur (PC et téléphone simulé). Nouveaux essais avec une image bloquée (retour au hall ; écran « Réessayer »).

**Point 6 (mesuré dans le navigateur de test, sans correction)** : oui, il y a un vrai écart à la règle « rien n'est créé pendant le jeu ».
- À chaque scan, **2 cartes sont construites** : la petite carte du Panier (dans le panneau caché) et la carte qui vole vers le Panier (visible). Cela fait environ 28 éléments.
- Le texte du haut-parleur **remplace ses morceaux de texte à chaque lettre** (~230 par réplique). Ce ne sont pas des éléments, mais du travail pour le ramasse-miettes.
- Le test des comptages ne le voit pas : le banc d'essai ne scanne pas.
- Coût probable : faible pour la carte cachée ; la carte qui vole est construite au moment où elle part, d'où un risque de petit à-coup. À mesurer sur le téléphone (DBG pendant un scan) avant toute correction.

**Point 5, à trancher** : voir les options dans la réponse de la séance et dans SUIVI.

---
