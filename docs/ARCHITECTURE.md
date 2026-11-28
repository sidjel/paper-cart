# Architecture technique

> Comment le jeu est construit **aujourd'hui**, et les règles techniques à respecter.
> Les règles du jeu sont dans `docs/VISION.md` et les documents de conception (liste et quand les lire : `CLAUDE.md`) ; le plan dans `docs/PROTOTYPES.md` ; les règles de travail dans `CLAUDE.md`.
> **Économie de lecture** : lire le résumé (§1) et seulement la section utile à la tâche.
> État vérifié dans le code le 25/11/2026 (séance 80). Repères : ✅ décision de l'auteur · 🔎 constaté dans le code · ⏳ prévu, pas construit.

## 1. Résumé (à lire à chaque fois)

- **Trois couches, sens unique** : `src/core/` (logique pure, sans page web, testée sous Node) ← `scene/`, `ui/`, `input/`, `audio/` (affichage, entrées, son) ← `src/main.js` avec `src/game/` et `src/debug/` (assemblage, boucle, rendu).
- **Rendu** : scène en **PixiJS v8** (`src/scene/renderer.js`, WebGL sur PC et smartphone, repli `CanvasRenderer` propre sans WebGPU en CI), interface (HUD, menus, dialogues, Panier) en HTML/CSS au-dessus de `#game`. Canevas 2D **au chargement** seulement (redimensionnement/SVG → `ImageBitmap`, textures d'ombre au démarrage).
- **Une boucle**, logique à **pas fixe** (60 Hz), délais liés au temps de jeu (jamais `setTimeout`), une **seule machine à états**.
- **Toutes** les valeurs réglables dans `src/config.js` et le panneau ⚙ ; tout le contenu en JSON dans `src/data/`.
- **Rien n'est créé pendant le jeu** (éléments, images, canevas, textures) ; tout est préparé au chargement. *Exception connue, à corriger : les cartes créées au moment du scan (audit séance 50, point 8).*
- Dépendance de rendu unique : `pixi.js` v8 ; outils de développement : Vite, Vitest, Playwright, Knip ✅. Aucun appel réseau.
- Une logique de jeu, même petite, va dans `core/` avec ses tests.
- Ne rien construire « pour plus tard » ✅ ; un fichier d'environ 300 lignes est un **repère** : découper quand il mélange plusieurs rôles ✅.

## 2. Dossiers 🔎

| Dossier | Rôle |
|---|---|
| `src/core/` | Logique pure : `state` (machine à états), `stepper` (pas fixe), `walkmask`, `pathfinding`, `movement` (marche), `direction` (8 directions et pivot), `scan` (scanner, double toucher), `cards` (cartes, Panier), `gear` (Scanette, panier, chariot, capacité), `chariot` (chariot poussé, roue folle, portée), `pile` (pile de cartons), `guard` (agent de sécurité), `hotesse` (hôtesse d'accueil, 10 slogans, échange PQ → jeton → chariot), `world` (état du monde par lieu), `focus` (qui a la main), `places` (sorties, transitions, préchargement voisins), `occlusion` (transparence du premier plan), `clouds` et `birds` (nuages, oiseaux volants/marcheurs, cris de corbeaux), `profiles` (profils de qualité), `treadmill` (studio de test libre), `intro`, `names`, `dizzy`, `narrator`. **Diagnostic seulement** : `bench`, `quicktest`, `departs`. |
| `src/scene/` | `renderer` (PixiJS v8 `Application`, `['webgl', 'canvas']`, `worldRoot`, `dissolveLayer`, `backstage`), `placeView` (vue complète d'un lieu), `stage` (scène, conteneurs de plans, parallaxe), `camera`, `projection`, `depth`, `character` + `animation` + `paperFlip` + `poses` (héros origami 8 directions, Paper Flip 2.5D GPU `MeshPlane`), `props`, `products`, `clouds`, `birds`, `dust`, `speakers`, `assets` (chargement parallèle → `Texture`/`ImageSource`, plafond `<= 4096 px`, `ImageBitmap`), `quality`, `targetMarker`, `debugMask`, `debugPerspective` |
| `src/ui/` | `hud`, `settings` (panneau ⚙ dev), `cards` (cartes, Panier, carte volante), `itemReveal` (fiche découverte d'objet clé, 2 colonnes paysage, vol vers HUD, anti-faux-clic, aides selon appareil), `narrator`, `aside`, `journal`, `title`, `playerOptions`, `confirm`, `intro`, `namePicker`, `dizzyStars`, `treadmill` (barre studio de test). **Diagnostic seulement** : `diagnostic`, `bench`, `quicktest`, `speedindex` |
| `src/game/` | Assemblage par sujet : `places`, `voices`, `guard`, `hotesse`, `chariot`, `pile`. Chacun reçoit un objet `game` qui liste ce qu'il a le droit de voir et de faire. |
| `src/debug/` | **Diagnostic seulement** : `measure` (DBG, banc d'essai, test rapide), `departs` (points de départ). |
| `src/input/` | `keyboard`, `pointer` (souris et doigt, double toucher), `gamepad` → `input` (une intention de déplacement + des actions abstraites) |
| `src/audio/` | `audio` (seul accès au son : bus, volumes, bruitages provisoires préparés) et `samples` (échantillons CC0 : musique supermarché, pluie d'intro, corbeaux, bip Scanette ; aucune musique générée par le navigateur) |
| `src/data/` | `places/` (`accueil.json`, `rayon-essai.json`, `rayon-2.json`, `salle-test.json`), `characters/` (`heros-test.json`, `hotesse.json`), `products.json`, `objects.json` (objets clés et modes d'emploi par appareil), `narrator.json`, `intro.json`, `joueur.json`, `departs.json`, `aide-reglages.json` |
| `src/config.js` | Valeurs réglables, liste des réglages du panneau, profils de marche |
| `public/art/` · `public/audio/` | Visuels origami HD (`.webp`), dessins provisoires restants (`placeholder/*.svg`), fichiers audio CC0 (`.mp3`) |
| `tools/` | Outils de préparation versionnés (`video_to_sprites.ps1` : extraction vidéo FFmpeg + contrôle anti-doublon ; sources lourdes `.kra` hors Git dans `_assets_stock/`) |
| `tests/unit/` · `tests/e2e/` | Vitest (logique, données, garde-fous) · Playwright (PC et téléphone simulé, comptages) |

## 3. Boucle, temps et états 🔎

- `requestAnimationFrame` → `stepper` avance la logique par pas fixes, l'affichage interpole entre deux pas.
- **Règles de la boucle** ✅ (séance 64, vérifiées par `tests/unit/core.test.js`) :
  - un **nombre maximum de pas de rattrapage** par image (`loop.maxStepsPerFrame`) : si l'appareil rame (onglet repris, téléphone chaud), le jeu ralentit un instant au lieu de se figer ou de sauter ;
  - un écran à 90, 120 ou 144 Hz ne change pas la vitesse du jeu, et le mouvement reste régulier grâce à l'interpolation entre deux pas (testé : même distance par seconde, chaque image avance de la même longueur).
- États : `loading`, `title` (écran titre), `options` (options du joueur), `intro` (texte sur noir après « Commencer » : `core/intro`, `ui/intro`, `data/intro.json`), `play`, `transition` (changement de lieu), `pause`, `menu`, `bench`, `panier` (`core/state.js`, passages autorisés listés). Une nouvelle fenêtre **déclare un état** ✅. Ce qui s'ouvre **dans** un état (question Oui / Non, grande carte, choix du nom, conversation) est arbitré par une seule règle : `core/focus.js` (« qui a la main ? »). Sous un menu, la scène n'est pas redessinée.
- Délais (scan…) : comptés en pas de jeu, donc figés en pause. Exceptions, en temps réel (gestes du joueur dans l'interface) : le délai du double toucher, et les courtes protections contre un double appui (grande carte du Panier, choix du nom).
- La logique renvoie de petits événements (ex. `stepScan` → `'bip'`) que `main.js` traduit en son et affichage. Pas de bus d'événements : inutile à cette taille.

## 4. Monde, profondeur, rendu ✅🔎

- **Coordonnées du monde** (x le long du rayon, z la profondeur) séparées de la **scène** (1080 px de haut, largeur du lieu). `projection` : y = sol − z ; taille = 1 − z × perte par profondeur.
- **Trois systèmes indépendants** ✅ : position (`core/movement`), projection (`scene/projection`), animation (`scene/character`, `animation`).
- **Calques déclarés** dans le lieu (`contains`, `hiddenBy`), parallaxe par calque. Objets contournables : **point de référence de profondeur** (`depthRef`) → ordre d'affichage.
- **Règles d'affichage, de parallaxe, de lumière et d'ombres** ✅ (décisions de l'auteur, migrées sur PixiJS v8) : **`src/scene/CLAUDE.md`** (écrites là seulement). En résumé : un seul `<canvas>` PixiJS (`preference: ['webgl', 'canvas']`, `autoStart: false`) ; toutes les textures, `Sprite`, `MeshPlane` (`autoResize = false`) et `Graphics` préparés au chargement et libérés en quittant le lieu (`texture.destroy(true)` + `bitmap.close()`) ; zéro `tint !== 0xffffff` sous `CanvasRenderer`, zéro `Filter` ni shader custom ; poses échangées via `poses.js` ; tri en profondeur numérique sur `acteurs.sortableChildren = true` ; fondu enchaîné par `RenderTexture` capturant `worldRoot` (à l'identité) et détruite dès la fin du fondu. Pourquoi : leçons du §15.
- Vérifié par le test des comptages (`tests/e2e/comptages.spec.js`, limites dans `tests/e2e/comptages-limites.json`) : nœuds du graphe PixiJS (`stageNodes`), sprites visibles (`visibleSprites`), zéro `<canvas>` créé en jeu (`canvasesInPlay === 0`), zéro lecture pixel (`pixelReads === 0`), zéro `RenderTexture` restante (`renderTextures === 0`) et stabilité mémoire après 5 allers-retours.
- Caméra : toute la hauteur toujours visible, un écran plus allongé montre plus de largeur (séance 6, validé séance 7). *Remplace le choix « remplir / tout montrer » du plan initial.*
- **Dimensions, proportions et résolution des lieux ✅ (séance 80, contrôlées par `tests/unit/data.test.js`)** :
  - hauteur de scène visible fixe : **`1 080 px`** (`size[1]` ou `viewHeight`) ;
  - largeur minimale obligatoire d'un lieu : **`2 400 px`** (écrans 20:9 comme l'Oppo Reno 2 sans bandes noires), **recommandée ≥ `2 560 px`** (couvre aussi 21:9 + laisse une marge de caméra) ; tous les lieux respectent désormais cette règle (`accueil` élargi à `2 600 px` en séance 81) ;
  - plans parallaxe (`dehors`/`lointain`, `premier-plan`) dimensionnés pour couvrir toute la course caméra sans bord vide ;
  - plafond matériel GPU : **≤ `4 096 px`** sur un côté pour une image unique ; sprites de personnage à cadre et point d'appui aux pieds identiques sur toutes les poses.
- Images : bitmaps `.webp` utilisés directement lorsqu'ils sont proches de la résolution utile (`assets.js`), SVG et images trop grandes préparés **une fois au chargement**, décodés avant affichage puis repassés en `decoding = 'sync'` (anti-clignotement à froid). Animations décrites dans les données (1 image comme 16).
- **Direction de la lumière** : chaque lieu la note dans ses données et dans `docs/DIRECTION_ARTISTIQUE.md`, pour que dessins et ombres restent cohérents (❓ à définir par l'auteur pour le hall et le rayon).

## 5. Entrées, son, données 🔎

- Entrées → **actions abstraites** (`action`, `back`, `pause`, `panier`, `settings`…) et une intention de déplacement ; le reste du jeu ne lit jamais une touche. Manette : disposition standard, **pas encore testée sur une vraie manette**. **Règles des entrées** ✅ (séance 64) : **`src/input/CLAUDE.md`** (clavier, souris, manette, doigt ; écarts constatés : `docs/SUIVI.md`).
- Son : Web Audio, sons synthétisés + échantillons libres de droit CC0 (`public/audio/` : musique supermarché, corbeaux, bip scanner ; `src/audio/samples.js`, `CREDITS.md`), débloqué au premier geste, coupé en arrière-plan. Règles : §12.
- Réglages modifiés gardés dans le navigateur (`localStorage`, seulement par `ui/settings.js`). **Pas de sauvegarde de partie** (pas encore de besoin ; règles prêtes : §13).
- Textes venant des données insérés avec `textContent` ; `innerHTML` seulement pour du balisage fixe.
- Les données se citent entre elles : `tests/unit/data.test.js` vérifie que chaque référence existe.

## 6. Vérifications 🔎

- `npm test` : logique, données et garde-fous (Vitest, sous Node : `tests/unit/regles.test.js`), puis Knip (code jamais utilisé). `npm run test:e2e` : navigateur, tailles PC et téléphone simulé (Oppo Reno 2, 20:9), **aucune erreur ni alerte console**.
- **Test des comptages** (`tests/e2e/comptages.spec.js`, limites dans `comptages-limites.json`) : éléments, calques, images, surface affichée, éléments et canevas créés en jeu, lectures de pixels, bascules de calque des objets. Une limite ne se relève qu'avec l'accord de l'auteur.
- Publication (`.github/workflows/deploy.yml`) : tous les tests, puis GitHub Pages. Un test qui échoue bloque la publication.
- Le navigateur de test n'a pas de carte graphique : **ses temps ne décident rien**. Seul le téléphone compte (CLAUDE.md, « Fluidité »).

## 7. Outils de mesure (diagnostic seulement) 🔎

Ils ne changent rien au jeu normal. Aujourd'hui (≈ 20 % du code) :

| Outil | Fichiers | Statut |
|---|---|---|
| Diagnostic DBG (F3), rapport copiable | `ui/diagnostic.js`, `debug/measure.js` | Exigé par CLAUDE.md |
| Banc d'essai + interrupteurs d'essai | `core/bench.js`, `ui/bench.js` | Exigé par CLAUDE.md |
| Test rapide (variantes alternées, verdict) | `core/quicktest.js`, `ui/quicktest.js`, `ui/speedindex.js` | Sert à comparer deux versions sur le téléphone |
| Points de départ (tests rapides : ⚙ → Départ, lien `?depart=<id>`) | `core/departs.js`, `data/departs.json`, `debug/departs.js` | Demandé par l'auteur (séance 48) ; recalculés à chaque chargement, pas une sauvegarde |
| Fonctions d'essai `window.paperCart` | `main.js` | Présentes aussi en ligne (utiles au diagnostic et aux tests), sans danger |

Le diagnostic en 4 configurations a été retiré (séance 30, décision de l'auteur) : le test rapide le remplace. La campagne « rayon de devant » (DEVANT2) aussi (séance 47, décision de l'auteur) : le rayon de devant est désormais réduit à sa moitié haute.

## 8. Points connus à reprendre (quand on y travaille)

- `src/main.js` : ~1 285 lignes (logique `treadmill` sortie dans `src/core/treadmill.js` à la séance 80 ; au-dessus de la limite de 600 lignes, exception datée dans `tests/unit/regles.test.js` : la suite du découpage reste à décider avec l'auteur).
- Les chaînes de texte créées à chaque image pour placer les éléments sont un coût accepté du rendu en éléments de page (calcul mesuré : 0,67 ms par image en moyenne sur le téléphone).
- Les dessins provisoires SVG ont été produits par des scripts non gardés : ils seront remplacés par ceux de l'auteur (prototype D).

## 9. Prévu, pas encore construit ⏳

A6 l'accueil (en cours : 1/3), A7 le deuxième rayon, A8 le chariot (règles des lieux : §11) · combat (B) · vieillissement des cartes · découverte (C) · `docs/IMAGES.md` et l'outil de conversion `tools/` (avant le prototype D) · **générateur de hasard à graine dans `core/`** (dès que le jeu tire au hasard ✅) · **file de travail lourd avec budget par image** (dès qu'un travail lourd apparaît en jeu ✅).

## 10. Héritage de Maxi-Gouffre

`docs/archive/maxi-gouffre-ARCHITECTURE.md` est une **réserve d'idées, pas une référence**.
- **Repris** (déjà en place) : logique pure séparée, contenu en JSON, réglages centralisés, actions abstraites, un seul accès au son, aucune dépendance au jeu ni appel réseau, `textContent` pour les textes, erreurs visibles, tests qui bloquent la publication.
- **Adapté** : canevas permis au chargement (pas d'interdiction absolue) ; Vite au lieu de « pas de bundler » ; réglages modifiables en jouant (pas de constantes gelées) ; scène qui s'adapte à toute forme d'écran (pas de profils fixes) ; repère de 300 lignes, pas une règle.
- **Pas repris** : branches, demandes de fusion et étiquettes par jalon (ici : travail direct sur `main`) ; Store, EventBus, Session, copie de l'état à chaque action (trop lourds pour une boucle à 60 Hz sur téléphone) ; modèle de combat, cartes à 3 stades nommés, campagne, sauvegarde, Android (Capacitor) et feuille de route : **règles ou projets de l'ancien jeu, à ne pas appliquer sans décision de l'auteur**.
- **Idées en réserve, à reconsidérer le moment venu** : choix des répliques du narrateur par une fonction pure (A4) ; scénarios de débogage et simulation de combats (B) ; sauvegarde par un seul module avec version des données (quand une partie se sauvegardera).

## 11. Lieux : règles ✅ (décidées par l'auteur, séance 50 ; à respecter dès A6)

État réel 🔎 (séance 56) :
- ✅ construit : trois lieux (`accueil`, où la partie commence et où se trouve le présentoir, `rayon-essai`, et `rayon-2` derrière lui depuis A7), reliés par des **sorties** dans les données (`exits`) ; un lieu se construit et se défait (`scene/placeView.js`, gestionnaire dans `src/game/places.js`) ; ses images sont **libérées en partant** (`releaseImages`), celles du héros et des produits restent ; état `transition` : fondu au noir, rien ne bouge, le lieu suivant est chargé dans le noir (`core/places.js`) ; le monde se souvient (`core/world.js`) ; temps du dernier changement de lieu dans le rapport DBG ; mémoire contrôlée après 5 allers-retours (test des comptages) ; comptages mesurés par lieu (le hall : mesuré, limites à valider par l'auteur) ; effets propres à un lieu dans ses données (`guard` : agent de sécurité ; `rain` : pluie posée sur le calque « dehors », que le mur vitré découpe, animations CSS en `transform` et opacité seulement, figées avec « réduire les animations ») ; objets du décor avec une taille par objet (`scale`, séance 57) ; voix « agent » : bulle au-dessus de l'agent.
- ✅ séance 62 : **un chargement de lieu qui échoue ne bloque jamais le jeu** : retour au lieu de départ (héros là où il est sorti, annonce, erreur notée au diagnostic) ; si même ce lieu échoue, état `erreur` avec « Réessayer » (séance 71 : il passe le relais à l'écran de fondu, qui dévoile la scène) ; `loadImages` libère ce qu'il avait préparé avant de relancer l'erreur ; l'historique des temps d'image repart de zéro à chaque lieu. Testé (image bloquée) ; mémoire testée aussi avec un échec au milieu.
- ✅ construit (préchargement & chargement rapide) : **pré-téléchargement réseau silencieux** des lieux voisins (`core/places.js`, `game/places.js`, délai réglable `places.prefetchDelay` dans `config.js`, annulable, désactivé en profil *Léger* ou `saveData`, actif même en marchant ou pendant un dialogue hors transition et hors scan, cache HTTP seul sans décodage ni calque) ; chargement/décodage **en parallèle** des images et utilisation directe des `.webp` natifs proches de la taille cible sans ré-encodage PNG CPU (`scene/assets.js`, `decoding = 'sync'` après `decode()`, `url` conservée avec `revoke: false` pour les copies partagées). ⏳ pas encore : banc qui traverse les lieux.
- **Chargements** ✅ (séances 64 et 80) : jamais d'écran noir muet (au-delà d'environ 0,3 s, un petit signe d'attente dans le style du jeu ; en cas d'échec, message et « Réessayer ») ; temps de chargement mesurés dans le diagnostic et jugés sur le téléphone ; après `places.prefetchDelay` en jeu (hors transition et hors scan), le jeu télécharge à l'avance les fichiers des lieux voisins dans le cache réseau, **sans les décoder ni créer leurs calques**. Signe d'attente fait (séance 67 : `core/places.js` `showWait`).

- **Traversée de bord d'écran** ✅ (validée par l'auteur, séance 80) : règle obligatoire pour **toutes les transitions de bord** (`edge: 'left' | 'right'`, `arriveEdge`, `core/places.js` `edgeBounds` / `edgeTouched` / `stepEdgeWalk`). Le joueur garde 100 % du contrôle jusqu'au **1ᵉʳ pixel du héros qui touche le bord** (calculé selon la profondeur `z`), puis le héros avance automatiquement jusqu'à **disparaître complètement** (100 % hors-champ, 0 pixel visible) avant de lancer la transition ; à l'arrivée, il entre depuis 100 % hors-champ et se pose **collé au bord** sans toucher le déclencheur (et enchaîne sans coupure si la direction reste tenue).
- **Tout est dans les données** : chaque lieu décrit ses calques, sa zone de marche, ses points d'intérêt et ses **sorties** (lieu de destination et point d'arrivée du héros).
- **Un seul gestionnaire de lieux**, avec un cycle de vie : préchargement → décodage avant affichage → utilisation → **libération de la mémoire en partant**. Seuls le lieu affiché (et temporairement l'ancien lieu pendant un fondu enchaîné `mist`/`dissolve`) restent chargés.
- **Transition courte gérée par la machine à états** ✅ (validée séance 81) : **fondu enchaîné pur** (`cross-dissolve`, sans brume ni filtre, passage direct si *Réduire les animations* ou `places.fade = 0`) ; le héros reste visible dans l'ancien décor pendant tout le chargement du lieu suivant et la direction maintenue reste active à l'arrivée (`src/input/CLAUDE.md`). Les 5 styles d'essai non retenus ont été retirés.
- **Un seul calque de transition** (`.place-fade`) pour tout le jeu (`src/game/places.js`) : **volet papier** entre deux lieux, et **écran noir** en relais pour le début de partie, la fin de l'intro et l'écran « Réessayer » (séance 68). Tout autre écran plein écran (intro, erreur) **lui passe le relais quand il est déjà plein à l'écran**, puis n'est retiré que dessous. Rien n'est créé ni retiré de la page au moment où la scène se dévoile ; une fois caché, le calque ne prend ni touchers ni sélection.
- **Téléchargement d'avance d'un lieu voisin** (s'il est construit) : il peut être annulé, et la transition marche sans lui.
- **Le monde se souvient** : un produit scanné reste scanné au retour, un chariot garé reste garé ; les cartes et les objets suivent le héros.
- **Mesures** : comptages **par lieu** ; banc d'essai qui traverse les trois lieux et les transitions ; mémoire contrôlée après plusieurs allers-retours (elle ne doit pas grimper) ; temps de transition mesuré sur le téléphone.

## 12. Son ✅ (règles décidées par l'auteur, séances 64 et 80)

Vue d'ensemble : un seul accès au son (`src/audio/audio.js`), **aucune musique générée par le navigateur** (retirée à la séance 80 sur demande de l'auteur) : musique d'ambiance supermarché, pluie réaliste de l'intro, cris de corbeaux et bip Scanette en échantillons libres de droit CC0 (`src/audio/samples.js`, `public/audio/`), avec bruitages courts provisoires préparés une fois au démarrage. **Les règles de code sont dans `src/audio/CLAUDE.md`** : un seul contexte audio repris au geste du joueur ; aucun nœud qui s'accumule (compteur interne, nettoyage idempotent) ; nombre maximum de sons par catégorie et priorité.

## 13. Sauvegarde ✅ (règles à appliquer dès qu'elle sera construite ; rien à construire maintenant)

- **Un seul module** lit et écrit la sauvegarde ; le reste du jeu ne touche jamais au stockage.
- On sauvegarde **l'état du monde et du joueur** (`core/`), jamais des éléments de page ni des images.
- Chaque sauvegarde porte un **numéro de version** ; une ancienne est **convertie** à l'ouverture, jamais perdue. On n'écrase **jamais une sauvegarde faite par une version plus récente** du jeu.
- **Écriture sûre** : la nouvelle sauvegarde est écrite à côté, puis remplace l'ancienne ; la précédente est gardée. Une sauvegarde abîmée est ignorée avec un message clair, et la précédente est proposée.
- Sauvegarde automatique à des **moments calmes** (entrée dans un lieu, fin de combat), jamais pendant une transition ou un dialogue.
- Les **réglages** restent séparés de la partie.
- Essais automatiques : aller-retour sauvegarder/relire identique, conversion d'une ancienne version, sauvegarde abîmée refusée sans planter, **mémoire pleine** (l'écriture échoue sans rien perdre ni planter).

## 14. Appareils : PC et smartphone ✅ (séance 64)

- Le jeu se joue **sur PC et sur smartphone**, dans le navigateur. Il vise **60 images par seconde partout**, avec un **profil de qualité** par appareil : densité de pixels plafonnée, effets coûteux (pluie animée, poussière, parallaxe lointaine) activés ou non.
- Le profil initial est choisi au démarrage d'après les **capacités estimées** de l'appareil, pas seulement l'étiquette « PC / smartphone » (un PC modeste ne doit pas recevoir un profil plus lourd qu'un bon téléphone). Les indices du navigateur (mémoire, cœurs) sont approximatifs : le choix s'appuie surtout sur un **court test de vitesse au premier lancement** (l'indice de vitesse du diagnostic), gardé dans le navigateur. Pas de WebGL juste pour lire le nom de la carte graphique. Le profil reste modifiable dans les options du joueur, **sans changement automatique en pleine partie**.
- **Appareils de référence** : PC (Core i3-8145U, 4 Go de mémoire) et Oppo Reno 2 (8 Go). Les objectifs se jugent sur chacun, dans son profil.
- Un profil léger réduit **les effets**, **jamais les commandes, les règles ni la lisibilité**. Un changement de profil s'applique à **un moment sûr** (menu, rechargement du lieu).
- Profils (option A, séance 64) : **étape 1 faite (séance 66)** : Léger (densité 1, sans poussière, plans lointains immobiles), Normal (densité 1,5), Fin (densité 2) ; valeurs dans `src/config.js` (`display.profiles`), règle dans `core/profiles.js`, lue par `scene/quality.js` ; choix dans les options (au chargement). [TEMP] « Fin » par défaut. ⏳ Étape 2 : choix automatique au premier lancement par un court test d'affichage, seuils à caler sur les deux appareils de référence.

## 15. Leçons (un bug corrigé = un test qui échoue s'il revient + une ligne ici, avec les hypothèses écartées et les essais différentiels)

| Symptôme observé | Cause identifiée | Règle qui l'évite · test |
|---|---|---|
| Présentoirs qui clignotent sur le téléphone quand le héros passe derrière (séance 27) | Le navigateur les faisait changer de calque à chaque passage | Un calque fixe par objet que l'on contourne · comptages (`propLayerSwitches = 0`) |
| +58 éléments de page à chaque changement de lieu (séance 53) | Les images du lieu quitté restaient suivies par le navigateur (taille de l'écran) | Retirer la source des images en défaisant un lieu · test de mémoire (5 allers-retours) |
| Pluie qui glisse de côté derrière la vitre (séance 58) | Elle était posée sur un calque de parallaxe | Un effet suit le calque de ce qu'il décore · capture |
| L'agent clignote, puis clignote à chaque pose (séances 59 à 61) | Ses poses étaient montrées et cachées comme calques à part (séance 59), puis chacune avait son calque, passé de l'opacité 0 à 1 (séance 60) ; sa boîte sans taille donnait aussi un calque à chaque pose | Un calque par élément animé, poses comme le héros (`scene/poses.js`), conteneur à la taille du dessin · comptages (« les changements de pose ne créent ni ne changent aucun calque ») |
| Nœuds audio jamais libérés : 1 975 d'effets et 5 549 de musique après 2 min sur le téléphone (séance 65) | Aucun son ne déconnectait ses nœuds à sa fin | Chaque son libère ses nœuds à sa fin (`onended` → `disconnect`, idempotent), compteur affiché · `tests/unit/audio.test.js`, `tests/e2e/son.spec.js` |
| En longeant l'étagère du rayon 7, le héros passait au rayon 2 sans le vouloir (séance 67) | La zone de passage touchait le pied de l'étagère, là où l'on marche | Un passage se trouve **au fond d'un prolongement du sol** dans l'ouverture : il faut y entrer · `tests/e2e/a7.spec.js` (« longer… ne fait pas changer de rayon ») |
| Le héros et la bande du haut-parleur clignotent à la première apparition du hall, jamais au retour (séances 67-68) | **Prouvé par l'auteur (intro désactivée : plus de clignotement)** : l'écran noir de l'intro, plein écran, dont l'opacité était changée en JavaScript à chaque image, était **retiré de la page** à la fin de son fondu ; le téléphone redessinait alors tout ce qui était dessous. Trois corrections précédentes (noir prolongé, préchauffage des poses, calques des bulles) visaient une mauvaise cause | Un seul écran noir pour tout le jeu, celui des changements de lieu (sa couche dès le départ, effacé par son opacité, retiré une fois transparent) : l'intro lui passe le relais et n'est retirée que dessous · `tests/e2e/comptages.spec.js` (« fin de l'intro ») · Méthode : investigation différentielle (un seul changement par essai) avant toute correction. Hypothèses écartées par les essais : pose « yeux fermés » montrée à froid (préchauffage sans effet), calques de la pluie et de la bande (sans effet), annonce du haut-parleur (test C). **Validé sur le téléphone par l'auteur** (séance 68). |
| Au doigt, impossible de repasser du rayon 2 au rayon 7 (séance 67) | Le passage était sous le bas de l'écran : on ne peut pas le toucher | Toucher une ouverture envoie au passage (`reach`) · `tests/e2e/a7.spec.js` (« au doigt ») |
| Toucher l'étagère du fond envoyait le héros contre un présentoir (séance 67) | Le point praticable le plus proche ignorait les bords du sol (devenu à coins) | Les bords du sol comptent · `tests/unit/pathfinding.test.js` |
| Écran noir bloqué si une image du lieu d'arrivée ne se charge pas (séance 62) | Le changement de lieu n'interceptait pas l'échec | Retour au lieu de départ, sinon « Réessayer » ; la transition se termine toujours · `tests/e2e/robustesse.spec.js` |
| Impossible de quitter le plein écran avec Échap ou le bouton ⛶ sur la salle de test (séance 79) | `Escape` appelait `preventDefault()` même en plein écran et la barre `.hud-bar` passait sous la barre studio / laissait remonter les clics | Ne pas bloquer `Escape` quand `document.fullscreenElement` est actif (`src/input/keyboard.js`) ; garder `.hud-bar` au-dessus (`z-index: 30`) avec `stopPropagation` sur `pointerdown` (`src/ui/hud.js`) · `tests/e2e/entrees.spec.js` |
| Appuyer sur Espace pendant l'écriture d'une bulle sautait au texte suivant au lieu de finir la phrase (séance 79) | L'action « avancer » ne vérifiait pas si l'effet machine à écrire était encore en cours | Exposer `voices.typing()` (`src/game/voices.js`) et terminer l'affichage de la bulle en cours avant de passer à la réplique suivante (`src/main.js`) · `tests/e2e/entrees.spec.js` |
| Nuages (et copies d'images `.webp` partagées) affichés en rectangle blanc vide | Le chemin direct `.webp` (`src/scene/assets.js`) mettait `url: null`, alors que nuages, oiseaux et portiques dupliqués lisent `im.url` | Toujours garder `url: e.url` valide sur les bitmaps directs avec un drapeau `revoke: false` pour ne révoquer que les blobs · `tests/unit/assets.test.js` |
| La fiche « Nouvel objet » se refermait aussitôt au double toucher quand le héros était déjà à portée (séance 80) | `onDoubleTap` ouvrait la fiche sur `pointerdown` ; le `click` du relâchement tombait sur `.item-reveal` sans garde anti-faux-clic | Exiger un `pointerdown` après ouverture (`armed`) + délai 350 ms sur le fond (`src/ui/itemReveal.js`), figer le monde et les voix sous la fiche · `tests/e2e/entrees.spec.js` |
| En transition `mist`, le héros disparaissait de l'ancien décor pendant tout le chargement du lieu suivant (séance 80) | `change()` retirait les acteurs dans `backstage` avant `await load(exit.to)` | Préparer le lieu suivant (`preparePlace`) avant de déplacer les acteurs hors de l'ancien décor (`src/game/places.js`) · `tests/e2e/entrees.spec.js` |
| Bandes noires sur téléphone 20:9 dans le hall origami V2 (séance 80) | Le décor du hall avait été produit en 2 160 px de large (18:9) au lieu d'au moins 2 400 px (20:9) | Règle dimensions ≥ 2 400 px (≥ 2 560 px recommandé) vérifiée automatiquement · `tests/unit/data.test.js` |
| Échecs Playwright en CI Linux après la migration PixiJS v8 (17 échecs + warnings `ReadPixels`) | En local Windows headless, PixiJS tourne en `CanvasRenderer` (~59 i/s) ; sur le runner GitHub Ubuntu sans GPU, Chromium fournit un WebGL logiciel à ~4 i/s (`stageNodes: 77`, avertissements `GL Driver Message … GPU stall due to ReadPixels`) où `stepper.js` abandonne le retard au-delà de 83,3 ms (temps de jeu ≈ 33–37 % du temps réel), et certains tests attendaient des délais muraux (`waitForTimeout`) ou oubliaient `markSaid('arrivee')` | Utiliser le même moteur (`CanvasRenderer`, `--disable-webgl`) partout dans les tests fonctionnels (local et CI), garder une suite dédiée `tests/e2e/webgl.spec.js` (démarrage, fondu `RenderTexture`, retournement 2.5D, zéro erreur console), filtrer uniquement le warning driver `ReadPixels` dans `tests/e2e/helpers.js`, et attendre un état ou le temps de jeu (`window.paperCart.time()`) plutôt qu'un délai mural · `playwright.config.js`, `tests/e2e/helpers.js`, `tests/e2e/webgl.spec.js` |
| Blocage de `npm run test:e2e` à la sortie sous Windows (> 45 s par navigateur) + projet `webgl` vert en silence sans WebGL (28/11/2026) | (1) Sous Windows, quand `%TEMP%` n'a pas de droits hérités, le bac à sable réseau de Chromium pose une ACL AppContainer exclusive sur `Default/Cache/No_Vary_Search` dans son profil temporaire → `fs.promises.rm(..., { maxRetries: 10 })` de Playwright boucle en `EPERM` à chaque fermeture (prouvé par `icacls` et `DEBUG=pw:browser`) ; (2) `playwright.config.js` empilait `npm run build && npx vite preview` (4 processus) ; (3) `tests/e2e/webgl.spec.js` conditionnait son contrôle `MeshPlane` par `if (sc0.isWebGL)` ; (4) en fenêtre visible, l'absence d'icône dans `index.html` déclenchait un 404 `/favicon.ico` | Sous Windows, diriger `TEMP`/`TMP` de Playwright vers `node_modules/.cache/pw-tmp` (droits hérités propres, ignoré par Git) nettoyé par `tests/e2e/teardown.js` même en cas d'échec ; appeler Vite directement dans `webServer.command` (`node ./node_modules/vite/bin/vite.js build && ... preview`) ; lancer le projet `webgl` en fenêtre visible en local (vraie carte graphique), headless en CI, avec échec obligatoire en CI sans WebGL et saut explicite en local (jamais vert en silence) ; icône SVG inline dans `index.html` · `playwright.config.js`, `tests/e2e/teardown.js`, `tests/e2e/webgl.spec.js`, `index.html` |

