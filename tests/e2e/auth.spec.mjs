import { test, expect } from '@playwright/test';

// Uses invalid local-only inputs; never creates accounts or submits credentials to Supabase.
test('login rejects passwords shorter than eight characters without a network request', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Log ind' }).first()).toBeVisible();
  await page.locator('input[type="email"]').fill('example@example.invalid');
  await page.locator('input[type="password"]').fill('abc');
  await page.locator('form').filter({ has: page.locator('input[type="email"]') }).getByRole('button', { name: 'Log ind' }).click();
  await expect(page.getByText('Adgangskoden skal være mindst 8 tegn.')).toBeVisible();
});

test('registration requires a letter and a number', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Opret konto' }).first().click();
  await page.locator('input[type="email"]').fill('example@example.invalid');
  await page.locator('input[type="password"]').fill('12345678');
  await page.locator('form').filter({ has: page.locator('input[type="email"]') }).getByRole('button', { name: 'Opret konto' }).click();
  await expect(page.getByText('Adgangskoden skal indeholde mindst ét bogstav.')).toBeVisible();
  await page.locator('input[type="password"]').fill('abcdefgh');
  await page.locator('form').filter({ has: page.locator('input[type="email"]') }).getByRole('button', { name: 'Opret konto' }).click();
  await expect(page.getByText('Adgangskoden skal indeholde mindst ét tal.')).toBeVisible();
});
