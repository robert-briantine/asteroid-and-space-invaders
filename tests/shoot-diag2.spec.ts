import { test, expect } from '@playwright/test';

test('diagnostic 2 : focus et écouteurs', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  // Vérifier qui a le focus
  const activeEl = await page.evaluate(() => document.activeElement?.tagName + '#' + (document.activeElement as any)?.id);
  console.log('élément actif:', activeEl);

  // Tester si keydown se déclenche sur window avec une autre touche
  const arrowTest = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let fired = false;
      const handler = () => { fired = true; };
      window.addEventListener('keydown', handler, { once: true });
      // Simuler un keydown natif
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      setTimeout(() => {
        window.removeEventListener('keydown', handler);
        resolve(fired);
      }, 50);
    });
  });
  console.log('dispatch synthétique ArrowLeft capturé:', arrowTest);

  // Tester avec Playwright keyboard.down sur ArrowLeft
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(100);
  const keysAfterArrow = await page.evaluate(() => Array.from((window as any).__debug.keys));
  console.log('keys après ArrowLeft down:', keysAfterArrow);
  await page.keyboard.up('ArrowLeft');

  // Vérifier si l'écouteur est bien attaché en comptant les listeners
  const listenerInfo = await page.evaluate(() => {
    // On ne peut pas compter directement, mais on peut tester via getEventListeners (dispo dans le devtools uniquement)
    // Alternative : vérifier que __debug.keys existe et est un Set
    const d = (window as any).__debug;
    return { hasKeys: !!d.keys, isSet: d.keys instanceof Set };
  });
  console.log('info __debug.keys:', listenerInfo);
});
