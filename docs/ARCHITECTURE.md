# Architecture technique

> Comment le jeu est construit **aujourd'hui**, et les règles techniques à respecter.
> Les règles du jeu sont dans `docs/VISION.md` et les documents de conception (liste et quand les lire : `CLAUDE.md`) ; le plan dans `docs/PROTOTYPES.md` ; les règles de travail dans `CLAUDE.md`.
> **Économie de lecture** : lire le résumé (§1) et seulement la section utile à la tâche.
> État vérifié dans le code le 14/11/2026 (séance 29). Repères : ✅ décision de l'auteur · 🔎 constaté dans le code · ⏳ prévu, pas construit.

## 1. Résumé (à lire à chaque fois)

- **Trois couches, sens unique** : `src/core/` (logique pure, sans page web, testée sous Node) ← `scene/`, `ui/`, `input/`, `audio/` (affichage, entrées, son) ← `src/main.js` (assemblage, boucle, rendu).
- **Rendu** en éléments de page (DOM + CSS), seulement `transform` et `opacity` animés. Canevas **au chargement** seulement.
- **Une boucle**, logique à **pas fixe** (60 Hz), délais liés au temps de jeu (jamais `setTimeout`), une **seule machine à états**.
- **Toutes** les valeurs réglables dans `src/config.js` et le panneau ⚙ ; tout le contenu en JSON dans `src/data/`.
- **Rien n'est créé pendant le jeu** (éléments, images, canevas) ; tout est préparé au chargement.
- Aucune dépendance au jeu ; outils de développement : Vite, Vitest, Playwright ✅. Aucun appel réseau.
- Une logique de jeu, même petite, va dans `core/` avec ses tests.
- Ne rien construire « pour plus tard » ✅ ; un fichier d'environ 300 lignes est un **repère** : découper quand il mélange plusieurs rôles ✅.

## 2. Dossiers 🔎

| Dossier | Rôle |
|---|---|
| `src/core/` | Logique pure : `state` (machine à états), `stepper` (pas fixe), `walkmask`, `pathfinding`, `movement` (marche), `scan` (scanner, double toucher), `cards` (cartes, Panier), `narrator` (les deux voix — haut-parleur et apartés du héros : quand parler, priorités, enchaînements, machine à écrire, inactivité ; sans hasard). **Diagnostic seulement** : `bench`, `quicktest`. |
| `src/scene/` | Scène et calques (`stage`), `camera`, `projection` (monde → scène), `depth` (ordre d'affichage), `character` + `animation` (personnage), `props` (objets du décor), `products` (produits, effets du scan), `dust`, `assets` (préparation des images), `targetMarker`, `debugMask` |
| `src/ui/` | `hud` (boutons, aide, pause), `settings` (panneau ⚙), `cards` (cartes, Panier, carte qui vole), `narrator` (bande du haut-parleur, bulle du héros qui le suit). **Diagnostic seulement** : `diagnostic`, `bench`, `quicktest`, `speedindex` |
| `src/input/` | `keyboard`, `pointer` (souris et doigt, double toucher), `gamepad` → `input` (une intention de déplacement + des actions abstraites) |
| `src/audio/` | `audio` (seul accès au son : bus, volumes, sons synthétisés), `music` (musique jouée depuis un JSON) |
| `src/data/` | `places/rayon-essai.json` (lieu : images, calques, zone de marche, objets, produits, parcours de mesure), `characters/heros.json`, `products.json`, `narrator.json` (moments et répliques), `music/` |
| `src/config.js` | Valeurs réglables, liste des réglages du panneau, profils de marche |
| `public/art/placeholder/` | Dessins provisoires (SVG), à remplacer sans changer le code |
| `tests/unit/` · `tests/e2e/` | Vitest (logique, données) · Playwright (PC et téléphone simulé, comptages) |

## 3. Boucle, temps et états 🔎

- `requestAnimationFrame` → `stepper` avance la logique par pas fixes, l'affichage interpole entre deux pas.
- États : `loading`, `play`, `pause`, `menu`, `bench`, `panier` (`core/state.js`, passages autorisés listés). Une nouvelle fenêtre **déclare un état** ✅. Sous un menu, la scène n'est pas redessinée.
- Délais (scan…) : comptés en pas de jeu, donc figés en pause. Seule exception : le délai du double toucher (geste du joueur, temps réel).
- La logique renvoie de petits événements (ex. `stepScan` → `'bip'`) que `main.js` traduit en son et affichage. Pas de bus d'événements : inutile à cette taille.

## 4. Monde, profondeur, rendu ✅🔎

- **Coordonnées du monde** (x le long du rayon, z la profondeur) séparées de la **scène** (1080 px de haut, largeur du lieu). `projection` : y = sol − z ; taille = 1 − z × perte par profondeur.
- **Trois systèmes indépendants** ✅ : position (`core/movement`), projection (`scene/projection`), animation (`scene/character`, `animation`).
- **Calques déclarés** dans le lieu (`contains`, `hiddenBy`), parallaxe par calque. Objets contournables : **point de référence de profondeur** (`depthRef`) → ordre d'affichage.
- **Les objets que l'on contourne ont leur propre calque en permanence** (`.props-layered .prop`) : sinon le navigateur les change de calque quand le personnage passe derrière et ils clignotent (mesuré, séance 27). Vérifié par le test des comptages (`propLayerSwitches = 0`).
- Caméra : toute la hauteur toujours visible, un écran plus allongé montre plus de largeur (séance 6, validé séance 7). *Remplace le choix « remplir / tout montrer » du plan initial.*
- Images : SVG préparés **une fois au chargement** à la taille d'affichage (densité plafonnée, réglable), décodés avant l'affichage. Animations décrites dans les données (1 image comme 10).
- Pas de `filter`, flou ou grande ombre CSS sur ce qui bouge ✅.

## 5. Entrées, son, données 🔎

- Entrées → **actions abstraites** (`action`, `back`, `pause`, `panier`, `settings`…) et une intention de déplacement ; le reste du jeu ne lit jamais une touche. Manette : disposition standard, **pas encore testée sur une vraie manette**.
- Son : Web Audio, tout synthétisé (aucun fichier son), débloqué au premier geste, coupé en arrière-plan.
- Réglages modifiés gardés dans le navigateur (`localStorage`, seulement par `ui/settings.js`). **Pas de sauvegarde de partie** (pas encore de besoin).
- Textes venant des données insérés avec `textContent` ; `innerHTML` seulement pour du balisage fixe.
- Les données se citent entre elles : `tests/unit/data.test.js` vérifie que chaque référence existe.

## 6. Vérifications 🔎

- `npm test` : logique et données (Vitest, sous Node). `npm run test:e2e` : navigateur, tailles PC et téléphone simulé (Oppo Reno 2, 20:9), **aucune erreur ni alerte console**.
- **Test des comptages** (`tests/e2e/comptages.spec.js`, limites dans `comptages-limites.json`) : éléments, calques, images, surface affichée, éléments et canevas créés en jeu, lectures de pixels, bascules de calque des objets. Une limite ne se relève qu'avec l'accord de l'auteur.
- Publication (`.github/workflows/deploy.yml`) : tous les tests, puis GitHub Pages. Un test qui échoue bloque la publication.
- Le navigateur de test n'a pas de carte graphique : **ses temps ne décident rien**. Seul le téléphone compte (CLAUDE.md, « Fluidité »).

## 7. Outils de mesure (diagnostic seulement) 🔎

Ils ne changent rien au jeu normal. Aujourd'hui (≈ 20 % du code) :

| Outil | Fichiers | Statut |
|---|---|---|
| Diagnostic DBG (F3), rapport copiable | `ui/diagnostic.js` | Exigé par CLAUDE.md |
| Banc d'essai + interrupteurs d'essai | `core/bench.js`, `ui/bench.js` | Exigé par CLAUDE.md |
| Test rapide (variantes alternées, verdict) | `core/quicktest.js`, `ui/quicktest.js`, `ui/speedindex.js` | Sert à comparer deux versions sur le téléphone |
| Campagne « rayon de devant » (`DEVANT2`), `stage.setLayerVariant` | `core/quicktest.js`, `scene/stage.js` | Enquête close (séance 26). **Gardée jusqu'à ce qu'on revoie le rayon de devant** (décision de l'auteur, séance 30). |
| Fonctions d'essai `window.paperCart` | `main.js` | Présentes aussi en ligne (utiles au diagnostic et aux tests), sans danger |

Le diagnostic en 4 configurations a été retiré (séance 30, décision de l'auteur) : le test rapide le remplace.

## 8. Points connus à reprendre (quand on y travaille)

- `src/main.js` (≈ 590 lignes) mélange l'assemblage, le rendu et le branchement des outils de mesure : à découper (par exemple `src/debug/`) à la prochaine séance qui le touche beaucoup.
- Les chaînes de texte créées à chaque image pour placer les éléments sont un coût accepté du rendu en éléments de page (calcul mesuré : 0,67 ms par image en moyenne sur le téléphone).
- Les dessins provisoires SVG ont été produits par des scripts non gardés : ils seront remplacés par ceux de l'auteur (prototype D).

## 9. Prévu, pas encore construit ⏳

Suite du narrateur (A4 : finitions, réglages complets, vérification de fluidité) · étape caddie (A5) · combat (B) · vieillissement des cartes · découverte (C) · `docs/IMAGES.md` et l'outil de conversion `tools/` (avant le prototype D) · **générateur de hasard à graine dans `core/`** (dès que le jeu tire au hasard ✅) · **file de travail lourd avec budget par image** (dès qu'un travail lourd apparaît en jeu ✅) · lieux chargés à la demande (dès le deuxième lieu ✅).

## 10. Héritage de Maxi-Gouffre

`docs/archive/maxi-gouffre-ARCHITECTURE.md` est une **réserve d'idées, pas une référence**.
- **Repris** (déjà en place) : logique pure séparée, contenu en JSON, réglages centralisés, actions abstraites, un seul accès au son, aucune dépendance au jeu ni appel réseau, `textContent` pour les textes, erreurs visibles, tests qui bloquent la publication.
- **Adapté** : canevas permis au chargement (pas d'interdiction absolue) ; Vite au lieu de « pas de bundler » ; réglages modifiables en jouant (pas de constantes gelées) ; scène qui s'adapte à toute forme d'écran (pas de profils fixes) ; repère de 300 lignes, pas une règle.
- **Pas repris** : branches, demandes de fusion et étiquettes par jalon (ici : travail direct sur `main`) ; Store, EventBus, Session, copie de l'état à chaque action (trop lourds pour une boucle à 60 Hz sur téléphone) ; modèle de combat, cartes à 3 stades nommés, campagne, sauvegarde, Android (Capacitor) et feuille de route : **règles ou projets de l'ancien jeu, à ne pas appliquer sans décision de l'auteur**.
- **Idées en réserve, à reconsidérer le moment venu** : choix des répliques du narrateur par une fonction pure (A4) ; scénarios de débogage et simulation de combats (B) ; sauvegarde par un seul module avec version des données (quand une partie se sauvegardera).
