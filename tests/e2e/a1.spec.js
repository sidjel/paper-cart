import { test, expect } from '@playwright/test';

// Étape A1 : le jeu démarre sans erreur, on marche au clavier, à la souris, au doigt,
// la pause fige le personnage, les panneaux s'ouvrent.

const errors = [];

test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // La partie commence dans le hall d'accueil (présentoir). Les tests du rayon y commencent directement
  // (lien ?lieu=) ; ceux du présentoir commencent dans le hall.
  const hall = /^(A5a (: mains vides|au doigt|: Scanette sans panier)|A6)/.test(info.title);
  await page.goto(hall ? './' : './?lieu=rayon-essai');
  // Écran titre : « Commencer » (sauf pour les tests de l'écran titre lui-même).
  await page.waitForFunction(() => window.paperCart?.state() === 'title');
  await page.evaluate(() => window.paperCart.startGame());
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  // Les tests du scanner commencent équipés (Scanette et panier) ; ceux de l'accueil (A5a), mains vides.
  if (!info.title.startsWith('A5a')) await page.evaluate(() => window.paperCart.equip());
  // La première rencontre (conversation après la première carte) a son propre test.
  if (!info.title.startsWith('A4 : la première rencontre')) await page.evaluate(() => window.paperCart.markSaid('rencontre'));
});

test.afterEach(async () => {
  expect(errors, 'aucune erreur ni alerte dans la console').toEqual([]);
});

const hero = (page) => page.evaluate(() => window.paperCart.hero());

// Dans le hall (2600 px) : dépasser les portiques par l'avant (ils sont un obstacle).
async function pastGates(page) {
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.hero().x > 1320);
  await page.keyboard.up('ArrowRight');
}

// Aller au pied de l'étagère, devant la banane (1er produit), au clavier.
async function toBanana(page) {
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.scanState().reach === 0, null, { timeout: 8000 });
  await page.keyboard.up('ArrowRight');
}


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
  // Largeur / orientation de la feuille (négative = tournée vers la gauche), lue dans le style.
  const width = () => page.locator('.actor-flip').evaluate((el) => Number(/scale\((-?[\d.e-]+),/.exec(el.style.transform)?.[1] ?? 1));
  // Se tourner d'abord à droite (E), puis observer le canevas 2.5D avant le demi-tour à gauche (W)
  // (observateur dans la page : insensible à la lenteur d'un runner CI sans carte graphique).
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  await page.evaluate(() => {
    const c = document.querySelector('.actor-flip-canvas');
    window.__flipSeen = Boolean(c && !c.hidden);
    if (c) {
      new MutationObserver(() => {
        if (!c.hidden) window.__flipSeen = true;
      }).observe(c, { attributes: true, attributeFilter: ['hidden'] });
    }
  });
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.__flipSeen), { timeout: 2500 }).toBe(true);
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(300);
  await expect(page.locator('.actor-flip-canvas')).toBeHidden();
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
  // Les rayons lointains ont glissé moins que le sol : décalage positif par rapport au fond (parallaxe 0,82 → 0,18 × cam.x).
  const far = await page.locator('.layer-lointain').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  expect(far).toBeGreaterThan(cam.x * 0.1);
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
  // Sur l'étagère du fond, bien au-dessus du sol (au-delà du mur biais gauche x >= 550).
  const shelf = await page.evaluate(() => window.paperCart.worldToClient(600, 500));
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
  await expect(page.locator('.settings input[data-key="walk.maxSpeed"]')).toBeVisible();
  await tabs.filter({ hasText: /^Son$/ }).click();
  await expect(page.locator('.settings input[data-key="audio.music"]')).toBeVisible();
  await expect(page.locator('.settings input[data-key="walk.maxSpeed"]')).toBeHidden();
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
  // Réglages remis comme avant, rien d'enregistré (premier plan opaque par défaut : option 4A).
  expect(await page.locator('.layer-premier-plan').evaluate((el) => el.style.opacity)).toBe('1');
  expect(['{}', null]).toContain(await page.evaluate(() => localStorage.getItem('paper-cart.reglages.v1')));
});

// ---------- Étape A3 : le scanner ----------

test('A3 : s’approcher d’un produit le met en évidence, Entrée le scanne, la carte rejoint le Panier', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  // Au départ, rien à portée.
  expect((await page.evaluate(() => window.paperCart.scanState())).reach).toBe(-1);
  await expect(page.locator('.scan-button')).not.toHaveClass(/visible/);
  // Monter au pied de l'étagère, sous la banane.
  await toBanana(page);
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
  await expect(page.locator('.panier-count')).toHaveText('1/6');
  // Le produit a disparu de l'étagère et n'est plus à portée.
  expect((await page.evaluate(() => window.paperCart.products()))[0].scanned).toBe(true);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).reach).not.toBe(0); // la banane n'est plus visée
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

test('Panier : petites cartes ; toucher une carte la retourne en grand (description au dos) ; on la referme', async ({ page }, info) => {
  const phone = info.project.name === 'telephone';
  await toBanana(page);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards, { timeout: 5000 }).toEqual(['Banane']);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).active).toBe(false);
  await page.keyboard.press('KeyI');
  await expect.poll(() => page.evaluate(() => window.paperCart.state())).toBe('panier');
  const mini = page.locator('.panier .card-mini');
  await expect(mini).toHaveCount(1);
  expect((await mini.boundingBox()).width).toBeLessThan(75); // deux fois plus petite (132 → 66 px)
  // Les deux boutons Fermer : en haut à droite et en bas à droite du menu (dans le menu).
  const vp = page.viewportSize();
  const pr = await page.locator('.panier').boundingBox();
  const [topBtn, bottomBtn] = await page.locator('.panier .kraft-close').all();
  const t = await topBtn.boundingBox();
  const b = await bottomBtn.boundingBox();
  for (const r of [t, b]) {
    expect(r.x + r.width).toBeLessThanOrEqual(pr.x + pr.width);
    expect(r.x + r.width).toBeGreaterThan(pr.x + pr.width - 40); // collé au bord droit
  }
  expect(t.y).toBeLessThan(pr.y + 40); // en haut
  expect(b.y + b.height).toBeGreaterThan(pr.y + pr.height - 40); // en bas
  await page.screenshot({ path: `test-results/captures/panier-${info.project.name}-petites.png` });
  if (phone) await mini.tap();
  else await mini.click();
  // La grande carte : elle se retourne et montre son dos (la description), deux fois plus grande.
  const detail = page.locator('.card-detail');
  await expect(detail).toBeVisible();
  await expect(detail.locator('button')).toHaveCount(0); // pas de bouton : on touche à côté pour refermer
  await expect(mini).toHaveCSS('visibility', 'hidden'); // pas de carte en double : elle a quitté le Panier
  expect(await page.evaluate(() => window.paperCart.flips())).toBe(1); // bruitage de la carte qui se retourne
  expect(await detail.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)'); // pas de fond assombri
  await expect(page.locator('.card-flip')).toHaveClass(/show-back/);
  await expect.poll(() => page.locator('.card-flip').getAttribute('class')).not.toMatch(/anim-/); // animation finie
  const backCard = page.locator('.card-flip .card-back');
  await expect(backCard).toBeVisible();
  await expect(backCard).toContainText('Courbée par nature');
  await expect(backCard).toContainText('Banane');
  const big = await backCard.boundingBox();
  expect(big.width).toBeGreaterThan(phone ? 130 : 250);
  expect(big.y).toBeGreaterThanOrEqual(0);
  expect(big.y + big.height).toBeLessThanOrEqual(vp.height); // tient dans l'écran
  // Texte net : la description est écrite à sa taille (pas une petite carte agrandie).
  const fs = await backCard.locator('.card-desc').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(fs).toBeGreaterThan(phone ? 13 : 20);
  expect(await page.locator('.card-flip').evaluate((e) => getComputedStyle(e).transform)).toBe('none');
  await page.screenshot({ path: `test-results/captures/panier-${info.project.name}-carte.png` });
  // Toucher la grande carte : elle se retourne (recto).
  if (phone) await page.locator('.card-flip').tap();
  else await page.locator('.card-flip').click();
  await expect(page.locator('.card-flip')).not.toHaveClass(/show-back/);
  await expect(page.locator('.card-flip .card-front')).toContainText('Mûr');
  await expect.poll(() => page.locator('.card-flip').getAttribute('class')).toBe('card-flip'); // retournée
  // Toucher à côté : elle se referme (le Panier reste ouvert).
  if (phone) await page.touchscreen.tap(8, vp.height / 2);
  else await page.mouse.click(8, vp.height / 2);
  await expect(detail).toBeHidden();
  await expect(mini).toHaveCSS('visibility', 'visible'); // revenue à sa place
  expect(await page.evaluate(() => window.paperCart.state())).toBe('panier');
  if (!phone) {
    // Clavier : Entrée sur la carte l'ouvre, Échap la referme, puis Échap ferme le Panier.
    await mini.focus();
    await page.keyboard.press('Enter');
    await expect(detail).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();
    expect(await page.evaluate(() => window.paperCart.state())).toBe('panier');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  } else {
    await page.locator('.panier .kraft-close').last().tap(); // en bas à droite
    expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  }
  expect(errors).toEqual([]);
});

test('A3 au doigt : le bouton Scanner apparaît près d’un produit et scanne', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  // Toucher l'étagère au-dessus du lait (x = 920) : le personnage va au pied de l'étagère.
  const p = await page.evaluate(() => window.paperCart.worldToClient(920, 500));
  await page.touchscreen.tap(p.x, p.y);
  await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 6000 }).toBe(false);
  await expect(page.locator('.scan-button')).toHaveClass(/visible/);
  await page.locator('.scan-button').tap();
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards, { timeout: 5000 }).toEqual(['Lait']);
  await page.screenshot({ path: `test-results/captures/a3-${info.project.name}-scan.png` });
  await page.locator('.panier-button').tap();
  await expect(page.locator('.panier .card')).toHaveCount(1);
  await page.locator('.panier button', { hasText: 'Fermer ✕' }).tap(); // en haut à droite
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
});

// Centre d'un produit de l'étagère à l'écran.
async function productCenter(page, index) {
  const r = await page.locator('.product').nth(index).boundingBox();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

test('A3 au doigt : un double toucher sur un produit lointain y emmène le personnage et le scanne', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  // Céréales (3e produit), à droite du départ : visible à l'écran.
  const c = await productCenter(page, 2);
  await page.touchscreen.tap(c.x, c.y);
  await page.touchscreen.tap(c.x, c.y);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).active, { timeout: 8000 }).toBe(true);
  const h = await hero(page);
  expect(Math.abs(h.x - 1000)).toBeLessThanOrEqual(150);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards.length, { timeout: 5000 }).toBe(1);
  expect((await page.evaluate(() => window.paperCart.products()))[2].scanned).toBe(true);
});

test('A3 au doigt : un simple toucher sur un produit ne le scanne pas', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  const c = await productCenter(page, 2);
  await page.touchscreen.tap(c.x, c.y);
  await expect.poll(async () => (await hero(page)).hasTarget, { timeout: 8000 }).toBe(false);
  await page.waitForTimeout(300);
  expect((await page.evaluate(() => window.paperCart.scanState())).active).toBe(false);
  expect((await page.evaluate(() => window.paperCart.scanState())).cards).toEqual([]);
});

test('A3 à la souris : double clic sur un produit, puis le clavier annule une approche', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  const c = await productCenter(page, 2);
  await page.mouse.dblclick(c.x, c.y);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards.length, { timeout: 10000 }).toBe(1);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).active, { timeout: 5000 }).toBe(false);
  // Nouvelle approche (pile, 6e produit), interrompue au clavier : pas de scan.
  const p = await productCenter(page, 5);
  await page.mouse.dblclick(p.x, p.y);
  await page.waitForTimeout(150);
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(2500);
  expect((await page.evaluate(() => window.paperCart.scanState())).cards.length).toBe(1);
});

test('Essai : scanner la boîte d’œufs dans le chariot, de profil (double toucher ou double clic)', async ({ page }, info) => {
  const n = await page.locator('.product').count();
  const eggs = page.locator('.product').nth(n - 1); // le dernier produit : les œufs du chariot
  const r = await eggs.boundingBox();
  const c = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  if (info.project.name === 'telephone') {
    await page.touchscreen.tap(c.x, c.y);
    await page.touchscreen.tap(c.x, c.y);
  } else {
    await page.mouse.dblclick(c.x, c.y);
  }
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).active, { timeout: 10000 }).toBe(true);
  // À gauche du chariot, tourné vers la droite, de face (donc de profil vers le produit).
  const h = await hero(page);
  expect(h).toMatchObject({ facing: 1, away: false });
  await page.waitForTimeout(450);
  await page.screenshot({ path: `test-results/captures/essai-${info.project.name}-chariot.png` });
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.scanState())).cards, { timeout: 5000 }).toEqual(['Œufs']);
  await expect(eggs).toBeHidden();
});

test('A3 : la pause fige le scan en cours', async ({ page }, info) => {
  test.skip(info.project.name === 'telephone', 'clavier : PC seulement');
  await toBanana(page);
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

// ---------- Étape A4 : le narrateur ----------
const narr = (page) => page.evaluate(() => window.paperCart.narrator());

test('A4 : le narrateur accueille le joueur, lettre par lettre ; toucher la bande la complète puis la ferme', async ({ page }, info) => {
  const band = page.locator('.narrator:not([hidden])'); // cachée = attribut hidden (elle garde son calque, séance 68)
  const viewW0 = (await page.evaluate(() => window.paperCart.camera())).viewW;
  await expect(band).toBeVisible({ timeout: 4000 });
  const n1 = await narr(page);
  expect(n1.text).toContain('Client');
  expect(n1.text).not.toContain('[TEMP]');
  // La bande ne recouvre pas les boutons du haut.
  const b = await band.boundingBox();
  const h = await page.locator('.hud-bar').boundingBox();
  expect(b.x + b.width).toBeLessThanOrEqual(h.x);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-narrateur.png` });
  if (info.project.name === 'telephone') await band.tap();
  else await band.click();
  const n2 = await narr(page);
  expect(n2.shown).toBe(n2.text.length);
  await expect(band).toContainText(n2.text);
  if (info.project.name === 'telephone') await band.tap();
  else await band.click();
  await expect(band).toBeHidden();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  // Première rencontre, graduée : il se parle d'abord à lui-même (pensées, bulle en pointillés)…
  const bubble = page.locator('.hero-bubble:not([hidden])');
  await expect(page.locator('.hero-bubble.thought:not([hidden])')).toBeVisible({ timeout: 4000 });
  expect((await narr(page)).voice).toBe('pensee');
  expect((await narr(page)).text).toMatch(/parking/);
  await expect.poll(async () => (await narr(page)).shown, { timeout: 5000 }).toBeGreaterThan(40);
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-pensee.png` });
  // (on accélère la suite pour le test) Les pensées s'enchaînent, sans aparté : la rencontre vient après la première carte.
  await page.evaluate(() => {
    for (const [k, v] of [['narrator.speed', 400], ['narrator.hold', 0.3], ['narrator.holdPerChar', 0], ['narrator.followDelay', 0.1]]) window.paperCart.set(k, v);
  });
  await expect.poll(async () => (await narr(page)).text, { timeout: 15000 }).toMatch(/D'en haut/);
  await expect.poll(async () => (await narr(page)).voice, { timeout: 5000 }).toBe('');
  expect((await page.evaluate(() => window.paperCart.journal())).join(' ')).not.toMatch(/heros:/);
  expect(errors).toEqual([]);
  expect((await page.evaluate(() => window.paperCart.camera())).viewW).toBeCloseTo(viewW0, 0);
});

test('A4 : la première rencontre, après la première carte : une conversation que rien n’interrompt, puis un choix ; relue dans la Pause', async ({ page }, info) => {
  test.setTimeout(90_000); // il s'avance d'abord (deux marches), puis toute la conversation
  const phone = info.project.name === 'telephone';
  const viewW0 = (await page.evaluate(() => window.paperCart.camera())).viewW;
  await page.evaluate(() => {
    for (const [k, v] of [['narrator.speed', 400], ['narrator.hold', 0.3], ['narrator.holdPerChar', 0], ['narrator.followDelay', 0.1], ['narrator.enabled', false], ['narrator.enabled', true]]) window.paperCart.set(k, v);
  });
  // Première carte : le haut-parleur la commente, puis le héros se tourne vers le joueur.
  await toBanana(page);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await narr(page)).text, { timeout: 6000 }).toContain('essence');
  // Il s'avance d'abord vers le milieu de l'écran, s'arrête à mi-chemin (« Hum ? »), repart.
  const x0 = (await hero(page)).x;
  await expect.poll(async () => (await narr(page)).voice, { timeout: 10000 }).toBe('marche');
  await expect(page.locator('.aside-veil')).toBeVisible();
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-marche.png` });
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.journal())).join(' '), { timeout: 10000 }).toMatch(/pensee: Hum/);
  await expect.poll(async () => (await narr(page)).voice, { timeout: 20000 }).toBe('heros');
  expect(Math.abs((await hero(page)).x - x0)).toBeGreaterThan(50);
  const bubble = page.locator('.hero-bubble:not([hidden])');
  await expect(bubble).toContainText('Ce bip');
  expect((await hero(page)).away).toBe(false);
  await expect(page.locator('.aside-bar-top')).toBeVisible();
  // Chaque réplique attend un toucher (petit ▾) : elle ne passe pas toute seule.
  await expect(page.locator('.hero-bubble.tap:not([hidden])')).toBeVisible({ timeout: 3000 });
  await page.waitForTimeout(1500);
  await expect(bubble).toContainText('Ce bip');
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-rencontre.png` });
  // Rien ne l'interrompt : ni le scanner, ni un déplacement.
  const h0 = await hero(page);
  await page.keyboard.press('ArrowLeft');
  expect((await hero(page)).x).toBeCloseTo(h0.x, 0);
  // Toucher (ou Entrée) : réplique suivante, jusqu'à « Qui es-tu ? ».
  const next = async (loc) => {
    // Attendre que la réplique soit écrite en entier : alors un toucher passe à la suivante.
    await expect.poll(async () => { const n = await narr(page); return n.shown >= n.text.length; }).toBe(true);
    if ((await narr(page)).waiting || (await page.locator('.name-picker').isVisible())) return; // une question : il faut choisir
    if (phone) await loc.tap({ force: true }); // la bulle suit le héros (zoom) : pas d'attente de stabilité
    else await page.keyboard.press('Enter');
  };
  for (let k = 0; k < 10 && !(await narr(page)).text.includes('Qui es-tu'); k++) await next(bubble);
  expect((await narr(page)).text).toMatch(/Qui es-tu/);
  await next(bubble);
  // Le joueur répond, sans choix : c'est l'écran qui parle (mots violets, centrés en bas, sans cadre).
  const player = page.locator('.screen-voice');
  await expect(player).toBeVisible();
  expect((await narr(page)).voice).toBe('epaisseur');
  await expect(player).not.toContainText('Toi');
  expect(await player.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  const vp = page.viewportSize();
  const pb = await player.boundingBox();
  expect(pb.y + pb.height).toBeGreaterThan(vp.height * 0.8); // en bas
  expect(Math.abs(pb.x + pb.width / 2 - vp.width / 2)).toBeLessThan(4); // centré
  // Pendant la conversation, l'interface (boutons, Panier) s'efface.
  expect(Number(await page.locator('.hud-bar').evaluate((e) => getComputedStyle(e).opacity))).toBeLessThan(0.05);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-toi.png` });
  const picker = page.locator('.name-picker');
  for (let k = 0; k < 12 && !(await picker.isVisible()); k++) {
    const v = (await narr(page)).voice;
    await next(v === 'epaisseur' ? player : bubble);
    await page.waitForTimeout(100);
  }
  // Le héros propose un nom (« Épaisseur ») ; le joueur peut en choisir un autre, ou taper le sien.
  await expect(picker).toBeVisible();
  await expect(picker.locator('.name-choice').first()).toHaveText('Épaisseur'); // le nom actuel d'abord
  await expect(picker).toContainText('Autre…');
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-nom.png` });
  await page.waitForTimeout(400); // (un appui juste à l'apparition ne choisit rien)
  const moitie = picker.locator('.name-choice', { hasText: 'Moitié' });
  if (phone) await moitie.tap();
  else await moitie.click();
  await expect(picker).toBeHidden();
  await expect.poll(async () => (await narr(page)).text).toMatch(/Ma… Moitié/); // la suite emploie le nouveau nom
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('paper-cart.reglages.v1') || '{}')['player.name'])).toBe('moitie');
  for (let k = 0; k < 4 && !(await narr(page)).waiting; k++) await page.waitForTimeout(300);
  // Seulement ensuite, un choix.
  expect((await narr(page)).waiting).toBe(true);
  const choice = page.locator('.hero-choices.ready .hero-choice').first();
  await expect(choice).toBeVisible();
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-reponses.png` });
  if (phone) await choice.tap();
  else await choice.click();
  await expect.poll(async () => (await narr(page)).trust).toBe(1);
  for (let k = 0; k < 3 && (await narr(page)).voice === 'heros'; k++) await next(bubble); // sa réponse, puis fin
  // Puis le haut-parleur croit qu'un client parle au mur ; le zoom revient.
  await expect.poll(async () => (await narr(page)).voice, { timeout: 12000 }).toBe('narrateur');
  expect((await narr(page)).text).toMatch(/mur|plafond/);
  await expect.poll(async () => (await page.evaluate(() => window.paperCart.camera())).viewW).toBeGreaterThan(viewW0 * 0.95);
  // Pause → Dialogues : toute la conversation se relit, avec les réponses du joueur.
  await page.locator('.hud-bar button[aria-label^="Pause"]').click();
  await page.locator('.journal-toggle').click();
  const journal = page.locator('.journal');
  await expect(journal).toBeVisible();
  await expect(journal).toContainText('Qui es-tu');
  await expect(journal.locator('.journal-epaisseur').first()).toContainText('Toi');
  await expect(journal).toContainText('Oui. Ensemble.');
  await expect(journal).toContainText('Moitié');
  await page.screenshot({ path: `test-results/captures/a4-${info.project.name}-journal.png` });
  expect(errors).toEqual([]);
});

test('A4 : le premier scan est commenté, même si l’accueil n’est pas fini', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await expect(page.locator('.narrator:not([hidden])')).toBeVisible({ timeout: 4000 });
  // Marcher jusqu'au pied de l'étagère, sous la banane, et scanner.
  await toBanana(page);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await narr(page)).text, { timeout: 5000 }).toContain('essence');
});

test('A4 : inactivité, rien à scanner, et narrateur désactivable', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.evaluate(() => {
    window.paperCart.set('narrator.inactivity', 5);
    window.paperCart.set('narrator.minGap', 0);
    window.paperCart.set('narrator.asideGap', 0);
    window.paperCart.set('narrator.breath', 0);
  });
  await expect(page.locator('.narrator:not([hidden])')).toBeVisible({ timeout: 4000 });
  await page.locator('.narrator:not([hidden])').click();
  await page.locator('.narrator:not([hidden])').click();
  await page.evaluate(() => {
    // sans les premières pensées de l'accueil (éteindre puis rallumer efface la suite en attente)
    window.paperCart.set('narrator.enabled', false);
    window.paperCart.set('narrator.enabled', true);
  });
  // Rien à portée : Entrée fait réagir le narrateur.
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await narr(page)).text, { timeout: 3000 }).toMatch(/vide|rien/i);
  await page.locator('.narrator:not([hidden])').click();
  await page.locator('.narrator:not([hidden])').click();
  await page.keyboard.press('ArrowRight'); // une action : l'inactivité repart de zéro
  // Sans rien faire pendant 5 s (temps de jeu) : la 1re fois, c'est le héros qui parle (aparté).
  await expect.poll(async () => (await narr(page)).voice, { timeout: 15000 }).toBe('heros');
  expect((await narr(page)).text).toMatch(/toujours là|sortie/);
  // Désactivé : la bande disparaît.
  await page.evaluate(() => window.paperCart.set('narrator.enabled', false));
  await expect(page.locator('.narrator:not([hidden])')).toBeHidden();
});


// ---------- Étape A5a : l'accueil en libre-service (Scanette et panier) ----------
const state = (page) => page.evaluate(() => window.paperCart.scanState());

test('A5a : mains vides au début ; à l’accueil, on prend la Scanette puis le panier', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  let s = await state(page);
  expect(s.gear).toEqual({ scanette: false, panier: false });
  await expect(page.locator('.panier-button')).toBeHidden();
  await expect(page.locator('.actor-held:visible')).toHaveCount(0); // vraiment invisibles à l'écran
  expect(await page.evaluate(() => window.paperCart.place())).toBe('accueil'); // la partie commence dans le hall
  // Passer devant les portiques (on ne les traverse pas), monter contre le mur, puis longer le hall jusqu'au présentoir.
  await pastGates(page);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).pickup, { timeout: 10000 }).toBeGreaterThanOrEqual(0);
  await page.keyboard.up('ArrowRight');
  await expect(page.locator('.scan-button')).toContainText('Prendre');
  await page.keyboard.press('Enter'); // la Scanette (le mur, tout près)
  await expect.poll(async () => (await state(page)).gear.scanette).toBe(true);
  await expect(page.locator('.item-reveal')).toBeVisible();
  await page.locator('.item-reveal-ok').click();
  await expect(page.locator('.item-reveal')).toBeHidden();
  await expect(page.locator('.scanette-button')).toBeVisible();
  // Le panier est un peu plus loin à droite, devant le pot de fleurs (z < 195).
  await page.keyboard.down('ArrowDown');
  await page.waitForFunction(() => window.paperCart.hero().z < 190, null, { timeout: 4000 });
  await page.keyboard.up('ArrowDown');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.paperCart.scanState().pickup === 1, null, { timeout: 6000 });
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).gear).toEqual({ scanette: true, panier: true });
  await expect(page.locator('.item-reveal')).toBeVisible();
  await page.locator('.item-reveal-ok').click();
  await expect(page.locator('.item-reveal')).toBeHidden();
  await expect(page.locator('.panier-button')).toBeVisible();
  await expect(page.locator('.panier-count')).toHaveText('0/6');
  // Hors scan, ni la Scanette ni le panier ne sont tenus en main sur le héros (ils sont dans le HUD).
  await expect(page.locator('.actor-held:visible')).toHaveCount(0);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/captures/a5a-${info.project.name}-accueil.png` });
});

test('A5a au doigt : double toucher sur le présentoir ; sans Scanette, le scan est refusé', async ({ page }, info) => {
  test.skip(info.project.name !== 'telephone', 'téléphone simulé');
  const p = await page.evaluate(() => window.paperCart.worldToClient(1875, 380)); // pile de paniers (y ≈ 800 dans le hall 2600 px)
  await page.touchscreen.tap(p.x, p.y);
  await page.touchscreen.tap(p.x, p.y);
  await expect.poll(async () => (await state(page)).gear.panier, { timeout: 8000 }).toBe(true);
  await expect(page.locator('.item-reveal')).toBeVisible();
  // Mode paysage smartphone : toute la fenêtre et le bouton « Continuer » tiennent dans l'écran sans être coupés.
  const revCard = await page.locator('.item-reveal-card').boundingBox();
  const revOk = await page.locator('.item-reveal-ok').boundingBox();
  const vp = page.viewportSize();
  expect(revCard.y).toBeGreaterThanOrEqual(0);
  expect(revCard.y + revCard.height).toBeLessThanOrEqual(vp.height);
  expect(revOk.y + revOk.height).toBeLessThanOrEqual(vp.height);
  await page.locator('.item-reveal-ok').tap();
  await expect(page.locator('.item-reveal')).toBeHidden();
  expect((await state(page)).gear.scanette).toBe(false);
  // Dans le rayon, sans Scanette : un double toucher sur un produit ne scanne rien.
  await page.evaluate(() => window.paperCart.useExit());
  await page.waitForFunction(() => window.paperCart.place() === 'rayon-essai' && window.paperCart.state() === 'play');
  const c = await page.locator('.product').nth(0).boundingBox();
  await page.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2);
  await page.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2);
  await page.waitForTimeout(2500);
  const s = await state(page);
  expect(s.active).toBe(false);
  expect(s.cards).toEqual([]);
  await page.screenshot({ path: `test-results/captures/a5a-${info.project.name}-panier.png` });
});

test('A5a : panier plein, on repose une carte pour faire de la place (choix B)', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.evaluate(() => {
    window.paperCart.equip();
    window.paperCart.set('carry.panier', 1);
  });
  await expect(page.locator('.panier-count')).toHaveText('0/1');
  // Scanner la banane (au fond, au-dessus du départ)…
  await toBanana(page);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).cards, { timeout: 5000 }).toEqual(['Banane']);
  await expect.poll(async () => (await state(page)).active).toBe(false);
  // … puis le lait, à droite (x = 920) : le panier est plein, l'écran propose de reposer une carte.
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).reach, { timeout: 6000 }).toBe(1);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Enter');
  // D'abord la question « Échanger une carte ? » : Oui.
  await expect(page.locator('.confirm')).toBeVisible();
  await expect(page.locator('.confirm')).toContainText('plein');
  // Pendant la question, le haut-parleur ne commente pas le panier plein (une seule chose à lire).
  expect((await narr(page)).text).not.toMatch(/panier est plein/);
  await page.screenshot({ path: `test-results/captures/a5a-${info.project.name}-echanger.png` });
  await page.locator('.confirm button', { hasText: 'Oui' }).click();
  await expect(page.locator('.panier h2')).toHaveText('Panier plein');
  await page.screenshot({ path: `test-results/captures/a5a-${info.project.name}-plein.png` });
  await page.locator('.panier .card').first().click();
  await expect(page.locator('.panier')).toBeHidden();
  await expect.poll(async () => (await state(page)).cards, { timeout: 5000 }).toEqual(['Lait']);
  await expect(page.locator('.panier-count')).toHaveText('1/1');
  // Échange : la banane reposée apparaît à la place du lait (et non à sa place d'origine).
  const banane = (await page.evaluate(() => window.paperCart.products()))[0];
  expect(banane.scanned).toBe(false);
  expect(banane.x).toBe(920);
  await expect(page.locator('.product').nth(0)).toBeVisible();
  // « Non » à la question : rien ne change.
  await page.keyboard.press('Enter'); // la banane est à portée, à la place du lait
  await expect(page.locator('.confirm')).toBeVisible();
  await page.locator('.confirm button', { hasText: 'Non' }).click();
  await expect(page.locator('.confirm')).toBeHidden();
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  expect((await state(page)).cards).toEqual(['Lait']);
  // Après un refus seulement, le haut-parleur commente.
  await expect.poll(async () => (await narr(page)).text, { timeout: 8000 }).toMatch(/panier est plein/);
});

test('A5a : le menu du panier a deux onglets, Cartes et Objets', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.evaluate(() => window.paperCart.equip());
  await page.keyboard.press('KeyI');
  const panel = page.locator('.panier');
  await expect(panel).toBeVisible();
  await panel.locator('.settings-tab', { hasText: 'Objets' }).click();
  await expect(panel.locator('.panier-objects li')).toHaveCount(2);
  await expect(panel.locator('.panier-objects')).toContainText('Scanette');
  await expect(panel.locator('.panier-objects')).toContainText('Panier à main');
  await expect(panel.locator('.panier-grid')).toBeHidden();
  await page.screenshot({ path: `test-results/captures/a5a-${info.project.name}-objets.png` });
  await panel.locator('.settings-tab', { hasText: 'Cartes' }).click();
  await expect(panel.locator('.panier-objects')).toBeHidden();
  // Au clavier : flèche droite ou gauche change d'onglet.
  await page.keyboard.press('ArrowRight');
  await expect(panel.locator('.panier-objects')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(panel.locator('.panier-grid')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('A5a : Scanette sans panier, le héros s’interroge lui-même (pensée, bulle en pointillés)', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.evaluate(() => window.paperCart.set('narrator.enabled', true));
  // Dans le hall : la Scanette seulement.
  await pastGates(page);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.paperCart.hero().z > 200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).pickup, { timeout: 10000 }).toBe(0);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Enter'); // la Scanette
  await expect.poll(async () => (await state(page)).gear.scanette).toBe(true);
  await expect(page.locator('.item-reveal')).toBeVisible();
  await page.locator('.item-reveal-ok').click();
  await expect(page.locator('.item-reveal')).toBeHidden();
  // Puis le rayon, sans panier : devant la banane.
  await page.evaluate(() => window.paperCart.useExit());
  await page.waitForFunction(() => window.paperCart.place() === 'rayon-essai' && window.paperCart.state() === 'play');
  await toBanana(page);
  await expect.poll(async () => (await state(page)).pickup).toBe(-1);
  await page.locator('.narrator, .hero-bubble').evaluateAll((els) => els.forEach((e) => e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))));
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await narr(page)).voice, { timeout: 3000 }).toBe('pensee');
  expect((await narr(page)).text).toMatch(/panier/);
  await expect(page.locator('.hero-bubble.thought:not([hidden])')).toBeVisible();
  expect((await state(page)).active).toBe(false);
});

test('Accessibilité : taille du texte, luminosité et contraste', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'PC');
  await page.evaluate(() => window.paperCart.set('access.textSize', 'grande'));
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ts').trim())).toBe('1.2');
  await page.evaluate(() => window.paperCart.set('access.brightness', 1.2));
  expect(await page.locator('#game').evaluate((g) => g.style.filter)).toContain('brightness(1.2)');
  await page.evaluate(() => window.paperCart.set('access.brightness', 1));
  expect(await page.locator('#game').evaluate((g) => g.style.filter)).toBe('');
});

test('Tournis : trop de demi-tours, trop vite → étoiles autour de la tête, puis il s’en plaint', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'clavier');
  await page.evaluate(() => {
    // sans l'annonce d'arrivée ni les premières pensées (éteindre puis rallumer efface la suite)
    window.paperCart.set('narrator.enabled', false);
    window.paperCart.set('narrator.enabled', true);
  });
  // Lent : un demi-tour par seconde → rien.
  for (let k = 0; k < 2; k++) {
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(1000);
    await page.keyboard.up('ArrowLeft');
  }
  await expect(page.locator('.dizzy-stars')).toBeHidden();
  // Vite : gauche, droite, gauche… toutes les 0,25 s.
  for (let k = 0; k < 5; k++) {
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(250);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(250);
    await page.keyboard.up('ArrowLeft');
  }
  await expect(page.locator('.dizzy-stars')).toBeVisible();
  // Arrêté, il se tourne vers le joueur et se plaint (aparté).
  await expect.poll(async () => (await narr(page)).voice, { timeout: 5000 }).toBe('heros');
  expect((await narr(page)).text).toMatch(/tête qui tourne/);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `test-results/captures/tournis-${info.project.name}.png` });
  await expect(page.locator('.dizzy-stars')).toBeVisible(); // tant qu'il s'en plaint
  expect(errors).toEqual([]);
});

test('Panier : un double clic (ou double toucher) sur une carte ne casse pas l’animation', async ({ page }, info) => {
  const phone = info.project.name === 'telephone';
  await page.goto('./?depart=panier-plein');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  if (phone) await page.locator('.panier-button').tap();
  else await page.keyboard.press('KeyI');
  const c = page.locator('.panier .card-mini').nth(2);
  await c.waitFor();
  if (phone) {
    await c.tap();
    await page.waitForTimeout(60);
    await page.locator('.card-flip').tap({ force: true });
  } else await c.dblclick();
  // Second toucher à côté de la petite carte qui grandit : ce n'est pas « toucher à côté pour refermer ».
  const box = await c.boundingBox();
  if (phone) await page.touchscreen.tap(box.x - 20, box.y + box.height / 2);
  else await page.mouse.click(box.x - 20, box.y + box.height / 2);
  // Le second toucher est ignoré : l'ouverture continue normalement (pas de saut à la grande taille).
  await page.waitForTimeout(40);
  const w = await page.locator('.card-flip').evaluate((e) => e.getBoundingClientRect().width);
  const big = await page.locator('.card-flip').evaluate((e) => e.offsetWidth);
  expect(w).toBeLessThan(big * 0.9); // encore en vol, petite
  await expect.poll(() => page.locator('.card-flip').getAttribute('class')).toBe('card-flip show-back'); // ouverte, au dos
  await expect(page.locator('.card-detail')).toBeVisible(); // et elle reste ouverte
  expect(await page.evaluate(() => window.paperCart.flips())).toBe(1);
  expect(await page.locator('.card-detail').evaluate((e) => getComputedStyle(e).touchAction)).toBe('none');
  expect(errors).toEqual([]);
});

test('Panier : double toucher sur la grande carte : elle se retourne une fois et reste ouverte, à sa taille', async ({ page }, info) => {
  const phone = info.project.name === 'telephone';
  await page.goto('./?depart=panier-plein');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  if (phone) await page.locator('.panier-button').tap();
  else await page.keyboard.press('KeyI');
  await page.locator('.panier .card-mini').nth(1).click();
  const flip = page.locator('.card-flip');
  await expect.poll(() => flip.getAttribute('class')).toBe('card-flip show-back');
  const w0 = await flip.evaluate((e) => e.offsetWidth);
  const box = await flip.boundingBox();
  // Double toucher au même endroit : le second tombe à côté de la carte à demi retournée.
  const x = box.x + box.width * 0.85;
  const y = box.y + box.height / 2;
  if (phone) {
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(80);
    await page.touchscreen.tap(x, y);
  } else await page.mouse.dblclick(x, y);
  await expect.poll(() => flip.getAttribute('class')).toBe('card-flip'); // retournée une fois (recto)
  await expect(page.locator('.card-detail')).toBeVisible(); // toujours ouverte
  const r = await flip.boundingBox();
  expect(Math.abs(r.width - w0)).toBeLessThan(2); // à sa taille, pas agrandie
  // Puis toucher à côté la referme bien, et la carte revient à sa place.
  if (phone) await page.touchscreen.tap(8, 200);
  else await page.mouse.click(8, 200);
  await expect(page.locator('.card-detail')).toBeHidden();
  await expect(page.locator('.panier .card-mini').nth(1)).toHaveCSS('visibility', 'visible');
  expect(errors).toEqual([]);
});

test('A4 : la première rencontre attend que le Panier soit fermé, et le Panier ne s’ouvre pas pendant elle', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'clavier');
  test.setTimeout(60_000);
  await page.goto('./?depart=equipe');
  await page.waitForFunction(() => window.paperCart?.state() === 'play');
  await page.evaluate(() => {
    for (const [k, v] of [['narrator.speed', 400], ['narrator.hold', 0.3], ['narrator.holdPerChar', 0]]) window.paperCart.set(k, v);
  });
  await toBanana(page);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.paperCart.scanState().cards.length === 1 && !window.paperCart.scanState().active);
  // Le Panier ouvert juste après la première carte : la rencontre ne commence pas dessous.
  await page.keyboard.press('KeyI');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('panier');
  await page.waitForTimeout(4000);
  expect(['', 'narrateur']).toContain((await narr(page)).voice);
  expect((await page.evaluate(() => window.paperCart.journal())).join(' ')).not.toMatch(/Hum/);
  // Panier fermé : elle commence, par la marche.
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await narr(page)).voice, { timeout: 10000 }).toBe('marche');
  // Pendant la rencontre, la touche du Panier ne fait rien.
  await page.keyboard.press('KeyI');
  expect(await page.evaluate(() => window.paperCart.state())).toBe('play');
  expect(errors).toEqual([]);
});

test('doigt qui glisse : le héros suit, et le chemin n’est calculé qu’une fois par image', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'souris');
  const a = await page.evaluate(() => window.paperCart.worldToClient(500, 60));
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  // 40 mouvements d'un coup (bien plus qu'une image) vers la droite.
  await page.mouse.move(a.x + 8, a.y);
  await page.waitForTimeout(100);
  const before = await page.evaluate(() => window.paperCart.paths());
  await page.evaluate(([x, y]) => {
    const el = document.getElementById('game');
    for (let k = 2; k <= 40; k++) el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: x + k * 8, clientY: y, bubbles: true }));
  }, [a.x, a.y]);
  await page.waitForTimeout(100);
  expect((await page.evaluate(() => window.paperCart.paths())) - before).toBe(1); // 39 mouvements, un seul calcul
  await page.waitForTimeout(800);
  await page.mouse.up();
  const h = await hero(page);
  expect(h.x).toBeGreaterThan(600); // il a suivi le doigt
});

test('A6 : l’agent va une fois au milieu ; il interpelle le héros (figé), puis « Stop ! » et le héros fait demi-tour s’il force', async ({ page }, info) => {
  test.setTimeout(40_000);
  await page.evaluate(() => {
    window.paperCart.markSaid('arrivee'); // l'accueil du haut-parleur et ses pensées ont leurs propres tests
    for (const [k, v] of [['narrator.speed', 400], ['narrator.hold', 0.6], ['narrator.holdPerChar', 0], ['narrator.followDelay', 0.1], ['narrator.enabled', false], ['narrator.enabled', true]]) window.paperCart.set(k, v);
  });
  const guard = () => page.evaluate(() => window.paperCart.guard());
  const said = async () => (await page.evaluate(() => window.paperCart.journal())).join(' ');
  expect((await hero(page)).x).toBeGreaterThan(1000); // la partie commence à droite des portiques
  // Au début, l'agent va de son poste à sa place, au milieu (hall 2600 px : x = 680), puis ne bouge plus.
  await expect.poll(async () => Math.round((await guard()).x), { timeout: 5000 }).toBe(680);
  const z0 = (await guard()).z;
  // Vers la gauche : il lève le bras et parle (bulle au-dessus de lui) ; le héros sursaute et s'arrête.
  await page.keyboard.down('ArrowLeft');
  await expect.poll(said, { timeout: 5000 }).toMatch(/agent: Vous ne pouvez pas ressortir par ici/);
  await expect(page.locator('.hero-bubble.agent:not([hidden])')).toBeVisible();
  await expect(page.locator('.hero-surprise')).toBeVisible(); // « !! »
  expect((await guard()).pose).toBe('stop');
  const frozen = (await hero(page)).x;
  await page.waitForTimeout(300);
  expect((await hero(page)).x).toBe(frozen); // figé pendant la bulle, même en appuyant
  await page.mouse.click(200, 300); // un toucher dans la scène ne le fait pas marcher non plus
  await page.waitForTimeout(300);
  expect((await hero(page)).x).toBe(frozen);
  await page.keyboard.up('ArrowLeft');
  const t0 = Date.now();
  await expect(page.locator('.hero-bubble.agent:not([hidden])')).toBeHidden({ timeout: 8000 }); // fermée seule, sans toucher
  expect(Date.now() - t0).toBeLessThan(7000); // 126 lettres : ≈ 6,3 s depuis son début (2,5 s + 50 ms par lettre)
  await page.keyboard.down('ArrowLeft');
  await page.screenshot({ path: `test-results/captures/a6-${info.project.name}-agent.png` });
  // Il force contre la barrière : « Stop ! », et il fait demi-tour de quelques pas. Il ne passe jamais.
  await expect.poll(said, { timeout: 10000 }).toMatch(/agent: Stop\s?! De l.autre côté/);
  // Le demi-tour attend que l'agent ait fini de parler.
  const atStop = (await hero(page)).x;
  await page.waitForTimeout(300);
  if (await page.locator('.hero-bubble.agent:not([hidden])').isVisible()) expect((await hero(page)).x).toBeLessThan(atStop + 5);
  await expect(page.locator('.hero-bubble.agent:not([hidden])')).toBeHidden({ timeout: 4000 });
  let minX = Infinity;
  let back = false;
  for (let k = 0; k < 60 && !back; k++) {
    const x = (await hero(page)).x;
    if (x > minX + 100) back = true;
    minX = Math.min(minX, x);
    await page.waitForTimeout(100);
  }
  await page.keyboard.up('ArrowLeft');
  expect(back, 'demi-tour de quelques pas').toBe(true);
  expect(minX).toBeGreaterThan(700);
  await page.screenshot({ path: `test-results/captures/a6-${info.project.name}-stop.png` });
  const gd = await guard();
  expect([Math.round(gd.x), gd.z]).toEqual([680, z0]); // l'agent n'a pas bougé
});
