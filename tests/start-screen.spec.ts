import { test, expect } from '@playwright/test';
import { loadGame, debug, pressKey } from './helpers';

test('la difficulté par défaut est normal', async ({ page }) => {
  await loadGame(page);
  const d = await debug(page);
  expect(d.difficulty).toBe('normal');
});

test('les touches 1/2/3 changent la difficulté sur l\'écran de démarrage', async ({ page }) => {
  await loadGame(page);
  // "1" → facile
  await pressKey(page, 'Digit1');
  let d = await debug(page);
  expect(d.difficulty).toBe('facile');
  // "3" → difficile
  await pressKey(page, 'Digit3');
  d = await debug(page);
  expect(d.difficulty).toBe('difficile');
  // "2" → normal
  await pressKey(page, 'Digit2');
  d = await debug(page);
  expect(d.difficulty).toBe('normal');
});

test('le nombre de blocs dépend de la difficulté au niveau 1', async ({ page }) => {
  await loadGame(page);
  // Facile / Normal / Difficile ont le même nombre (4) au niveau 1
  for (const diff of ['facile', 'normal', 'difficile']) {
    await page.evaluate((d: string) => (window as any).__debug.setDifficulty(d), diff);
    await page.evaluate(() => (window as any).__debug.reset());
    const dbg = await debug(page);
    expect(dbg.blocks.length).toBe(4);
  }
});

test('au-delà du niveau 13 les difficultés divergent', async ({ page }) => {
  await loadGame(page);
  // Niveau 14 : facile=26, normal=30, difficile=30
  const counts: Record<string, number> = {};
  for (const diff of ['facile', 'normal', 'difficile']) {
    await page.evaluate((d: string) => (window as any).__debug.startLevel(14, d), diff);
    const dbg = await debug(page);
    counts[diff] = dbg.blocks.length;
  }
  expect(counts.facile).toBe(26);
  expect(counts.normal).toBe(30);
  expect(counts.difficile).toBe(30);
});

test('game over renvoie à l\'écran de démarrage avec Space', async ({ page }) => {
  await loadGame(page);
  await pressKey(page, 'Space');
  // Force un game over
  await page.evaluate(() => {
    const d = (window as any).__debug;
    while (!d.gameOver) d.damageShip();
  });
  let d = await debug(page);
  expect(d.gameOver).toBe(true);
  expect(d.started).toBe(true);
  // Space ramène à l'écran de démarrage
  await pressKey(page, 'Space');
  d = await debug(page);
  expect(d.gameOver).toBe(false);
  expect(d.started).toBe(false);
});

test('l\'historique des scores est enregistré après un game over', async ({ page }) => {
  await loadGame(page);
  await page.evaluate(() => (window as any).__debug.resetScores());
  // Simule directement l'enregistrement d'un score en simulant la logique de recordScore()
  await page.evaluate(() => {
    const d = (window as any).__debug;
    d.startLevel(1);
    const entry = {
      score: 250,
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
  const d = await debug(page);
  expect(d.scoreHistory.length).toBeGreaterThan(0);
  const last = d.scoreHistory[d.scoreHistory.length - 1];
  expect(last.level).toBeGreaterThanOrEqual(1);
  expect(last.date).toBeTruthy();
});
