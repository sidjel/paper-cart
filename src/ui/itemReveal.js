// Fenêtre de découverte d'un objet important (façon Zelda) : apparaît au centre de l'écran avec une
// animation « petit → grand », affiche l'image, l'utilité, le mode d'emploi et une phrase énigmatique.
// Créée une fois au chargement, réutilisée (aucun élément créé en jeu).

const TEMP = /^\[TEMP\]\s*/;
const clean = (s) => (s ?? '').replace(TEMP, '').replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

export function createItemReveal(root, { objects, base = '' }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay item-reveal';
  backdrop.hidden = true;
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  const card = document.createElement('div');
  card.className = 'item-reveal-card panel';
  card.innerHTML =
    '<div class="item-reveal-art"><img class="item-reveal-img" alt="" draggable="false"></div>' +
    '<div class="item-reveal-body">' +
      '<p class="item-reveal-kicker">Nouvel objet obtenu !</p>' +
      '<h2 class="item-reveal-name"></h2>' +
      '<p class="item-reveal-desc"></p>' +
      '<p class="item-reveal-usage"><strong>Comment s’en servir :</strong> <span></span></p>' +
      '<p class="item-reveal-hint"></p>' +
      '<div class="panel-buttons"><button class="primary item-reveal-ok">Continuer</button></div>' +
    '</div>';

  const kicker = card.querySelector('.item-reveal-kicker');
  const img = card.querySelector('.item-reveal-img');
  const name = card.querySelector('.item-reveal-name');
  const desc = card.querySelector('.item-reveal-desc');
  const usageRow = card.querySelector('.item-reveal-usage');
  const usageText = usageRow.querySelector('span');
  const hint = card.querySelector('.item-reveal-hint');
  const okBtn = card.querySelector('.item-reveal-ok');

  backdrop.appendChild(card);
  root.appendChild(backdrop);

  // Image volante réutilisable (zéro élément créé en jeu) : part de la fiche vers le bouton HUD.
  const fly = document.createElement('img');
  fly.className = 'flying-item';
  fly.alt = '';
  fly.draggable = false;
  fly.hidden = true;
  root.appendChild(fly);

  let onClosed = null;
  let flyTarget = null;
  let onLanded = null;
  let lastReduce = false;
  let lastSrc = '';
  let flyRaf = 0;

  function stopFly() {
    if (flyRaf) {
      cancelAnimationFrame(flyRaf);
      flyRaf = 0;
    }
    fly.hidden = true;
  }

  function launchFly(fromRect, toRect, src, onLand) {
    stopFly();
    const fx = fromRect.left + fromRect.width / 2;
    const fy = fromRect.top + fromRect.height / 2;
    const tx = toRect.left + toRect.width / 2;
    const ty = toRect.top + toRect.height / 2;
    const baseSize = 96;
    const s0 = Math.max(0.4, fromRect.width / baseSize);
    const s1 = Math.max(0.32, (toRect.width * 0.78) / baseSize);
    const dur = 480;
    fly.src = src;
    fly.hidden = false;
    const t0 = performance.now();
    const step = (now) => {
      const q = Math.min(1, (now - t0) / dur);
      const e = q * q * (3 - 2 * q); // lissage doux départ/arrivée
      const arc = Math.sin(e * Math.PI) * 68;
      const x = fx + (tx - fx) * e;
      const y = fy + (ty - fy) * e - arc;
      const s = s0 + (s1 - s0) * e;
      const rot = Math.sin(e * Math.PI) * -14;
      const o = q > 0.88 ? 1 - (q - 0.88) / 0.12 : 1;
      fly.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${s})`;
      fly.style.opacity = String(o);
      if (q < 1) {
        flyRaf = requestAnimationFrame(step);
      } else {
        flyRaf = 0;
        fly.hidden = true;
        onLand?.();
      }
    };
    flyRaf = requestAnimationFrame(step);
  }

  function close() {
    if (backdrop.hidden) return;
    const fromRect = img.getBoundingClientRect();
    const targetFn = flyTarget;
    const landCb = onLanded;
    const src = lastSrc;
    const reduce = lastReduce;
    backdrop.hidden = true;
    card.classList.remove('pop');
    const cb = onClosed;
    onClosed = null;
    flyTarget = null;
    onLanded = null;
    cb?.();
    const toRect = targetFn?.();
    if (!reduce && fromRect.width > 0 && toRect) launchFly(fromRect, toRect, src, landCb);
    else landCb?.();
  }

  okBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  return {
    // id : clé dans data/objects.json ; isNew : affiche « Nouvel objet obtenu ! » sinon « Objet »
    show(id, { isNew = true, reduceMotion = false, onClose = null, flyTo = null, onLand = null } = {}) {
      const def = objects[id];
      if (!def) return;
      stopFly();
      kicker.textContent = isNew ? 'Nouvel objet obtenu !' : 'Objet équipé';
      lastSrc = base + def.image;
      img.src = lastSrc;
      name.textContent = clean(def.name);
      desc.textContent = clean(def.text);
      const u = clean(def.usage);
      usageRow.hidden = !u;
      usageText.textContent = u;
      const h = clean(def.hint);
      hint.hidden = !h;
      hint.textContent = h ? `✦ ${h}` : '';
      onClosed = onClose;
      flyTarget = flyTo;
      onLanded = onLand;
      lastReduce = reduceMotion;
      backdrop.hidden = false;
      card.classList.remove('pop');
      if (!reduceMotion) {
        void card.offsetWidth;
        card.classList.add('pop');
      }
      okBtn.focus({ preventScroll: true });
    },
    close,
    get open() {
      return !backdrop.hidden;
    },
  };
}
