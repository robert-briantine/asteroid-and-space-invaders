import { test, expect } from '@playwright/test';

async function getDebug(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as any).__debug);
}

test('état initial propre : speed === 0 et pas d\'erreur', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(300);

  const debug = await getDebug(page);
  expect(debug.ship.speed).toBe(0);
  expect(pageErrors).toHaveLength(0);
});

test('rotation gauche : ArrowLeft diminue l\'angle', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(200);

  const before = (await getDebug(page)).ship.angle;
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowLeft');

  const after = (await getDebug(page)).ship.angle;
  expect(after).toBeLessThan(before);
});

test('rotation droite : ArrowRight augmente l\'angle', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(200);

  const before = (await getDebug(page)).ship.angle;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowRight');

  const after = (await getDebug(page)).ship.angle;
  expect(after).toBeGreaterThan(before);
});

test('accélération : ArrowUp augmente la vitesse', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(200);

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowUp');

  const speed = (await getDebug(page)).ship.speed;
  expect(speed).toBeGreaterThan(0);
});

test('freinage : ArrowDown ramène la vitesse à 0', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(200);

  // D'abord accélérer
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowUp');

  // Puis freiner
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowDown');

  const speed = (await getDebug(page)).ship.speed;
  expect(speed).toBe(0);
});

test('déplacement : avec speed > 0, la position change', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(200);

  // Accélérer pour avoir une vitesse non nulle
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowUp');

  const posBefore = (await getDebug(page)).ship;
  await page.waitForTimeout(500);
  const posAfter = (await getDebug(page)).ship;

  const moved = Math.abs(posAfter.x - posBefore.x) > 1 || Math.abs(posAfter.y - posBefore.y) > 1;
  expect(moved).toBe(true);
});
