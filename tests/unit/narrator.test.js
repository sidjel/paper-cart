import { describe, it, expect } from 'vitest';
import { createNarrator, narrate, stepNarrator, skipNarrator, silenceNarrator, stepIdle, answer, waitingAnswer, waitingTap, inScene, endLine, approach } from '../../src/core/narrator.js';
import file from '../../src/data/narrator.json';

const P = { enabled: true, speed: 40, hold: 2, holdPerChar: 0, minGap: 20, lineCooldown: 600, inactivity: 30, asides: true, asideGap: 90, breath: 4, followDelay: 0.8, glanceGap: 25, followWait: 20 };
const DATA = {
  triggers: { arrivee: { once: true, strong: true }, scan: { every: 3 }, idle: {} },
  lines: [
    { id: 'a', trigger: 'arrivee', text: 'Bonjour' },
    { id: 's1', trigger: 'scan', text: 'Un' },
    { id: 's2', trigger: 'scan', text: 'Deux' },
    { id: 'i1', trigger: 'idle', text: 'Zzz' },
  ],
};
// Avance le temps de jeu de `s` secondes par pas de 1/60 s.
function run(n, s) {
  for (let t = 0; t < s; t += 1 / 60) stepNarrator(n, DATA, 1 / 60, P);
}

describe('narrateur : quand parler', () => {
  it('un moment fort coupe la réplique en cours (le premier scan n’est jamais perdu)', () => {
    const n = createNarrator();
    narrate(n, DATA, 'idle', P);
    expect(narrate(n, DATA, 'arrivee', P).id).toBe('a');
    expect(n.line.id).toBe('a');
  });
  it('« once » : une seule fois ; un moment ordinaire ne coupe pas une réplique en cours', () => {
    const n = createNarrator();
    expect(narrate(n, DATA, 'arrivee', P).id).toBe('a');
    expect(narrate(n, DATA, 'scan', P)).toBe(null); // il parle déjà
    run(n, 10);
    expect(narrate(n, DATA, 'arrivee', P)).toBe(null);
  });
  it('« every: 3 » : la 1re, la 4e, la 7e occurrence…', () => {
    const n = createNarrator();
    const said = [];
    const Q = { ...P, lineCooldown: 0 }; // ici, seule la règle « every » compte
    for (let k = 0; k < 7; k++) {
      said.push(!!narrate(n, DATA, 'scan', Q));
      run(n, 30); // assez pour finir la réplique et respecter l'écart minimal
    }
    expect(said).toEqual([true, false, false, true, false, false, true]);
  });
  it('écart minimal entre deux prises de parole, sauf moment fort', () => {
    const n = createNarrator();
    narrate(n, DATA, 'idle', P);
    run(n, 5); // réplique finie, mais moins de 20 s depuis
    expect(narrate(n, DATA, 'idle', P)).toBe(null);
    expect(narrate(n, DATA, 'arrivee', P)?.id).toBe('a'); // fort : passe quand même
  });
  it('anti-répétition : la réplique dite il y a le plus longtemps, jamais deux fois en 600 s', () => {
    const n = createNarrator();
    const ids = [];
    for (let k = 0; k < 7; k++) {
      const l = narrate(n, DATA, 'scan', P);
      if (l) ids.push(l.id);
      run(n, 30);
    }
    expect(ids).toEqual(['s1', 's2']); // la 3e fois, les deux sont encore « récentes » : il se tait
  });
  it('désactivé : il ne dit rien', () => {
    expect(narrate(createNarrator(), DATA, 'arrivee', { ...P, enabled: false })).toBe(null);
  });
});

describe('deux voix : haut-parleur et apartés du héros', () => {
  const D = {
    triggers: {
      arrivee: { once: true, strong: true },
      aparte_accueil: { voice: 'heros', once: true, follows: 'arrivee' },
      vide: { every: 2 },
      aparte_vide: { voice: 'heros' },
      inactif: { every: 2, from: 2 },
      parle_seul: { follows: '@heros', every: 2 },
    },
    lines: [
      { id: 'a', trigger: 'arrivee', text: 'Bienvenue' },
      { id: 'h', trigger: 'aparte_accueil', text: 'Psst' },
      { id: 'v', trigger: 'vide', text: 'Rien' },
      { id: 'hv', trigger: 'aparte_vide', text: 'Pourquoi' },
      { id: 'i', trigger: 'inactif', text: 'Dodo' },
      { id: 'r', trigger: 'parle_seul', text: 'Au mur' },
    ],
  };
  const go = (n, s) => {
    for (let t = 0; t < s; t += 1 / 60) stepNarrator(n, D, 1 / 60, P);
  };
  it('l’aparté suit l’accueil, puis le haut-parleur réagit au « client qui parle au mur »', () => {
    const n = createNarrator();
    narrate(n, D, 'arrivee', P); // ≈ 0,2 s d'écriture + 2 s affichée, puis 0,8 s d'enchaînement
    go(n, 3.5);
    expect(n.voice).toBe('heros');
    expect(n.line.id).toBe('h');
    go(n, 3.5);
    expect(n.voice).toBe('narrateur');
    expect(n.line.id).toBe('r');
  });
  it('une seule voix à la fois ; pendant un aparté, le magasin se fige : le haut-parleur se tait', () => {
    const n = createNarrator();
    narrate(n, D, 'vide', P); // annonce en cours
    expect(narrate(n, D, 'aparte_vide', P)).toBe(null); // l'aparté ne coupe pas
    const m = createNarrator();
    m.t = 100;
    narrate(m, D, 'aparte_vide', P); // aparté en cours…
    expect(narrate(m, D, 'vide', P)).toBe(null); // … le haut-parleur se tait
    expect(narrate(m, D, 'arrivee', P)).toBe(null); // même pour un moment fort
    expect(m.voice).toBe('heros');
  });
  it('petits regards caméra : sans texte, après une annonce, coupés par une annonce, au plus un toutes les 25 s', () => {
    const G = {
      triggers: { annonce: {}, regard: { voice: 'regard', follows: '@narrateur', cooldown: 0 } },
      lines: [{ id: 'a', trigger: 'annonce', text: 'Promo' }, { id: 'r', trigger: 'regard', text: '', emotion: 'blase' }],
    };
    const n = createNarrator();
    const run2 = (s) => {
      for (let t = 0; t < s; t += 1 / 60) stepNarrator(n, G, 1 / 60, P);
    };
    narrate(n, G, 'annonce', P);
    run2(3.5); // annonce finie, puis regard enchaîné
    expect(n.voice).toBe('regard');
    expect(narrate(n, G, 'annonce', { ...P, minGap: 0, lineCooldown: 0 }).id).toBe('a'); // une annonce coupe le regard
    run2(4);
    expect(n.line).toBe(null); // le regard suivant attend 25 s
  });
  it('pensée du héros (il se parle à lui-même) : quand il veut, sans couper personne ; une annonce la coupe', () => {
    const T = {
      triggers: { p: { voice: 'pensee', cooldown: 0 }, a: {} },
      lines: [{ id: 'p', trigger: 'p', text: 'Euh…' }, { id: 'a', trigger: 'a', text: 'Promo' }],
    };
    const n = createNarrator();
    n.asideOk = false; // même en marchant
    expect(narrate(n, T, 'p', P).id).toBe('p');
    expect(narrate(n, T, 'a', P).id).toBe('a'); // l'annonce passe
    expect(narrate(n, T, 'p', P)).toBe(null); // la pensée ne coupe pas l'annonce
  });
  it('deux réponses : la réplique attend, la confiance évolue, puis le héros répond', () => {
    const Q = {
      triggers: { q: { voice: 'heros' } },
      lines: [{ id: 'q', trigger: 'q', text: 'Tu es là ?', choices: [{ text: 'Oui', trust: 1, reply: 'Ouf.' }, { text: '…', trust: -1, reply: 'Bon.' }] }],
    };
    const n = createNarrator();
    n.t = 100;
    narrate(n, Q, 'q', P);
    for (let t = 0; t < 10; t += 1 / 60) stepNarrator(n, Q, 1 / 60, P);
    expect(waitingAnswer(n)).toBe(true); // elle attend, même après 10 s
    skipNarrator(n, Q, P);
    expect(n.line.id).toBe('q'); // toucher ne fait pas disparaître une question
    answer(n, 0, P);
    expect(n.trust).toBe(1);
    expect(n.line.text).toBe('Ouf.');
    expect(waitingAnswer(n)).toBe(false);
  });
  it('apartés rares : écart minimal entre deux, et silence avant', () => {
    const n = createNarrator();
    n.t = 100;
    expect(narrate(n, D, 'aparte_vide', P).id).toBe('hv');
    go(n, 10);
    expect(narrate(n, D, 'aparte_vide', P)).toBe(null); // moins de 90 s
    go(n, 85); // assez loin du dernier aparté…
    narrate(n, D, 'vide', P); // … mais le haut-parleur vient de parler
    go(n, 3);
    expect(narrate(n, D, 'aparte_vide', { ...P, lineCooldown: 0 })).toBe(null); // moins de 4 s de silence
  });
  it('l’aparté enchaîné attend que le héros s’arrête (20 s au plus), au lieu d’être perdu', () => {
    const n = createNarrator();
    narrate(n, D, 'arrivee', P);
    n.asideOk = false; // le joueur marche
    go(n, 8);
    expect(n.line).toBe(null);
    expect(n.pending?.trigger).toBe('aparte_accueil');
    n.asideOk = true; // il s'arrête
    go(n, 0.1);
    expect(n.line?.id).toBe('h');
  });
  it('une suite écrite (arrivée → pensée → …) survit à une annonce qui s’intercale', () => {
    const S = {
      triggers: { a: {}, b: { voice: 'pensee', follows: 'a' }, c: { voice: 'pensee', follows: 'b' }, x: { strong: true } },
      lines: [{ id: 'a', trigger: 'a', text: 'A' }, { id: 'b', trigger: 'b', text: 'B' }, { id: 'c', trigger: 'c', text: 'C' }, { id: 'x', trigger: 'x', text: 'X' }],
    };
    const n = createNarrator();
    const run = (s) => {
      for (let t = 0; t < s; t += 1 / 60) stepNarrator(n, S, 1 / 60, P);
    };
    narrate(n, S, 'a', P);
    run(2.2); // A finie : B attend
    expect(n.pending?.trigger).toBe('b');
    narrate(n, S, 'x', P); // une annonce s'intercale
    expect(n.line?.id).toBe('x');
    expect(n.pending?.trigger).toBe('b'); // B attend toujours
    run(2.5); // X finie : B commence aussitôt
    expect(n.line?.id).toBe('b');
  });
  it('« from » : l’inactivité ne fait parler le haut-parleur qu’à partir de la 2e fois', () => {
    const n = createNarrator();
    expect(narrate(n, D, 'inactif', P)).toBe(null);
    expect(narrate(n, D, 'inactif', P).id).toBe('i');
  });
  it('pas d’aparté si le héros n’est pas disponible (en marche, en train de scanner…)', () => {
    const n = createNarrator();
    n.t = 100;
    n.asideOk = false;
    expect(narrate(n, D, 'aparte_vide', P)).toBe(null);
    n.asideOk = true;
    expect(narrate(n, D, 'aparte_vide', P).id).toBe('hv');
  });
  it('confiance : certaines répliques n’existent qu’au-dessus ou en dessous d’un seuil', () => {
    const T = {
      triggers: { a: { voice: 'heros', cooldown: 0 } },
      lines: [
        { id: 'haut', trigger: 'a', text: 'Merci', minTrust: 1 },
        { id: 'bas', trigger: 'a', text: 'Bof', maxTrust: -1 },
      ],
    };
    const n = createNarrator();
    n.t = 100;
    expect(narrate(n, T, 'a', P)).toBe(null); // confiance 0 : ni l'une ni l'autre
    n.trust = 2;
    expect(narrate(n, T, 'a', P).id).toBe('haut');
    const m = createNarrator();
    m.t = 100;
    m.trust = -1;
    expect(narrate(m, T, 'a', P).id).toBe('bas');
  });
  it('apartés désactivés : le héros se tait', () => {
    const n = createNarrator();
    n.t = 100;
    expect(narrate(n, D, 'aparte_vide', { ...P, asides: false })).toBe(null);
  });
});

describe('conversation, moment important (must), historique', () => {
  const PS = { ...P, sceneWait: true, logMax: 5 };
  const SC = {
    triggers: { carte: { strong: true }, rencontre: { voice: 'heros', once: true, must: true }, bavard: {}, regard: { voice: 'regard', follows: '@narrateur' } },
    lines: [
      { id: 'c', trigger: 'carte', text: 'Bip' },
      { id: 'b', trigger: 'bavard', text: 'Bla' },
      { id: 'g', trigger: 'regard', text: '' },
      {
        id: 'r',
        trigger: 'rencontre',
        emotion: 'inquiet',
        steps: [
          { voice: 'regard', emotion: 'inquiet' },
          { voice: 'heros', text: 'Qui es-tu ?' },
          { voice: 'epaisseur', text: 'Je ne sais pas.' },
          { voice: 'heros', text: 'Ensemble ?', emotion: 'complice', choices: [{ text: 'Oui', trust: 1, reply: 'Bien.' }, { text: 'Non', trust: -1, reply: 'Ah.' }] },
        ],
      },
    ],
  };
  const go = (n, s) => {
    for (let t = 0; t < s; t += 1 / 60) stepNarrator(n, SC, 1 / 60, PS);
  };
  it('un moment important attend que le héros soit libre et que l’annonce finisse, puis commence (jamais perdu)', () => {
    const n = createNarrator();
    narrate(n, SC, 'carte', PS);
    n.asideOk = false; // le héros marche
    expect(narrate(n, SC, 'rencontre', PS)).toBeNull();
    expect(n.queue).toEqual(['rencontre']);
    go(n, 30); // l'annonce est finie, mais le héros marche toujours
    expect(n.line).toBeNull();
    n.asideOk = true;
    go(n, 0.1);
    expect(inScene(n)).toBe(true);
    expect(n.voice).toBe('regard');
  });
  it('une conversation : regard, héros, joueur, puis un choix ; chaque réplique attend un toucher ; rien ne l’interrompt', () => {
    const n = createNarrator();
    narrate(n, SC, 'rencontre', PS);
    go(n, 3); // le regard passe seul (sans texte)
    expect(n.voice).toBe('heros');
    expect(n.line.text).toBe('Qui es-tu ?');
    expect(n.line.emotion).toBe('inquiet'); // garde l'expression du regard
    go(n, 60); // écrite, elle attend un toucher
    expect(waitingTap(n)).toBe(true);
    expect(narrate(n, SC, 'carte', PS)).toBeNull(); // même une annonce forte n'interrompt pas
    expect(narrate(n, SC, 'bavard', PS)).toBeNull();
    skipNarrator(n, SC, PS);
    expect(n.voice).toBe('epaisseur');
    skipNarrator(n, SC, PS); // texte entier
    skipNarrator(n, SC, PS); // suivante
    expect(n.line.text).toBe('Ensemble ?');
    go(n, 5);
    expect(waitingAnswer(n)).toBe(true);
    answer(n, 0, PS);
    expect(n.trust).toBe(1);
    expect(n.line.text).toBe('Bien.');
    skipNarrator(n, SC, PS);
    skipNarrator(n, SC, PS);
    expect(inScene(n)).toBe(false);
    expect(n.line).toBeNull();
  });
  it('historique : chaque réplique dite et la réponse du joueur, les plus anciennes oubliées au-delà de logMax', () => {
    const n = createNarrator();
    narrate(n, SC, 'rencontre', PS);
    go(n, 3);
    skipNarrator(n, SC, PS);
    skipNarrator(n, SC, PS);
    skipNarrator(n, SC, PS);
    skipNarrator(n, SC, PS);
    go(n, 5);
    answer(n, 1, PS);
    expect(n.log.map((e) => e.text)).toEqual(['Qui es-tu ?', 'Je ne sais pas.', 'Ensemble ?', 'Non', 'Ah.']);
    expect(n.log[1].voice).toBe('epaisseur');
    expect(n.log[3].voice).toBe('epaisseur');
    skipNarrator(n, SC, PS);
    skipNarrator(n, SC, PS);
    narrate(n, SC, 'carte', PS);
    expect(n.log.length).toBe(5);
    expect(n.log[4].text).toBe('Bip');
  });
  it('marche : l’étape dure jusqu’à l’arrivée signalée par le jeu (un toucher ne la passe pas) ; « auto » passe sans toucher', () => {
    const W = {
      triggers: { r: { voice: 'heros', must: true } },
      lines: [{ id: 'r', trigger: 'r', steps: [{ voice: 'marche', walk: 0.5 }, { voice: 'pensee', text: 'Hum ?', auto: true }, { voice: 'heros', text: 'Toi ?' }] }],
    };
    const n = createNarrator();
    narrate(n, W, 'r', PS);
    expect(n.voice).toBe('marche');
    expect(n.line.walk).toBe(0.5);
    for (let t = 0; t < 30; t += 1 / 60) stepNarrator(n, W, 1 / 60, PS);
    skipNarrator(n, W, PS);
    expect(n.voice).toBe('marche'); // toujours en marche
    endLine(n, W, PS); // arrivé
    expect(n.voice).toBe('pensee');
    for (let t = 0; t < 5; t += 1 / 60) stepNarrator(n, W, 1 / 60, PS);
    expect(n.voice).toBe('heros'); // « Hum ? » est passé seul
  });
  it('narrateur coupé pendant une conversation : elle reprendra depuis le début', () => {
    const n = createNarrator();
    narrate(n, SC, 'rencontre', PS);
    go(n, 3);
    silenceNarrator(n);
    expect(n.queue).toEqual(['rencontre']);
    go(n, 0.1);
    expect(inScene(n)).toBe(true);
    expect(n.voice).toBe('regard');
  });
});

describe('narrateur : machine à écrire', () => {
  it('les lettres apparaissent au rythme réglé, puis la réplique reste, puis disparaît', () => {
    const n = createNarrator();
    narrate(n, DATA, 'arrivee', P); // 7 lettres à 40 lettres/s ≈ 0,18 s
    let letters = 0;
    for (let k = 0; k < 7; k++) letters += stepNarrator(n, DATA, 1 / 60, P); // 7/60 s × 40 ≈ 4,7 lettres
    expect(Math.floor(n.shown)).toBe(4);
    expect(letters).toBe(4);
    run(n, 0.2);
    expect(n.shown).toBe(7);
    expect(n.line).not.toBe(null);
    run(n, 2.1);
    expect(n.line).toBe(null);
  });
  it('toucher la bande : texte entier, puis disparition', () => {
    const n = createNarrator();
    narrate(n, DATA, 'arrivee', P);
    skipNarrator(n, DATA, P);
    expect(n.shown).toBe(7);
    skipNarrator(n, DATA, P);
    expect(n.line).toBe(null);
  });
  it('inactivité : un seul signal par période sans action', () => {
    const n = createNarrator();
    let fired = 0;
    for (let t = 0; t < 70; t += 0.5) if (stepIdle(n, 0.5, false, P)) fired++;
    expect(fired).toBe(1);
    stepIdle(n, 0.5, true, P);
    for (let t = 0; t < 31; t += 0.5) if (stepIdle(n, 0.5, false, P)) fired++;
    expect(fired).toBe(2);
  });
});

describe('répliques du narrateur (données)', () => {
  it('chaque réplique a un moment connu, un identifiant unique et le préfixe [TEMP]', () => {
    const ids = new Set();
    for (const l of file.lines) {
      expect(file.triggers[l.trigger], l.id).toBeDefined();
      expect(ids.has(l.id), l.id).toBe(false);
      ids.add(l.id);
      // Une conversation (steps) : chaque réplique est vérifiée comme une réplique ordinaire.
      const parts = l.steps ?? [{ ...l, voice: file.triggers[l.trigger].voice }];
      for (const st of parts) {
        if (st.voice === 'regard') expect(st.text ?? '', l.id).toBe(''); // regard : sans texte
        else if (st.voice === 'marche') expect(st.walk > 0 && st.walk <= 1 && !st.text, l.id).toBe(true); // marche : une part du chemin
        else expect(st.text.startsWith('[TEMP] '), l.id).toBe(true);
        expect(['heros', 'epaisseur', 'regard', 'pensee', 'narrateur', 'marche', undefined], l.id).toContain(st.voice);
        for (const c of st.choices ?? []) {
          expect(c.text.startsWith('[TEMP] ') && c.reply.startsWith('[TEMP] '), l.id).toBe(true);
          expect(typeof c.trust, l.id).toBe('number');
        }
        if (st.choices) expect(st.choices.length, l.id).toBe(2);
      }
      if (l.steps) expect(l.steps.findIndex((st) => st.choices) === -1 || l.steps.findIndex((st) => st.choices) === l.steps.length - 1, l.id).toBe(true); // un choix : seulement à la fin
    }
  });
  it('la première rencontre : après la première carte, jamais perdue ; le héros demande « Qui es-tu ? », le joueur répond sans choix, puis un choix', () => {
    expect(file.triggers.rencontre).toMatchObject({ voice: 'heros', once: true, must: true });
    const l = file.lines.find((x) => x.trigger === 'rencontre');
    const heroText = l.steps.filter((st) => st.voice === 'heros').map((st) => st.text).join(' ');
    expect(heroText).toMatch(/Qui es-tu/);
    expect(heroText).toMatch(/feuille/);
    const firstPlayer = l.steps.findIndex((st) => st.voice === 'epaisseur');
    const firstChoice = l.steps.findIndex((st) => st.choices);
    expect(firstPlayer).toBeGreaterThan(0);
    expect(firstChoice).toBeGreaterThan(firstPlayer); // d'abord la réponse sans choix, ensuite un choix
    // Il s'avance en deux fois, avec un « Hum ? » à mi-chemin, avant de regarder le joueur.
    expect(l.steps.slice(0, 4).map((st) => st.voice)).toEqual(['marche', 'pensee', 'marche', 'regard']);
    expect(l.steps[0].walk).toBe(0.5);
    expect(l.steps[2].walk).toBe(1);
    expect(l.steps[1].text).toMatch(/Hum/);
    expect(file.triggers.rencontre.veil).toBe(true);
  });
  it('chaque moment a au moins une réplique', () => {
    for (const tr of Object.keys(file.triggers)) expect(file.lines.some((l) => l.trigger === tr), tr).toBe(true);
  });
  it('les apartés du héros tutoient leur « Épaisseur » ; le haut-parleur vouvoie', () => {
    for (const l of file.lines) {
      const hero = file.triggers[l.trigger].voice === 'heros';
      const text = l.steps ? l.steps.filter((st) => st.voice === 'heros').map((st) => st.text).join(' ') : l.text;
      if (hero) expect(/\b(tu|te|toi|t'|mon Épaisseur)\b/i.test(text), l.id).toBe(true);
      else expect(/\b(tu|toi)\b/i.test(text), l.id).toBe(false);
    }
    expect(file.lines.filter((l) => file.triggers[l.trigger].voice === 'heros').length).toBeGreaterThanOrEqual(4);
  });
  it('chaque aparté a une émotion qui a son dessin (tête de face)', async () => {
    const hero = (await import('../../src/data/characters/heros.json')).default;
    for (const l of file.lines) {
      if (!['heros', 'regard'].includes(file.triggers[l.trigger].voice)) continue;
      expect(hero.views.face[`aparte_${l.emotion}`], `${l.id} : ${l.emotion}`).toBeDefined();
      for (const st of l.steps ?? []) {
        for (const e of [st.emotion, ...(st.choices ?? []).map((c) => c.emotion)]) {
          if (e) expect(hero.views.face[`aparte_${e}`], `${l.id} : ${e}`).toBeDefined();
        }
      }
    }
  });
  it('le fil « Client » → « Article non référencé » est présent', () => {
    const all = file.lines.map((l) => l.text).join(' ');
    expect(all).toContain('Client');
    expect(all).toContain('Article non référencé');
  });
});

describe('mise en scène', () => {
  it('approach : avance vers le but sans le dépasser, puis ne bouge plus (pas de tremblement du zoom)', () => {
    let v = 0.9;
    v = approach(v, 1, 0.2);
    expect(v).toBe(1);
    for (let k = 0; k < 5; k++) v = approach(v, 1, 0.2);
    expect(v).toBe(1);
    expect(approach(0.1, 0, 0.3)).toBe(0);
    expect(approach(0.5, 0, 0.2)).toBeCloseTo(0.3);
  });
});
