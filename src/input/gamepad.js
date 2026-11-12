// Manette (API Gamepad, disposition standard) → actions abstraites.
// Stick gauche ou croix pour marcher ; Start pour la pause.
// On n'interroge la manette que si une manette est branchée.

const START = 9;
const DPAD_UP = 12, DPAD_DOWN = 13, DPAD_LEFT = 14, DPAD_RIGHT = 15;

export function createGamepad(onAction, settings) {
  let connected = 0;
  let startWasDown = false;
  let x = 0;
  let z = 0;

  window.addEventListener('gamepadconnected', () => (connected += 1));
  window.addEventListener('gamepaddisconnected', () => (connected = Math.max(0, connected - 1)));

  const pressed = (pad, i) => pad.buttons[i]?.pressed ?? false;

  return {
    get connected() {
      return connected > 0;
    },
    // À appeler une fois par image affichée (même en pause, pour que Start fonctionne).
    poll() {
      x = 0;
      z = 0;
      if (connected === 0 || !navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      let startDown = false;
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (!pad || !pad.connected) continue;
        // Zone morte circulaire, puis remise à l'échelle pour garder une réponse progressive.
        const ax = pad.axes[0] ?? 0;
        const ay = pad.axes[1] ?? 0;
        const len = Math.hypot(ax, ay);
        const dz = settings.stickDeadZone;
        if (len > dz) {
          const k = Math.min(1, (len - dz) / (1 - dz)) / len;
          x += ax * k;
          z -= ay * k; // stick vers le haut = vers le fond
        }
        x += (pressed(pad, DPAD_RIGHT) ? 1 : 0) - (pressed(pad, DPAD_LEFT) ? 1 : 0);
        z += (pressed(pad, DPAD_UP) ? 1 : 0) - (pressed(pad, DPAD_DOWN) ? 1 : 0);
        if (pressed(pad, START)) startDown = true;
      }
      if (startDown && !startWasDown) onAction('pause');
      startWasDown = startDown;
    },
    read(out) {
      out.moveX += x;
      out.moveZ += z;
    },
  };
}
