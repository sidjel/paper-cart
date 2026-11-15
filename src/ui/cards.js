// Affichage des cartes, du Panier et de la carte qui « file » dans le Panier après un scan.
// Le stade se lit à la couleur ET à la forme de l'icône (cercle, triangle, carré).

const STAGE_INFO = {
  frais: { label: 'Frais', shape: '<circle cx="10" cy="10" r="7"/>' },
  mur: { label: 'Mûr', shape: '<path d="M10 2 L18 17 H2 Z"/>' },
  pourri: { label: 'Pourri', shape: '<rect x="3" y="3" width="14" height="14" rx="2"/>' },
};

const MAX_PROPS = 4; // propriétés affichées au plus (éléments préparés à l'avance)

// card : { name, power, stage, properties } ; imageUrl : illustration du produit.
export function buildCard(card, imageUrl) {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="card-top">
      <span class="card-power" title="Puissance"></span>
      <span class="card-stage"><svg viewBox="0 0 20 20" width="16" height="16"></svg><span class="card-stage-label"></span></span>
    </div>
    <img class="card-img" alt="" draggable="false">
    <div class="card-name"></div>
    <div class="card-props">${'<span></span>'.repeat(MAX_PROPS)}</div>`;
  fillCard(el, card, imageUrl);
  return el;
}

// Remplit une carte déjà construite (la grande carte du Panier est préparée une fois et remplie à
// chaque ouverture : rien n'est créé).
function fillCard(el, card, imageUrl, extra = '') {
  const info = STAGE_INFO[card.stage] ?? STAGE_INFO.frais;
  el.className = `card stage-${card.stage}${extra}`;
  el.querySelector('.card-power').textContent = card.power;
  el.querySelector('.card-stage svg').innerHTML = info.shape;
  el.querySelector('.card-stage-label').textContent = info.label;
  const img = el.querySelector('.card-img');
  if (imageUrl) img.src = imageUrl;
  el.querySelector('.card-name').textContent = card.name;
  const spans = el.querySelectorAll('.card-props span');
  spans.forEach((sp, k) => {
    sp.textContent = card.properties[k] ?? '';
    sp.hidden = k >= card.properties.length;
  });
}

const CATEGORY = { alimentaire: 'Alimentaire', 'non-alimentaire': 'Non alimentaire', speciale: 'Spéciale' };

// Panier : bouton dans l'interface (nombre de cartes / capacité) et écran à deux onglets :
//  - « Cartes » (la liste de courses, nom provisoire) ;
//  - « Objets » : les vrais objets portés (Scanette, panier…), pas des cartes.
// Mode « reposer » (panier plein) : toucher une carte la repose pour faire de la place, ou annuler.
const TEMP = /^\[TEMP\]\s*/;

// objects : data/objects.json ; base : chemin des images du jeu.
export function createBasketUi(root, { onOpen, onClose, objects, base = '' }) {
  const button = document.createElement('button');
  button.className = 'hud-button panier-button';
  button.setAttribute('aria-label', 'Panier (I)');
  button.title = 'Panier (I)';
  // Un petit panier rouge (mêmes formes que le panier tenu en main), avec le nombre de cartes dessus.
  button.innerHTML =
    '<svg class="panier-icon" viewBox="0 0 80 64" aria-hidden="true">' +
    '<g stroke-linejoin="round"><g stroke="#fbf8ee" stroke-width="7">' +
    '<path d="M22 24 q0 -20 18 -20 q18 0 18 20 h-6 q0 -14 -12 -14 q-12 0 -12 14 z" fill="#b8473a"/>' +
    '<path d="M6 22 h68 l-7 34 q-1 5 -6 5 h-42 q-5 0 -6 -5 z" fill="#c0503f"/></g>' +
    '<g stroke="#3d352a" stroke-width="2.4">' +
    '<path d="M22 24 q0 -20 18 -20 q18 0 18 20 h-6 q0 -14 -12 -14 q-12 0 -12 14 z" fill="#b8473a"/>' +
    '<path d="M6 22 h68 l-7 34 q-1 5 -6 5 h-42 q-5 0 -6 -5 z" fill="#c0503f"/></g>' +
    '<path d="M11 33 h58 M13 44 h54 M18 22 v36 M62 22 v36" stroke="#8e2f25" stroke-width="2" fill="none"/></g></svg>' +
    '<span class="panier-count">0</span>';
  button.hidden = true; // pas de panier au début : on le prend à l'accueil
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
  // Fermer (ou Annuler) : en haut à droite et en bas à droite, papier kraft foncé.
  const closeTop = document.createElement('button');
  closeTop.className = 'kraft-close';
  closeTop.addEventListener('click', () => onClose());
  const head = document.createElement('div');
  head.className = 'panier-head';
  head.append(title, closeTop);
  const tabs = document.createElement('div');
  tabs.className = 'settings-tabs panier-tabs';
  tabs.setAttribute('role', 'tablist');
  const tabCards = document.createElement('button');
  const tabObjects = document.createElement('button');
  for (const [t, label] of [[tabCards, 'Cartes'], [tabObjects, 'Objets']]) {
    t.className = 'settings-tab';
    t.textContent = label;
    t.setAttribute('role', 'tab');
    t.addEventListener('click', () => showTab(t === tabCards ? 'cards' : 'objects'));
    tabs.appendChild(t);
  }
  const hint = document.createElement('p');
  hint.className = 'settings-note panier-hint';
  hint.hidden = true;
  // Sous-onglets des cartes (filtres) : Toutes, Alimentaire, Non alimentaire, Spéciales.
  const filters = document.createElement('div');
  filters.className = 'panier-filters';
  const FILTERS = [['toutes', 'Toutes'], ['alimentaire', 'Alimentaire'], ['non-alimentaire', 'Non alimentaire'], ['speciale', 'Spéciales']];
  const filterBtns = FILTERS.map(([id, label]) => {
    const b = document.createElement('button');
    b.className = 'panier-filter';
    b.textContent = label;
    b.dataset.filter = id;
    b.addEventListener('click', () => setFilter(id));
    filters.appendChild(b);
    return b;
  });
  const grid = document.createElement('div');
  grid.className = 'panier-grid';
  const noneInFilter = document.createElement('p');
  noneInFilter.className = 'settings-note panier-none';
  noneInFilter.textContent = 'Aucune carte de ce genre pour l’instant.';
  function setFilter(id) {
    grid.dataset.filter = id;
    filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === id));
    const visible = id === 'toutes' ? shown : grid.querySelectorAll(`.card[data-category="${id}"]`).length;
    noneInFilter.hidden = tab !== 'cards' || shown === 0 || visible > 0;
  }
  const empty = document.createElement('p');
  empty.className = 'settings-note';
  empty.textContent = "Le panier est vide. Approche-toi d'un produit sur l'étagère et scanne-le avec la Scanette.";
  const objList = document.createElement('ul');
  objList.className = 'panier-objects';
  const close = document.createElement('button');
  close.className = 'kraft-close';
  close.textContent = 'Fermer (Échap)';
  close.addEventListener('click', () => onClose());
  const row = document.createElement('div');
  row.className = 'panel-buttons';
  row.appendChild(close);
  panel.append(head, tabs, filters, hint, empty, noneInFilter, grid, objList, row);

  // Une carte touchée : elle se retourne comme une feuille et s'affiche en grand, sa description au dos ;
  // elle se referme en touchant à côté (ou Échap, B), sans bouton.
  // La grande carte est dessinée à sa taille (texte net), pas agrandie. Préparée une fois.
  const detail = document.createElement('div');
  detail.className = 'card-detail';
  detail.hidden = true;
  detail.setAttribute('role', 'dialog');
  detail.setAttribute('aria-label', 'Carte');
  detail.tabIndex = -1; // reçoit le focus (clavier, manette) ; on referme en touchant à côté, Échap ou B
  const flipper = document.createElement('div');
  flipper.className = 'card-flip';
  const front = buildCard({ name: '', power: 0, stage: 'frais', properties: [] }, '');
  const back = document.createElement('div');
  back.innerHTML = `
    <div class="card-top"><span class="card-power"></span><span class="card-back-cat"></span></div>
    <div class="card-name"></div>
    <p class="card-desc"></p>
    <div class="card-props">${'<span></span>'.repeat(MAX_PROPS)}</div>
    <p class="card-back-stage"></p>`;
  flipper.append(front, back);
  detail.append(flipper);
  root.append(button, panel, detail);
  let detailCard = null;
  let backShown = false;
  let reduce = () => false;

  function setFace(showBack) {
    backShown = showBack;
    flipper.classList.toggle('show-back', showBack);
  }
  // Animation en deux temps (la feuille se plie de profil, puis se déplie de l'autre côté) ;
  // fin de chaque temps : événement animationend (rien n'est compté en temps réel).
  function animate(first, second, mid) {
    if (reduce()) {
      mid();
      return;
    }
    flipper.classList.remove('anim-in', 'anim-out', 'anim-fold', 'anim-unfold', 'anim-back1', 'anim-back2');
    void flipper.offsetWidth;
    flipper.classList.add(first);
    flipper.onanimationend = () => {
      flipper.classList.remove(first);
      mid();
      flipper.classList.add(second);
      flipper.onanimationend = () => {
        flipper.classList.remove(second);
        flipper.onanimationend = null;
      };
    };
  }
  // Départ (ou arrivée) de l'animation : là où est la petite carte (mesuré à l'ouverture et à la fermeture).
  function measureFrom(el) {
    const a = el.getBoundingClientRect();
    const b = flipper.getBoundingClientRect();
    flipper.style.setProperty('--fx', `${a.left + a.width / 2 - (b.left + b.width / 2)}px`);
    flipper.style.setProperty('--fy', `${a.top + a.height / 2 - (b.top + b.height / 2)}px`);
    flipper.style.setProperty('--fs', String(a.width / b.width));
  }
  function openDetail(el) {
    const card = cards.get(Number(el.dataset.uid));
    if (!card) return;
    detailCard = el;
    fillCard(front, card.card, card.url, ' card-big card-front');
    back.className = `card card-big card-back stage-${card.card.stage}`;
    back.querySelector('.card-power').textContent = card.card.power;
    back.querySelector('.card-back-cat').textContent = CATEGORY[card.card.category] ?? '';
    back.querySelector('.card-name').textContent = card.card.name;
    back.querySelector('.card-desc').textContent = card.card.description || '…';
    back.querySelectorAll('.card-props span').forEach((sp, k) => {
      sp.textContent = card.card.properties[k] ?? '';
      sp.hidden = k >= card.card.properties.length;
    });
    back.querySelector('.card-back-stage').textContent = `Stade : ${(STAGE_INFO[card.card.stage] ?? STAGE_INFO.frais).label}`;
    setFace(false);
    detail.hidden = false;
    measureFrom(el);
    el.classList.add('lifted'); // la petite carte quitte le Panier : une seule carte à l'écran
    animate('anim-in', 'anim-out', () => setFace(true));
    detail.focus({ preventScroll: true });
  }
  // Refermer : la carte se retourne dans l'autre sens et revient à sa place dans le Panier.
  let closing = false;
  function closeDetail() {
    if (detail.hidden || closing) return;
    const el = detailCard;
    const done = () => {
      closing = false;
      detail.hidden = true;
      detail.classList.remove('closing');
      flipper.onanimationend = null;
      flipper.classList.remove('anim-in', 'anim-out', 'anim-fold', 'anim-unfold', 'anim-back1', 'anim-back2');
      el?.classList.remove('lifted');
      el?.focus({ preventScroll: true });
      if (detailCard === el) detailCard = null;
    };
    if (reduce() || !el || el.offsetParent === null) {
      done();
      return;
    }
    closing = true;
    detail.classList.add('closing');
    measureFrom(el);
    animate('anim-back1', 'anim-back2', () => setFace(false));
    // fin du second temps : la carte est revenue à sa place
    const second = flipper.onanimationend;
    flipper.onanimationend = () => {
      second();
      flipper.onanimationend = () => done();
    };
  }
  // Toucher la grande carte : elle se retourne (recto, verso).
  function flipDetail() {
    if (closing) return;
    animate('anim-fold', 'anim-unfold', () => setFace(!backShown));
  }
  flipper.addEventListener('click', (e) => {
    e.stopPropagation();
    flipDetail();
  });
  // Toucher à côté de la carte : elle se referme.
  detail.addEventListener('click', (e) => {
    if (e.target === detail) closeDetail();
  });
  const cards = new Map(); // uid → { card, url }

  let shown = 0;
  let cap = 0;
  let tab = 'cards';
  let choose = null; // mode « reposer » : fonction appelée avec l'identifiant de la carte choisie
  const owned = [];

  function showTab(t) {
    tab = choose ? 'cards' : t;
    tabCards.setAttribute('aria-selected', tab === 'cards');
    tabObjects.setAttribute('aria-selected', tab === 'objects');
    tabCards.classList.toggle('active', tab === 'cards');
    tabObjects.classList.toggle('active', tab === 'objects');
    grid.hidden = tab !== 'cards';
    filters.hidden = tab !== 'cards' || !!choose;
    setFilter(choose ? 'toutes' : grid.dataset.filter || 'toutes');
    empty.hidden = tab !== 'cards' || shown > 0;
    objList.hidden = tab !== 'objects';
    tabs.hidden = !!choose;
  }

  // En mode « reposer », chaque carte devient un bouton (doigt, souris, ou Entrée sur la carte).
  function pickFrom(target) {
    const el = target.closest('.card');
    if (!el) return;
    if (!choose) {
      openDetail(el); // consultation : la carte se retourne et s'affiche en grand
      return;
    }
    const pick = choose;
    choose = null;
    pick(Number(el.dataset.uid));
  }
  grid.addEventListener('click', (e) => pickFrom(e.target));
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    pickFrom(e.target);
  });

  return {
    button,
    // Le héros a un contenant : le bouton apparaît, avec la capacité.
    setCapacity(c) {
      cap = c;
      button.hidden = c <= 0;
      count.textContent = `${shown}/${cap}`;
    },
    // Ajoute la carte à l'écran du Panier (créée une fois, au moment du scan, pas à chaque image).
    add(card, imageUrl) {
      const el = buildCard(card, imageUrl);
      el.classList.add('card-mini');
      el.dataset.uid = card.uid;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${card.name} : voir la carte`);
      cards.set(card.uid, { card, url: imageUrl });
      el.dataset.category = card.category;
      el.tabIndex = 0;
      grid.appendChild(el);
      shown++;
    },
    // Une carte reposée quitte l'écran.
    remove(uid) {
      grid.querySelector(`.card[data-uid="${uid}"]`)?.remove();
      cards.delete(uid);
      shown--;
    },
    // Un objet porté apparaît dans l'onglet « Objets » (id : clé dans data/objects.json).
    addObject(id) {
      const def = objects[id];
      if (!def || owned.includes(id)) return;
      owned.push(id);
      const li = document.createElement('li');
      const img = new Image(); // petite icône d'interface, chargée au moment où l'objet est pris
      img.className = 'object-icon';
      img.alt = '';
      img.width = 56;
      img.height = 56;
      img.decoding = 'async';
      img.src = base + def.image;
      const txt = document.createElement('div');
      const b = document.createElement('strong');
      b.textContent = def.name.replace(TEMP, '');
      const p = document.createElement('span');
      p.textContent = def.text.replace(TEMP, '');
      txt.append(b, p);
      li.append(img, txt);
      objList.appendChild(li);
    },
    setCount(n) {
      count.textContent = `${n}/${cap}`;
      button.classList.remove('bump');
      void button.offsetWidth; // relance la petite animation
      button.classList.add('bump');
    },
    // Onglet précédent ou suivant (clavier, manette) ; pas en mode « reposer ».
    switchTab() {
      if (!panel.hidden && !choose) showTab(tab === 'cards' ? 'objects' : 'cards');
    },
    // onChoose(uid) : mode « reposer une carte » (panier plein) ; sans : consultation.
    open(onChoose = null) {
      choose = onChoose;
      panel.classList.toggle('choosing', !!choose);
      title.textContent = choose ? 'Panier plein' : `Panier — ${shown} carte${shown > 1 ? 's' : ''} sur ${cap}`;
      hint.hidden = !choose;
      hint.textContent = 'Touche une carte pour la reposer et faire de la place, ou ferme pour annuler.';
      showTab(choose ? 'cards' : tab);
      panel.hidden = false;
      close.textContent = choose ? 'Annuler (Échap)' : 'Fermer (Échap)';
      closeTop.textContent = choose ? 'Annuler ✕' : 'Fermer ✕';
      (choose ? grid.querySelector('.card') ?? close : close).focus({ preventScroll: true });
    },
    close() {
      closeDetail();
      panel.hidden = true;
      choose = null;
    },
    // La grande carte est ouverte (Échap, B : la refermer d'abord).
    get detailOpen() {
      return !detail.hidden;
    },
    closeDetail,
    // « Réduire les animations » : la carte s'affiche sans se retourner.
    setReduceMotion(fn) {
      reduce = fn;
    },
    // Manette, clavier : A / Entrée sur la carte mise en avant (ou retourner la grande carte).
    press() {
      if (!detail.hidden) {
        flipDetail();
        return;
      }
      const a = document.activeElement;
      if (a?.classList.contains('card') && grid.contains(a)) pickFrom(a);
      else if (a?.tagName === 'BUTTON' && panel.contains(a)) a.click();
    },
    // Haut / bas : carte précédente ou suivante (parmi celles affichées).
    move(dir) {
      if (!detail.hidden || panel.hidden) return;
      const list = [...grid.querySelectorAll('.card')].filter((c) => c.offsetParent !== null);
      if (!list.length) return;
      const i = list.indexOf(document.activeElement);
      list[i < 0 ? 0 : (i + dir + list.length) % list.length].focus({ preventScroll: false });
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
