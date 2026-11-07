import { test, expect } from '@playwright/test';

test('isolated IME page uses plain native inputs and does not load recovery button', async ({ page }) => {
  await page.goto('/keyboard-test');
  const input = page.getByLabel('Plain text input');
  await expect(input).toBeVisible();
  await input.focus();
  await page.keyboard.type('English test');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('English test');
  await expect(page.getByRole('button', { name: 'Vis tastatur igen' })).toHaveCount(0);
  await expect(page.getByLabel('IME event log')).toContainText('focusin');
  await expect(page.getByLabel('IME event log')).not.toContainText('English test');
});
