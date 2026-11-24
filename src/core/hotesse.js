// L'hôtesse d'accueil (A8) : logique pure, sans écran ni hasard.
// Derrière son comptoir, elle suit le héros du regard ; quand on lui parle :
//  1. Elle dit quelques slogans (slogansBeforeOffer, sans jamais boucler) ;
//  2. Si le héros a un rouleau de papier toilette (monnaie d'échange) et pas de jeton : elle propose
//     de l'échanger contre un jeton (Oui / Non) ;
//  3. Sinon, dès qu'elle a fini ses slogans (ou si le héros a déjà un jeton) : elle propose le chariot
//     (« Vous voulez un chariot ? » : Oui / Non).

const GAZE_DEADZONE = 18; // évite de basculer sans cesse quand le héros est pile en face (px)

export function createHotesse() {
  return {
    sloganIndex: 0, // prochain slogan à réciter (ne boucle pas)
    exchanged: false, // chariot déjà remis
  };
}

// Le héros est-il assez proche du comptoir pour parler à l'hôtesse ?
export function nearHotesse(def, walker) {
  const dx = walker.x - def.talkX;
  const dz = walker.z - def.talkZ;
  return dx * dx + dz * dz <= def.range * def.range;
}

// Sens du regard de l'hôtesse (-1 vers la gauche, 1 vers la droite) pour suivre le héros.
export function hotesseFacing(def, walkerX, current = 1) {
  const cx = def.at[0];
  if (walkerX < cx - GAZE_DEADZONE) return -1;
  if (walkerX > cx + GAZE_DEADZONE) return 1;
  return current;
}

// Peut-on échanger un rouleau de papier toilette contre un jeton ?
export function canExchangeRollForToken(gear) {
  return Boolean(gear.papier_toilette && !gear.jeton && !gear.chariot);
}

// Le héros a-t-il un jeton pour obtenir un chariot ?
export function canGetChariot(gear) {
  return Boolean(gear.jeton && !gear.chariot);
}

// Bouton d'action devant le comptoir : 'echanger', 'parler' ou '' (trop loin).
export function hotesseAction(def, walker, gear) {
  if (!nearHotesse(def, walker)) return '';
  return canExchangeRollForToken(gear) || canGetChariot(gear) ? 'echanger' : 'parler';
}

// Échange 1 rouleau de papier toilette contre 1 jeton de chariot.
export function exchangeRollForToken(gear) {
  gear.papier_toilette = false;
  gear.jeton = true;
}

// Consomme le jeton quand le joueur accepte le chariot.
export function consumeChariotToken(state, gear) {
  gear.jeton = false;
  state.exchanged = true;
}

export function talkToHotesse(state, lines, gear) {
  const offer = lines.chariotOffer;
  if (gear.chariot) return { kind: 'after', text: offer.after };
  if (canExchangeRollForToken(gear) && lines.tokenExchange) {
    const tx = lines.tokenExchange;
    return {
      kind: 'token_offer',
      text: tx.question,
      choices: [
        { text: tx.yes, reply: '', grantToken: true, grantReply: tx.grant },
        { text: tx.no, reply: tx.refuse, grantToken: false },
      ],
    };
  }
  const limit = Math.min(lines.slogans.length, lines.slogansBeforeOffer ?? lines.slogans.length);
  if (canGetChariot(gear) || state.sloganIndex >= limit) {
    const canGrant = canGetChariot(gear);
    return {
      kind: 'chariot_offer',
      text: offer.question,
      choices: [
        { text: offer.yes, reply: canGrant ? '' : offer.noToken, grantChariot: canGrant, grantReply: offer.grant },
        { text: offer.no, reply: offer.refuse, grantChariot: false },
      ],
    };
  }
  const text = lines.slogans[state.sloganIndex];
  state.sloganIndex++;
  return { kind: 'slogan', text };
}
