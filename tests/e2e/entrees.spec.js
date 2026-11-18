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
