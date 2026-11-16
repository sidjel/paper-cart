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

## Séance 53 — 16/11/2026 — Remise en ordre (2/2) : des garde-fous qui se vérifient tout seuls

**Décisions de l'auteur** : VISION.md modifié (direction visuelle → renvoi à DIRECTION_ARTISTIQUE.md) ; flou optionnel gardé, seule exception (choix A) ; les 59 points 👀 : « je te laisse trancher ».

**Fait** :
- **Les 59 points 👀** :
  - 53 validés (étapes validées A1 à A5, ou acceptés ensuite) → archive ;
  - 3 à mesurer sur le téléphone (temps de chargement, latence du son) → 🔧 ;
  - 3 restent 👀 avec A6.
- **Garde-fous dans `npm test`** (`tests/unit/regles.test.js`) :
  - fichiers de `src/` de 600 lignes au plus, sauf exceptions datées : `main.js` approuvé, `style.css` en attente d'accord ;
  - `src/core/` sans `setTimeout`, `setInterval`, `Math.random`, `document`, `window` ;
  - CSS sans `filter`, `backdrop-filter` ni `blur`, sauf `.veil-blur` ;
  - chaque chemin cité dans les documents existe (sauf documents prévus : `docs/IMAGES.md`, `tools/`).
  - Vérifié en y glissant des erreurs volontaires (retirées) : elles sont attrapées.
- **Mémoire après les changements de lieu** (test des comptages) : 5 allers-retours rayon ↔ accueil → éléments de page, écouteurs, mémoire JS et images reviennent au niveau de départ.
  - **Une vraie fuite trouvée et corrigée** : chaque changement de lieu gardait environ 58 éléments en mémoire. Cause : le navigateur gardait chaque image d'un lieu quitté inscrite pour suivre la taille de l'écran, et avec elle tout l'ancien décor.
  - Correction : en quittant un lieu, les images perdent leur source. Après correction : 3 077 éléments avant, 3 077 après.
- **Sécurités de Claude Code** (`.claude/settings.json` + `.claude/hooks/garde-git.mjs`, testé) :
  - push forcé, `reset --hard`, `rebase`, `commit --amend`, `filter-branch` bloqués, où que soit l'option dans la commande ;
  - accord demandé avant de modifier `docs/VISION.md` ou `tests/e2e/comptages-limites.json`, y compris par une commande.
- **Skill `audit`** : relecteur à froid en lecture seule, lancé par l'auteur à la fin d'une étape importante.

**Pas fait (accord nécessaire)** : Knip (nouvelle dépendance) ; découpage de `main.js` (proposé, en attente).

**Vérifié** :
- 159 tests de logique ; 82 tests navigateur PC et téléphone simulé, sans erreur console ; comptages du rayon inchangés.
- Aucun changement visible pour le joueur, hors la fuite corrigée.

---

## Séance 52 — 15/11/2026 — Remise en ordre (1/2) : la documentation

**Demande de l'auteur** : A4 et A5 validées ; puis séance 1 de remise en ordre (documents seulement, un commit par point).

**Fait** :
- **A4 et A5 validées : `c32eedd`** (dernière version avant le début d'A6), inscrites dans le tableau ci-dessus et dans PROTOTYPES.md.
- `ARCHITECTURE.md` : état vérifié séance 51 ; modules et données ajoutés ; taille réelle de `main.js` (1 370 lignes) ; §9 nettoyé ; §11 = état réel des lieux.
- `HISTOIRE.md` : accueil « en construction (A6) » ; première rencontre résumée en 2 lignes (79 lignes au total, aucune décision perdue).
- `REGLES_CARTES_COMBAT.md` : ❓ « 12 cartes en combat » contre la capacité du panier, à régler avant B.
- `DIRECTION_ARTISTIQUE.md` : reçoit, mot pour mot, le détail du style de `VISION.md`. **`VISION.md` pas encore modifié : en attente de l'accord de l'auteur.**
- `SUIVI.md` : section « Ouvert » seule, et liste numérotée des 59 points 👀 à trancher ; les points ✅ sont dans `SUIVI-archive.md` (tels quels).
- `JOURNAL.md` : tableau des étapes validées et 5 derniers rapports ; les anciens dans `docs/journal/anciens-rapports.md` (tels quels).
- `CLAUDE.md` : 68 lignes (au lieu de 84), carte des documents rangée par sujet.
- Skills `.claude/skills/` : `fin-seance`, `valider` et `mesures`, avec le texte déplacé mot pour mot.
- `src/core/CLAUDE.md` et `src/scene/CLAUDE.md` : règles propres à ces dossiers.

**Le flou réel des bords pendant la rencontre** :
- Il est **désactivé par défaut** (`narrator.veilBlur = 0` ; à 0, l'élément flou est retiré de l'affichage, donc il ne coûte rien).
- Réglable de 0 à 16 px dans ⚙ → Narrateur.
- Activé, il recalcule le flou de tout l'écran derrière le voile à chaque image, pendant toute la rencontre (zoom, vagues) : c'est le plus coûteux des effets du jeu. Coût jamais mesuré sur le téléphone.
- Autre `filter` présent : luminosité / contraste (Accessibilité), seulement si on les change. Décision de l'auteur attendue.

**Vérifié** : aucun code de jeu modifié ; 151 tests de logique verts ; chaque ligne de tableau du suivi retrouvée (165 lignes de tableau avant, toutes présentes après, dans SUIVI ou SUIVI-archive).

---
