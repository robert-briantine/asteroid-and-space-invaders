import { test, expect } from '@playwright/test';

test('diagnostic tir Space', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(500);

  const before = await page.evaluate(() => (window as any).__debug.bullets.length);
  console.log('bullets avant tir:', before);

  await page.keyboard.down('Space');
  await page.waitForTimeout(150);
  await page.keyboard.up('Space');

  const after = await page.evaluate(() => (window as any).__debug.bullets.length);
  console.log('bullets après tir:', after);

  const keysState = await page.evaluate(() => Array.from((window as any).__debug.keys));
  console.log('keys après up:', keysState);

  // Vérifier si la touche Space est bien dans le Set pendant qu'on l'appuie
  await page.keyboard.down('Space');
  await page.waitForTimeout(100);
  const keysDuring = await page.evaluate(() => Array.from((window as any).__debug.keys));
  console.log('keys pendant Space down:', keysDuring);
  await page.keyboard.up('Space');

  expect(pageErrors).toHaveLength(0);
});
