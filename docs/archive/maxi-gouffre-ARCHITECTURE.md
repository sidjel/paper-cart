# MAXI-GOUFFRE — ARCHITECTURE.md

> Charte technique, organisation du code et feuille de route — **Version 2.0** (réécriture complète, novembre 2026)
> Ce document dit **comment le jeu est construit**. Les règles du jeu sont dans `GAME_DESIGN.md` (noté GD).
> En cas de contradiction : GD fait foi pour les règles, ce document pour la technique.

---

## 0. Organisation du travail

### 0.1 Rôles
- **L'auteur** décide du jeu, écrit le contenu final, teste sur PC et sur téléphone, valide chaque jalon.
- **Claude** conçoit et écrit tout le code, les tests, les données provisoires et la documentation technique. Il livre **un jalon complet par échange**.

### 0.2 Où vit le projet
| Lieu | Contenu | Rôle |
|---|---|---|
| **Dépôt GitHub** `maxi-gouffre` | Code, données, assets, docs | **Source de vérité.** Toute session de Claude repart du dépôt. |
| Projet Claude « Maxi_Gouffre » | `GAME_DESIGN.md`, `ARCHITECTURE.md` | Référence pour les échanges. Copiés dans `docs/` du dépôt à chaque nouvelle version. |
| PC de l'auteur | Clone du dépôt | Tests en local, sur PC et sur téléphone via le Wi-Fi |
| GitHub Pages | Contenu de `app/` sur `main` | Version jouable en ligne |

Claude peut travailler depuis une session dans le cloud (sur claude.ai ou le téléphone) ou depuis l'application Claude Code sur le PC. Dans les deux cas, il part du dépôt et y pousse son travail.

### 0.3 Déroulé d'un jalon (un échange)
1. L'auteur écrit « Jalon N » (avec ses retours éventuels sur le jalon précédent).
2. Claude relit les deux documents, vérifie l'état du dépôt, crée la branche `jN-nom` depuis `main`.
3. Claude annonce en quelques lignes le périmètre et les fichiers concernés, **puis enchaîne sans attendre**, sauf question bloquante au sens de GD §0.2.
4. Claude code, écrit les tests, lance toutes les vérifications automatiques (§14), corrige.
5. Claude commite sur la branche, pousse, ouvre une pull request et livre le **rapport de jalon** :
   - ce qui est nouveau et jouable ;
   - **comment le tester** : étapes précises sur PC (avec chaque entrée concernée) et sur téléphone ;
   - captures d'écran (grand écran et téléphone) ;
   - décisions prises seul (copiées dans `DECISIONS.md`) ;
   - limites connues et ce qui pourrait casser.
6. L'auteur teste. Si c'est bon, il fusionne la pull request (ou demande à Claude de le faire), GitHub Pages se met à jour et Claude pose le tag `vN.0-nom`. Sinon, les retours ouvrent un lot de corrections sur la même branche.

### 0.4 Règles de sécurité
- **Périmètre** : ne modifier que ce que le jalon demande. Pas de réécriture spontanée de code qui fonctionne. Si un jalon impose de toucher l'existant, le rapport le dit.
- **Disjoncteur** : un bug qui résiste à 2 tentatives de correction : Claude s'arrête, explique le blocage et propose des pistes.
- **Taille** : moins de **300 lignes** par fichier de code (JSON exclus). Au-delà, découper avant de livrer.
- **Dépendances** : **aucune dépendance d'exécution**, jamais. En développement, seules sont autorisées : `playwright` (tests navigateur) et, au jalon J10, les paquets `@capacitor/*`. Toute autre demande passe par l'auteur.
- **Réseau** : le jeu ne fait **aucun appel réseau externe**. Charger ses propres fichiers (JSON, images, sons) depuis la même origine est autorisé.
- **Git** : jamais de push sur `main`, de force-push, de `reset --hard` ou de suppression de branche sans accord de l'auteur. Pas de secrets dans le dépôt.
- **Documents** : `GAME_DESIGN.md` et `ARCHITECTURE.md` ne changent qu'à la demande de l'auteur ; Claude propose, l'auteur décide.

---

## 1. Stack et contraintes

- **HTML5, CSS3, JavaScript ES2022** en modules natifs (`<script type="module">`). Pas de bundler, pas de framework, pas de TypeScript.
- **Affichage en DOM + CSS** (Grid, Flexbox, transformations 3D). **Interdits** : Canvas, WebGL, Three.js.
- **Serveur HTTP obligatoire** : les modules ne fonctionnent pas en `file://`.
- **Navigateurs cibles** : Chrome, Edge, Firefox récents sur PC ; Chrome pour Android ; WebView Android (Capacitor). Safari n'est pas une cible mais ne doit pas être cassé volontairement.
- **Node.js ≥ 20** pour les outils (tests, serveur, simulation, vérifications). Il n'est pas nécessaire pour jouer.
- **Chemins relatifs uniquement** : le jeu tourne à la racine d'un serveur local, dans un sous-dossier de GitHub Pages (`/maxi-gouffre/`) et dans Capacitor sans modification.
- Polices, images et sons sont **dans le dépôt**.

---

## 2. Arborescence

```
maxi-gouffre/
├── README.md                 présentation, installation, lancement, publication
├── CHANGELOG.md              une entrée par jalon
├── LICENSE                   « Tous droits réservés » (jeu destiné à la vente)
├── package.json              scripts uniquement ; aucune dépendance d'exécution
├── .editorconfig  .gitignore
├── .github/workflows/
│   ├── pages.yml             vérifications puis publication de app/ sur GitHub Pages
│   └── android.yml           (J10) construction d'un APK de test
├── capacitor.config.json     (J10) webDir = "app"
├── docs/
│   ├── GAME_DESIGN.md  ARCHITECTURE.md  DIRECTION_ARTISTIQUE.md
│   ├── PROMPTS_IMAGES.md     consignes de génération d'images pour l'auteur (J1.5)
│   ├── DECISIONS.md          journal des décisions (date, décision, raison)
│   └── CREDITS.md            généré depuis app/data/credits.json
├── app/                      ← LE JEU. Seul dossier publié (web, PWA, Android).
│   ├── index.html
│   ├── manifest.webmanifest  sw.js        (J10, optionnels)
│   ├── css/                  tokens.css  base.css  layout.css  board.css  cards.css  screens.css  debug.css
│   ├── assets/
│   │   ├── fonts/
│   │   ├── img/              cards/  rooms/  ui/
│   │   └── audio/            music/  sfx/
│   ├── data/                 cards.json  recipes.json  campaign.json  rooms.json  combats.json
│   │                         npcs.json  events.json  dialogues.json  strings.json  credits.json
│   │                         arenas.json (supports de plateau, J1.5)  scenarios.json (chargé seulement en mode debug)
│   └── src/
│       ├── main.js           démarrage et câblage
│       ├── config.js         constantes gelées
│       ├── core/             LOGIQUE PURE, sans DOM : rng.js  rules.js  time.js  board.js
│       │                     effects.js  match.js  ai.js  fusion.js  trade.js  campaign.js
│       ├── narrator/         narrator.js (choix des répliques, pur)
│       ├── content/          loader.js  validate.js  expand.js (plats → 3 stades)
│       ├── app/              StateMachine.js  Store.js  EventBus.js  Scheduler.js  Session.js
│       ├── ui/               dom.js (petit utilitaire de création d'éléments)  Stage.js (mise à l'échelle)
│       │   ├── components/   Card.js  Board.js  Hand.js  NarratorBox.js  Dialog.js  Inspect.js …
│       │   └── screens/      warning.js  pressKey.js  title.js  intro.js  form.js  exploration.js
│       │                     prepHand.js  combat.js  collection.js  kitchen.js  merchant.js
│       │                     loot.js  options.js  pause.js  ending.js  credits.js  rotate.js
│       ├── input/            InputHandler.js  keyboard.js  pointer.js  gamepad.js  FocusManager.js  bindings.js
│       ├── audio/            AudioManager.js
│       ├── save/             SaveManager.js  migrations.js
│       ├── platform/         platform.js (web / Android, cycle de vie, plein écran, orientation)
│       │   └── storage/      webStorage.js  nativeStorage.js (J10)
│       └── debug/            DebugPanel.js  scenarios.js
├── tests/
│   ├── unit/                 *.test.js (node --test)
│   ├── helpers/              chargement des données sous Node, fabriques d'états
│   ├── simulation/           simulate.js (1 000 matchs, rapport)
│   └── e2e/                  smoke.mjs  play-match.mjs … (Playwright)
├── tools/                    serve.mjs  check.mjs  validate-data.mjs  check-size.mjs  credits.mjs  screenshots.mjs
└── android/                  (J10) projet Android généré par Capacitor
```

**Nommage** : fichiers de classes en `PascalCase.js`, modules de fonctions en `camelCase.js`, données et assets en minuscules sans accents ni espaces (`banane_1.webp`). Code et identifiants en anglais, textes joueur en français dans les JSON.

---

## 3. Scripts (`package.json`)

| Commande | Rôle |
|---|---|
| `npm run serve` | Serveur local sur `app/` (port 8080, accessible depuis le téléphone sur le même Wi-Fi : `http://IP-du-PC:8080`). Sans Node : `python -m http.server 8080 -d app`. |
| `npm test` | Tests unitaires (`node --test tests/unit`) |
| `npm run check` | Validation des données + taille des fichiers + recherches interdites (`Math.random` dans `core/`, `innerHTML` avec des données joueur, URL externes) + tests unitaires |
| `npm run sim` | Simulation d'équilibrage (`-- --games 1000 --level gamer`) |
| `npm run e2e` | Tests navigateur Playwright (nécessite `npm install` une fois) |
| `npm run shots` | Captures d'écran aux 3 tailles de référence |
| `npm run credits` | Régénère `docs/CREDITS.md` depuis `app/data/credits.json` |

---

## 4. Principes d'architecture

- **Le cœur est pur.** `core/` et `narrator/` ne touchent jamais au DOM, à `window`, au stockage ni à l'heure. Ils s'exécutent sous Node.
- **Actions pures** : chaque action du cœur reçoit `(state, args, ctx)` et renvoie `{ state, events }`. Elle commence par copier l'état (`structuredClone`) et ne modifie jamais l'original.
- **Contexte** `ctx` : `{ defs, rules }`. `defs` = données chargées et validées ; `rules` = valeurs de jeu de la partie (constantes de `config.js` + options qui les modifient, comme `STAGE_LENGTH`). Le cœur lit `ctx.rules`, jamais `config.js` directement.
- **Valeurs dérivées recalculées** : scores, P effectives, effets actifs et raisons d'inactivité ne sont jamais stockés. `effects.evaluate(state, ctx)` les recalcule à la demande.
- **Événements** : le cœur **renvoie** ses événements ; il n'importe pas l'EventBus. `Session.js` applique l'action, remplace l'état dans le `Store`, puis publie les événements sur l'`EventBus`. L'interface, le narrateur et l'audio écoutent.
- **Une seule source de vérité par donnée** : la Glacière est une liste d'`uid` dans la partie (aucun drapeau sur la carte) ; le stade verrouillé vit dans la case du plateau.
- **Hasard** : uniquement par `core/rng.js`, générateur à graine dont l'état (un entier) est stocké dans la partie : `next(rngState) → { value, rngState }`. `Math.random()` est interdit dans `core/`. Graine : **nouvelle partie** = tirée de l'heure puis sauvegardée ; **simulation** = graine de base + numéro de partie ; **debug** = saisie.
- **Contenu en JSON, validé au chargement** : une donnée invalide produit une erreur explicite qui nomme le fichier, l'élément et le champ.
- **Temps réel** : aucune boucle continue pour la logique. `requestAnimationFrame` sert aux animations et au sondage de la manette. Les délais passent par `Scheduler` (annulable, mis en pause avec le jeu).
- **Erreurs** : jamais silencieuses, préfixées `[MG]` en console. Une erreur fatale affiche un écran « Le magasin a planté » avec le message et un bouton pour revenir au titre.
- **Pas de variable globale**, une responsabilité par module, code partagé dans un module dédié plutôt que dupliqué.
- **Sécurité des textes** : tout texte venant du joueur (prénom) ou des données s'insère par `textContent`, jamais par `innerHTML`.

---

## 5. Modèle d'état

### 5.1 Partie (`GameState`, sauvegardée)
```js
{
  version: 1,
  seed: 123456, rng: 987654,                 // graine d'origine et état courant du générateur
  clock: 0, act: 1, roomId: 'z1_kevin',
  visitedRooms: [], doorPool: [], doorOffer: [],
  collection: [{ uid: 'c001', cardId: 'banane', age: 0 }],
  nextUid: 2,
  fridgeUnlocked: false, fridge: [],         // liste d'uid
  defeats: { c2_influenceur: 0 },
  seenDialogues: [], narrator: { lastByLine: {}, lastSpontaneous: 0 },
  combatSnapshot: null                       // Collection d'avant combat (défaite, reprise)
}
```

### 5.2 Match (`MatchState`, jamais sauvegardé : un match interrompu reprend au début)
```js
{
  combatId: 'c2_influenceur', flags: { singleRound: false, guided: false, noLoot: false, overtime: false },
  round: 1, starter: 'player', turn: 'player', chifoumiWinner: 'player',
  wins: { player: 0, opponent: 0 }, roundScores: [],          // [{ player, opponent }]
  passed: { player: false, opponent: false },
  panic: { player: 0, opponent: 0 },                          // tours restants sans pouvoir passer
  hands: { player: ['c001'], opponent: ['o001'] },
  discard: { player: [], opponent: [] },
  board: { player: Array(10).fill(null), opponent: Array(10).fill(null) },
  opponentCards: { o001: { uid: 'o001', cardId: 'influenceur', stage: 1 } },
  actionsThisRound: 0
}
// Case : null | { uid, owner, lockedStage, transferBonus }
// Index de case = row * GRID_COLS + col ; row 0 = ligne Avant, col 0 = colonne de gauche vue par le joueur.
```
Pendant un combat, l'état complet est `{ game, match }` : les âges des cartes du joueur restent dans `game.collection`.

---

## 6. Contrats des modules

| Module | Fonctions clés |
|---|---|
| `core/rng.js` | `seedFrom(n)`, `next(rng)`, `int(rng, max)`, `pick(rng, list)`, `shuffle(rng, list)` — chacune renvoie la valeur et le nouvel état |
| `core/rules.js` | `buildRules(config, options)` → `ctx.rules` |
| `core/time.js` | `stageOf`, `activeStage`, `advanceTime(state, crans, reason, ctx)` → événements `CARD_STAGE_CHANGED`, `CARD_ROTTEN`, `CLOCK_MILESTONE` |
| `core/board.js` | `cellIndex`, `cellPos`, `neighbors`, `facing`, `isPlaceable(state, uid, ctx)`, `legalCells(state, side, uid, ctx)` |
| `core/effects.js` | `evaluate(state, ctx)` → `{ cards: { uid: { power, effectActive, inactiveReason } }, score: { player, opponent } }` ; `resolvePlacement(state, uid, cell, choice, ctx)` ; `settle(state, ctx)` (EAT) ; `transferTargets(state, uid, ctx)` |
| `core/match.js` | `createMatch(game, combatId, handUids, ctx)`, `setChifoumi`, `setStarter`, `legalMoves(state, side, ctx)`, `playCard(state, side, uid, cell, choice, ctx)`, `pass(state, side, ctx)`, `endRound`, `matchWinner`, `finishMatch(state, ctx)` → retour des cartes, offres de butin |
| `core/ai.js` | `chooseMove(state, level, ctx, rng)` → `{ type: 'play', uid, cell, choice } \| { type: 'pass' }` ; `chooseStarter` ; `chooseTransferTarget` |
| `core/fusion.js` | `availableRecipes(game, ctx)`, `fuse(game, { ingredients, mixer, battery, scotch }, ctx)` |
| `core/trade.js` | `soldeurOffers(game, ctx)`, `trade(game, givenUid, choice, ctx)` |
| `core/campaign.js` | `newGame(seed, ctx)`, `enterRoom`, `offerDoors`, `chooseDoor`, `applyEventOutcome`, `startCombat`, `winCombat`, `loseCombat`, `setFridge`, `talkToNpc` |
| `narrator/narrator.js` | `pick(trigger, context, history, now, settings, rng)` → `{ line, history }` (conditions, variables, délais) |
| `content/loader.js` | `loadAll(fetcher)` : même code dans le navigateur (`fetch`) et sous Node (`fs`) |
| `app/Session.js` | seul point qui appelle les actions du cœur, met à jour le `Store`, publie les événements, déclenche les sauvegardes |
| `app/StateMachine.js` | états du GD §3, transitions autorisées, superposition, journal |
| `save/SaveManager.js` | API **asynchrone** : `load()`, `save(game)`, `loadOptions()`, `saveOptions()`, `loadProfile()`, `saveProfile()`, `clearAll()`, `exportFile()`, `importFile(file)`, `migrate(data)` |
| `input/InputHandler.js` | émet des actions abstraites (`UP`, `DOWN`, `LEFT`, `RIGHT`, `CONFIRM`, `CANCEL`, `PASS`, `INSPECT`, `PAUSE`, `TAB_PREV`, `TAB_NEXT`, `DEBUG`) et `POINTER_SELECT(target)`, plus `INPUT_SOURCE_CHANGED(keyboard\|mouse\|gamepad\|touch)` |
| `input/FocusManager.js` | zones, navigation en grille, mémoire du dernier focus, cases légales |
| `audio/AudioManager.js` | `unlock()`, `play(id)`, `music(id)`, `setVolume(bus, v)`, `duck(on)`, `suspend()`, `resume()` |
| `platform/platform.js` | `isNative`, `onPause(cb)`, `onResume(cb)`, `onBack(cb)`, `requestFullscreen()`, `isPortrait()` |

**Événements publiés** : `CARD_PLAYED`, `CARD_DESTROYED`, `CARD_STAGE_CHANGED`, `CARD_ROTTEN`, `PANIC_APPLIED`, `TRANSFER_APPLIED`, `PLAYER_PASSED`, `ROUND_ENDED`, `MATCH_ENDED`, `BAD_MOVE`, `CLOCK_MILESTONE`, `FUSION_DONE`, `ROOM_ENTERED`, `NPC_DEATH`, `OPTION_CHANGED`, `STATE_CHANGED`.

---

## 7. Formats de données (extraits)

Chemins d'images relatifs à `app/`. Une image absente s'écrit `null` : la carte affiche alors son illustration provisoire (aucune requête 404).

```jsonc
// cards.json — carte normale
{ "id": "banane", "family": "banane", "tags": ["aliment"],
  "stages": [
    { "name": "Banane Verte", "power": 2, "effects": [], "tags": [], "image": null, "flavor": "[TEMP] …" },
    { "name": "Banane Parfaite", "power": 6, "effects": [], "tags": [], "image": null, "flavor": "[TEMP] …" },
    { "name": "Bouillie Brune", "power": -1, "effects": [{ "type": "ZONE_MALUS" }], "tags": ["malus"], "image": null, "flavor": "[TEMP] …" }
  ] }
// Outil : "power": null, "placeable": false au stade concerné
// Effets : { "type": "BOOST", "scope": "neighbors", "condition": { "stage": 1 } }
//          { "type": "BOOST", "scope": "backRow" } · { "type": "SCORE_BONUS", "value": 2 }
//          { "type": "DESTROY_FACING", "condition": { "stage": 1 } } · { "type": "EAT", "target": { "family": "steak", "stage": 3 } }

// cards.json — plat (étendu en 3 stades par content/expand.js)
{ "id": "ado_muet", "family": "ado_muet", "dish": true, "tags": ["plat", "humain"],
  "name": "Ado Muet", "power": 8, "effects": [{ "type": "CANCEL_FACING" }], "image": null, "flavor": "[TEMP] …" }

// recipes.json
{ "id": "plante_mutante", "ingredients": [{ "family": "plante" }, { "family": "pile", "stage": 3 }], "result": "plante_mutante" }

// campaign.json
{ "act1": ["z1_kevin", "z1_tuto", "z1_kitchen", "z1_vieux", "z1_chad"], "revelation": "revelation",
  "act2Pool": ["z2_c3", "z2_c4", "z2_c5", "z2_kitchen", "z2_fridge", "z2_soldeur", "z2_event"], "act3": ["boss"],
  "startingCollection": [{ "card": "banane", "age": 0 }] }

// rooms.json
{ "id": "z2_kitchen", "zone": 2, "type": "KITCHEN", "images": [null, null, null],
  "narratorTags": ["room_kitchen"], "doorLabel": "Porte grise" }

// combats.json
{ "id": "boss", "opponent": "Le Gérant", "handBudget": 55, "rules": ["overtime", "noLoot"],
  "hand": [{ "card": "kevin", "stage": 3 }], "startingBoard": [{ "card": "cassette", "stage": 3, "cell": 2 }] }

// npcs.json
{ "id": "kevin", "name": "Kévin", "lines": ["[TEMP] …"], "choice": null, "gives": [{ "card": "kevin", "age": 0 }, { "card": "mixeur", "age": 0 }] }

// events.json
{ "id": "caddie", "text": "[TEMP] …", "choices": [{ "label": "[TEMP] Payer", "outcome": { "type": "crans", "value": 2 } }] }

// dialogues.json
{ "id": "inactivity_1_a", "trigger": "INACTIVITY_1", "conditions": { "states": ["EXPLORATION", "COMBAT"] },
  "text": "[TEMP] Tu dors, {prenom} ?", "weight": 1, "cooldownSec": 600, "tags": ["inactivite"] }

// credits.json (registre unique des assets)
{ "file": "assets/fonts/xxx.woff2", "author": "…", "source": "…", "license": "OFL-1.1", "commercial": true, "date": "2026-11-06", "usage": "police d'affichage" }

// scenarios.json (debug) : plateau et mains imposés pour tester une règle à la main
{ "id": "chat_vs_bacterie", "label": "Chat posé après une Bactérie", "board": { … }, "hands": { … }, "turn": "player" }
```

Les étiquettes affichées en français correspondent à des identifiants ASCII en minuscules (`surgele`, `malus`, `outil`, `fermentation`, `aliment`, `plat`…).

---

## 8. Rendu et interface

### 8.1 Scène mise à l'échelle
- Tout le jeu est dessiné dans une **scène logique de taille fixe**, mise à l'échelle par une transformation CSS pour remplir l'écran sans déformer (bandes de décor sur les côtés si besoin).
- **Deux profils**, choisis selon la fenêtre et recalculés au redimensionnement :
  - `wide` : scène 1920×1080, pour PC et tablettes ;
  - `compact` : scène 1280×720, avec faces de cartes compactes (GD §17.4), quand la fenêtre fait moins de `COMPACT_MAX_WIDTH` × `COMPACT_MAX_HEIGHT` px CSS.
- Les tailles exactes (cartes, main, panneaux) sont fixées au jalon J1 d'après des captures validées par l'auteur. Objectifs : zones à toucher ≥ `TOUCH_MIN_PX` px réels, texte ≥ 12 px réels.
- En portrait sur téléphone : écran `rotate` superposé et pause.

### 8.2 Composants
- Un écran = un module `screens/x.js` avec `mount(root, ctx)`, `update(state)`, `unmount()`.
- **Carte** : un conteneur (survol, focus, sélection) qui contient l'élément qui pivote (face avant, face arrière, `backface-visibility: hidden`).
- Plateau 2.5D par `perspective` et `transform-style: preserve-3d` ; « à plat » = une classe CSS.
- Classes d'état : `is-focused`, `is-selected`, `is-legal`, `is-stage-locked`, `is-in-fridge`, `is-effect-inactive`, `is-effect-cancelled`, `stage-1`, `stage-2`, `stage-3`, `is-malus`.
- **Tokens CSS** (couleurs, tailles, durées, palettes de zone) dans `tokens.css`. Pas de style inline, sauf variables CSS.

### 8.3 Animations et accessibilité
- Transitions et animations CSS. Respect de `prefers-reduced-motion` et de l'option « Réduire les clignotements ».
- Focus visible, rôles et libellés ARIA sur cartes et boutons, contrastes ≥ 4,5:1, taille du texte par variable CSS.

---

## 9. Entrées

- `InputHandler` lit **clavier**, **pointeur** (Pointer Events : souris et tactile, distingués par `pointerType`) et **manette** (API Gamepad, sondée par `requestAnimationFrame`). Il émet uniquement des actions abstraites. Le cœur et les écrans ne lisent jamais une touche.
- **Manette** : zone morte `DEADZONE` (0,2), déclenchement à `STICK_TRIGGER` (0,5), réarmement sous `DEADZONE`, un appui = un déplacement, axe dominant (pas de diagonale).
- **Tactile** : toucher = `POINTER_SELECT` ; appui long de `LONG_PRESS_MS` (500 ms) = `INSPECT` ; un déplacement de plus de `TAP_SLOP_PX` (10 px) annule l'appui. Menu contextuel du navigateur, zoom au double toucher et rafraîchissement par glissement désactivés (`touch-action`, `overscroll-behavior`, balise `viewport`).
- **Souris** : le survol déplace le focus ; clic droit = `INSPECT`.
- **Bouton retour Android** : `CANCEL` s'il y a quelque chose à annuler, sinon `PAUSE`.
- Les correspondances clavier et manette sont stockées dans les options (`bindings.js` fournit les valeurs par défaut).

---

## 10. Audio

- `AudioManager` (Web Audio API) est le **seul** accès au son : 4 bus (général, musique, effets, narrateur) en nœuds de gain, fondu enchaîné de 1 s, baisse de 30 % de la musique pendant une réplique, préchargement par acte.
- Aucun son avant `unlock()` (écran PRESS_KEY). Son suspendu quand le jeu passe en arrière-plan.
- Formats : OGG, MP3 en secours. Tant que l'auteur n'a pas fourni les sons, Claude produit des bruitages provisoires synthétiques, enregistrés dans le registre des assets.

---

## 11. Sauvegarde

- `SaveManager` est la **seule** porte d'accès au stockage, à travers un adaptateur :
  - `webStorage.js` (`localStorage`) pour le navigateur ;
  - `nativeStorage.js` (plugin Capacitor Preferences) pour Android, au jalon J10.
- Clés : `maxi-gouffre.options`, `maxi-gouffre.profile`, `maxi-gouffre.save`.
- API **asynchrone** dès le départ. Sur le web, demande de stockage persistant (`navigator.storage.persist()`), refus ignoré proprement.
- Données versionnées (`version`) avec migrations. Sérialisation complète avant écriture. Sauvegarde corrompue : ignorée avec un message clair.
- Export : fichier JSON téléchargé. Import : version et structure vérifiées ; un fichier invalide est refusé avec un message.

---

## 12. Plateformes et publication

| Cible | Comment | Jalon |
|---|---|---|
| **Local PC** | `npm run serve`, puis `http://localhost:8080` | J0 |
| **Local téléphone** | même serveur, `http://IP-du-PC:8080` sur le même Wi-Fi | J0 |
| **GitHub Pages** | `pages.yml` : à chaque fusion sur `main`, `npm run check` puis publication de `app/` | J0 |
| **Hors ligne dans le navigateur (PWA)** | `manifest.webmanifest` + `sw.js` (cache versionné de tout `app/`), installable depuis Chrome | J10, optionnel |
| **Android** | Capacitor (`webDir: "app"`), orientation paysage, plein écran, bouton retour, cycle de vie, stockage natif ; APK de test construit par `android.yml` ou dans Android Studio | J10 |

- **GitHub Pages** : gratuit avec un dépôt **public** ; avec un dépôt privé, il faut un abonnement GitHub payant. Réglage du dépôt : *Settings → Pages → Source : GitHub Actions*.
- **Mode debug** : activé par `?debug=1` dans l'URL (ou par une option cachée dans l'APK de test). Désactivé par défaut partout.

---

## 13. Constantes techniques (`config.js`)

`config.js` regroupe les valeurs de jeu de GD §19 et les valeurs techniques ci-dessous, dans des objets gelés (`Object.freeze`). Aucune valeur numérique en dur ailleurs, hors CSS (tokens).

| Constante | Valeur | Constante | Valeur |
|---|---|---|---|
| `WIDE_STAGE` | 1920 × 1080 | `COMPACT_STAGE` | 1280 × 720 |
| `COMPACT_MAX_WIDTH` / `COMPACT_MAX_HEIGHT` 🔶 | 1100 / 620 | `TOUCH_MIN_PX` | 44 |
| `LONG_PRESS_MS` | 500 | `TAP_SLOP_PX` | 10 |
| `DEADZONE` / `STICK_TRIGGER` | 0,2 / 0,5 | `BOARD_PERSPECTIVE` (px) / `BOARD_TILT` (°) | 1200 / 25 |
| `AUDIO_CROSSFADE_MS` | 1000 | `AUDIO_DUCK_RATIO` | 0,7 |
| `SAVE_VERSION` | 1 | `STORAGE_PREFIX` | `maxi-gouffre.` |

---

## 14. Vérifications

### 14.1 Tests unitaires (`node --test`), obligatoires sur le cœur
- Stade et âge : Surgelé, plafond, changement de vitesse de pourrissement.
- Temps : tout vieillit sauf la Glacière ; stade verrouillé sur le plateau puis recalculé à la sortie ; cartes de l'IA sans âge ; poses de l'IA sans cran.
- Pose : légalité, Malus chez l'adversaire, camp plein, Outils non posables.
- Passer : définitif ; confirmation côté interface ; PANIC sur un seul tour, sans effet après un passe, levé si aucun coup possible.
- Cas limites du GD §9.12, dont le garde-fou `MAX_ACTIONS_PER_ROUND`.
- Score : plancher, boosts, malus de zone, score bonus, transferts.
- Chaque effet en ligne Avant et en ligne Arrière, avec `effectActive` et `inactiveReason`.
- Priorités : Chat et Bactérie dans les deux ordres, Chat en ligne Arrière inactif, CANCEL, CANCEL_FACING sur une carte posée après, Explosion Électrique chez l'adversaire, TRANSFER (0, 1 ou plusieurs voisins), une carte ne se cible pas elle-même.
- Manche nulle, départage (3 niveaux), qui commence, règles spéciales `singleRound`, `guided`, `noLoot`, `overtime`.
- Après match : retour des cartes, butin ; défaite : Collection restaurée puis pénalité.
- Fusion : recettes, stade imposé, Scotch joker et pénalité avant division, Mixeur selon le stade, Pile de carburant distincte.
- Glacière, Soldeur, tirage des portes (reproductible avec la même graine).
- Narrateur : délais, variables, variante sans variable.
- Sauvegarde : aller-retour asynchrone, migration, import invalide refusé.
- Données : chaque fichier JSON passe la validation.

### 14.2 Tests navigateur (Playwright)
- **Smoke** à chaque jalon : la page se charge aux tailles 1920×1080, 1280×720 et 844×390 (téléphone en paysage) **sans aucune erreur ni avertissement console** ; captures enregistrées.
- **Parcours** ajoutés au fil des jalons : jouer un match complet au pointeur, au clavier ; enchaîner l'Acte I ; recharger puis « Continuer ».

### 14.3 Simulation (`npm run sim`)
Les mesures du GD §20.7. Le rapport (texte) est joint au rapport de jalon à partir de J2.

### 14.4 Panneau debug (`?debug=1`, touche F3 ou bouton « DBG »)
État courant en JSON, journal des transitions, FPS, graine (lecture et saisie), forcer l'âge d'une carte, ajouter une carte, avancer l'horloge, aller à une salle, gagner ou perdre le combat en cours, **charger un scénario** de `scenarios.json` pour vérifier une règle à la main.

### 14.5 Checklist de fin de jalon
**Vérifié par Claude**
- [ ] `npm run check` vert (données, tailles, recherches interdites, tests unitaires)
- [ ] Tests navigateur verts aux 3 tailles, console sans erreur ni avertissement
- [ ] Captures jointes au rapport
- [ ] Aucune valeur ni contenu en dur
- [ ] `CHANGELOG.md`, `DECISIONS.md`, `README.md` et registre des assets à jour

**Vérifié par l'auteur**
- [ ] Jouable sur PC avec chaque entrée concernée par le jalon
- [ ] Jouable au doigt sur téléphone
- [ ] Manette (à partir de J3), son (à partir de J9b), APK (J10)

---

## 15. Performance et qualité

- 60 images par seconde en combat sur PC moyen et téléphone milieu de gamme ; chargement initial < 3 s ; assets chargés par acte ; poids total < 150 Mo.
- JSDoc sur les fonctions publiques ; commentaires courts qui expliquent le **pourquoi**.
- Images en WebP (illustrations 768×768), sons en OGG.

---

## 16. Git

- `main` = toujours jouable, publié sur GitHub Pages. Une branche par jalon (`j1-premier-match`), plus des branches `fix-…` pour les corrections isolées.
- Commits conventionnels (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), en français ou en anglais mais de façon constante. Claude commite librement **sur la branche du jalon**.
- Fusion dans `main` par pull request, après validation de l'auteur. Tag `vN.0-nom` après fusion (ex. `v1.0-premier-match`).

---

## 17. Assets et crédits

- Registre unique : `app/data/credits.json` (fichier, auteur, source, licence, usage commercial, date, usage). L'écran Crédits le lit ; `npm run credits` en tire `docs/CREDITS.md`. **Un asset absent du registre est refusé** par `npm run check`.
- Polices OFL récupérées depuis un paquet npm de polices au moment du développement, puis **copiées** dans `app/assets/fonts/` (aucune dépendance au jeu).
- Illustrations et sons provisoires produits par Claude (SVG/CSS dans le style prospectus, bruitages synthétiques), remplacés au fil de l'eau par ceux de l'auteur. Claude convertit les fichiers fournis aux bons formats.

---

## 18. Feuille de route

Chaque jalon tient en **un échange** et se termine par quelque chose de **jouable dans le navigateur**, sur PC et sur téléphone.

| Jalon | Contenu | Ce que l'auteur teste |
|---|---|---|
| **J0 — Socle et mise en ligne** | Dépôt, arborescence, scripts, `README`, `LICENSE`, publication GitHub Pages ; `index.html`, scène mise à l'échelle (profils `wide` et `compact`), écran « Tourne ton téléphone », tokens CSS et polices provisoires ; chargement et validation des données ; `rng`, `config`, `EventBus`, `Scheduler`, `StateMachine` ; panneau debug ; écran titre provisoire ; tests unitaires et smoke | L'URL GitHub Pages s'ouvre sur PC et téléphone ; l'écran s'adapte à la fenêtre ; le portrait affiche le message ; `?debug=1` montre l'état et les FPS |
| **J1 — Premier match jouable** | Les 20 cartes et 6 plats en données (P, stades, étiquettes ; effets présents mais pas encore résolus) ; plateau 2.5D et à plat ; main ; sélection et pose au pointeur (souris et doigt) ; cartes Malus ; passer avec confirmation ; scores en direct ; 3 manches, manche nulle, départage, qui commence ; chifoumi ; IA « Noob » ; écran de fin de match ; entrée « Combat rapide » depuis le titre | Jouer un match complet contre l'IA à la souris puis au doigt |
| **J1.5 — Habillage du combat et de l'accueil** | Selon `DIRECTION_ARTISTIQUE.md` §12 : illustrations SVG des 20 cartes (3 stades) et 6 plats, `docs/PROMPTS_IMAGES.md` ; nouvelles faces, rendu par stade, finitions `matte` / `promo` / `limited` / `greasy` avec reflets (souris, gyroscope) ; états d'interaction (contour, scintillement, scanner à la pose) ; plateau posé sur un support réel (tapis de caisse pour le combat rapide, table de démonstration pour Chad), `arenas.json` ; interface intégrée au décor (afficheur de caisse, tickets, étiquette électronique, haut-parleur, boutons de caisse, pioche en vrac, bac de démarque) ; caméras de surveillance avec avatars et expressions ; ticket de fin de manche, rideau de fer, gants du chifoumi ; écran d'accueil (portes coulissantes, enseigne néon, panneaux de rayon, caddie, portes qui se referment) | Rejouer un combat rapide sur PC et téléphone : tout est dans le décor, les cartes brillent selon leur rareté ; ouvrir le jeu et voir les portes s'ouvrir |
| **J2 — Effets, vieillissement, IA Gamer** | Les 10 effets avec lignes, priorités, raisons d'inactivité ; PANIC, TRANSFER avec choix ; vieillissement : âge, crans, stade verrouillé, changement de face en main, horloge, jauge ; inspection (clic droit, appui long, I) ; IA « Gamer » ; simulation et premier rapport ; scénarios debug | Voir une carte pourrir en plein match ; vérifier Chat contre Bactérie et les autres règles avec les scénarios ; perdre contre l'IA Gamer |
| **J3 — Clavier, manette, focus** | `FocusManager` complet, clavier, manette (branchement à chaud, pause auto), glyphes selon l'entrée, bouton retour Android simulé | Jouer un match entier au clavier seul, puis à la manette seule |
| **J4 — Campagne** | Machine à états complète ; exploration (salles, portes, tirage sans remise, graine) ; Acte I complet (Kévin, tutoriel guidé, cuisine provisoire, Vieux Monsieur, Chad) ; Révélation provisoire ; Acte II (combats C3 à C5, autres salles provisoires) ; préparation de main ; Collection ; butin ; défaite et rejeu ; crans d'exploration ; sauvegarde automatique, Continuer ; pause | Lancer une partie, finir l'Acte I, recharger la page, reprendre au bon endroit |
| **J5 — Cuisine, Glacière, Soldeur, événements** | Fusion complète (Mixeurs, Scotch, Pile), Cuisine guidée et libre, Glacière, Soldeur, événements absurdes | Faire un Milkshake guidé ; congeler une carte ; troquer un Papier Toilette |
| **J6 — Narrateur et avant-jeu** | Moteur du narrateur, ~120 répliques `[TEMP]`, machine à écrire et blips, tous les déclencheurs, bavardage ; WARNING, PRESS_KEY, titre, intro terminal, bouton qui fuit (souris, focus, doigt), formulaire ; scène de mort du Vieux Monsieur ; Révélation mise en scène | Une nouvelle partie de zéro, le narrateur réagit à tout |
| **J7 — Options, sauvegarde complète, accessibilité** | Toutes les options du GD §15.4, remappage, taille du texte, réduction des clignotements ; effacer mes données ; export et import ; sauvegarde corrompue ; passe d'accessibilité | Changer chaque option ; exporter puis importer ; tout effacer |
| **J8 — Contenu complet et fin** | 6 combats aux budgets prévus, boss avec Heures sup', Acte III, fin, crédits ; variantes de salles ; équilibrage par la simulation avec propositions chiffrées à l'auteur | Une partie complète d'environ 30 minutes |
| **J9a — Finition visuelle** | Intégration des illustrations et décors fournis par l'auteur (conversion WebP) ; tremblement, particules, arrêt sur image, glisser-déposer ; variantes de décor ; 60 fps sur téléphone | Vérifier le rendu final et la fluidité sur téléphone |
| **J9b — Audio** | Direction musicale (`DIRECTION_ARTISTIQUE.md` §10, à compléter avant) ; `AudioManager` complet, sons provisoires puis sons de l'auteur ; ambiances par zone et par support | Écouter le jeu de bout en bout |
| **J10 — Android et hors ligne** | Capacitor, stockage natif, bouton retour, cycle de vie, orientation, plein écran, icônes et écran de démarrage provisoires ; APK de test par GitHub Actions ; PWA optionnelle ; contrôle final de conformité (registre complet, console propre, checklist) | Installer l'APK sur le téléphone et jouer sans réseau |

Un jalon trop gros pour un seul échange est coupé en `Na` et `Nb`, annoncé dès le début de l'échange.

---

## 19. Interdits (résumé)

Canvas, WebGL, Three.js · frameworks et bundlers · dépendance d'exécution · CDN et ressources externes · `Math.random()` dans `core/` · valeur ou contenu en dur · lecture des touches hors `InputHandler` · stockage hors `SaveManager` · `innerHTML` avec un texte du joueur · push sur `main` ou force-push sans accord · asset absent du registre · règle de jeu inventée sans la signaler.

---

## 20. Révisions

- **v1.0** : document initial (développement avec Antigravity).
- **v1.1** : graine du hasard, vieillissement continu, raisons d'inactivité, sauvegarde asynchrone.
- **v2.0** (novembre 2026) : réécriture complète pour un développement **avec Claude, de zéro**. Dépôt GitHub source de vérité ; un jalon complet par échange (J0 à J10) avec rapport et tests ; dossier `app/` seul publié ; publication GitHub Pages ; tactile, profils d'écran `wide` / `compact`, mobile et Android (Capacitor) ; contexte `ctx.rules` à la place des constantes modifiables ; actions pures avec `structuredClone` ; valeurs dérivées recalculées ; Glacière et stade verrouillé à source unique ; données sorties de `src/` ; registre `credits.json` ; scénarios debug ; tests navigateur Playwright.
- **v2.1** (novembre 2026) : ajout de `DIRECTION_ARTISTIQUE.md` ; nouveau jalon **J1.5 — Habillage du combat et de l'accueil** ; J9 coupé en J9a (visuel) et J9b (audio) ; `arenas.json` et `PROMPTS_IMAGES.md`.
