// Moteur de rendu de scène PixiJS v8 (WebGL sur PC et smartphone, repli CanvasRenderer propre en CI/headless).
// Un seul <canvas> dans #game, piloté manuellement par la boucle unique de src/main.js (autoStart: false).
// Contient :
//  - worldRoot (à l'identité) : porte stage.root du lieu actif ;
//  - dissolveLayer : RenderTexture figée de l'ancien lieu pendant un fondu enchaîné (détruite aussitôt après) ;
//  - backstage (hors scène) : accueille les acteurs persistants (héros, poussière, repère, chariot) entre deux lieux.

import { Application, Container, RenderTexture, Sprite } from 'pixi.js';

const BG_COLOR = 0x2f2a24;

function countTree(node, ancestorVisible, out) {
  out.stageNodes += 1;
  const vis = ancestorVisible && node.visible && node.alpha > 0;
  // Un nœud affichable (Sprite, MeshPlane, Graphics, Text) possède renderPipeId dans PixiJS v8.
  if (vis && node.renderPipeId) out.visibleSprites += 1;
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) countTree(children[i], vis, out);
}

export async function createRenderer(container, { maxPixelRatio = 2, onContextLost = null, onContextRestored = null } = {}) {
  const width = Math.max(1, container.clientWidth || window.innerWidth || 1);
  const height = Math.max(1, container.clientHeight || window.innerHeight || 1);
  const resolution = Math.min(window.devicePixelRatio || 1, maxPixelRatio);

  const app = new Application();
  await app.init({
    width,
    height,
    backgroundColor: BG_COLOR,
    antialias: true,
    // WebGL matériel prioritaire ; repli CanvasRenderer si WebGL est logiciel (SwiftShader/llvmpipe)
    // ou absent, sans jamais sonder WebGPU (évite les warnings driver ReadPixels et la lenteur en CI).
    preference: ['webgl', 'canvas'],
    failIfMajorPerformanceCaveat: true,
    resolution,
    autoDensity: true,
    autoStart: false,
  });

  const canvas = app.canvas;
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const isWebGL = app.renderer.name !== 'canvas';
  let maxTextureSize = 4096;
  const gl = app.renderer.gl;
  if (gl && typeof gl.getParameter === 'function') {
    const lim = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (Number.isFinite(lim) && lim >= 1024) maxTextureSize = Math.min(4096, lim);
  }

  const worldRoot = new Container();
  worldRoot.label = 'worldRoot';
  const dissolveLayer = new Container();
  dissolveLayer.label = 'dissolveLayer';
  const backstage = new Container();
  backstage.label = 'backstage';
  backstage.visible = false;

  app.stage.addChild(worldRoot, dissolveLayer);

  let lastW = width;
  let lastH = height;
  let dissolve = null; // { sprite, rt }
  let activeRenderTextures = 0;
  let contextLost = false;

  const handleContextLost = (e) => {
    e.preventDefault();
    contextLost = true;
    onContextLost?.();
  };
  const handleContextRestored = () => {
    contextLost = false;
    onContextRestored?.();
  };
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  function clearDissolve() {
    if (!dissolve) return;
    dissolveLayer.removeChild(dissolve.sprite);
    dissolve.sprite.destroy();
    dissolve.rt.destroy(true);
    activeRenderTextures = Math.max(0, activeRenderTextures - 1);
    dissolve = null;
  }

  // Capture la vue exacte à l'écran (worldRoot à l'identité, donc stage.root conserve scale/offX/camX).
  function captureSnapshot() {
    clearDissolve();
    if (contextLost || worldRoot.children.length === 0) return false;
    const sw = Math.max(1, Math.round(app.screen.width));
    const sh = Math.max(1, Math.round(app.screen.height));
    if (sw < 2 || sh < 2) return false;
    const rt = RenderTexture.create({
      width: sw,
      height: sh,
      resolution: app.renderer.resolution,
    });
    app.renderer.render({
      container: worldRoot,
      target: rt,
      clear: true,
      clearColor: BG_COLOR,
    });
    const sprite = new Sprite(rt);
    sprite.x = 0;
    sprite.y = 0;
    sprite.width = sw;
    sprite.height = sh;
    dissolveLayer.addChild(sprite);
    dissolve = { sprite, rt };
    activeRenderTextures += 1;
    return true;
  }

  function setDissolveAlpha(alpha) {
    if (!dissolve) return;
    dissolve.sprite.alpha = Math.max(0, Math.min(1, alpha));
  }

  function resize(w, h) {
    const rw = Math.max(1, Math.round(w));
    const rh = Math.max(1, Math.round(h));
    if (rw === lastW && rh === lastH) return;
    lastW = rw;
    lastH = rh;
    app.renderer.resize(rw, rh);
    if (dissolve) {
      dissolve.sprite.width = rw;
      dissolve.sprite.height = rh;
    }
  }

  function render() {
    if (contextLost) return;
    app.renderer.render({ container: app.stage });
  }

  function stats() {
    const counts = { stageNodes: 0, visibleSprites: 0 };
    for (const child of worldRoot.children) countTree(child, true, counts);
    return {
      renderer: isWebGL ? 'WebGL' : 'Canvas',
      isWebGL,
      maxTextureSize,
      stageNodes: counts.stageNodes,
      visibleSprites: counts.visibleSprites,
      renderTextures: activeRenderTextures,
      dissolving: Boolean(dissolve),
      width: app.screen.width,
      height: app.screen.height,
    };
  }

  function destroy() {
    clearDissolve();
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    backstage.destroy({ children: false });
    app.destroy(true);
  }

  return {
    app,
    canvas,
    container,
    worldRoot,
    dissolveLayer,
    backstage,
    isWebGL,
    maxTextureSize,
    captureSnapshot,
    setDissolveAlpha,
    clearDissolve,
    resize,
    render,
    stats,
    destroy,
  };
}
