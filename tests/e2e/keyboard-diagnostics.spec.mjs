import { test, expect } from '@playwright/test';

test('keyboard diagnostics are disabled by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Keyboard diagnostics')).toHaveCount(0);
});

test('opt-in keyboard diagnostics report focus without recording input text', async ({ page }) => {
  await page.goto('/?keyboardDebug=1');
  const diagnostics = page.getByLabel('Keyboard diagnostics');
  await expect(diagnostics).toBeVisible();
  const email = page.locator('input[type="email"]').first();
  await email.focus();
  await email.fill('private-value@example.invalid');
  await expect(diagnostics).toContainText('focusin');
  await expect(diagnostics).not.toContainText('private-value');
  await expect(diagnostics).not.toContainText('example.invalid');
});
