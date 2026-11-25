import { describe, expect, it } from 'vitest';
import {
  canExchangeRollForToken,
  canGetChariot,
  consumeChariotToken,
  createHotesse,
  exchangeRollForToken,
  hotesseAction,
  hotesseFacing,
  nearHotesse,
  talkToHotesse,
} from '../../src/core/hotesse.js';

const DEF = { at: [1106, 718], talkX: 1106, talkZ: 206, range: 145 };
const LINES = {
  slogansBeforeOffer: 3,
  slogans: ['Slogan 1', 'Slogan 2', 'Slogan 3', 'Slogan 4'],
  tokenExchange: {
    question: 'Échanger le rouleau contre un jeton ?',
    yes: 'Oui',
    no: 'Non',
    refuse: 'Le cours du rouleau est volatil !',
    grant: 'Un jeton tout neuf !',
  },
  chariotOffer: {
    question: 'Vous voulez un chariot ?',
    yes: 'Oui',
    no: 'Non',
    noToken: 'Dommage, il faut un jeton !',
    refuse: 'Très bien… vos bras me remercieront plus tard.',
    grant: 'Attention aux accidents !',
    after: 'Bonne route !',
  },
};

describe('hotesse (core/hotesse.js)', () => {
  it('détecte la proximité devant le comptoir', () => {
    expect(nearHotesse(DEF, { x: 1106, z: 206 })).toBe(true);
    expect(nearHotesse(DEF, { x: 1200, z: 160 })).toBe(true);
    expect(nearHotesse(DEF, { x: 1400, z: 206 })).toBe(false);
  });

  it('suit le héros du regard avec une zone morte au centre', () => {
    expect(hotesseFacing(DEF, 900, 1)).toBe(-1);
    expect(hotesseFacing(DEF, 1300, -1)).toBe(1);
    expect(hotesseFacing(DEF, 1110, -1)).toBe(-1);
  });

  it('propose parler sans monnaie, échanger avec rouleau ou jeton', () => {
    expect(hotesseAction(DEF, { x: 1400, z: 206 }, {})).toBe('');
    expect(hotesseAction(DEF, { x: 1106, z: 206 }, {})).toBe('parler');
    expect(hotesseAction(DEF, { x: 1106, z: 206 }, { papier_toilette: true })).toBe('echanger');
    expect(hotesseAction(DEF, { x: 1106, z: 206 }, { jeton: true })).toBe('echanger');
    expect(hotesseAction(DEF, { x: 1106, z: 206 }, { chariot: true })).toBe('parler');
  });

  it('propose le chariot une fois après 3 slogans sans jeton, puis récite naturellement tous les slogans restants', () => {
    const state = createHotesse();
    const gear = {};
    const linesWithIdle = { ...LINES, chariotOffer: { ...LINES.chariotOffer, idle: 'Je reste à votre disposition.' } };
    expect(talkToHotesse(state, linesWithIdle, gear)).toEqual({ kind: 'slogan', text: 'Slogan 1' });
    expect(talkToHotesse(state, linesWithIdle, gear)).toEqual({ kind: 'slogan', text: 'Slogan 2' });
    expect(talkToHotesse(state, linesWithIdle, gear)).toEqual({ kind: 'slogan', text: 'Slogan 3' });
    const offer = talkToHotesse(state, linesWithIdle, gear);
    expect(offer.kind).toBe('chariot_offer');
    expect(offer.text).toBe('Vous voulez un chariot ?');
    expect(offer.choices[0]).toMatchObject({ text: 'Oui', reply: 'Dommage, il faut un jeton !', grantChariot: false });
    expect(offer.choices[1]).toMatchObject({ text: 'Non', reply: 'Très bien… vos bras me remercieront plus tard.', grantChariot: false });
    // Après cette proposition unique, elle continue les slogans restants sans boucler mécaniquement sur le chariot.
    expect(talkToHotesse(state, linesWithIdle, gear)).toEqual({ kind: 'slogan', text: 'Slogan 4' });
    expect(talkToHotesse(state, linesWithIdle, gear)).toEqual({ kind: 'slogan', text: 'Je reste à votre disposition.' });
  });

  it('enchaîne rouleau de PQ → jeton → chariot', () => {
    const state = createHotesse();
    const gear = { panier: true, papier_toilette: true };
    expect(canExchangeRollForToken(gear)).toBe(true);
    const tokOffer = talkToHotesse(state, LINES, gear);
    expect(tokOffer.kind).toBe('token_offer');
    expect(tokOffer.choices[0].grantToken).toBe(true);

    exchangeRollForToken(gear);
    expect(gear.papier_toilette).toBe(false);
    expect(gear.jeton).toBe(true);
    expect(canGetChariot(gear)).toBe(true);

    const chOffer = talkToHotesse(state, LINES, gear);
    expect(chOffer.kind).toBe('chariot_offer');
    expect(chOffer.choices[0].grantChariot).toBe(true);

    consumeChariotToken(state, gear);
    gear.chariot = true;
    expect(gear.jeton).toBe(false);
    expect(state.exchanged).toBe(true);
    expect(talkToHotesse(state, LINES, gear)).toEqual({ kind: 'after', text: 'Bonne route !' });
  });
});
