// Poses d'un personnage ou d'un objet animé (le héros, l'agent de sécurité, les personnages à venir).
// Règle (séance 61, docs/ARCHITECTURE.md §4) : un seul calque, sur le conteneur ; ses poses sont des
// images à l'intérieur, une seule visible à la fois (hidden), sans will-change ni calque propre.
// Jamais un calque par pose : un calque caché n'est pas préparé, le téléphone le dessine à froid quand
// il apparaît, d'où un trou d'une image (l'agent clignotait ainsi, séance 60).
//
// images : images décodées (scene/assets.js) ; parent : le conteneur ; size : [largeur, hauteur] ;
// className : classe des images.

export function createPoses(images, parent, [w, h], className) {
  const els = new Map(); // une image par source distincte
  let shown = null;
  let warming = 0; // images restantes du préchauffage
  return {
    // Préchauffage (séance 68, règle « rien n'apparaît à froid ») : pendant quelques images, toutes les poses
    // sont montrées, presque transparentes, pour que le téléphone les prépare toutes ; sinon chaque pose
    // montrée pour la première fois manquait une image (le héros clignait à ses premiers clignements d'yeux).
    warm(frames = 3) {
      warming = frames;
      for (const el of els.values()) {
        if (el === shown) continue;
        el.style.opacity = '0.01';
        el.hidden = false;
      }
    },
    // À chaque image affichée : termine le préchauffage quand il est fini.
    tick() {
      if (warming <= 0 || --warming > 0) return;
      for (const el of els.values()) {
        if (el === shown) continue;
        el.hidden = true;
        el.style.opacity = '';
      }
    },
    // L'élément d'une pose (préparé au chargement, caché).
    el(url) {
      if (!els.has(url)) {
        const img = images.get(url).el;
        img.className = className;
        img.width = w;
        img.height = h;
        img.alt = '';
        img.draggable = false;
        img.hidden = true;
        parent.appendChild(img);
        els.set(url, img);
      }
      return els.get(url);
    },
    // Montrer une pose (et cacher la précédente). Renvoie true si l'image affichée a changé.
    show(el) {
      if (el === shown) return false;
      if (shown) shown.hidden = true;
      el.hidden = false;
      el.style.opacity = ''; // (si elle était en préchauffage)
      shown = el;
      return true;
    },
  };
}
