import { test, expect } from '@playwright/test';

// Séance des entrées (séance 70) : manette simulée (l'API Gamepad est remplacée par une fausse manette,
// pilotée depuis le test), relâchement général quand le jeu perd le focus, aides selon le dernier appareil.
// Une vraie manette reste à essayer par l'auteur (règle de src/input/CLAUDE.md).

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // Fausse manette : 17 boutons, 4 axes (disposition standard), absente au départ.
  await page.addInitScript(() => {
    const pad = { index: 0, connected: false, id: 'essai', mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pad = pad;
    navigator.getGamepads = () => [pad.connected ? pad : null];
    const fire = (type) => {
      const e = new Event(type);
      e.gamepad = pad;
      window.dispatchEvent(e);
    };
    window.__padPlug = (on) => {
      pad.connected = on;
      fire(on ? 'gamepadconnected' : 'gamepaddisconnected');
    };
    window.__padButton = (i, on) => (pad.buttons[i].pressed = on);
    window.__padStick = (x, y) => {
      pad.axes[0] = x;
      pad.axes[1] = y;
    };
  });
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    window.paperCart.equip();
    window.paperCart.markSaid('rencontre');
  });
});

test.afterEach(() => expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]));

const hero = (page) => page.evaluate(() => window.paperCart.hero());
const frames = (page, n = 6) =>
  page.evaluate((n) => new Promise((r) => {
    const step = () => (--n <= 0 ? r() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  }), n);

test('manette : le stick fait marcher, les aides passent à la manette, Start met en pause', async ({ page }) => {
  await page.evaluate(() => window.__padPlug(true));
  await frames(page);
  const before = await hero(page);
  await page.evaluate(() => window.__padStick(1, 0));
  await expect.poll(async () => (await hero(page)).x).toBeGreaterThan(before.x + 30);
  await page.evaluate(() => window.__padStick(0, 0));
  await expect(page.locator('.hint')).toHaveText('Stick gauche pour marcher');
  await page.evaluate(() => window.__padButton(9, true));
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('pause');
  await expect(page.locator('.pause .help')).toContainText('Start : pause');
  await page.evaluate(() => window.__padButton(9, false));
  await frames(page);
  await page.evaluate(() => window.__padButton(9, true));
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('play');
  await page.evaluate(() => window.__padButton(9, false));
  // Retour au clavier : les aides suivent.
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.hint')).toHaveText('ZQSD, flèches ou clic pour marcher');
});

test('manette : un bouton tenu au branchement ou pendant une perte de focus ne déclenche rien ; il faut un nouvel appui', async ({ page }) => {
  // Start tenu au moment du branchement : pas de pause.
  await page.evaluate(() => {
    window.__padButton(9, true);
    window.__padPlug(true);
  });
  await frames(page, 10);
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  await page.evaluate(() => window.__padButton(9, false));
  await frames(page);
  // Stick tenu pendant une perte de focus : le héros s'arrête et ne repart pas tant que le stick n'est pas relâché.
  await page.evaluate(() => window.__padStick(1, 0));
  await expect.poll(async () => (await hero(page)).x).toBeGreaterThan(0);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await frames(page, 30); // le temps de s'arrêter
  const stopped = await hero(page);
  await frames(page, 20);
  expect((await hero(page)).x).toBeCloseTo(stopped.x, 0);
  // Relâché puis repoussé : il repart.
  await page.evaluate(() => window.__padStick(0, 0));
  await frames(page);
  await page.evaluate(() => window.__padStick(1, 0));
  await expect.poll(async () => (await hero(page)).x).toBeGreaterThan(stopped.x + 20);
  await page.evaluate(() => window.__padStick(0, 0));
});

test('manette : débrancher la manette utilisée met le jeu en pause', async ({ page }) => {
  await page.evaluate(() => window.__padPlug(true));
  await frames(page);
  await page.evaluate(() => window.__padStick(1, 0));
  await frames(page, 10);
  await page.evaluate(() => window.__padPlug(false));
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('pause');
});

test('clavier : une touche gardée pendant une perte de focus ne refait pas marcher le héros', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await hero(page)).hasTarget || (await hero(page)).x).toBeTruthy();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  // Les répétitions de la touche toujours enfoncée n'y changent rien.
  for (let i = 0; i < 5; i++) await page.keyboard.down('ArrowRight');
  await frames(page, 30);
  const stopped = await hero(page);
  await frames(page, 20);
  expect((await hero(page)).x).toBeCloseTo(stopped.x, 0);
  await page.keyboard.up('ArrowRight');
});

test('clavier : Échap en plein écran quitte le plein écran sans ouvrir la pause (non-régression séance 79)', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.evaluate(() => {
    window.__exitedFs = 0;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => document.documentElement });
    document.exitFullscreen = () => {
      window.__exitedFs++;
      return Promise.resolve();
    };
  });
  await page.keyboard.press('Escape');
  await frames(page, 4);
  expect(await page.evaluate(() => window.__exitedFs)).toBe(1);
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('clavier : Espace pendant l’écriture d’une bulle termine la phrase avant de passer (non-régression séance 79)', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  // Aller devant l'hôtesse avec une vitesse de texte lente pour attraper la bulle en cours d'écriture.
  await page.evaluate(() => {
    window.paperCart.set('narrator.enabled', true);
    window.paperCart.set('narrator.speed', 12);
    window.paperCart.markSaid('arrivee');
  });
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 190);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.hero().x < 1160);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Space'); // lance le premier slogan de l'hôtesse
  await page.waitForFunction(() => window.paperCart.narrator().visible && window.paperCart.narrator().shown > 0 && window.paperCart.narrator().shown < window.paperCart.narrator().text.length);
  const firstText = await page.evaluate(() => window.paperCart.narrator().text);
  await page.keyboard.press('Space'); // 1er appui : termine la phrase en cours sans la fermer
  await frames(page, 3);
  const after = await page.evaluate(() => window.paperCart.narrator());
  expect(after.visible).toBe(true);
  expect(after.text).toBe(firstText);
  expect(after.shown).toBe(firstText.length);
});

test('fiche « Nouvel objet » au doigt : double toucher à portée ne la referme pas, aide tactile, monde figé', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  // Avancer devant les Scanettes jusqu'à être déjà à portée.
  const pt = await page.evaluate(() => window.paperCart.worldToClient(1370, 206));
  await page.touchscreen.tap(pt.x, pt.y);
  await expect.poll(() => page.evaluate(() => window.paperCart.scanState().pickup), { timeout: 8000 }).toBe(0);
  // Double toucher directement sur le présentoir alors que le héros est déjà à portée : la fiche doit rester ouverte !
  const stand = await page.evaluate(() => window.paperCart.worldToClient(1370, 560));
  await page.touchscreen.tap(stand.x, stand.y);
  await page.waitForTimeout(60);
  await page.touchscreen.tap(stand.x, stand.y);
  await expect(page.locator('.item-reveal')).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.locator('.item-reveal')).toBeVisible();
  // Mode d'emploi adapté au doigt (ne mentionne pas « Entrée » ni « double-clic »).
  const usage = await page.locator('.item-reveal-usage').textContent();
  expect(usage).not.toMatch(/Entrée|double-clic/i);
  // Le temps du narrateur est figé tant que la fiche est ouverte.
  const t1 = await page.evaluate(() => window.paperCart.narrator().t);
  await page.waitForTimeout(350);
  const t2 = await page.evaluate(() => window.paperCart.narrator().t);
  expect(t2).toBe(t1);
  await page.locator('.item-reveal-ok').tap();
  await expect(page.locator('.item-reveal')).toBeHidden();
});

test('transition « mist » : le héros reste visible dans l’ancien décor pendant le chargement du nouveau lieu', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC seulement');
  await page.goto('./?lieu=accueil');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => window.paperCart.set('places.style', 'mist'));
  // Ralentir volontairement le chargement du rayon d'essai pour observer le héros pendant 'load'.
  let releaseRoute;
  const hold = new Promise((r) => (releaseRoute = r));
  await page.route('**/rayon-fond.webp', async (route) => {
    await hold;
    await route.continue();
  });
  await page.evaluate(() => window.paperCart.useExit('vers-rayon'));
  await page.waitForTimeout(180);
  // Pendant le chargement, le héros est toujours monté dans le décor affiché (pas dans backstage).
  const heroInStage = await page.evaluate(() => Boolean(document.querySelector('#game .stage .actor')));
  expect(heroInStage).toBe(true);
  releaseRoute();
  await page.waitForFunction(() => window.paperCart.place() === 'rayon-essai' && window.paperCart.state() === 'play', null, { timeout: 15000 });
});

test('traversée de bord : au contact du bord gauche, le héros avance seul à 3/4 hors-champ, change de lieu et arrive collé au bord droit sans re-déclencher', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC seulement');
  await page.goto('./?lieu=rayon-essai');
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  // Marcher à gauche jusqu'au 1er pixel qui touche le bord (x <= 54 à z = 60), puis lâcher la touche aussitôt.
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.paperCart.hero().x <= 52, null, { timeout: 5000 });
  await page.keyboard.up('ArrowLeft');
  // Même touche lâchée, il traverse automatiquement jusqu'à 3/4 hors-champ, change de lieu vers l'accueil,
  // et avance automatiquement jusqu'à son point d'arrivée collé au bord droit (~2079), sans re-déclencher la sortie.
  await page.waitForFunction(() => window.paperCart.place() === 'accueil' && window.paperCart.state() === 'play', null, { timeout: 15000 });
  await page.waitForFunction(() => {
    const h = window.paperCart.hero();
    return h.x <= 2090 && h.x >= 2040 && !h.moving;
  }, null, { timeout: 5000 });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.paperCart.place())).toBe('accueil');
});
