// Clavier → actions abstraites.
// On lit la position physique des touches (event.code) : ZQSD sur un clavier AZERTY
// et WASD sur un QWERTY tombent au même endroit. Flèches aussi.

const UP = ['KeyW', 'ArrowUp'];
const DOWN = ['KeyS', 'ArrowDown'];
const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const MOVE = new Set([...UP, ...DOWN, ...LEFT, ...RIGHT]);

// Touches qui déclenchent une action ponctuelle.
const ACTIONS = {
  Escape: 'back',
  KeyP: 'pause',
  F2: 'settings',
  F3: 'diagnostic',
  F4: 'debugMask',
  Enter: 'action',
  NumpadEnter: 'action',
  Space: 'action',
  KeyI: 'panier',
};

export function createKeyboard(onAction) {
  const down = new Set();

  function isTyping(e) {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
  }

  window.addEventListener('keydown', (e) => {
    const action = ACTIONS[e.code];
    // Sur un bouton ou un réglage, Entrée et Espace gardent leur rôle habituel (cliquer, cocher).
    if (action === 'action' && e.target && /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (action) {
      e.preventDefault();
      if (!e.repeat) onAction(action);
      return;
    }
    if (MOVE.has(e.code) && !isTyping(e)) {
      e.preventDefault();
      down.add(e.code);
    }
  });
  window.addEventListener('keyup', (e) => down.delete(e.code));
  // Fenêtre quittée : on relâche tout, pour éviter une touche « collée ».
  window.addEventListener('blur', () => down.clear());

  const any = (codes) => down.has(codes[0]) || down.has(codes[1]);

  return {
    // Écrit la direction voulue dans `out` (moveX, moveZ entre -1 et 1).
    read(out) {
      out.moveX += (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0);
      out.moveZ += (any(UP) ? 1 : 0) - (any(DOWN) ? 1 : 0);
    },
    clear() {
      down.clear();
    },
  };
}
