// Petits nuages de poussière en papier, à chaque pas (comme dans Paper Mario).
// Une petite réserve d'éléments créés au chargement et réutilisés : rien n'est créé pendant le jeu.
// Animés par le temps de jeu (figés en pause), seulement en transform et opacity.

const POOL = 6;
const DRIFT = 26; // recul du nuage, en pixels de scène, sur sa durée de vie
const RISE = 16; // montée du nuage

// image : { url, w, h } ; anchor : point du nuage posé au sol (dans l'image).
export function createDust(parent, image, anchor, settings, display) {
  const items = [];
  for (let i = 0; i < POOL; i++) {
    const el = new Image();
    el.src = image.url;
    el.className = 'dust';
    el.width = image.w;
    el.height = image.h;
    el.alt = '';
    el.hidden = true;
    el.style.transformOrigin = `${anchor[0]}px ${anchor[1]}px`;
    parent.appendChild(el);
    items.push({ el, active: false, start: 0, x: 0, y: 0, dir: 1, scale: 1 });
  }
  let next = 0;
  const anchorX = anchor[0];
  const anchorY = anchor[1];

  const counter = { spawns: 0 }; // pour le diagnostic
  return {
    counter,
    // (sx, sy) : pieds du personnage sur la scène ; facing : 1 vers la droite, -1 vers la gauche.
    spawn(sx, sy, facing, scale, level, time) {
      if (!settings.dust || display.reduceMotion) return;
      const it = items[next];
      counter.spawns++;
      next = (next + 1) % POOL;
      it.active = true;
      it.start = time;
      it.x = sx - facing * 22 * scale; // derrière le pied
      it.y = sy + 2;
      it.dir = -facing;
      it.scale = scale * settings.dustSize;
      it.el.style.zIndex = level;
      it.el.hidden = false;
    },
    update(time) {
      const dur = settings.dustDuration;
      for (let i = 0; i < POOL; i++) {
        const it = items[i];
        if (!it.active) continue;
        const p = (time - it.start) / dur;
        if (p >= 1 || p < 0) {
          it.active = false;
          it.el.hidden = true;
          continue;
        }
        const ease = 1 - (1 - p) * (1 - p); // part vite, ralentit
        const s = it.scale * (0.35 + 0.75 * ease);
        const x = it.x + it.dir * DRIFT * ease - anchorX;
        const y = it.y - RISE * ease - anchorY;
        it.el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
        it.el.style.opacity = settings.dustOpacity * (1 - p) * (1 - p * 0.5);
      }
    },
  };
}
