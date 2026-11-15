// Choix du nom du joueur pendant la rencontre : c'est le joueur qui répond, donc dans le style de
// « l'écran qui parle » (violet, en bas, sans cadre de personnage). Les propositions (data/joueur.json),
// la première étant le nom actuel, puis « Autre… » qui ouvre un champ pour taper son propre nom.
// Tout est créé au chargement. Doigt, souris, clavier (flèches, Entrée) et manette (croix, A).

export function createNamePicker(root, { names, other, maxLength, onPick }) {
  const el = document.createElement('div');
  el.className = 'name-picker';
  el.hidden = true;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Choisis ton nom');
  const list = document.createElement('div');
  list.className = 'name-picker-list';
  const buttons = names.map((n) => {
    const b = document.createElement('button');
    b.className = 'name-choice';
    b.textContent = n.name;
    b.dataset.id = n.id;
    list.appendChild(b);
    return b;
  });
  const otherBtn = document.createElement('button');
  otherBtn.className = 'name-choice name-other';
  otherBtn.textContent = 'Autre…';
  list.appendChild(otherBtn);
  const form = document.createElement('div');
  form.className = 'name-picker-form';
  form.hidden = true;
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = maxLength;
  input.autocomplete = 'off';
  input.placeholder = 'Ton nom';
  input.setAttribute('aria-label', 'Ton nom');
  const ok = document.createElement('button');
  ok.className = 'name-choice';
  ok.textContent = 'OK';
  form.append(input, ok);
  el.append(list, form);
  root.appendChild(el);

  // Un toucher dans le choix ne fait pas avancer la réplique ni marcher le héros.
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  // Juste après l'apparition, un appui (Entrée, A) lancé pour faire défiler le texte ne choisit rien.
  let shownAt = 0;
  const tooSoon = () => performance.now() - shownAt < 350;
  for (const b of buttons) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tooSoon()) return;
      onPick(b.dataset.id, '', b.textContent);
    });
  }
  otherBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tooSoon()) return;
    form.hidden = false;
    input.focus({ preventScroll: true });
  });
  const submit = () => {
    const typed = input.value.trim();
    if (!typed) {
      input.focus({ preventScroll: true });
      return;
    }
    onPick(other, typed, typed);
  };
  ok.addEventListener('click', (e) => {
    e.stopPropagation();
    submit();
  });
  input.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault();
      submit();
    }
  });

  // Dans l'ordre affiché (le nom actuel a été mis en premier).
  const focusables = () => [...list.children, ...(form.hidden ? [] : [input, ok])];
  return {
    // currentId : le nom actuel, proposé en premier (mis en avant).
    show(currentId, custom) {
      const k = Math.max(0, buttons.findIndex((b) => b.dataset.id === currentId));
      list.prepend(buttons[k]); // le nom actuel d'abord
      input.value = custom ?? '';
      form.hidden = true;
      el.hidden = false;
      shownAt = performance.now();
      buttons[k].focus({ preventScroll: true });
    },
    hide() {
      el.hidden = true;
    },
    get visible() {
      return !el.hidden;
    },
    // Flèches, croix de la manette : passer d'une proposition à l'autre.
    move(dir) {
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      f[(i + dir + f.length) % f.length].focus({ preventScroll: true });
    },
    // Manette (A) : la proposition mise en avant.
    press() {
      const a = document.activeElement;
      if (a && el.contains(a) && a.tagName === 'BUTTON') a.click();
    },
  };
}
