import { test, expect } from '@playwright/test';

// Browser-level regression for the shared web UI. This cannot emulate a real
// OnePlus keyboard's language-switch button; physical-device validation remains necessary.
test('typing and keyboard language shortcut preserve the same focused field', async ({ page }) => {
  await page.goto('/');
  const email = page.locator('input[type="email"]').first();
  await expect(email).toBeVisible();
  await email.focus();
  await email.fill('test@example.com');
  await page.evaluate(() => { window.__huspassFocusedInput = document.activeElement; });
  await page.keyboard.press('Control+Shift');
  await page.keyboard.type('a');
  await expect(email).toBeFocused();
  await expect(email).toHaveValue('test@example.coma');
  expect(await page.evaluate(() => window.__huspassFocusedInput === document.activeElement)).toBe(true);
});

test('IME composition does not remount the focused field', async ({ page }) => {
  await page.goto('/');
  const email = page.locator('input[type="email"]').first();
  await email.focus();
  await page.evaluate(() => {
    window.__huspassFocusedInput = document.activeElement;
    const el = document.activeElement;
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    el.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: 'ع' }));
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ع' }));
  });
  await expect(email).toBeFocused();
  expect(await page.evaluate(() => window.__huspassFocusedInput === document.activeElement)).toBe(true);
});
