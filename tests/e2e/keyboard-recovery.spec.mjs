import { test, expect } from '@playwright/test';

test('recovery control does not appear during ordinary input', async ({ page }) => {
  await page.goto('/');
  const email = page.locator('input[type="email"]').first();
  await email.focus();
  await email.fill('test@example.com');
  await expect(page.getByRole('button', { name: 'Vis tastatur igen' })).toHaveCount(0);
  await expect(email).toBeFocused();
});

// Physical Android IME long-press behavior cannot be simulated by Playwright.
// On OnePlus 13: focus input, long-press space to switch language; if the
// keyboard disappears with focus retained, tap "Vis tastatur igen".
