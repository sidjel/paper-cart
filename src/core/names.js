// Le nom du joueur dans les répliques (le héros l'appelle « mon Épaisseur » par défaut, ou un autre nom
// choisi dans les options, ou le nom que le joueur a tapé). Logique pure.
// Repères dans les textes : {mon nom} → « mon Épaisseur » ; {Mon… nom} → « Mon… Épaisseur » (il hésite) ;
// {nom} → « Épaisseur ». Un nom tapé par le joueur s'emploie seul : « Sid », « … Sid ».

export const OTHER = 'autre'; // choix « ton propre nom »
export const MAX_NAME = 16; // longueur maximale d'un nom tapé

// Nettoie un nom tapé : sans caractères de contrôle ni accolades ou chevrons, espaces resserrés, 16 au plus.
export function cleanName(raw) {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f<>{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME);
}

// Le nom à employer : { name, mon } (mon : possessif, '' pour un nom tapé).
export function playerName(names, id, custom) {
  const typed = cleanName(custom);
  if (id === OTHER && typed) return { name: typed, mon: '' };
  const n = names.find((x) => x.id === id) ?? names[0];
  return { name: n.name, mon: n.mon };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Remplace les repères du nom dans un texte.
export function fillName(text, who) {
  if (!text || !text.includes('{')) return text;
  return text
    .replace(/\{Mon… nom\}/g, who.mon ? `${cap(who.mon)}… ${who.name}` : `… ${who.name}`)
    .replace(/\{mon nom\}/g, who.mon ? `${who.mon} ${who.name}` : who.name)
    .replace(/\{nom\}/g, who.name);
}
