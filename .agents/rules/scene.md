---
trigger: always_on
description: "Règles propres au dossier src/scene/ : rendu PixiJS v8, textures, poses, profondeur, parallaxe, lumière, ombres et règles validées d'accessibilité."
---

# src/scene/ — règles propres à ce dossier

Affichage de la scène sous **PixiJS v8** (WebGL sur PC et smartphone, repli `CanvasRenderer` propre en CI/headless). Vue d'ensemble et leçons des bugs passés : `docs/ARCHITECTURE.md` §4 et §15.

## Moteur et rendu (`renderer.js`)
- Un seul `<canvas>` dans `#game`, initialisé avec **`autoStart: false`** (piloté par la boucle unique de `src/main.js`) et **`preference: ['webgl', 'canvas']`** (ne jamais sonder WebGPU pour éviter les warnings en CI/headless).
- Hiérarchie fixe dans `app.stage` : `worldRoot` (à l'identité, portant `stage.root`) et `dissolveLayer` (`RenderTexture` temporaire de fondu enchaîné, détruite dès la fin de la transition). `backstage` (hors scène) porte les acteurs persistants entre deux lieux.
- Écouter `webglcontextlost` / `webglcontextrestored` sur `app.canvas`.
- **Rien n'est créé pendant le jeu** : `Sprite`, `MeshPlane`, `Graphics` et textures sont préparés au chargement (ou à l'entrée dans un lieu), puis réutilisés.
- **Animations peu coûteuses en jeu** : en boucle de jeu, n'animer que les propriétés de transformation (`x`, `y`, `scale`, `rotation`, `alpha`, `visible`), l'échange de textures préchargées (`poses.js`) ou les sommets d'un `MeshPlane` pré-alloué (`paperFlip.js`). Ne jamais appeler `Graphics.clear()` ni régénérer une texture à chaque image (un redessin ponctuel de `Graphics` n'est permis qu'à un changement d'état rare, comme le début d'un scan). Ne pas modifier un objet `Text` en boucle de jeu (chaque changement redessine un canevas et ré-envoie une texture au GPU ; comparer avant d'écrire ou préférer l'interface HTML / `BitmapText`).
- **Rien n'apparaît « à froid »** : tout ce dont le **lieu actif** a besoin (bulle, effet, pose, carte) est préchargé, décodé et préparé avant que le lieu soit jouable (seulement le lieu actif, pas tout le jeu ; un éventuel pré-envoi GPU explicite sous PixiJS ne s'ajoute qu'après mesure sur l'appareil réel).
- **Fondu au noir** : un seul écran de transition (`.place-fade`) pour tout le jeu, les autres (intro, écran d'erreur) lui passent le relais (`docs/ARCHITECTURE.md` §11).
- **Élément invisible** : un élément invisible ne prend **ni touchers ni sélection** (vaut pour la scène comme pour l'interface : `.agents/rules/ui.md`).
- **Zéro `tint !== 0xffffff` sous `CanvasRenderer`** : sur repli `CanvasRenderer`, toute teinte non-blanche alloue un `<canvas>` caché et appelle `getImageData`. Utiliser des `Graphics` pré-alloués pour les formes colorées (confettis, laser, repères) et réserver `tint` au chemin WebGL (`isWebGL`).
- **Zéro `Filter` WebGL, zéro shader custom et zéro mode de fusion avancé** sur la scène en jeu : compatibilité Android 10 et fluidité garanties. En PixiJS v8, seuls les **modes de fusion simples GPU natifs** restent permis (`'normal'`, `'add'`, `'multiply'`, `'screen'`, `'erase'`, `'none'`, `'inherit'`, ainsi que les variantes `'-npm'` et `'min'`/`'max'` en WebGL2, en évitant d'alterner inutilement pour préserver le batching) ; tous les modes avancés de `pixi.js/advanced-blend-modes` (`'overlay'`, `'darken'`, `'lighten'`, `'hard-light'`, `'soft-light'`, `'color-dodge'`, `'color-burn'`, `'difference'`, `'exclusion'`, `'subtract'`, `'color'`, `'luminosity'`, etc.) sont interdits car ils passent par des `Filter`.
- **Limites d'affichage par lieu (`tests/e2e/comptages-limites.json`)** : le nombre de nœuds d'affichage (`stageNodes`), de plans, de sprites visibles, de textures et de mégapixels est borné par lieu et vérifié par `tests/e2e/comptages.spec.js` (avec `0` élément/canevas/lecture pixel/`RenderTexture` créés en jeu). Une limite ne se relève qu'avec l'accord explicite de l'auteur.
- Pas de règle de jeu ici : la logique vit dans `src/core/`, on ne fait que l'afficher.

## Textures et poses (`assets.js`, `poses.js`)
- Plafond matériel GPU : **≤ `4 096 px`** sur chaque côté (`Math.min(4096, renderer.maxTextureSize)`). Les assets plus grands (ex. `rayon-avant.webp` 4300 px), les `.svg` et le profil `leger` sont redimensionnés une fois au chargement via un seul canevas réutilisé + `createImageBitmap` (zéro `canvas.toBlob` PNG).
- **Libération complète en quittant un lieu** (`releaseImages`) : `texture.destroy(true)`, `bitmap?.close?.()`, et mise à jour des compteurs `assetStats`.
- Les changements de pose passent par **`poses.js`** (échange de référence `sprite.texture` sur le `Sprite` déjà monté, sans réaffectation redondante ni recréation).
- Les poses d'un même élément ont **le même cadre et le même point d'appui** (pas de saut d'une pose à l'autre) ; l'ombre suit le point d'appui et **ne change pas de taille selon la pose**.
- Sur tout **`MeshPlane`** (ex. Paper Flip 2.5D dans `paperFlip.js`), poser **`autoResize = false`** pour empêcher un changement de texture haute définition de redimensionner la géométrie.

## Profondeur et parallaxe
- Le calque `acteurs` utilise `sortableChildren = true` et les niveaux numériques calculés par `depth.js` (`propLevels` / `actorLevel`). Les produits posés sur un meuble (`loose`) reçoivent `levelOf(on) + 0.1`.
- Chaque plan de parallaxe est un `Container` déplacé uniquement en `x = camX * (1 - f)` (figé à `0` pour `f < 1` en profil `leger`). Le coefficient de chaque plan est dans les données du lieu ; **la composition des plans ne change jamais pendant le mouvement**.
- Un plan lointain n'est pas plus grand que nécessaire : sa largeur se calcule d'après la course de la caméra et le coefficient (`largeur visible + course × (1 − coefficient)`) ; un plan presque vide est dimensionné à la mesure de son contenu.
- **Accessibilité parallaxe** : « Réduire les animations » diminue l'amplitude de la parallaxe (confort, mal des transports).
- 🧪 **À TESTER** (pas encore une règle) : le grain et les traits fins peuvent scintiller quand un plan avance de moins d'un pixel par image ; arrondir peut créer des à-coups d'un pixel. Un arrondi éventuel se fait **au pixel physique** (échelle de la scène × densité), jamais au pixel de la scène, de préférence **seulement quand la caméra s'arrête**, avec un interrupteur d'essai (sans arrondi / à l'arrêt / permanent) : l'auteur choisit sur l'appareil réel.

## Lumière, ombres et debug
- **Pas d'éclairage calculé en direct** : la lumière est dessinée dans les images, ou posée en **éléments de lumière et d'obscurité préparés** (halo, pénombre), animés seulement par l'opacité. La désaturation et la saleté de la zone 2 sont **dans les images**.
- Les ombres au sol sont des `Sprite`s séparés du dessin (textures radiales générées une fois au démarrage), qui suivent la profondeur, la hauteur, le point d'appui et les réglages (`shadowOpacity`, `contactShadow`), **sans changer de taille selon la pose**.
- **Néons qui clignotent** : 3 éclairs par seconde au plus, figés par l'option « réduire les clignotements ».
- Les overlays de debug (`debugMask.js`, `debugPerspective.js`) sont construits paresseusement uniquement à l'activation (`F4`/`F6`) et détruits quand désactivés ou au changement de lieu.
