// Historique des dialogues, dans l'écran Pause : bouton « Dialogues », puis la liste des répliques
// dites (haut-parleur, héros, pensées, et les réponses du joueur), la plus récente en bas.
// Les lignes sont créées une fois au chargement (rows) et seulement remplies à l'ouverture.

const WHO = { narrateur: 'Haut-parleur', heros: 'Lui', pensee: 'Lui (pensée)', agent: 'Agent de sécurité', epaisseur: 'Toi' };

export function createJournal(card, rows, { onFirstButton }) {
  const toggle = document.createElement('button');
  toggle.className = 'journal-toggle';
  toggle.textContent = 'Dialogues';
  toggle.setAttribute('aria-expanded', 'false');
  const box = document.createElement('div');
  box.className = 'journal';
  box.hidden = true;
  box.tabIndex = 0;
  box.setAttribute('aria-label', 'Historique des dialogues');
  const empty = document.createElement('p');
  empty.className = 'journal-empty';
  empty.textContent = 'Rien pour l’instant.';
  const list = document.createElement('ol');
  const items = [];
  for (let k = 0; k < rows; k++) {
    const li = document.createElement('li');
    li.innerHTML = '<b></b><span></span>';
    li.hidden = true;
    list.appendChild(li);
    items.push(li);
  }
  box.append(empty, list);
  // Juste après « Reprendre ».
  card.querySelector('.primary').after(toggle, box);

  let log = [];
  function fill() {
    const n = Math.min(log.length, rows);
    const start = log.length - n;
    for (let k = 0; k < rows; k++) {
      const li = items[k];
      if (k >= n) {
        li.hidden = true;
        continue;
      }
      const e = log[start + k];
      li.hidden = false;
      li.className = `journal-${e.voice}`;
      li.firstChild.textContent = WHO[e.voice] ?? e.voice;
      li.lastChild.textContent = e.text;
    }
    empty.hidden = n > 0;
  }
  function setOpen(open) {
    box.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Masquer les dialogues' : 'Dialogues';
    if (open) {
      fill();
      box.scrollTop = box.scrollHeight; // la plus récente
    }
  }
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(box.hidden);
  });

  return {
    // À l'ouverture de la pause : l'historique du moment (fermé par défaut).
    prepare(entries) {
      log = entries;
      setOpen(false);
    },
    get open() {
      return !box.hidden;
    },
    toggle() {
      setOpen(box.hidden);
      toggle.focus({ preventScroll: true });
    },
    // Manette, flèches : faire défiler la liste ouverte, sinon passer d'un bouton à l'autre.
    move(d) {
      if (!box.hidden) box.scrollTop += d * 60;
      else if (d > 0) toggle.focus({ preventScroll: true });
      else onFirstButton();
    },
    // Manette (A) : le bouton mis en avant.
    press() {
      if (document.activeElement === toggle) setOpen(box.hidden);
      else return false;
      return true;
    },
  };
}
