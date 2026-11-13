import { test, expect } from '@playwright/test';

// Étape A1 : le jeu démarre sans erreur, on marche au clavier, à la souris, au doigt,
// la pause fige le personnage, les panneaux s'ouvrent.

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto('./');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
});

test.afterEach(async () => {
  expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]);
});

const hero = (page) => page.evaluate(() => window.paperCart.hero());

test('affiche la version et le rayon', async ({ page }, info) => {
  await expect(page.locator('.version')).toContainText('v ');
  await expect(page.locator('.layer-fond img')).toBeVisible();
  await expect(page.locator('.actor-frame:not([hidden])')).toHaveCount(1);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}.png` });
});

test('marche au clavier (flèches et ZQSD) et se retourne', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  const start = await hero(page);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  const after = await hero(page);
  expect(after.x).toBeGreaterThan(start.x + 50);
  expect(after.facing).toBe(1);

  // Q sur AZERTY = A sur QWERTY : même touche physique (KeyA) → vers la gauche
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyA');
  expect((await hero(page)).facing).toBe(-1);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyW');
  const back = await hero(page);
  expect(back.away).toBe(true);
  expect(back.z).toBeGreaterThan(after.z);
});

test('va au point cliqué ou touché', async ({ page }, info) => {
  const target = await page.evaluate(() => window.paperCart.worldToClient(500, 80));
  if (info.project.name === 'telephone') await page.touchscreen.tap(target.x, target.y);
  else await page.mouse.click(target.x, target.y);
  await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 4000 }).toBe(false);
  const h = await hero(page);
  expect(Math.abs(h.x - 500)).toBeLessThan(8);
  expect(Math.abs(h.z - 80)).toBeLessThan(8);
});

test('contourne le présentoir quand on touche derrière', async ({ page }, info) => {
  const tap = async (x, z) => {
    const p = await page.evaluate(([x, z]) => window.paperCart.worldToClient(x, z), [x, z]);
    if (info.project.name === 'telephone') await page.touchscreen.tap(p.x, p.y);
    else await page.mouse.click(p.x, p.y);
    await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 6000 }).toBe(false);
  };
  await tap(750, 40); // devant le présentoir
  await tap(750, 215); // derrière lui
  const h = await hero(page);
  expect(Math.abs(h.x - 750)).toBeLessThan(8);
  expect(Math.abs(h.z - 215)).toBeLessThan(8);
  const lv = await page.evaluate(() => window.paperCart.levels());
  expect(lv.hero).toBeLessThan(lv['presentoir-crousti']);
});

test('la pause fige le personnage', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('pause');
  await expect(page.locator('.pause')).toBeVisible();
  const before = await hero(page);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  expect((await hero(page)).x).toBe(before.x);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('réglages : ouverture, changement de vitesse, fermeture', async ({ page }) => {
  await page.locator('.hud-button', { hasText: '⚙' }).click();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('menu');
  const slider = page.locator('input[data-key="walk.maxSpeed"]');
  await slider.fill('900');
  await expect(page.locator('.setting.changed')).toHaveCount(1);
  await page.locator('.settings button', { hasText: 'Fermer' }).click();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  const saved = await page.evaluate(() => localStorage.getItem('paper-cart.reglages.v1'));
  expect(JSON.parse(saved)).toEqual({ 'walk.maxSpeed': 900 });
});

test('diagnostic : affichage et rapport', async ({ page }, info) => {
  await page.locator('.hud-button', { hasText: 'DBG' }).click();
  await expect(page.locator('.diag')).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.locator('.diag pre')).toContainText('images/s');
  const report = await page.evaluate(() => window.paperCart.report());
  expect(report).toContain('Version');
  expect(report.length).toBeLessThan(4000);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}-diag.png` });
});

test('passe derrière le présentoir puis revient devant', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  // Monter au pied des étagères, puis longer le rayon jusque derrière le présentoir.
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 240);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 740);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);
  let lv = await page.evaluate(() => window.paperCart.levels());
  expect(lv.hero).toBeLessThan(lv['presentoir-crousti']);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}-derriere.png` });

  // Contourner par la droite et redescendre devant.
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 930);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => window.paperCart.hero().z < 60);
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(100);
  lv = await page.evaluate(() => window.paperCart.levels());
  expect(lv.hero).toBeGreaterThan(lv['presentoir-crousti']);
});

test('la feuille se retourne quand il change de côté', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  // Largeur apparente de la feuille (négative = tournée vers la gauche), lue dans le style.
  const width = () => page.locator('.actor-flip').evaluate((el) => Number(/scale\((-?[\d.e-]+),/.exec(el.style.transform)?.[1] ?? 1));
  await page.keyboard.down('ArrowLeft');
  // Pendant le retournement, la feuille est nettement plus étroite qu'en entier.
  await expect.poll(async () => Math.abs(await width()), { timeout: 2000, intervals: [16] }).toBeLessThan(0.7);
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(300);
  expect(await width()).toBeLessThan(-0.9);
});

test('descend jusqu’en bas de l’écran, de face, et le son démarre', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => window.paperCart.hero().z < -140);
  await page.keyboard.up('ArrowDown');
  // Monter puis aller sur le côté : il se remet de face.
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowUp');
  expect((await hero(page)).away).toBe(true);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowRight');
  expect((await hero(page)).away).toBe(false);
  expect(await page.evaluate(() => window.paperCart.audioStarted())).toBe(true);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}-bas.png` });
});

test('de la poussière apparaît en marchant, puis disparaît', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.locator('.dust:not([hidden])').count(), { timeout: 2000 }).toBeGreaterThan(0);
  await page.screenshot({ path: `test-results/captures/a1-${info.project.name}-poussiere.png` });
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => page.locator('.dust:not([hidden])').count(), { timeout: 3000 }).toBe(0);
});

test('le profil « Paper Mario » est sélectionné par défaut', async ({ page }) => {
  await page.locator('.hud-button', { hasText: '⚙' }).click();
  await expect(page.locator('.presets button.active')).toHaveText(/Paper Mario/);
});

test('ombre au sol et personnage plus petit au fond', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await expect(page.locator('.shadow')).toHaveCount(1);
  const size = () => page.locator('.actor').evaluate((el) => el.getBoundingClientRect().height);
  const front = await size();
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 240);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(300);
  expect(await size()).toBeLessThan(front * 0.85);
});

test('la caméra suit le personnage le long du rayon, avec parallaxe', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  const cam0 = await page.evaluate(() => window.paperCart.camera());
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 2200, null, { timeout: 10000 });
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(800);
  const cam = await page.evaluate(() => window.paperCart.camera());
  expect(cam.x).toBeGreaterThan(cam0.x + 800);
  // Le personnage reste à l'écran.
  const box = await page.locator('.actor').boundingBox();
  const vp = page.viewportSize();
  expect(box.x).toBeGreaterThan(0);
  expect(box.x + box.width).toBeLessThan(vp.width);
  // Les rayons lointains ont glissé moins que le sol : décalage positif par rapport au fond.
  const far = await page.locator('.layer-lointain').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(far).toBeGreaterThan(cam.x * 0.3);
  await page.screenshot({ path: `test-results/captures/a2-${info.project.name}-camera.png` });
});

test('toute la hauteur du décor est visible, même sur un écran allongé', async ({ page }) => {
  const v = await page.evaluate(() => window.paperCart.camera());
  const vp = page.viewportSize();
  // Largeur visible (en pixels de scène) proportionnelle à la forme de l'écran.
  expect(v.viewW).toBeCloseTo((1080 * vp.width) / vp.height, 0);
});

test('toucher hors du sol : il va jusqu’au bord de la zone de marche', async ({ page }, info) => {
  const tapAt = async (x, y) => {
    if (info.project.name === 'telephone') await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 6000 }).toBe(false);
  };
  // Sur l'étagère du fond, bien au-dessus du sol.
  const shelf = await page.evaluate(() => window.paperCart.worldToClient(400, 500));
  await tapAt(shelf.x, shelf.y);
  expect((await hero(page)).z).toBeGreaterThan(258);
  // Tout en bas de l'écran, sur le rayon de devant.
  const vp = page.viewportSize();
  await tapAt(shelf.x, vp.height - 3);
  expect((await hero(page)).z).toBeLessThan(-185);
});

test('réglages rangés en onglets par thème', async ({ page }) => {
  await page.locator('.hud-button', { hasText: '⚙' }).click();
  const tabs = page.locator('.settings-tab');
  expect(await tabs.count()).toBeGreaterThan(4);
  await expect(page.locator('input[data-key="walk.maxSpeed"]')).toBeVisible();
  await tabs.filter({ hasText: /^Son$/ }).click();
  await expect(page.locator('input[data-key="audio.music"]')).toBeVisible();
  await expect(page.locator('input[data-key="walk.maxSpeed"]')).toBeHidden();
});

for (const [name, w, h] of [['4:3 (tablette)', 1024, 768], ['21:9 (très allongé)', 1260, 540], ['16:10 (PC portable)', 1280, 800]]) {
  test(`autre forme d’écran ${name} : tout le décor en hauteur, personnage visible`, async ({ page }, info) => {
    test.skip(info.project.name === 'telephone', 'une fois suffit');
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(200);
    const v = await page.evaluate(() => window.paperCart.camera());
    expect(v.viewW).toBeCloseTo((1080 * w) / h, 0);
    const box = await page.locator('.actor').boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(h);
    await expect(page.locator('.hud-bar')).toBeInViewport();
  });
}

test('chaque thème n’a qu’un seul onglet', async ({ page }) => {
  const names = await page.locator('.settings-tab').allTextContents();
  expect(new Set(names).size).toBe(names.length);
});

test('banc d’essai : lancé depuis l’onglet Diagnostic, annulable, rapport affiché', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.locator('.hud-button', { hasText: '⚙' }).click();
  await page.locator('.settings-tab', { hasText: /^Diagnostic$/ }).click();
  await page.getByRole('button', { name: "Lancer le banc d'essai" }).click();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('bench');
  await expect(page.locator('.bench-banner:not([hidden])')).toBeVisible();
  await page.waitForTimeout(1500);
  const moved = await hero(page);
  expect(moved.x).not.toBe(300); // il marche tout seul
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  const result = page.locator('.bench-result:not([hidden])');
  await expect(result).toBeVisible();
  await expect(result.locator('pre')).toContainText('annulé');
  await page.screenshot({ path: `test-results/captures/a2-${info.project.name}-banc.png` });
});

test('diagnostic en 4 configurations (version courte) : rapport complet', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'une fois suffit');
  test.setTimeout(90_000);
  await page.evaluate(() => window.paperCart.startProtocol(1, 2, 2));
  await page.waitForFunction(() => window.paperCart.protocolReport(), null, { timeout: 60_000 });
  const r = await page.evaluate(() => window.paperCart.protocolReport());
  expect(r).toContain('Résultat : terminé');
  for (const k of ['[1]', '[2]', '[3]', '[4]']) expect(r).toContain(k);
  expect(r.match(/essai \d/g).length).toBe(8);
  expect(r).not.toContain('CONDITIONS CHANGÉES');
  expect(r.length).toBeLessThan(6000);
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('test rapide T0/T1/T2 (version courte) : rapport complet, réglages rendus', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'une fois suffit');
  test.setTimeout(60_000);
  await page.evaluate(() => window.paperCart.startQuick(1, 2, 0.5, 2));
  // Pendant B-T2, le rayon de devant est invisible.
  await page.waitForFunction(() => /B-T2/.test([...document.querySelectorAll('.bench-banner')].map((e) => e.textContent).join('')), null, { timeout: 30_000 });
  await page.waitForTimeout(300);
  expect(await page.locator('.layer-premier-plan').evaluate((el) => el.style.opacity)).toBe('0');
  await page.waitForFunction(() => window.paperCart.quickReport(), null, { timeout: 40_000 });
  const r = await page.evaluate(() => window.paperCart.quickReport());
  expect(r).toContain('Résultat : terminé');
  for (const k of ['A-T0', 'A-T1', 'B-T0', 'B-T1', 'B-T2']) expect(r).toContain(k);
  expect(r.match(/→ (amélioration|dégradation|pas de différence) /g).length).toBe(4);
  expect(r.length).toBeLessThan(4000);
  // Réglages remis comme avant, rien d'enregistré.
  expect(await page.locator('.layer-premier-plan').evaluate((el) => el.style.opacity)).toBe('0.55');
  expect(['{}', null]).toContain(await page.evaluate(() => localStorage.getItem('paper-cart.reglages.v1')));
});

test('campagne « rayon de devant » n° 2 (version courte) : chaque variante est appliquée puis le jeu est rétabli', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'une fois suffit');
  test.setTimeout(90_000);
  const state = () => page.locator('.layer-premier-plan').evaluate((el) => ({
    opacite: el.style.opacity,
    hauteur: el.style.height,
    coupe: el.style.overflow,
  }));
  // Décalage du rayon de devant par rapport au sol : nul s'il glisse à la vitesse du sol.
  const offset = () => page.locator('.layer-premier-plan').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  const at = (id) => page.waitForFunction((x) => [...document.querySelectorAll('.bench-banner')].some((e) => !e.hidden && e.textContent.includes(`· ${x} ·`)), id, { timeout: 40_000 });
  await page.evaluate(() => window.paperCart.startQuick(1, 3, 0.5, 1, 'DEVANT2'));
  await at('T0');
  await page.waitForTimeout(800);
  expect(await state()).toEqual({ opacite: '0.55', hauteur: '', coupe: '' });
  expect(Math.abs(await offset())).toBeGreaterThan(1);
  await at('G4');
  await page.waitForTimeout(250);
  expect(await state()).toEqual({ opacite: '0.55', hauteur: '150px', coupe: 'hidden' });
  await at('G3');
  await page.waitForTimeout(800);
  expect(await state()).toEqual({ opacite: '0.55', hauteur: '', coupe: '' });
  expect(Math.abs(await offset())).toBeLessThan(0.01);
  await page.waitForFunction(() => window.paperCart.quickReport(), null, { timeout: 40_000 });
  const r = await page.evaluate(() => window.paperCart.quickReport());
  expect(r).toContain('rayon de devant');
  expect(r).toMatch(/Vitesse du téléphone .* début \d/);
  expect(r.match(/→ (amélioration|dégradation|pas de différence) /g).length).toBe(2);
  expect(await state()).toEqual({ opacite: '0.55', hauteur: '', coupe: '' }); // le jeu est rendu tel qu'avant
});

// ---------- Étape A3 : le scanner ----------

test('A3 : s’approcher d’un produit le met en évidence, Entrée le scanne, la carte rejoint le Panier', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  // Au départ, rien à portée.
  expect((await page.evaluate(() => window.paperCart.scanState())).reach).toBe(-1);
  await expect(page.locator('.scan-button')).not.toHaveClass(/visible/);
  // Monter au pied de l'étagère, sous la banane.
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).reach).toBe(0);
  await expect(page.locator('.scan-marker')).toHaveClass(/visible/);
  await expect(page.locator('.scan-button')).toHaveClass(/visible/);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).active).toBe(true);
  // Pendant le scan, le personnage ne bouge pas.
  const x0 = (await hero(page)).x;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  expect((await hero(page)).x).toBe(x0);
  await page.screenshot({ path: `test-results/captures/a3-${info.project.name}-scan.png` });
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards, { timeout: 5000 }).toEqual(['Banane']);
  await expect(page.locator('.panier-count')).toHaveText('1');
  // Le produit a disparu de l'étagère et n'est plus à portée.
  expect((await page.evaluate(() => window.paperCart.shelf()))[0].scanned).toBe(true);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).reach).toBe(-1);
  // Le Panier s'ouvre (I) et montre la carte, avec son stade.
  await page.keyboard.press('KeyI');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('panier');
  const card = page.locator('.panier .card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Banane');
  await expect(card).toContainText('Mûr');
  await expect(card).toHaveClass(/stage-mur/);
  await page.screenshot({ path: `test-results/captures/a3-${info.project.name}-panier.png` });
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('A3 au doigt : le bouton Scanner apparaît près d’un produit et scanne', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  // Toucher l'étagère au-dessus du lait : le personnage va au pied de l'étagère.
  const p = await page.evaluate(() => window.paperCart.worldToClient(560, 500));
  await page.touchscreen.tap(p.x, p.y);
  await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 6000 }).toBe(false);
  await expect(page.locator('.scan-button')).toHaveClass(/visible/);
  await page.locator('.scan-button').tap();
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards, { timeout: 5000 }).toEqual(['Lait']);
  await page.screenshot({ path: `test-results/captures/a3-${info.project.name}-scan.png` });
  await page.locator('.panier-button').tap();
  await expect(page.locator('.panier .card')).toHaveCount(1);
  await page.locator('.panier button', { hasText: 'Fermer' }).tap();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
});

test('A3 : la pause fige le scan en cours', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).reach).toBe(0);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  const s1 = await page.evaluate(() => window.paperCart.scanState());
  await page.waitForTimeout(2500);
  const s2 = await page.evaluate(() => window.paperCart.scanState());
  expect(s2).toEqual(s1); // rien n'a avancé pendant la pause
  expect(s2.active).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards, { timeout: 5000 }).toEqual(['Banane']);
});
