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

  let onClosed = null;

  function close() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    card.classList.remove('pop');
    const cb = onClosed;
    onClosed = null;
    cb?.();
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
    show(id, { isNew = true, reduceMotion = false, onClose = null } = {}) {
      const def = objects[id];
      if (!def) return;
      kicker.textContent = isNew ? 'Nouvel objet obtenu !' : 'Objet équipé';
      img.src = base + def.image;
      name.textContent = clean(def.name);
      desc.textContent = clean(def.text);
      const u = clean(def.usage);
      usageRow.hidden = !u;
      usageText.textContent = u;
      const h = clean(def.hint);
      hint.hidden = !h;
      hint.textContent = h ? `✦ ${h}` : '';
      onClosed = onClose;
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
