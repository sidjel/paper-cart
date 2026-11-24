// Barre d'outils discrète réservée à la Salle de test libre (place.treadmill) :
// - marche sur place à la vitesse réelle de chaque direction (8 flèches ou clavier) ;
// - ralenti (×0.4) et pose fixe (idle + clignement) ;
// - perspective (rétrécissement avant/arrière) activable / désactivable à la volée.

const DIRS = [
  ['S', '↓'],
  ['SE', '↘'],
  ['E', '→'],
  ['NE', '↗'],
  ['N', '↑'],
  ['NW', '↖'],
  ['W', '←'],
  ['SW', '↙'],
];

export function createTreadmillUi(root, { onDirection, onPerspective }) {
  const bar = document.createElement('div');
  bar.className = 'treadmill-bar panel';
  bar.hidden = true;
  bar.setAttribute('aria-label', 'Contrôles du studio de test');

  let active = false;
  let slow = false;
  let paused = false;
  let perspective = false;

  const stop = (e) => e.stopPropagation();
  const makeBtn = (label, onClick) => {
    const b = document.createElement('button');
    b.className = 'treadmill-btn';
    b.textContent = label;
    b.addEventListener('pointerdown', stop);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      b.blur();
      onClick();
      sync();
    });
    return b;
  };

  const btnRun = makeBtn('Marche sur place', () => {
    active = !active;
    if (active) paused = false;
  });
  const btnSlow = makeBtn('Ralenti ×0.4', () => {
    slow = !slow;
  });
  const btnStop = makeBtn('Fixe', () => {
    if (!active) active = true;
    paused = !paused;
  });
  const btnPersp = makeBtn('Perspective : OFF', () => {
    perspective = !perspective;
    onPerspective(perspective);
  });

  const dirWrap = document.createElement('div');
  dirWrap.className = 'treadmill-dirs';
  for (const [dir, arrow] of DIRS) {
    const b = document.createElement('button');
    b.className = 'treadmill-dir';
    b.textContent = arrow;
    b.title = `Direction ${dir}`;
    b.addEventListener('pointerdown', stop);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      b.blur();
      active = true;
      paused = false;
      onDirection(dir);
      sync();
    });
    dirWrap.appendChild(b);
  }

  bar.append(btnRun, btnSlow, btnStop, btnPersp, dirWrap);
  root.appendChild(bar);

  function sync() {
    btnRun.classList.toggle('active', active && !paused);
    btnSlow.classList.toggle('active', slow);
    btnStop.classList.toggle('active', active && paused);
    btnPersp.classList.toggle('active', perspective);
    btnPersp.textContent = perspective ? 'Perspective : ON' : 'Perspective : OFF';
  }
  sync();

  return {
    setVisible(v) {
      bar.hidden = !v;
      if (!v) {
        active = false;
        slow = false;
        paused = false;
        perspective = false;
        sync();
      }
    },
    get active() {
      return !bar.hidden && active;
    },
    get slow() {
      return !bar.hidden && slow;
    },
    get paused() {
      return paused;
    },
  };
}
