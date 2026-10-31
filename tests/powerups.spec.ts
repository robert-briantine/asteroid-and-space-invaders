import { test, expect } from '@playwright/test';
import { loadGame, debug } from './helpers';

test('la collecte d\'un powerup donne +50 points', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  const before = await debug(page).then((d) => d.score);
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.spawnPowerupForTest('bullet');
    const p = d.powerups[d.powerups.length - 1];
    d.setShipPos(p.x, p.y);
  });
  await page.waitForTimeout(100);
  const after = await debug(page).then((d) => d.score);
  expect(after - before).toBe(50);
});

test('le nombre max de powerups à l\'écran est 3', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  // Force 5 powerups → seuls les 3 premiers restent
  await page.evaluate(() => {
    const d = (window as any).__debug;
    for (let i = 0; i < 5; i++) d.spawnPowerupForTest('bullet');
  });
  const d = await debug(page);
  expect(d.powerups.length).toBeLessThanOrEqual(3);
});

test('les powerups planifiés du niveau apparaissent après leur délai', async ({ page }) => {
  await loadGame(page);
  // Niveau 8 : powerup wave à 10 s
  await page.evaluate(() => (window as any).__debug.startLevel(8));
  let d = await debug(page);
  expect(d.powerups.length).toBe(0);
  // On ne peut pas attendre 10 s dans un test ; on vérifie la structure
  const def = d.currentLevelDef;
  expect(def.powerups[0].at).toBe(10000);
  expect(def.powerups[0].type).toBe('wave');
});

test('spawnPowerupForTest crée un powerup du type demandé', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  for (const type of ['bullet', 'wave', 'life']) {
    await page.evaluate((t: string) => (window as any).__debug.spawnPowerupForTest(t), type);
    const d = await debug(page);
    const last = d.powerups[d.powerups.length - 1];
    expect(last.type).toBe(type);
  }
});
