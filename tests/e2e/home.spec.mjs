import { test, expect } from '@playwright/test';

test('homepage renders without blank screen or fatal JavaScript errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).toBeVisible();
  await expect.poll(async () => (await page.locator('body').innerText()).trim().length, { timeout: 15000 }).toBeGreaterThan(30);
  expect(errors).toEqual([]);
});

test('narrow mobile viewport has no horizontal document overflow', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(1000);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
