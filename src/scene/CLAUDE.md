# src/scene/ — règles propres à ce dossier

Affichage de la scène sous **PixiJS v8** (WebGL sur PC et smartphone, repli `CanvasRenderer` propre en CI/headless). Vue d'ensemble et leçons des bugs passés : `docs/ARCHITECTURE.md` §4 et §15.

## Moteur et rendu (`renderer.js`)
- Un seul `<canvas>` dans `#game`, initialisé avec **`autoStart: false`** (piloté par la boucle unique de `src/main.js`) et **`preference: ['webgl', 'canvas']`** (ne jamais sonder WebGPU pour éviter les warnings en CI/headless).
- Hiérarchie fixe dans `app.stage` : `worldRoot` (à l'identité, portant `stage.root`) et `dissolveLayer` (`RenderTexture` temporaire de fondu enchaîné, détruite dès la fin de la transition). `backstage` (hors scène) porte les acteurs persistants entre deux lieux.
- Écouter `webglcontextlost` / `webglcontextrestored` sur `app.canvas`.
- **Rien n'est créé pendant le jeu** : `Sprite`, `MeshPlane`, `Graphics` et textures sont préparés au chargement (ou à l'entrée dans un lieu), puis réutilisés.
- **Zéro `tint !== 0xffffff` sous `CanvasRenderer`** : sur repli `CanvasRenderer`, toute teinte non-blanche alloue un `<canvas>` caché et appelle `getImageData`. Utiliser des `Graphics` pré-alloués pour les formes colorées (confettis, laser, repères) et réserver `tint` au chemin WebGL (`isWebGL`).
- **Zéro `Filter` WebGL et zéro shader custom** sur la scène en jeu : compatibilité Android 10 garantie.
- Pas de règle de jeu ici : la logique vit dans `src/core/`, on ne fait que l'afficher.

## Textures et poses (`assets.js`, `poses.js`)
- Plafond matériel GPU : **≤ `4 096 px`** sur chaque côté (`Math.min(4096, renderer.maxTextureSize)`). Les assets plus grands (ex. `rayon-avant.webp` 4300 px), les `.svg` et le profil `leger` sont redimensionnés une fois au chargement via un seul canevas réutilisé + `createImageBitmap` (zéro `canvas.toBlob` PNG).
- **Libération complète en quittant un lieu** (`releaseImages`) : `texture.destroy(true)`, `bitmap?.close?.()`, et mise à jour des compteurs `assetStats`.
- Les changements de pose passent par **`poses.js`** (échange de référence `sprite.texture` sur le `Sprite` déjà monté, sans réaffectation redondante ni recréation).
- Sur tout **`MeshPlane`** (ex. Paper Flip 2.5D dans `paperFlip.js`), poser **`autoResize = false`** pour empêcher un changement de texture haute définition de redimensionner la géométrie.

## Profondeur, parallaxe et ombres
- Le calque `acteurs` utilise `sortableChildren = true` et les niveaux numériques calculés par `depth.js` (`propLevels` / `actorLevel`). Les produits posés sur un meuble (`loose`) reçoivent `levelOf(on) + 0.1`.
- Chaque plan de parallaxe est un `Container` déplacé uniquement en `x = camX * (1 - f)` (figé à `0` pour `f < 1` en profil `leger`).
- Les ombres au sol sont des `Sprite`s séparés du dessin (textures radiales générées une fois au démarrage), qui suivent la profondeur, la hauteur et les réglages (`shadowOpacity`, `contactShadow`).
- Les overlays de debug (`debugMask.js`, `debugPerspective.js`) sont construits paresseusement uniquement à l'activation (`F4`/`F6`) et détruits quand désactivés ou au changement de lieu.
