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

---

> Rapports plus anciens : `docs/journal/anciens-rapports.md` (déplacés tels quels à la séance 51).

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

**Vérifié** : 172 tests de logique (dont 5 nouveaux pour la boucle et 1 pour l'index des règles), Knip. Aucun code de jeu modifié. Écarts aux nouvelles règles : `SUIVI.md` (séance 64).

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

## Séance 61 — 16/11/2026 — Un seul mécanisme de poses ; règle « un personnage = un calque »

**Demande de l'auteur** : l'agent clignote encore. Son diagnostic : le héros a un seul calque et ses poses sont cachées ou montrées à l'intérieur ; l'agent (séance 60) avait un calque par pose, que Chrome ne prépare pas quand il est invisible. Corriger avec le même code que le héros, remplacer l'essai, écrire la règle. Et le demi-tour du héros seulement après la fin de la bulle de l'agent.

**Fait** :
- **`scene/poses.js`** : un seul mécanisme de poses pour tous les personnages (le héros l'utilise, l'agent aussi). Une image par pose, à l'intérieur du conteneur, une seule visible (`hidden`), sans calque propre.
- **Trouvé en mesurant** : la boîte de l'agent n'avait pas de taille, et le navigateur donnait alors **un calque à chaque pose**. C'était probablement déjà la cause à la séance 59. Elle a maintenant la taille du dessin, comme le héros : 0 calque de pose.
- **Essai remplacé** : pendant la scène de l'agent (le héros marche, l'agent lève puis baisse le bras), aucun changement de pose ne crée de calque ni n'en change, pour le héros comme pour l'agent. L'essai de la séance 60 (« zéro redessin ») est retiré : il visait le mauvais objectif.
- **Règle écrite** (décision de l'auteur) dans `docs/ARCHITECTURE.md` §4 et `src/scene/CLAUDE.md`.
- Le héros fait demi-tour **une fois la bulle « Stop ! » fermée**.

**Vérifié** : 166 tests de logique, Knip, 86 essais navigateur (PC et téléphone simulé), sans erreur console.

**À vérifier par l'auteur** : le clignotement sur le téléphone. S'il a disparu, l'auteur valide.

---

## Séance 60 — 16/11/2026 — Agent : plus de clignotement à la bulle ; héros immobile ; bulle de 3 s

**Demande de l'auteur** : l'agent clignote quand sa bulle apparaît et quand elle disparaît ; le héros ne doit pas bouger tant que la bulle est ouverte ; la bulle se ferme seule au bout de 3 s.

**Fait** :
- **Clignotement** : à chaque changement de pose (bras levé pendant la bulle), l'image de l'agent était redessinée. Chaque pose a maintenant son propre calque, qui reste ; on passe de l'une à l'autre par l'opacité, sans rien redessiner.
  - L'essai automatique compte maintenant les redessins de l'agent et des portiques (0) en plus des changements de calque.
  - Vérifié : avec l'ancienne façon de faire, l'essai échoue.
- **Héros immobile** tant que l'agent parle : clavier et manette l'étaient déjà ; le toucher et le clic aussi maintenant.
- **Bulle de l'agent fermée seule au bout de 3 s** (⚙ → Narrateur). Ses répliques s'écrivent assez vite (en 1,2 s au plus) pour être lues avant.

**Vérifié** : 166 tests de logique, Knip, 86 essais navigateur (PC et téléphone simulé), sans erreur console.

**À vérifier par l'auteur** : le clignotement sur le téléphone ; si 3 s suffisent pour lire la première phrase (longue).

---
