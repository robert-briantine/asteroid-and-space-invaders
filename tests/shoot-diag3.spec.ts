import { test, expect } from '@playwright/test';

test('diagnostic 3 : logging keydown Space', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  // Ajouter un écouteur de debug directement dans la page
  await page.evaluate(() => {
    (window as any).__keyLog = [];
    document.addEventListener('keydown', (e) => {
      (window as any).__keyLog.push(`down:${e.key}:${e.code}`);
    });
    document.addEventListener('keyup', (e) => {
      (window as any).__keyLog.push(`up:${e.key}:${e.code}`);
    });
  });

  // Appuyer sur Space via Playwright
  await page.keyboard.down('Space');
  await page.waitForTimeout(150);
  await page.keyboard.up('Space');
  await page.waitForTimeout(100);

  const keyLog = await page.evaluate(() => (window as any).__keyLog);
  console.log('keyLog Space:', JSON.stringify(keyLog));

  // Vérifier aussi les flèches pour comparaison
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(100);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(100);

  const keyLog2 = await page.evaluate(() => (window as any).__keyLog);
  console.log('keyLog après ArrowLeft:', JSON.stringify(keyLog2));

  expect(true).toBe(true);
});
