// Regroupe clavier, manette, souris et doigt en une seule intention de déplacement.

import { createKeyboard } from './keyboard.js';
import { createGamepad } from './gamepad.js';
import { createPointer } from './pointer.js';

// onAction(name) : 'back' | 'pause' | 'settings' | 'diagnostic' | 'debugMask'
// onTarget(clientX, clientY) : un point de l'écran a été touché ou cliqué.
// onDoubleTap(clientX, clientY) : double toucher ou double clic.
export function createInput({ surface, ui, settings, onAction, onTarget, onDoubleTap }) {
  const keyboard = createKeyboard(onAction);
  const gamepad = createGamepad(onAction, settings);
  const pointer = createPointer(surface, ui, settings, onTarget, onDoubleTap);

  return {
    gamepad,
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
    clear() {
      keyboard.clear();
      pointer.clear();
    },
  };
}
