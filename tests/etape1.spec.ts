import { test, expect } from '@playwright/test';

test('GET /healthz renvoie 200 et { ok: true }', async ({ request }) => {
  const res = await request.get('/healthz');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ ok: true });
});

test('la page / charge sans erreur console ni exception page-level', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForTimeout(500);

  expect(pageErrors).toHaveLength(0);
  expect(consoleErrors).toHaveLength(0);
});

test('un canvas #game est visible sur la page', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#game');
  await expect(canvas).toBeVisible();
});
