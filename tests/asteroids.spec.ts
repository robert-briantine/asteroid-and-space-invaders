import { test, expect } from '@playwright/test';
import { loadGame, debug } from './helpers';

test('un astéroïde de niveau 1 se divise en deux plus petits', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  // Ajoute un astéroïde n=2 (moyen) à une position fixe
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.spawnAsteroidForTest(2, 400, 300);
  });
  const before = await debug(page).then((d) => d.asteroids.length);
  // Tire dessus
  await page.evaluate(() => {
    const d = (window as any).__debug;
    // L'astéroïde ajouté est le dernier du tableau
    d.shootAtAsteroid(d.asteroids.length - 1);
  });
  // Attendre que la balle arrive (~200 ms)
  await page.waitForTimeout(300);
  const after = await debug(page).then((d) => d.asteroids);
  // L'astéroïde n=2 se divise en deux n=1 → +1 au total
  expect(after.length).toBe(before + 1);
  // Les deux fragments ont n=1
  const smalls = after.filter((a: any) => a.n === 1);
  expect(smalls.length).toBeGreaterThanOrEqual(2);
});

test('un astéroïde de niveau 1 explose sans se diviser', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.spawnAsteroidForTest(1, 500, 400);
  });
  const before = await debug(page).then((d) => d.asteroids.length);
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.shootAtAsteroid(d.asteroids.length - 1);
  });
  await page.waitForTimeout(300);
  const after = await debug(page).then((d) => d.asteroids.length);
  // n=1 explose → il disparaît (pas de division)
  expect(after).toBeLessThan(before);
});

test('les astéroïdes rebondissent sur les bords du canvas', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  // Laisse tourner 800 ms pour que les astéroïdes bougent
  await page.waitForTimeout(800);
  const d = await debug(page);
  for (const a of d.asteroids) {
    expect(a.x).toBeGreaterThan(-a.r);
    expect(a.y).toBeGreaterThan(-a.r);
  }
});

test('le score augmente quand on détruit un astéroïde', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  const before = await debug(page).then((d) => d.score);
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.spawnAsteroidForTest(1, 600, 500);
    d.shootAtAsteroid(d.asteroids.length - 1);
  });
  await page.waitForTimeout(400);
  const after = await debug(page).then((d) => d.score);
  expect(after).toBeGreaterThan(before);
});
