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

## Séance 80 — 25/11/2026 — Suite audit Claude Opus 5.5 : correctifs `mist`, fiche objet, pluie réaliste CC0, retrait musique synthétique et code mort, garde-fous

**Contexte & commits intermédiaires depuis la séance 79 (`8bdfe05` → `c06fb72`)** :
- Chargement rapide `.webp` en parallèle (`8bdfe05`), marche continue entre lieux (`676851b`), volet papier directionnel (`d7896f9`), fix des `.webp` partagés (`529a3a0`), 4 styles origami HD (`0931959`) et transitions douces `dissolve` / `mist` (`c06fb72`), suivis d'un audit complet de Claude Opus 5.5 vérifié dans le code.

**Décisions de l'auteur** :
- `1a` : corriger le clignotement à froid (`decoding = 'sync'` après décodage + décodage copies partagées).
- `1b` : garder `mist` en corrigeant la disparition du héros pendant le chargement ; conserver les 6 styles testables dans `⚙` jusqu'à validation sur téléphone.
- `2a` / `7a` : ajouter une règle de dimensions (`≥ 2 400 px` mini / `2 560 px` recommandé + test automatique garde-fou), puis élargir visuellement le hall dans une passe dédiée juste après.
- `2b` : contraste Backrooms (pluie réaliste CC0 `#595717` dans l'intro → grand soleil inexplicable derrière les vitres du hall remarqué par le héros ; retrait total du code mort de pluie du hall).
- `3b` : supprimer totalement la musique générée par le navigateur (`music.js`, `supermarche.json`, 3 réglages `basse / piano / mélodie`).
- `4a` : supprimer l'ancien héros provisoire 2 vues (`heros.json`, 16 SVG) et les 11 SVG inutilisés.
- `5a` : hôtesse récite naturellement ses 10 slogans sans boucle artificielle (proposition chariot une seule fois après le 3ᵉ sans jeton, aucun indice sur le PQ).
- `6a` : petits correctifs fluidité sans risque + préchargement voisins autorisé même en marche/dialogue avec délai réglable (`places.prefetchDelay`).
- `7a` (moteur) : rester en DOM/CSS pour finir A8, rappel inscrit dans `SUIVI.md` pour un POC **PixiJS v8** sur branche à part juste avant le Prototype B.
- `8a` / `9b` / `10a` : scripts de conversion versionnés dans `tools/`, `VISION.md` mis à jour (IA + retouche manuelle Krita, déclaration Steam prévue), publication sur `main` après 100 % tests verts.

**Fait** :
- **Transition `mist`** (`src/game/places.js`) : préparation du lieu suivant (`preparePlace`) avant de déplacer les acteurs hors de l'ancien décor (le héros ne disparaît plus pendant le chargement) ; retrait des `box-shadow` flous sur les transitions papier (`src/style.css`).
- **Fiche « Nouvel objet »** (`src/ui/itemReveal.js`, `src/data/objects.json`, `src/main.js`) : protection anti-faux-clic au double toucher, mode d'emploi adapté au dernier appareil (`keys / touch / pad`), préchargement des 5 images d'objets au démarrage, monde/voix/corbeaux figés sous la fiche.
- **Anti-clignotement à froid** (`src/scene/assets.js`, `src/scene/clouds.js`, `src/scene/birds.js`) : passage en `decoding = 'sync'` après `decode()` et décodage proactif des copies partagées.
- **Pluie d'intro CC0 & retrait code mort** : ajout de `public/audio/pluie-intro.mp3` (`#595717`, *Soft Rain Loop*, CC0), pensée Backrooms dans `src/data/narrator.json`, suppression de tout le code/CSS/réglage de pluie du hall, suppression de l'ancienne musique synthétisée (`music.js` + `supermarche.json` + 3 réglages musique), suppression de l'ancien héros 2 vues (`heros.json` + 27 SVG/WebP inutilisés).
- **Hôtesse naturelle** (`src/core/hotesse.js`, `src/data/characters/hotesse.json`) : les 10 slogans sont tous entendus naturellement sans boucle répétitive sur la question du chariot.
- **Fluidité & architecture** : `getBoundingClientRect()` mémorisé au `layout()` (`src/scene/stage.js`), cache de segments dans `src/core/birds.js`, `places.prefetchDelay` dans `src/config.js`, logique du studio extraite dans `src/core/treadmill.js`, suivi des calques `.cloud`/`.bird` dans `tests/e2e/comptages.spec.js`.
- **Tests, outils & docs** : 4 nouveaux tests E2E de non-régression (`Échap` plein écran, `Espace` machine à écrire, fiche objet double-tap/tactile/monde figé, héros visible pendant `mist`), garde-fou dimensions dans `tests/unit/data.test.js`, `tests/unit/treadmill.test.js`, `tools/video_to_sprites.ps1`, et mise à jour de `VISION.md`, `CREDITS.md`, `ARCHITECTURE.md`, `SUIVI.md`, `PROTOTYPES.md`, `GAME_DESIGN.md`, `HISTOIRE.md`, `DIRECTION_ARTISTIQUE.md`.

---

## Séance 79 (branche `test/krita-mcp`) — 23–24/11/2026 — Héros origami 8 directions, marche vidéo 16 images, hôtesse & troc PQ→jeton→chariot, découverte Zelda et salle de test libre

**Demandes & décisions de l'auteur** :
- Travail strictement isolé dans `C:\Paper Cart - krita-codex-mcp` (branche locale `test/krita-mcp`, aucun push sur `main` sans accord).
- **Héros & équipement** : ne plus afficher le panier ni la Scanette tenus en permanence sur le héros (la Scanette n'apparaît en main que pendant le scan, icône HUD en bas à gauche à droite du panier). **Clignement des yeux validé**.
- **Découverte d'objets clés** : fenêtre centrale animée (petit → grand) + fanfare style Zelda (`decouverte`) + description, utilité et indice énigmatique d'évolution pour `scanette`, `panier`, `papier_toilette`, `jeton`, `chariot`.
- **Hôtesse de l'accueil** : placeholder blonde bien proportionné (~1m72), agent de sécurité reproportionné (~1m85), 3 portiques antivol blancs reproportionnés (~1m70). Dialogues de l'hôtesse sans boucle infinie : 3 slogans puis question **« Vous voulez un chariot ? »** (`Oui` / `Non`) ; **1 rouleau de Papier Toilette = 1 jeton = 1 chariot**.
- **Pipeline vidéo → sprites** : test concluant sur la marche avant issue d'une vidéo Gemini Omni 1.2 (`face_marche.mp4`) ; objectif fixé à **16 images uniques (0 doublon)** avec détails vivants. **FFmpeg 8.0.1** configuré en local (shims dans `PATH` + contrôle anti-doublon dans `_assets_stock/heros_test_v1/scripts/video_to_sprites.ps1`).
- **Salle de test libre (`?depart=salle-test`)** : grande surface verticale (`5400×3240`), marche sur place à vitesse réelle, ralenti `×0,4`, bouton fixe, 8 directions et perspective (rétrécissement) désactivable à la volée. **Validée par l'auteur.**
- **Son & ergonomie** : corbeaux plus graves et réalistes ; serveur MCP **Freesound** installé en local ; sortie plein écran corrigée (`Escape` + bouton ⛶) ; barre Espace / bouton A finit d'afficher la bulle en cours avant de passer au texte suivant.

**Fait** :
- **Héros origami (`heros-test`)** : 8 directions fixes + clignements (`heros-s/se/e-idle-blink.webp`) + marche avant fluide **16 images** extraites, détourées, harmonisées en couleur et alignées aux pieds (`public/art/heros-test/`, `src/data/characters/heros-test.json`, `src/core/direction.js`, `src/scene/character.js`).
- **Accueil & Hôtesse** : `public/art/placeholder/hotesse.svg`, `jeton.svg`, `agent-securite*.svg` reproportionnés ; `src/core/hotesse.js` (+ `tests/unit/hotesse.test.js`), `src/game/hotesse.js`, `src/data/characters/hotesse.json`, `src/data/places/accueil.json` (portiques ~1m70).
- **Découverte d'objet & HUD** : `src/ui/itemReveal.js`, `src/core/focus.js`, `src/ui/cards.js`, `src/data/objects.json`, `src/audio/audio.js` (`decouverte` + corbeau grave).
- **Salle de test libre** : `src/data/places/salle-test.json`, `public/art/placeholder/salle-test-fond.svg`, `src/ui/treadmill.js`, `src/scene/projection.js` (`refZ`), `src/scene/stage.js` (`viewHeight`), `src/data/departs.json`.
- **Correctifs** : plein écran (`src/input/keyboard.js`, `src/ui/hud.js`, `src/style.css`), machine à écrire sur Espace/A (`src/game/voices.js`, `src/main.js`), fermeture propre de la bande narrateur lors du passage aux bulles (`src/ui/narrator.js`), `.gitignore` (`_assets_stock/`, `_krita_mcp_test/`).
- **Audio réel CC0 (Freesound MCP + FFmpeg)** : `src/audio/samples.js` + `public/audio/` (`corbeau-1..4.mp3` alternés issus de `#813115` et `#741366` découpé, `supermarche.mp3` bossa-nova `#464924` en boucle sans couture, `scan-bip.mp3` `#202530` normalisé), avec repli automatique sur la synthèse hors-ligne et suivi complet des nœuds audio (`CREDITS.md` à jour).
- **Smartphone paysage & transitions rapides (`1A`)** : fenêtre de découverte d'objet (`src/ui/itemReveal.js`, `src/style.css`) en 2 colonnes compactes sur faible hauteur (vérifiée sur `914×411` et `720×360` + assertion E2E), animation de vol de l'objet vers son icône HUD après appui sur « Continuer » ; pré-téléchargement réseau silencieux des lieux voisins après 2,5 s au calme (`src/core/places.js`, `src/game/places.js`, `tests/unit/places.test.js`, désactivé en profil `Léger` ou `saveData`) ; chargement d'images optimisé (`src/scene/assets.js`, `tests/unit/assets.test.js`) en parallèle (`Promise.all`), utilisation directe des `.webp` sans ré-encodage PNG CPU (sauf réduction en profil `Léger` ou > 4096 px) et encodage WebP rapide : démarrage PC `2 462 → 1 744 ms`, transition `876 → 347 ms`.

**Ce qui reste ouvert** :
- Choisir la personnalité définitive du héros (visage fixe + ton des dialogues) avant de générer les 5 poses fixes et cycles 16 images définitifs.
- Renseigner `FREESOUND_API_KEY` pour activer la recherche Freesound MCP.
- Validation sur smartphone (via Wi-Fi local ou après fusion/push sur `main` pour GitHub Pages).

---

## Séance 78 (branche `test/krita-mcp`) — 21/11/2026 — Refonte origami Rayon 1, ciel vivant Accueil, réglages agrandis et transitions rapides

**Demandes & décisions de l'auteur** :
- Travail strictement isolé dans `C:\Paper Cart - krita-codex-mcp` (branche locale `test/krita-mcp`, aucun push GitHub, `c:\Paper Cart` non touché).
- **Option 1A** : une seule grande arche centrale vers `rayon-2` à `x = 2170` (bout droit en cul-de-sac récompense).
- **Option 4A** : gondole du premier plan (`premier-plan`) opaque par défaut (`1.0`) avec transparence dynamique (`core/occlusion.js`) quand le héros passe derrière.
- **Signalétique Rayon 1 validée** : `← Accueil`, `Les essentiels`, `↑ Épiceries`, `Les indispensables` en lettrage chaleureux (`Segoe Print Bold`, cohérent avec *« Bienvenue chez Maxi Gouffre ! »*), déformé pour suivre les courbes/plis/perspectives des panneaux et incrusté en mode Produit.
- **Produits scannables** : conservés en SVG provisoires pour cette passe (remplacement prévu à une étape dédiée).
- **Chariot abandonné** (pour la passe `props` à venir) : pensée automatique du héros prévue (*« Pourquoi je ne prends pas celui-là ? Hum… les roues sont bloquées. »*).

**Fait** :
- **Rayon 1 (`rayon-essai`, 3600×1080, 3 plans parallaxe origami HD)** :
  - Plan 3 (`public/art/rayon-essai/rayon-lointain.webp`, parallaxe `0.82`) : ciel bleu + panorama large du Rayon 2 upscalé ×4 (Real-ESRGAN `realesrgan-x4plus-anime`) avec transition lumineuse douce au ras du sol pour éviter tout conflit de carrelage au seuil.
  - Plan 2 (`public/art/rayon-essai/rayon-fond.webp`) : 4 verrières + arche centrale détourées, sol carrelé prolongé en perspective droite, barre de seuil origami au pied de l'arche, 5 haut-parleurs et signalétique courbée V4.
  - Plan 1 (`public/art/rayon-essai/rayon-avant.webp`, parallaxe `1.25`) : gondole avant détourée, opaque par défaut (`display.foregroundOpacity = 1`), fondu dynamique au passage du héros (`src/main.js`, `core/occlusion.js`).
  - Archive complète + `.kra` Krita multi-calques éditable dans `_assets_stock/rayon_essai_v1_origami/` (`_assets_stock/rayon_essai_v1_origami/INDEX.md` et `CREDITS.md` à jour).
- **Vie extérieure (Accueil + Rayon 1)** :
  - **Nuages origami dérivants** (`src/core/clouds.js`, `src/scene/clouds.js`, `tests/unit/clouds.test.js`) : 7 nuages au Rayon 1 (`nuage-1/2.webp`), 8 nuages à l'Accueil (`nuage-1/2/3.webp`) après nettoyage complet des nuages figés dans `accueil-dehors.webp`.
  - **Oiseaux marcheurs** (`src/core/birds.js`, `src/scene/birds.js`, `tests/unit/birds.test.js`) : 2 sprites à pattes courtes/fines et cou continu (`oiseau-marche-1/2.webp`), marche irrégulière par petits à-coups et micro-pauses, suivi de courbe de rebord (`walkPoints`) pour rester posé sur la crête de l'enseigne *Maxi Gouffre* (Accueil) et les rebords des verrières (Rayon 1). Respecte `Réduire les animations`.
- **Accueil (`accueil-fond.webp`)** : bord supérieur de l'enseigne *Maxi Gouffre* lissé proprement (arêtes polygonales anti-aliasées ×4, archive `plan2_final_v3_2160x1080.png`).
- **Menu de configuration (`⚙` et `Options`)** : fenêtre agrandie (`980 px` en 2 colonnes avec barre latérale d'onglets et compteurs, recherche instantanée multi-onglets, filtre `Modifiés (N)`, bouton `↺` par réglage ; `760 px` pour `Options` joueur) dans `src/ui/settings.js` et `src/style.css` ; audit et correction de 7 libellés/descriptions dans `src/config.js` et `src/data/aide-reglages.json` (tous les réglages conservés).
- **Transitions entre lieux** : `places.fade` réduit par défaut de `0,25 s` à **`0,06 s`** et réglable jusqu'à **`0 s`** (coupure directe sans fondu, garde `fade <= 0` dans `src/core/places.js` et `src/game/places.js`, testé dans `tests/unit/places.test.js`).

**Ce qui fonctionne / Vérifié** :
- `npm.cmd test` : **30/30 fichiers, 228/228 tests unitaires + Knip** verts (inclut `regles.test.js`, `data.test.js`, `places.test.js`, `birds.test.js`, `clouds.test.js`, `occlusion.test.js`).
- `npm.cmd run build` : build Vite OK (`dist/`).
- Vérifications visuelles en direct sur `http://127.0.0.1:5173/?lieu=accueil` et `/?lieu=rayon-essai` : 0 erreur console, 0 requête réseau échouée, parallaxe sans couture, signalétique courbée validée, nuages dérivants, oiseaux marcheurs calés sur les rebords, menu `⚙` agrandi et transition `0,06 s` vérifiés.

**Ce qui reste à faire / Limites connues (pas encore vérifié)** :
- `props` du Rayon 1 (`chariot` abandonné + chariot du héros, `presentoir-crousti`, `petite-table`) encore en SVG provisoires — en attente des visuels de l'auteur (+ ajout de la pensée du héros près du chariot abandonné ; attention `src/data/narrator.json` est à 572/600 lignes).
- Produits scannables encore en SVG provisoires (passe dédiée ultérieure).
- Limites E2E `comptages-limites.json` et suite Playwright complète (`npm run test:e2e`) non relancées après l'ajout des sprites de nuages/oiseaux marcheurs ; fluidité sur téléphone non mesurée sur cette passe.
- Changements locaux non commités sur `test/krita-mcp` (à commiter localement si l'auteur souhaite un point de retour).

**Prochaine étape demandée (nouvelle session)** :
1. Tester un nouveau sprite multi-directions pour le héros (8 directions fixes : face, dos, profil G/D, diagonales avant G/D, diagonales arrière G/D + sprites de marche).
2. Rechercher et évaluer `Ludo.ai`, `AutoSprite`, `SpriteCanvas`, `SpriteFrame` (et serveurs MCP / skills associés) pour créer les animations du jeu.
3. Analyser l'opportunité d'une migration vers **Godot / GDScript** (optimisation matérielle CPU/GPU, export Web HTML/JS + Android) vs rester en **HTML/JavaScript**.

---

## Séance 77 — 19/11/2026 — Passer, réglages expliqués, cartons logiques

**Demandes de l'auteur** :
- un bouton « Passer » ;
- le panneau ⚙ réservé aux développeurs, avec plus d'explications ;
- pas deux bulles en même temps (question) ;
- des cartons logiques ;
- la version en haut à gauche, un bouton Scanner plus petit en bas à droite.

**Réponses** : 1A (le rayon Papier Toilette est vide depuis « la Grande Rupture »), 2A, 4 tous les slogans, 5A (et elle suit le héros du regard), 6A, 7A.

**Fait** :
- **Passer** : toutes les répliques jusqu'à une question, sinon toute la conversation. Bouton en bas à droite, Tab, Select à la manette. Les répliques passées restent dans l'historique (`b9f510b`).
- **Réglages** : ⚙, DBG et F2 à F4 seulement en mode dev ; les joueurs ont **Pause › Options**. Une explication sous chaque réglage, en mots simples (147 réglages) (`16d1a1e`).
- **Cartons** : un dernier carton encore en haut de l'étagère, les traces claires des trois tombés, et le tas en désordre au sol (`ca6ca16`).
- Version en haut à gauche (en jeu et sur l'écran titre) ; bouton Scanner plus petit, tout en bas à droite.
- Notés : le Papier Toilette, l'hôtesse (slogans dans `src/data/characters/hotesse.json`, regard, réaction au rouleau), monter sur le chariot, les tas du chariot.

**Vérifié** : 215 tests de logique, Knip. 124 essais navigateur, dont « Passer » (jusqu'au choix du nom, rencontre gardée dans l'historique) et Pause › Options. Comptages ; aucune erreur console. Le test des comptages a relevé que le nouveau bouton gagnait puis perdait un calque à la fin de l'intro, comme le noir de l'intro à la séance 68 : corrigé avant de publier. **Pas vérifié** : l'absence de clignotement sur le téléphone, la fluidité.

**Proposition pour la séance suivante** : l'hôtesse et l'échange du rouleau contre le chariot.

---

## Séance 76 — 19/11/2026 — La pile de cartons et le rouleau

**Réponses de l'auteur** :
- 1 : l'hôtesse donne le chariot contre une monnaie d'échange ; le Papier Toilette est à rendre logique ;
- 2A : un rouleau [TEMP] ;
- 3A : sous la pile de cartons [TEMP] ;
- 4B : un rayon d'écart au plus ;
- 5A : la burette d'huile ;
- 6AB : dessous, la monnaie pour l'instant ;
- 7A : monter sur le chariot lâché ;
- 8B : 3 dessins de tas ;
- 9A : je propose les slogans.

**Fait** (`49b2262`) :
- **Une pile de cartons au rayon 8**, le rayon d'entretien. Avec le chariot lancé, elle tombe d'un coup. À la main, il faut pousser un moment : elle vacille, puis tombe.
- **Dessous, un rouleau de Papier Toilette** à prendre (onglet Objets). Le héros pense : « Ici, j'ai l'impression que ça vaut une fortune. »
- Une fois tombée, la pile le reste, même quand on revient.
- **Scanner loin du chariot** : au plus un rayon d'écart ; au-delà, le haut-parleur refuse en se moquant.
- Le chariot bute maintenant par **son avant**, et non plus par son milieu.
- Nouveau départ de test : « chariot-pile ».
- Réglages : ⚙ › Pile de cartons.

**Décision prise seule** : la pile est au rayon 8 (entretien), où des cartons ont du sens, et le rayon 7 est déjà à sa limite d'images.

**Vérifié** : 212 tests de logique, Knip ; 121 essais navigateur (à la main, au chariot, retour au rayon) ; aucune erreur console. **Pas vérifié** : le ressenti de la chute, la fluidité sur le téléphone.

**Proposition pour la séance suivante** : l'hôtesse du comptoir et l'échange du rouleau contre le chariot, puis monter sur le chariot.

---

## Séance 75 — 19/11/2026 — Le chariot : lâcher partout, bras tendus, roue folle, haut-parleur

**Réponses de l'auteur** : 1A, 2AB, 3 (l'hôtesse, contre une monnaie d'échange à trouver), 4B, 5 (pas trop loin), 6A (et réparable dans l'histoire), 7A, 8A, 9A.

**Fait** (`19ccbe6`) :
- **Lâcher ou pousser partout**, même devant un produit : double toucher sur le chariot, R au clavier, X à la manette. Les aides à l'écran le disent.
- **Le héros pousse à bras tendus** (pose provisoire). La Scanette est rangée pendant qu'il pousse, et ressort pour scanner.
- **Roue folle** : en poussant de côté, le chariot tire doucement vers le fond ; le joueur corrige. Réglable (⚙ › Chariot › Roue folle ; 0 = réparée).
- **Le haut-parleur commente**, rarement : le chariot repris, lâché, qui cogne 3 fois en 4 s, ou oublié dans une autre pièce. 8 répliques [TEMP].
- Les réponses sont notées : `docs/GAME_DESIGN.md`, `docs/HISTOIRE.md` (hôtesse, monnaie, réparation), `docs/PERSONNAGES.md` (l'hôtesse).

**Décision prise seule** (détail) : les deux bras tiennent en une seule image, pour rester dans la limite des comptages (40 images dans le rayon). Le remplissage du chariot (9A) demandera d'en parler.

**Vérifié** : 207 tests de logique, dont la roue folle et les chocs ; Knip. 119 essais navigateur (PC et téléphone simulé), dont R, double toucher au doigt et bras tendus ; comptages dans les limites ; aucune erreur console. **Pas vérifié** : le ressenti de la roue folle, la fluidité sur le téléphone.

**Proposition pour la séance suivante** : l'élan qui renverse une pile de cartons (2A).

---

## Séance 74 — 19/11/2026 — Le chariot poussé ; nouvelle règle des questions

**Réponses de l'auteur** :
- 1A : poussé, le chariot passe les portes ; lâché, il reste dans sa pièce ;
- 2ABC : trois utilités (explorer, garde-manger, allié en combat), chacune à son prototype ;
- 3A : le chariot est lourd.

**Nouvelle règle** : questions sans limite de nombre, mais utiles, avec une réponse en une ou deux lettres ; enrichir l'univers sans attendre (`CLAUDE.md`).

**Fait** (`315eb71`) :
- Le héros **pousse** le chariot devant lui. Il est **lourd** : plus lent, démarre et freine moins vite, dérape un peu au demi-tour.
- Au demi-tour, il **se retourne comme une feuille** autour du héros, et **grince**.
- Il **bute** contre le décor.
- **Lâcher / Pousser** : le bouton d'action, quand rien n'est à scanner.
- **Poussé, il passe les portes** avec le héros ; **lâché, il reste** dans sa pièce.
- L'essai de la séance 72 (le chariot qui suit derrière) est retiré du code.
- Réglages : ⚙ › Chariot (distance, vitesse, lourdeur, retournement, portée, taille, capacité).

**Pas encore** : le héros penché (il faut un dessin), l'élan et ses usages, le comptoir.

**Vérifié** : 205 tests de logique (dont 5 sur le chariot poussé : côté, retournement et grincement, lourdeur, butée, portes), Knip. 117 essais navigateur (PC et téléphone simulé), dont 2 nouveaux : pousser, demi-tour, lâcher, reprendre ; passer la porte poussé, rester lâché. Aucune erreur console. **Pas vérifié** : la lourdeur dans le navigateur (temps trop irréguliers : vérifiée par les tests de logique seulement) ; la fluidité sur le téléphone.

**Proposition pour la séance suivante** : selon les réponses, l'élan (première utilité) ou le comptoir.

---

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
