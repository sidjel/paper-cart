// Affichage des cartes, du Panier et de la carte qui « file » dans le Panier après un scan.
// Le stade se lit à la couleur ET à la forme de l'icône (cercle, triangle, carré).

const STAGE_INFO = {
  frais: { label: 'Frais', shape: '<circle cx="10" cy="10" r="7"/>' },
  mur: { label: 'Mûr', shape: '<path d="M10 2 L18 17 H2 Z"/>' },
  pourri: { label: 'Pourri', shape: '<rect x="3" y="3" width="14" height="14" rx="2"/>' },
};

// card : { name, power, stage, properties } ; imageUrl : illustration du produit.
export function buildCard(card, imageUrl) {
  const el = document.createElement('div');
  el.className = `card stage-${card.stage}`;
  const info = STAGE_INFO[card.stage];
  el.innerHTML = `
    <div class="card-top">
      <span class="card-power" title="Puissance">${card.power}</span>
      <span class="card-stage"><svg viewBox="0 0 20 20" width="16" height="16">${info.shape}</svg>${info.label}</span>
    </div>
    <img class="card-img" alt="" draggable="false">
    <div class="card-name"></div>
    <div class="card-props"></div>`;
  el.querySelector('.card-img').src = imageUrl;
  el.querySelector('.card-name').textContent = card.name;
  const props = el.querySelector('.card-props');
  for (const p of card.properties) {
    const s = document.createElement('span');
    s.textContent = p;
    props.appendChild(s);
  }
  return el;
}

// Panier : bouton dans l'interface (avec le nombre de cartes) et écran qui les montre.
export function createBasketUi(root, { onOpen, onClose }) {
  const button = document.createElement('button');
  button.className = 'hud-button panier-button';
  button.setAttribute('aria-label', 'Panier (I)');
  button.title = 'Panier (I)';
  button.innerHTML = 'Panier <span class="panier-count">0</span>';
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    button.blur();
    onOpen();
  });
  const count = button.querySelector('.panier-count');

  const panel = document.createElement('div');
  panel.className = 'panier panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Panier');
  const title = document.createElement('h2');
  const grid = document.createElement('div');
  grid.className = 'panier-grid';
  const empty = document.createElement('p');
  empty.className = 'settings-note';
  empty.textContent = "Le Panier est vide. Approche-toi d'un produit sur l'étagère et scanne-le.";
  const close = document.createElement('button');
  close.className = 'primary';
  close.textContent = 'Fermer (Échap)';
  close.addEventListener('click', () => onClose());
  const row = document.createElement('div');
  row.className = 'panel-buttons';
  row.appendChild(close);
  panel.append(title, empty, grid, row);
  root.append(button, panel);

  let shown = 0;
  return {
    button,
    // Ajoute la carte à l'écran du Panier (créée une fois, au moment du scan, pas à chaque image).
    add(card, imageUrl) {
      grid.appendChild(buildCard(card, imageUrl));
      shown++;
    },
    setCount(n) {
      count.textContent = n;
      button.classList.remove('bump');
      void button.offsetWidth; // relance la petite animation
      button.classList.add('bump');
    },
    open() {
      title.textContent = `Panier — ${shown} carte${shown > 1 ? 's' : ''}`;
      empty.hidden = shown > 0;
      panel.hidden = false;
      close.focus({ preventScroll: true });
    },
    close() {
      panel.hidden = true;
    },
  };
}

// La carte qui apparaît au-dessus du personnage puis file vers le bouton du Panier.
// Un seul élément, réutilisé ; animé par le temps de jeu (transform et opacity seulement).
export function createFlyingCard(root) {
  const holder = document.createElement('div');
  holder.className = 'flying-card';
  holder.hidden = true;
  root.appendChild(holder);
  let current = null;

  return {
    show(card, imageUrl) {
      if (current) current.remove();
      current = buildCard(card, imageUrl);
      holder.appendChild(current);
      holder.hidden = false;
    },
    // p : 0 → 1 ; from : position d'apparition (écran) ; to : bouton du Panier (écran).
    update(p, from, to, reduceMotion) {
      if (holder.hidden) return;
      let x, y, s, r, o;
      if (p < 0.3) {
        // Apparition avec un petit rebond.
        const q = p / 0.3;
        s = reduceMotion ? 1 : q < 0.7 ? (q / 0.7) * 1.15 : 1.15 - ((q - 0.7) / 0.3) * 0.15;
        x = from.x;
        y = from.y - (reduceMotion ? 0 : 20 * q);
        r = reduceMotion ? 0 : (1 - q) * -12;
        o = 1;
      } else if (p < 0.55) {
        // Elle reste un instant, pour qu'on la lise.
        s = 1;
        x = from.x;
        y = from.y - (reduceMotion ? 0 : 20);
        r = 0;
        o = 1;
      } else {
        // Puis file dans le Panier en rapetissant.
        const q = (p - 0.55) / 0.45;
        const e = q * q * (3 - 2 * q);
        x = from.x + (to.x - from.x) * e;
        y = from.y - 20 + (to.y - from.y + 20) * e - (reduceMotion ? 0 : Math.sin(e * Math.PI) * 60);
        s = 1 - 0.8 * e;
        r = reduceMotion ? 0 : e * 20;
        o = q > 0.9 ? 1 - (q - 0.9) * 10 : 1;
      }
      holder.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${r}deg) scale(${s})`;
      holder.style.opacity = o;
    },
    hide() {
      holder.hidden = true;
      if (current) {
        current.remove();
        current = null;
      }
    },
  };
}
