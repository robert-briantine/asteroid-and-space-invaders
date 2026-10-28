import { test, expect } from '@playwright/test';

async function getDebug(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as any).__debug);
}

test('les blocs bougent réellement', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const before = (await getDebug(page)).blocks[0];
  await page.waitForTimeout(1000);
  const after = (await getDebug(page)).blocks[0];

  const moved = Math.abs(after.x - before.x) > 1 || Math.abs(after.y - before.y) > 1;
  expect(moved).toBe(true);
});

test('rebond aux bords : un bloc forcé près d\'un bord revient dans le canvas', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(300);

  // Forcer le bloc 0 contre le bord gauche
  await page.evaluate(() => {
    (window as any).__debug.setBlockPos(0, 0, 100);
  });

  // Attendre que le bloc rebondisse et reparte vers l'intérieur
  await page.waitForTimeout(2000);

  const block = (await getDebug(page)).blocks[0];
  expect(block.x).toBeGreaterThan(0);
  expect(pageErrors).toHaveLength(0);
});

test('changement de direction aléatoire se produit après ~6 s', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const dirsBefore = (await getDebug(page)).blocks.map((b: any) => b.dir);
  await page.waitForTimeout(6000);
  const dirsAfter = (await getDebug(page)).blocks.map((b: any) => b.dir);

  const changed = dirsBefore.some((d: number, i: number) => Math.abs(d - dirsAfter[i]) > 0.01);
  expect(changed).toBe(true);
});

test('pas de crash pendant les rebonds', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(5000);

  expect(pageErrors).toHaveLength(0);
});
