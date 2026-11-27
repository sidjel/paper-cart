// Poses d'un personnage ou d'un objet animé (le héros, l'agent de sécurité, les personnages à venir).
// Sous PixiJS v8, chaque pose est une Texture préchargée ; on échange uniquement `target.texture`
// sur le Sprite / MeshPlane déjà monté, sans réaffectation redondante ni allocation en jeu.

export function createPoses(images, target, size = null) {
  const textures = new Map();
  let shown = null;

  function applySize(tex) {
    if (!target || !size) return;
    const tw = Math.max(1, tex?.width ?? size[0]);
    const th = Math.max(1, tex?.height ?? size[1]);
    if (target.scale?.set) target.scale.set(size[0] / tw, size[1] / th);
  }

  return {
    // Texture préparée pour une pose donnée (résolue une fois depuis `images`).
    texture(id) {
      if (!textures.has(id)) {
        const rec = images.get(id);
        textures.set(id, rec?.texture ?? rec);
      }
      return textures.get(id);
    },
    // Afficher une pose (et réafficher la cible si elle était cachée). Renvoie true si la texture a changé.
    show(tex) {
      if (!tex) return false;
      const changed = tex !== shown;
      if (changed) {
        if (target) {
          target.texture = tex;
          applySize(tex);
        }
        shown = tex;
      }
      if (target && !target.visible) target.visible = true;
      return changed;
    },
    // Cacher temporairement la pose active (ex. pendant le rendu MeshPlane 2.5D du retournement).
    hide() {
      if (target && target.visible) target.visible = false;
      shown = null;
    },
    current() {
      return shown;
    },
  };
}
