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

## Séance 56 — 16/11/2026 — A6 (3/3) : l'agent de sécurité, les portiques, la pluie derrière les vitres

**Demande de l'auteur** : « 1,a. 2, oui. 3, Oui. 4, … la petite animation de pluie au niveau des baies vitrées. » On peut toujours entrer dans le rayon sans Scanette (A). Mesurer les comptages du hall et proposer des limites. Faire A6 (3/3). Ajouter la pluie.

**Jouable maintenant** :
- Dans le hall, un **agent de sécurité** (forme provisoire, uniforme bleu marine) attend près des portes. Quand le héros va vers le fond, du côté des portiques, l'agent se place devant **le portique le plus proche** et suit le héros d'un portique à l'autre. Le héros ne passe pas.
- À la première tentative, le haut-parleur annonce « Les sorties sont réservées aux clients ayant réglé leurs achats. » [TEMP]. Le héros pense ensuite « Hum… étrange… » [TEMP], dans une bulle, sans mise en scène.
- Quand le héros s'éloigne, l'agent retourne à son poste. Après un retour, une nouvelle tentative fait revenir l'annonce, au plus une fois toutes les 25 s.
- Les portiques sont un **obstacle**, comme un présentoir : le héros les contourne ou glisse le long, sans saut. Il les longe vers le présentoir sans déclencher l'annonce : seule une poussée vers le fond (clavier, manette) ou un toucher sur les portiques compte comme une tentative.
- **De la pluie** tombe derrière les portes vitrées : deux voiles de traits en biais, à deux vitesses. Elle s'arrête avec « réduire les animations ».

**Vérifié** :
- Tests de logique : 167 (dont 8 nouveaux pour l'agent), avec Knip.
- Tests navigateur sur PC et en téléphone simulé, sans erreur console : nouveau test A6 (l'agent va au portique du milieu, le héros est retenu, l'annonce puis la pensée, le retour au poste).
- Captures `a6-pc-agent.png` et `a6-telephone-agent.png`.
- Comptages du rayon inchangés. Hall mesuré pour la première fois (voir les limites proposées). Mémoire stable après 5 allers-retours.

**À vérifier par l'auteur** :
- sur le téléphone, la fluidité dans le hall avec la pluie (DBG) ;
- si l'agent se voit assez derrière le héros ;
- au doigt, un toucher sur un portique.

**Décisions prises seul** (détails) :
- L'obstacle des portiques avance un peu dans le hall, pour que l'agent ne soit pas caché par le héros. On ne peut donc plus longer le mur du fond des portes jusqu'au présentoir : on passe devant les portiques. Deux essais du présentoir ont été adaptés en conséquence.
- Si le héros fonce aux portiques pendant l'accueil du haut-parleur, la pensée « Hum… étrange… » peut être sautée (l'accueil et ses pensées passent avant).
- L'agent est un peu plus grand que le héros.
- Sa vitesse est réglable : ⚙ → Marche → « Agent de sécurité : vitesse ».
- La pluie figée du décor est remplacée par la pluie animée.
- L'ordre devant/derrière entre l'agent et le héros se fait sans déplacer d'élément dans la page (le comptage l'a demandé).

**Suite proposée** : faire valider A6 (après votre test), puis A7.

---

## Séance 55 — 16/11/2026 — A6 (2/3) : la partie commence dans le hall, le présentoir y est

**Demande de l'auteur** : « Reprends là où tu en étais » → option recommandée, A6 (2/3).

**Jouable maintenant** :
- Après l'intro, le héros apparaît dans le **hall d'accueil**, près des portes vitrées. Le haut-parleur l'accueille (le hall a deux haut-parleurs).
- Le **présentoir de Scanettes et de paniers** est dans le hall, entre les portiques et le comptoir. Le hall a été agrandi (2 800 px).
- Le rayon n'a plus de présentoir : un panneau « ← ACCUEIL » sur le mur et la flèche au sol.
- Près du passage « RAYONS → » sans Scanette : le haut-parleur le rappelle. On peut quand même entrer, comme avant.

**Vérifié** :
- 159 tests de logique et Knip.
- 82 tests navigateur PC et téléphone simulé, sans erreur console. Les tests du présentoir se jouent dans le hall : prendre la Scanette puis le panier ; au doigt ; puis passage au rayon, scan refusé sans Scanette, pensée sans panier.
- Comptages du rayon inchangés.
- Captures du hall et du début du rayon.

**À vérifier par l'auteur** : sur le téléphone, le début de partie (intro → hall), le temps du changement de lieu (rapport DBG).

**Décisions prises seul** :
- Les points de départ « équipés » (⚙ → Départ) commencent dans le rayon, là où l'on teste le scan. Nouveau lien `?lieu=rayon-essai` pour commencer directement dans le rayon.
- Les objets déjà portés ne sont plus à prendre au présentoir.

**Suite proposée** : A6 (3/3), l'agent de sécurité qui vient se placer devant le portique visé, l'annonce d'interdiction, la pensée « Hum… étrange… ».

---

## Séance 54 — 16/11/2026 — Knip, puis découpage de main.js en 3 étapes

**Décisions de l'auteur** : Knip accepté (1.a) ; exception de taille pour `style.css` (2.a) ; découpage de `main.js` en 3 étapes (3 : ok).

**Fait** (aucun changement pour le joueur) :
- **Knip** installé. Sa liste : 4 fonctions marquées « partagées » pour rien (`createCard`, `PLAYER`, `patrol`, `buildCard`), aucun code mort. Liste vidée, puis Knip ajouté à `npm test`.
- **Découpage de `main.js`**, un commit par étape, tests complets à chaque fois :
  1. `src/debug/measure.js` (DBG, banc d'essai, test rapide) et `src/debug/departs.js` (points de départ) ;
  2. `src/game/places.js` (gestionnaire de lieux : charger, quitter, sorties, fondu) ;
  3. `src/game/voices.js` (haut-parleur, pensées, apartés, rencontre, choix du nom, tournis).
- `main.js` : 1 370 → **932 lignes**. C'est plus que les 600 annoncées : j'avais sous-estimé ce qui reste (règles de scan et de panier plein, traitement des commandes, fonctions de test).

**Vérifié** :
- À chaque étape : 159 tests de logique et Knip ; 82 tests navigateur PC et téléphone simulé, sans erreur console.
- Comptages du rayon identiques (84 éléments, 38 images).
- Mémoire identique après 5 allers-retours (3 077 éléments).
- Une erreur attrapée par les tests à l'étape 1 (la caméra passée trop tôt à l'outil de mesure), corrigée avant publication.

**À vérifier par l'auteur** : banc d'essai sur le téléphone, avant (`74cb80b`) et après, s'il le souhaite. Le code a été déplacé, pas changé.

**Suite proposée** : reprendre A6 (2/3), le présentoir déplacé dans le hall et le départ à l'accueil. La suite du découpage de `main.js` peut attendre.

---
