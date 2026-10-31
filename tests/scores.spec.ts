import { test, expect } from '@playwright/test';
import { loadGame, debug, pressKey } from './helpers';

test('le score augmente quand on détruit des cellules', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.startLevel(1));
  const before = await debug(page).then((d) => d.score);
  // Place un bloc à droite du vaisseau et tire vers lui (angle par défaut = -π/2 → nord,
  // donc on tourne l'angle à 0 pour tirer vers l'est)
  await page.evaluate(() => {
    const d = (window as any).__debug;
    if (d.blocks.length === 0) return;
    d.setShipPos(100, 300);
    d.setBlockPos(0, 400, 297);
    // Force l'angle du vaisseau à 0 (est) pour que la balle parte horizontalement
    (window as any).__debug.ship.angle = 0;
    d.fireBullet();
  });
  // La balle parcourt 300 px à 1500 px/s → ~200 ms
  await page.waitForTimeout(300);
  const after = await debug(page).then((d) => d.score);
  expect(after).toBeGreaterThan(before);
});

test('le meilleur score est mis à jour si le score dépasse bestScore', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.resetScores());
  let d = await debug(page);
  expect(d.bestScore).toBe(0);
  // Démarre la partie puis gagne des points en détruisant une cellule
  await pressKey(page, 'Space');
  await page.evaluate(() => {
    const d = (window as any).__debug;
    if (d.blocks.length === 0) return;
    d.setShipPos(100, 300);
    d.setBlockPos(0, 400, 297);
    (window as any).__debug.ship.angle = 0;
    d.fireBullet();
  });
  await page.waitForTimeout(300);
  // Game over → recordScore() met à jour bestScore
  await page.evaluate(() => {
    const d = (window as any).__debug;
    while (!d.gameOver) d.damageShip();
  });
  d = await debug(page);
  expect(d.bestScore).toBeGreaterThan(0);
});

test('resetScores vide l\'historique et le meilleur score', async ({ page }) => {
  await loadGame(page);
  // Ajoute directement une entrée dans l'historique en simulant la logique de recordScore()
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.startLevel(1);
    // Simule ce que fait recordScore : push + filtrage des 5 meilleurs par difficulté
    const entry = {
      score: 125,
      level: d.level,
      difficulty: d.difficulty,
      date: new Date().toISOString(),
    };
    d.scoreHistory.push(entry);
    for (const diff of ['facile', 'normal', 'difficile']) {
      const entries = d.scoreHistory.filter((s: any) => s.difficulty === diff).sort((a: any, b: any) => b.score - a.score);
      const keep = new Set(entries.slice(0, 5));
      d.scoreHistory = d.scoreHistory.filter((s: any) => keep.has(s));
    }
  });
  let d = await debug(page);
  expect(d.scoreHistory.length).toBeGreaterThan(0);
  // Réinitialise
  await page.evaluate(() => (window as any).__debug.resetScores());
  d = await debug(page);
  expect(d.bestScore).toBe(0);
  expect(d.scoreHistory.length).toBe(0);
});

test('l\'historique garde au max 5 scores par difficulté', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.resetScores());
  // Simule 7 parties terminées en normal
  for (let i = 0; i < 7; i++) {
    await page.evaluate(() => {
      const d = (window as any).__debug;
      d.startLevel(1, 'normal');
      d.recordScore();
    });
  }
  const d = await debug(page);
  const normals = d.scoreHistory.filter((s: any) => s.difficulty === 'normal');
  expect(normals.length).toBeLessThanOrEqual(5);
});
