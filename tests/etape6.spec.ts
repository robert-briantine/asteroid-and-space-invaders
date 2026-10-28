import { test, expect } from '@playwright/test';

async function getDebug(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as any).__debug);
}

const BASE_SPEED = 40; // doit correspondre à BASE_BLOCK_SPEED dans main.js
const SPEED_FACTOR = 2;
const TOLERANCE = 0.1; // ±10 %

test('bloc neuf : vitesse ≈ BASE_SPEED', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const speeds = (await getDebug(page)).blockSpeeds;
  expect(speeds.length).toBeGreaterThan(0);
  for (const s of speeds) {
    expect(Math.abs(s - BASE_SPEED)).toBeLessThanOrEqual(BASE_SPEED * TOLERANCE);
  }
});

test('moitié des cellules retirées : vitesse a augmenté (~1,5×)', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const debug = await getDebug(page);
  const block = debug.blocks[0];
  const totalCells = block.cells.reduce((sum: number, r: boolean[]) => sum + r.filter(Boolean).length, 0);
  const half = Math.floor(totalCells / 2);

  // Retirer la moitié des cellules du bloc 0
  await page.evaluate(({ idx, count }: { idx: number; count: number }) => {
    (window as any).__debug.removeBlockCells(idx, count);
  }, { idx: 0, count: half });

  // Attendre une frame pour que la vitesse soit recalculée
  await page.waitForTimeout(100);

  const speeds = (await getDebug(page)).blockSpeeds;
  const expected = BASE_SPEED * (1 + 0.5 * SPEED_FACTOR); // ratio = 0.5 → 1 + 0.5*2 = 2.0... 
  // En réalité ratio = 0.5 → speed = BASE * (1 + (1-0.5)*2) = BASE * 2
  const actual = speeds[0];
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(expected * TOLERANCE);
});

test('toutes les cellules sauf une retirées : vitesse proche de BASE_SPEED * 3', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const debug = await getDebug(page);
  const block = debug.blocks[0];
  const totalCells = block.cells.reduce((sum: number, r: boolean[]) => sum + r.filter(Boolean).length, 0);

  // Retirera toutes les cellules sauf une
  await page.evaluate(({ idx, count }: { idx: number; count: number }) => {
    (window as any).__debug.removeBlockCells(idx, count);
  }, { idx: 0, count: totalCells - 1 });

  await page.waitForTimeout(100);

  const speeds = (await getDebug(page)).blockSpeeds;
  // ratio = 1/totalCells ≈ 0 → speed ≈ BASE * (1 + 1*2) = BASE * 3
  const expected = BASE_SPEED * 3;
  const actual = speeds[0];
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(expected * TOLERANCE);
});

test('pas de crash quand le bloc est presque vide', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(300);

  const debug = await getDebug(page);
  const block = debug.blocks[0];
  const totalCells = block.cells.reduce((sum: number, r: boolean[]) => sum + r.filter(Boolean).length, 0);

  // Retirera toutes les cellules (ratio = 0, pas de division par zéro)
  await page.evaluate(({ idx, count }: { idx: number; count: number }) => {
    (window as any).__debug.removeBlockCells(idx, count);
  }, { idx: 0, count: totalCells });

  await page.waitForTimeout(500);

  expect(pageErrors).toHaveLength(0);
});
