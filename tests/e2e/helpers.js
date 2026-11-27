// Aides partagées pour les tests Playwright E2E.

// Avertissement matériel/driver émis uniquement par Chromium headless sans carte graphique (CI)
// lorsqu'il recopie le framebuffer WebGL logiciel via ReadPixels — pas un bug du jeu.
const IGNORED_DRIVER_WARNING = /GL Driver Message.*GPU stall due to ReadPixels/;

export function watchConsole(page, errors) {
  page.on('console', (m) => {
    const type = m.type();
    if (type !== 'error' && type !== 'warning') return;
    const text = m.text();
    if (type === 'warning' && IGNORED_DRIVER_WARNING.test(text)) return;
    errors.push(`${type}: ${text}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
}

// Double toucher fiable même à ~11 i/s (CI sans GPU) : deux `page.touchscreen.tap()` séquentiels
// subissent 350–1 100 ms de latence IPC/compositeur entre les deux taps (au-delà de doubleTapTime = 350 ms).
// Ici on envoie deux vrais touchers Chromium via CDP avec un écart explicite (80 ms par défaut),
// qui traversent la vraie chaîne Touch → PointerEvent → src/input/pointer.js.
export async function doubleTap(page, x, y, gapMs = 80) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const t0 = Date.now() / 1000;
    const gap = gapMs / 1000;
    await Promise.all([
      cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }], timestamp: t0 }),
      cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t0 + 0.02 }),
      cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 2 }], timestamp: t0 + gap }),
      cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t0 + gap + 0.02 }),
    ]);
  } finally {
    await cdp.detach().catch(() => {});
  }
}
