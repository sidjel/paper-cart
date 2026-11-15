// Écran titre : grand nom du jeu, image mystérieuse, et le menu (Commencer, Options).
// Doigt, souris, clavier (Tab ou flèches, Entrée) et manette (croix ou LB/RB, A).

export function createTitleScreen(root, { image, onStart, onOptions }) {
  const el = document.createElement('div');
  el.className = 'title-screen';
  el.hidden = true;
  el.innerHTML = `
    <img class="title-image" alt="" draggable="false">
    <div class="title-shade"></div>
    <div class="title-content">
      <h1 class="title-name"><span class="title-main">Paper Cart</span><span class="title-sub">The Final Checkout</span></h1>
      <nav class="title-menu" aria-label="Menu principal">
        <button class="title-button" data-act="start">Commencer</button>
        <button class="title-button" data-act="options">Options</button>
      </nav>
    </div>`;
  el.querySelector('.title-image').src = image;
  const buttons = [...el.querySelectorAll('.title-button')];
  buttons[0].addEventListener('click', () => onStart());
  buttons[1].addEventListener('click', () => onOptions());
  root.appendChild(el);
  let focus = 0;
  return {
    show() {
      el.hidden = false;
      focus = 0;
      buttons[0].focus({ preventScroll: true });
    },
    hide() {
      el.hidden = true;
    },
    get visible() {
      return !el.hidden;
    },
    // Gauche/haut : bouton précédent ; droite/bas : suivant.
    move(dir) {
      focus = (focus + dir + buttons.length) % buttons.length;
      buttons[focus].focus({ preventScroll: true });
    },
    // Manette (A) : le bouton mis en avant.
    press() {
      buttons[focus].click();
    },
  };
}
