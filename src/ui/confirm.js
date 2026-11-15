// Petite fenêtre « Oui / Non » au-dessus du jeu (ex. : panier plein, échanger une carte ?).
// Créée une fois, réutilisée. Doigt, souris, clavier (Tab, Entrée, flèches) et manette (A oui, B non).

export function createConfirm(root) {
  const box = document.createElement('div');
  box.className = 'confirm panel';
  box.hidden = true;
  box.setAttribute('role', 'alertdialog');
  const text = document.createElement('p');
  text.className = 'confirm-text';
  const row = document.createElement('div');
  row.className = 'panel-buttons';
  const yes = document.createElement('button');
  yes.className = 'primary';
  yes.textContent = 'Oui';
  const no = document.createElement('button');
  no.textContent = 'Non';
  row.append(yes, no);
  box.append(text, row);
  root.appendChild(box);
  let answer = null;

  function close(ok) {
    if (box.hidden) return;
    box.hidden = true;
    const a = answer;
    answer = null;
    a?.(ok);
  }
  yes.addEventListener('click', () => close(true));
  no.addEventListener('click', () => close(false));

  return {
    // onAnswer(true | false)
    ask(message, onAnswer) {
      text.textContent = message;
      answer = onAnswer;
      box.hidden = false;
      yes.focus({ preventScroll: true });
    },
    get open() {
      return !box.hidden;
    },
    yes: () => close(true),
    no: () => close(false),
    // Gauche : Oui ; droite : Non (clavier, manette).
    focus(right) {
      (right ? no : yes).focus({ preventScroll: true });
    },
  };
}
