import { test, expect } from '@playwright/test';

async function getDebug(page: import('@playwright/test').Page) {
  return page.evaluate(() => (window as any).__debug);
}

test('plusieurs blocs sont présents sur l\'écran', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const debug = await getDebug(page);
  expect(debug.blocks.length).toBeGreaterThanOrEqual(5);
});

test('chaque bloc a une grille de cellules valide', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const blocks = (await getDebug(page)).blocks;
  for (const block of blocks) {
    expect(block.cols).toBeGreaterThan(0);
    expect(block.rows).toBeGreaterThan(0);
    // La grille doit contenir au moins une cellule pleine
    const hasFilledCell = block.cells.some((row: boolean[]) => row.some((v: boolean) => v));
    expect(hasFilledCell).toBe(true);
  }
});

test('les positions des blocs ne se chevauchent pas', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(300);

  const blocks = (await getDebug(page)).blocks;
  const CELL_SIZE = 6;

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      const overlapX = a.x < b.x + b.cols * CELL_SIZE && a.x + a.cols * CELL_SIZE > b.x;
      const overlapY = a.y < b.y + b.rows * CELL_SIZE && a.y + a.rows * CELL_SIZE > b.y;
      expect(overlapX && overlapY).toBe(false);
    }
  }
});

test('le canvas contient des pixels verts (blocs visibles) après 1 s', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(1000);

  // Compter les pixels verts dans une zone restreinte autour du premier bloc
  const result = await page.evaluate(() => {
    const debug = (window as any).__debug;
    const block = debug.blocks[0];
    if (!block) return { greenPixels: 0 };
    const canvas = document.getElementById('game') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const CELL = 6;
    const x = Math.max(0, Math.floor(block.x - 10));
    const y = Math.max(0, Math.floor(block.y - 10));
    const w = block.cols * CELL + 20;
    const h = block.rows * CELL + 20;
    const data = ctx.getImageData(x, y, w, h).data;
    let greenPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 1] > 150 && data[i] < 100 && data[i + 2] < 100) {
        greenPixels++;
      }
    }
    return { greenPixels };
  });

  expect(result.greenPixels).toBeGreaterThan(0);
  expect(pageErrors).toHaveLength(0);
});
