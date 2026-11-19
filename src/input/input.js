// Regroupe clavier, manette, souris et doigt en une seule intention de déplacement.
// Suit aussi le dernier appareil utilisé (les aides à l'écran s'y adaptent) et relâche tout quand le
// jeu perd le focus ou la visibilité (src/input/CLAUDE.md).

import { createKeyboard } from './keyboard.js';
import { createGamepad } from './gamepad.js';
import { createPointer } from './pointer.js';

// onAction(name) : 'back' | 'pause' | 'settings' | 'diagnostic' | 'debugMask' | 'padLost'…
// onTarget(clientX, clientY) : un point de l'écran a été touché ou cliqué.
// onDoubleTap(clientX, clientY) : double toucher ou double clic.
// onDevice(kind) : le dernier appareil utilisé change : 'keys' (clavier et souris), 'touch' ou 'pad'.
export function createInput({ surface, ui, settings, onAction, onTarget, onDoubleTap, onDrag, device = 'keys', onDevice = () => {}, canSkip = () => false }) {
  let current = device;
  const use = (kind) => {
    if (kind === current) return;
    current = kind;
    onDevice(kind);
  };
  const keyboard = createKeyboard(onAction, () => use('keys'), canSkip);
  const gamepad = createGamepad(onAction, settings, () => use('pad'));
  const pointer = createPointer(surface, ui, settings, onTarget, onDoubleTap, onDrag);
  window.addEventListener('pointerdown', (e) => use(e.pointerType === 'mouse' ? 'keys' : 'touch'), true);

  const clear = () => {
    keyboard.clear();
    pointer.clear();
    gamepad.clear();
  };
  // Focus, visibilité ou page perdus : tout est relâché ; au retour, il faut un nouveau geste.
  window.addEventListener('blur', clear);
  window.addEventListener('pagehide', clear);
  document.addEventListener('visibilitychange', () => document.hidden && clear());

  return {
    gamepad,
    get device() {
      return current;
    },
    pollDevices() {
      gamepad.poll();
    },
    // Remplit `intent` (objet réutilisé) : direction voulue, longueur au plus 1.
    read(intent) {
      intent.moveX = 0;
      intent.moveZ = 0;
      keyboard.read(intent);
      gamepad.read(intent);
      pointer.read(intent);
      const len = Math.hypot(intent.moveX, intent.moveZ);
      if (len > 1) {
        intent.moveX /= len;
        intent.moveZ /= len;
      }
      return intent;
    },
    clear,
  };
}
