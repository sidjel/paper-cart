// Petit repère au sol, à l'endroit touché ou cliqué. Il disparaît à l'arrivée.

export function createTargetMarker(parent) {
  const el = document.createElement('div');
  el.className = 'target-marker';
  parent.appendChild(el);
  let visible = false;
  return {
    showAt(sx, sy) {
      el.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
      el.classList.add('visible');
      visible = true;
    },
    hide() {
      if (!visible) return;
      el.classList.remove('visible');
      visible = false;
    },
  };
}
