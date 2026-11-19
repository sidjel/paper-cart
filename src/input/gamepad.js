// Manette (API Gamepad, disposition standard) → actions abstraites.
// Stick gauche ou croix pour marcher ; A : scanner ; B : retour ; Y : Panier ; X : lâcher ou pousser le
// chariot ; Start : pause ;
// croix gauche/droite et LB/RB : gauche/droite dans les menus (onglets) et les réponses.
// On n'interroge la manette que si une manette est branchée.
// Règles (src/input/CLAUDE.md) : après un relâchement général (focus perdu, onglet caché) ou un
// branchement, rien ne compte tant que la manette n'est pas revenue au repos (nouveau geste exigé) ;
// la manette utilisée débranchée → action 'padLost' (pause).

const START = 9;
const BUTTON_A = 0, BUTTON_B = 1, BUTTON_X = 2, BUTTON_Y = 3, BUTTON_LB = 4, BUTTON_RB = 5;
const BUTTON_ACTIONS = ['action', 'back', 'panier', 'left', 'right', 'up', 'down', 'chariot'];
const DPAD_UP = 12, DPAD_DOWN = 13, DPAD_LEFT = 14, DPAD_RIGHT = 15;

// onUsed() : la manette vient de servir (aides à l'écran).
export function createGamepad(onAction, settings, onUsed = () => {}) {
  let connected = 0;
  let startWasDown = false;
  const buttons = [false, false, false, false, false, false, false, false];
  const wasDown = [false, false, false, false, false, false, false, false]; // A, B, Y, gauche, droite, haut, bas, X
  let x = 0;
  let z = 0;
  let latched = true; // au repos exigé avant de compter (au départ, au branchement, après un relâchement)
  let usedIndex = -1; // la manette qui a servi en dernier

  window.addEventListener('gamepadconnected', () => {
    connected += 1;
    latched = true;
  });
  window.addEventListener('gamepaddisconnected', (e) => {
    connected = Math.max(0, connected - 1);
    if (e.gamepad?.index === usedIndex) {
      usedIndex = -1;
      onAction('padLost');
    }
  });

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
      let user = -1;
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (!pad || !pad.connected) continue;
        const bx = x, bz = z;
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
        let any = x !== bx || z !== bz;
        if (pressed(pad, START)) startDown = any = true;
        if (pressed(pad, BUTTON_A)) buttons[0] = any = true;
        if (pressed(pad, BUTTON_B)) buttons[1] = any = true;
        if (pressed(pad, BUTTON_Y)) buttons[2] = any = true;
        if (pressed(pad, BUTTON_LB) || pressed(pad, DPAD_LEFT)) buttons[3] = any = true;
        if (pressed(pad, BUTTON_RB) || pressed(pad, DPAD_RIGHT)) buttons[4] = any = true;
        if (pressed(pad, DPAD_UP)) buttons[5] = true;
        if (pressed(pad, DPAD_DOWN)) buttons[6] = true;
        if (pressed(pad, BUTTON_X)) buttons[7] = any = true;
        if (any) user = pad.index;
      }
      const active = user !== -1;
      if (latched) {
        // Tant que la manette n'est pas revenue au repos, rien ne compte (ni marche, ni bouton).
        x = 0;
        z = 0;
        if (!active) latched = false;
      } else if (active) {
        usedIndex = user;
        onUsed();
      }
      if (startDown && !startWasDown && !latched) onAction('pause');
      startWasDown = startDown;
      // Un appui (et non un maintien) déclenche l'action.
      for (let k = 0; k < BUTTON_ACTIONS.length; k++) {
        if (buttons[k] && !wasDown[k] && !latched) onAction(BUTTON_ACTIONS[k]);
        wasDown[k] = buttons[k];
        buttons[k] = false;
      }
    },
    read(out) {
      out.moveX += x;
      out.moveZ += z;
    },
    // Tout relâché : il faudra un retour au repos, puis un nouvel appui.
    clear() {
      latched = true;
      x = 0;
      z = 0;
    },
    // Vibration de la manette (si elle sait vibrer) : ms, force du gros et du petit moteur (0 à 1).
    rumble(ms, strong, weak) {
      if (connected === 0 || !navigator.getGamepads) return;
      for (const pad of navigator.getGamepads()) {
        pad?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak })?.catch?.(() => {});
      }
    },
  };
}
