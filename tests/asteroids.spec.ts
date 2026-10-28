import { test, expect } from '@playwright/test';

test('astéroïdes : apparition forcée et reset', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);

  // Forcer l'apparition d'un astéroïde très grand (n = 4 divisions restantes) via le hook debug
  await page.evaluate(() => (window as any).__debug.spawnAsteroidForTest());

  const asteroids = await page.evaluate(() => (window as any).__debug.asteroids);
  expect(asteroids.length).toBeGreaterThan(0);

  // Chaque astéroïde a les bonnes propriétés
  for (const a of asteroids) {
    expect(a.r).toBeGreaterThan(0);
    expect([1, 2, 3, 4]).toContain(a.n); // n divisions restantes avant explosion
    expect([0, 1, 2, 3]).toContain(a.sizeIndex); // 4 tailles : très grand → petit
    expect(typeof a.x).toBe('number');
    expect(typeof a.y).toBe('number');
  }

  // Le reset vide les astéroïdes et en fait apparaître le nombre correspondant au niveau 1
  await page.evaluate(() => (window as any).__debug.reset());
  const afterReset = await page.evaluate(() => (window as any).__debug.asteroids);
  // Au niveau 1, asteroidCountForLevel(1) = min(2 + 1, 10) = 3 astéroïdes
  expect(afterReset.length).toBe(3);
  // Tous les astéroïdes du niveau 1 ont n = 4 (très grands)
  for (const a of afterReset) {
    expect(a.n).toBe(4);
  }
});

test('astéroïdes : division quand une balle touche un grand astéroïde', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__debug !== undefined);

  // Forcer l'apparition d'un astéroïde très grand (n = 4) au centre de l'écran
  await page.evaluate(() => {
    const d = (window as any).__debug;
    const canvas = document.getElementById('game') as HTMLCanvasElement;
    d.spawnAsteroidForTest(4, canvas.width / 2, canvas.height / 2);
  });

  // Récupérer la position du grand astéroïde
  const target = await page.evaluate(() => {
    const d = (window as any).__debug;
    const big = d.asteroids.find((a: any) => a.n === 4);
    return big ? { x: big.x, y: big.y, r: big.r, n: big.n } : null;
  });
  expect(target).not.toBeNull();
  expect(target!.n).toBe(4);

  // Compter les astéroïdes avant le tir
  const countBefore = await page.evaluate(() => (window as any).__debug.asteroids.length);
  expect(countBefore).toBe(1); // un seul astéroïde (le très grand qu'on vient de créer)

  // Tirer directement sur l'astéroïde en utilisant le hook debug
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.shootAtAsteroid(0);
  });

  // Attendre un moment pour laisser la balle atteindre l'astéroïde
  await page.waitForTimeout(500);

  // Vérifier que le très grand a disparu et s'est divisé en deux fragments n = 3
  const afterShot = await page.evaluate(() => (window as any).__debug.asteroids);
  const stillBig = afterShot.find((a: any) => a.n === 4);
  expect(stillBig).toBeUndefined(); // le très grand a disparu
  const mediumCount = afterShot.filter((a: any) => a.n === 3).length;
  expect(mediumCount).toBeGreaterThanOrEqual(2); // au moins 2 nouveaux fragments n = 3
});
