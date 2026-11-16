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

## Séance 57 — 16/11/2026 — Le hall refait en profondeur, d'après l'image de référence

**Demande de l'auteur** : refondre le hall en vraie 2.5D avec une ambiance pluvieuse, et un agent qui interpelle le héros, le fige et le repousse. Image de référence fournie en cours de séance.

**Corrections signalées** :
- Pas de « Canvas » : interdit par les règles et changement de technique. Tout est en dessins SVG, calques et animations CSS légères.
- Le flou du parking est dessiné dans l'image : le flou CSS est interdit.
- La logique de l'agent est dans `src/core/guard.js`, pas dans `src/core/places.js`.

**Jouable maintenant** :
- Le héros commence **à droite** d'une **barrière de 4 portiques en diagonale**, rangés en profondeur : le héros passe devant ou derrière chacun. Il ne passe jamais à gauche.
- À gauche, un **mur vitré de côté, en perspective**. Derrière, un parking de nuit : arbres et voitures flous, lampadaire avec son halo, flaques. Il glisse moins vite que le mur (parallaxe).
- **La pluie** : deux voiles de gouttes (devant rapide et pâle, derrière plus lent), du ruissellement, des ronds dans les flaques. **Le tapis d'entrée** noir, mouillé, suit le mur, avec un reflet qui glisse.
- **L'agent**, redessiné dans le style du héros (grosse tête, contour épais), longe la barrière pour faire face au héros.
  - Quand le héros va vers la gauche, l'agent lève le bras et parle dans **une bulle au-dessus de lui** : « Vous ne pouvez pas ressortir par ici !… » [TEMP]. Le héros est **figé** le temps de la bulle. Puis le héros pense « Hum… étrange… ».
  - S'il force contre les portiques, l'agent le **repousse d'un petit pas** vers la droite.
- Premier plan : une plante en pot et une file de caddies. Panneau d'affichage, caméras au plafond.

**Vérifié** :
- 166 tests de logique et Knip.
- 85 essais navigateur sur PC et téléphone simulé, sans erreur console. Nouvel essai de l'agent : interpellation, bulle, héros figé, poussée, jamais à gauche, retour au poste.
- Comptages du hall : 83 éléments, 4 calques, 38 images, 4,5 Mpx, rien créé en jeu. Le rayon est inchangé. Mémoire stable après 5 allers-retours.

**À vérifier par l'auteur** : la fluidité dans le hall sur le téléphone (pluie, parallaxe ; DBG), et le ressenti de la poussée.

**Décisions prises seul** (détails) :
- L'opacité du premier plan du hall est réglable : ⚙ → Affichage.
- Le texte de la bulle de l'agent est droit et centré.
- Le panneau d'affichage est placé du côté de l'agent.

**Suite proposée** : vos réponses aux questions (hôtesse, « !! », pensée), puis la validation d'A6.

---
