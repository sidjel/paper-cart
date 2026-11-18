// Produits sur l'étagère et effets du scanner (affichage seulement ; la logique est dans core/scan.js).
// - chaque produit est une illustration entière posée sur une tablette de l'étagère du fond,
//   ou ailleurs (sur une table, dans le chariot : « loose ») ; ces derniers sont dessinés juste
//   au-dessus de l'objet qui les porte, sur leur propre calque comme lui (pas de clignotement) ;
// - un repère en papier flotte au-dessus du produit à portée ;
// - pendant un scan : laser, dissolution du produit, confettis aspirés par la Scanette.
// Tout est créé au chargement et réutilisé ; animé par le temps de jeu (figé en pause),
// seulement en transform et opacity. Les éléments qui bougent ont leur propre calque pendant
// l'effet seulement (will-change posé au début, retiré à la fin).

const BITS_MAX = 24;

// Petit générateur déterministe (positions des confettis identiques d'un scan à l'autre).
function noise(i, k) {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

// items : produits du lieu (état du monde, core/world.js) — la seule source : ici on ne fait que les montrer.
// loose : { parent, levelOf(idObjet) } pour les produits posés ailleurs que sur l'étagère.
export function createProducts(items, images, parent, effectsParent, settings, display, loose) {
  // Place (ou replace) le dessin d'un produit d'après son état : calque, niveau, position, visible ou non.
  function place(i) {
    const it = items[i];
    const el = els[i];
    const into = it.loose ? loose.parent : parent;
    if (el.parentNode !== into) into.appendChild(el);
    el.classList.toggle('prop', !!it.loose); // posé ailleurs : même calque fixe que les objets du décor
    el.style.zIndex = it.loose ? loose.levelOf(it.on) : '';
    el.style.opacity = '';
    el.style.transform = `translate(${it.x - it.w / 2}px, ${it.y - it.h}px)`;
    el.hidden = it.scanned;
  }
  const els = items.map((it) => {
    const el = new Image();
    el.src = images.get(it.def.image).url;
    el.className = 'product';
    el.alt = '';
    el.draggable = false;
    el.width = it.w;
    el.height = it.h;
    return el;
  });
  items.forEach((_, i) => place(i));

  // Réserve pour les échanges avec un produit venu d'un autre lieu (A7) : quelques images préparées au
  // chargement ; l'image d'un produit échangé y est posée et décodée pendant que le joueur choisit sa carte,
  // avant d'apparaître (rien n'apparaît à froid). Au retour dans le lieu, il a sa propre image.
  const spares = [];
  for (let k = 0; k < settings.exchangeSpares; k++) {
    const el = new Image();
    el.className = 'product';
    el.alt = '';
    el.draggable = false;
    el.hidden = true;
    spares.push({ el, used: false });
  }

  // Repère au-dessus du produit à portée.
  const marker = document.createElement('div');
  marker.className = 'scan-marker';
  marker.innerHTML = '<svg viewBox="0 0 40 40" width="40" height="40"><path d="M6 8 h28 l-14 24 z" fill="#fbf8ee" stroke="#4a4236" stroke-width="3" stroke-linejoin="round"/></svg>';
  effectsParent.appendChild(marker);
  let markerOn = -1;

  // Laser : un trait rouge (et son halo) qui part de la Scanette.
  const laser = document.createElement('div');
  laser.className = 'scan-laser';
  laser.innerHTML = '<div class="scan-laser-halo"></div><div class="scan-laser-core"></div>';
  effectsParent.appendChild(laser);

  // Confettis : juste le nombre réglé (le réglage s'applique au rechargement).
  const bits = [];
  const bitsCount = Math.min(BITS_MAX, settings.particles);
  for (let i = 0; i < bitsCount; i++) {
    const b = document.createElement('div');
    b.className = 'scan-bit';
    b.hidden = true;
    effectsParent.appendChild(b);
    bits.push(b);
  }
  let bitsOn = false;
  let dissolving = -1;

  function setMarker(index, time) {
    if (index < 0) markAt(-1, 0, 0, time);
    else markAt(index, items[index].x, items[index].y - items[index].h, time);
  }

  // Repère au-dessus d'un point (x, haut du dessin) de la scène ; key : ce qui est visé (-1 : rien).
  function markAt(key, x, top, time) {
    if (key !== markerOn) {
      marker.classList.toggle('visible', key !== -1);
      markerOn = key;
    }
    if (key === -1) return;
    const bob = display.reduceMotion ? 0 : Math.sin(time * 5) * 6;
    marker.style.transform = `translate3d(${x - 20}px, ${top - 46 + bob}px, 0)`;
  }

  function hideEffects() {
    laser.classList.remove('visible');
    if (bitsOn) {
      for (const b of bits) b.hidden = true;
      bitsOn = false;
    }
  }

  // Appelé à chaque image affichée. scan : état du scan (core) ; progress : avancement de la phase ;
  // tip : bout de la Scanette sur la scène { x, y }.
  function update(scan, progress, tip) {
    if (!scan.active) {
      hideEffects();
      return;
    }
    const it = items[scan.index];
    const el = els[scan.index];
    const cx = it.x;
    const cy = it.y - it.h / 2;

    // Laser : grandit pendant sa phase, tremble puis s'éteint pendant la dissolution.
    if (scan.phase === 'laser' || scan.phase === 'dissolve') {
      const dx = cx - tip.x;
      const dy = cy - tip.y;
      const len = Math.hypot(dx, dy);
      const grow = scan.phase === 'laser' ? progress : 1;
      const fade = scan.phase === 'dissolve' ? 1 - progress : 1;
      laser.style.width = `${len}px`;
      laser.style.transform = `translate3d(${tip.x}px, ${tip.y}px, 0) rotate(${Math.atan2(dy, dx)}rad) scaleX(${grow})`;
      laser.style.opacity = fade;
      laser.classList.add('visible');
    } else {
      laser.classList.remove('visible');
    }

    // Dissolution du produit et confettis aspirés vers la Scanette.
    if (scan.phase === 'dissolve') {
      if (dissolving !== scan.index) {
        dissolving = scan.index;
        el.style.willChange = 'transform, opacity';
        const colors = it.def.colors;
        bits.forEach((b, i) => {
          b.hidden = false;
          b.style.background = colors[i % colors.length];
        });
        bitsOn = true;
      }
      const p = progress;
      el.style.opacity = 1 - p;
      el.style.transform = `translate(${it.x - it.w / 2}px, ${it.y - it.h}px) scale(${1 - 0.5 * p})`;
      const n = bits.length;
      for (let i = 0; i < n; i++) {
        // Chaque confetti part d'un point du produit, avec un petit retard, et file en courbe vers la Scanette.
        const start = noise(i, 1) * 0.45;
        const q = Math.max(0, Math.min(1, (p - start) / (1 - start)));
        const e = q * q;
        const sx = it.x + (noise(i, 2) - 0.5) * it.w;
        const sy = it.y - noise(i, 3) * it.h;
        const mx = (sx + tip.x) / 2 + (noise(i, 4) - 0.5) * 120;
        const my = Math.min(sy, tip.y) - 40 - noise(i, 5) * 60;
        const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tip.x;
        const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * tip.y;
        const s = (1 - 0.7 * e) * (0.6 + noise(i, 6));
        bits[i].style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${(noise(i, 7) - 0.5) * 6 + q * 8}rad) scale(${s})`;
        bits[i].style.opacity = q >= 1 ? 0 : 1;
      }
    } else if (bitsOn) {
      for (const b of bits) b.hidden = true;
      bitsOn = false;
    }
  }

  // Le produit a été aspiré : il disparaît de l'étagère (l'état « scanné » est tenu par le monde).
  function remove(index) {
    els[index].hidden = true;
    els[index].style.willChange = '';
    dissolving = -1;
  }

  // Prépare l'image d'un produit échangé (entry : core/world.js swapEntry). Renvoie son numéro, ou -1.
  function reserve(entry) {
    const k = spares.findIndex((s) => !s.used);
    if (k < 0) return -1;
    const s = spares[k];
    s.used = true;
    s.el.src = images.get(entry.def.image).url;
    s.el.width = entry.w;
    s.el.height = entry.h;
    s.el.decode?.().catch(() => {});
    return k;
  }
  // Le produit `index` (nouveau, dans l'état du monde) prend l'image préparée `k`.
  function adopt(index, k) {
    els[index] = spares[k].el;
  }

  return { setMarker, markAt, update, remove, sync: place, reserve, adopt };
}
