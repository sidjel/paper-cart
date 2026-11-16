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

## Séance 59 — 16/11/2026 — Hall : la cause du clignotement, l'agent refait

**Demande de l'auteur** : l'agent et les portiques clignotent encore (éteindre la pluie ne change rien). L'agent ne se déplace qu'une fois au début (du côté au milieu), un peu plus en retrait. Si le héros force : « Stop ! De l'autre côté je vous ai dit ! », et le héros fait demi-tour de quelques pas.

**Mesures (navigateur de test, des comptages et non des temps)** :
- L'agent **gagnait et perdait son calque graphique** à chaque changement de pose : ses deux images étaient montrées et cachées tour à tour. C'est la cause déjà connue des clignotements du rayon (séance 27).
- Son niveau d'affichage changeait 7 fois en 5 s, **à égalité avec un portique** à chaque fois.

**Fait** :
- Les deux poses de l'agent sont dans une seule boîte, qui garde son calque.
- L'agent ne change plus de profondeur : il est rangé avec les portiques, sans égalité de niveau.
- Nouvel essai automatique : pendant toute la scène de l'agent, ni l'agent ni les portiques ne changent de calque (0 mesuré).
- L'agent va une fois, au début, du côté au milieu, à 200 px en retrait de la barrière ; il ne bouge plus.
- Première tentative : l'interpellation (héros figé, « !! »). Ensuite : « Stop ! De l'autre côté, je vous ai dit ! » [TEMP] et le héros fait demi-tour d'environ 170 px. Au plus une fois toutes les 1,5 s.

**Vérifié** : 165 tests de logique, Knip, 86 essais navigateur (PC et téléphone simulé), sans erreur console.

**À vérifier par l'auteur** : le clignotement sur le téléphone. L'essai prouve que les calques ne bougent plus, mais seul le téléphone dit si c'était toute la cause.

---

## Séance 58 — 16/11/2026 — Hall : clignotements, pluie, haut de la vitre ; le « !! » du héros

**Demande de l'auteur** : corriger le clignotement des personnages et des portiques, la pluie qui bascule de côté, le haut du mur vitré mal couvert. Réponses : hôtesse plus tard (1 B), « !! » oui (2 A), pensée gardée (3 A).

**Fait** :
- **Haut de la vitre** : le plafond était dessiné par-dessus. Il est maintenant découpé le long du mur de côté.
- **Pluie** : elle était sur le calque du dehors, qui glisse moins vite que le mur. Elle a maintenant son propre calque, qui suit le mur.
- **Clignotement** : sur ta capture, des morceaux du fond manquaient aussi (des Scanettes). C'est le signe d'une mémoire graphique saturée. Le dehors et la pluie réservaient chacun une surface grande comme tout le hall ; ils sont réduits à la taille de leur contenu. Surface totale : 13,8 → 10,5 millions de pixels (le rayon : 14,2). Cause **probable, pas prouvée** : seul le téléphone le dira.
- Nouveau réglage ⚙ → Affichage → « Pluie animée du hall », pour vérifier la cause si ça clignote encore.
- Le héros **sursaute** quand l'agent l'interpelle : « !! » et gouttes de sueur.

**Vérifié** : 166 tests de logique, Knip, 85 essais navigateur (PC et téléphone simulé), sans erreur console. Captures du haut de la vitre en téléphone simulé.

**À vérifier par l'auteur** : le clignotement sur le téléphone. S'il reste, éteindre la pluie dans ⚙ et dire si ça change.

---
