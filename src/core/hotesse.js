// L'hôtesse d'accueil (A8) : logique pure, sans écran ni hasard.
// Derrière son comptoir, elle suit le héros du regard ; quand on lui parle :
//  1. Si le héros a un rouleau de papier toilette (et pas de jeton) : elle propose de l'échanger contre un jeton ;
//  2. Si le héros a un jeton : elle propose aussitôt le chariot (« Vous voulez un chariot ? » : Oui / Non) ;
//  3. Sans jeton : elle récite ses slogans naturellement dans l'ordre, glisse une seule fois sa proposition de
//     chariot après slogansBeforeOffer slogans, puis continue le reste de ses 10 slogans sans jamais boucler
//     artificiellement sur la question, avant une réplique d'attente polie.

const GAZE_DEADZONE = 18; // évite de basculer sans cesse quand le héros est pile en face (px)

export function createHotesse() {
  return {
    sloganIndex: 0, // prochain slogan à réciter (ne boucle pas)
    offeredWithoutToken: false, // proposition de chariot déjà posée une fois sans jeton
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
  if (canGetChariot(gear)) {
    return {
      kind: 'chariot_offer',
      text: offer.question,
      choices: [
        { text: offer.yes, reply: '', grantChariot: true, grantReply: offer.grant },
        { text: offer.no, reply: offer.refuse, grantChariot: false },
      ],
    };
  }
  if (!state.offeredWithoutToken && state.sloganIndex >= limit) {
    state.offeredWithoutToken = true;
    return {
      kind: 'chariot_offer',
      text: offer.question,
      choices: [
        { text: offer.yes, reply: offer.noToken, grantChariot: false, grantReply: offer.grant },
        { text: offer.no, reply: offer.refuse, grantChariot: false },
      ],
    };
  }
  if (state.sloganIndex < lines.slogans.length) {
    const text = lines.slogans[state.sloganIndex];
    state.sloganIndex++;
    return { kind: 'slogan', text };
  }
  return { kind: 'slogan', text: offer.idle ?? lines.slogans[lines.slogans.length - 1] };
}
