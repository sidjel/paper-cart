// Souris et doigt (événements « pointer », communs aux deux) → actions abstraites.
//  - toucher ou cliquer le sol : aller à cet endroit ; garder appuyé et glisser : le point suit ;
//  - option joystick virtuel : un doigt posé sur la partie gauche de l'écran fait apparaître
//    un joystick ; la partie droite garde le « toucher pour aller » ;
//  - double toucher (ou double clic) : onDoubleTap, en plus du « toucher pour aller ».

const JOYSTICK_ZONE = 0.4; // part gauche de l'écran réservée au joystick

export function createPointer(surface, ui, settings, onTarget, onDoubleTap) {
  let targetId = null;
  let follow = true; // le point suit le doigt (sauf après un double toucher)
  let lastTapTime = -Infinity;
  let lastTapX = 0;
  let lastTapY = 0;
  let stickId = null;
  let baseX = 0;
  let baseY = 0;
  let x = 0;
  let z = 0;

  const stick = document.createElement('div');
  stick.className = 'joystick';
  const knob = document.createElement('div');
  knob.className = 'joystick-knob';
  stick.appendChild(knob);
  ui.appendChild(stick);

  function moveStick(cx, cy) {
    const r = settings.joystickRadius;
    let dx = cx - baseX;
    let dy = cy - baseY;
    const len = Math.hypot(dx, dy);
    if (len > r) {
      dx = (dx / len) * r;
      dy = (dy / len) * r;
    }
    knob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    x = dx / r;
    z = -dy / r;
  }

  function endStick() {
    stickId = null;
    x = 0;
    z = 0;
    stick.classList.remove('visible');
  }

  surface.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const useStick = settings.virtualJoystick && e.pointerType !== 'mouse' && e.clientX < window.innerWidth * JOYSTICK_ZONE;
    if (useStick && stickId === null) {
      stickId = e.pointerId;
      baseX = e.clientX;
      baseY = e.clientY;
      const size = settings.joystickRadius * 2;
      stick.style.width = `${size}px`;
      stick.style.height = `${size}px`;
      stick.style.transform = `translate3d(${baseX - settings.joystickRadius}px, ${baseY - settings.joystickRadius}px, 0)`;
      stick.classList.add('visible');
      moveStick(e.clientX, e.clientY);
    } else if (targetId === null) {
      targetId = e.pointerId;
      onTarget(e.clientX, e.clientY);
      const double =
        e.timeStamp - lastTapTime <= settings.doubleTapTime * 1000 &&
        Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) <= settings.doubleTapDistance;
      follow = !double;
      if (double) {
        lastTapTime = -Infinity; // un triple toucher ne compte pas pour deux doubles
        onDoubleTap(e.clientX, e.clientY);
      } else {
        lastTapTime = e.timeStamp;
        lastTapX = e.clientX;
        lastTapY = e.clientY;
      }
    } else {
      return;
    }
    surface.setPointerCapture?.(e.pointerId);
  });

  surface.addEventListener('pointermove', (e) => {
    if (e.pointerId === stickId) moveStick(e.clientX, e.clientY);
    else if (e.pointerId === targetId && follow) onTarget(e.clientX, e.clientY);
  });

  const end = (e) => {
    if (e.pointerId === stickId) endStick();
    if (e.pointerId === targetId) targetId = null;
  };
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);
  surface.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    read(out) {
      out.moveX += x;
      out.moveZ += z;
    },
    clear() {
      endStick();
      targetId = null;
    },
  };
}
