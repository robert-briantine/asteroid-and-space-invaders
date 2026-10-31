import { test, expect } from '@playwright/test';
import { loadGame, debug, pressKey } from './helpers';

test('la page se charge sans erreur JS', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await loadGame(page);
  expect(pageErrors).toEqual([]);
});

test('l\'écran de démarrage est affiché au chargement', async ({ page }) => {
  await loadGame(page);
  const d = await debug(page);
  expect(d.started).toBe(false);
  expect(d.gameOver).toBe(false);
  expect(d.level).toBe(1);
  expect(d.lives).toBe(3);
});

test('Space démarre la partie depuis l\'écran de démarrage', async ({ page }) => {
  await loadGame(page);
  await pressKey(page, 'Space');
  const d = await debug(page);
  expect(d.started).toBe(true);
  expect(d.blocks.length).toBeGreaterThan(0);
  expect(d.asteroids.length).toBeGreaterThan(0);
});

test('le vaisseau tourne avec les flèches gauche/droite', async ({ page }) => {
  await loadGame(page);
  await pressKey(page, 'Space');
  const d0 = await debug(page);
  const angleBefore = d0.ship.angle;
  // Appuie sur ArrowLeft pendant 200 ms → l'angle diminue
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft');
  const d1 = await debug(page);
  expect(d1.ship.angle).toBeLessThan(angleBefore);
});

test('le vaisseau accélère avec la flèche haut', async ({ page }) => {
  await loadGame(page);
  await pressKey(page, 'Space');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowUp');
  const d = await debug(page);
  expect(d.ship.speed).toBeGreaterThan(0);
});
