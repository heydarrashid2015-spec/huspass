import { test, expect } from '@playwright/test';

test('pure HTML IME isolation has no app scripts or styles', async ({ page }) => {
  await page.goto('/keyboard-isolation.html');
  await expect(page.getByLabel('Plain input')).toBeVisible();
  await expect(page.locator('script, style, link[rel="stylesheet"]')).toHaveCount(0);
  await page.getByLabel('Plain input').fill('test');
  await expect(page.getByLabel('Plain input')).toHaveValue('test');
  await expect(page.getByRole('button', { name: 'Vis tastatur igen' })).toHaveCount(0);
});
