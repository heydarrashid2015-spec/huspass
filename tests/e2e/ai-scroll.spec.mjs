import { test, expect } from '@playwright/test';

// Synthetic, browser-local session only. This test never uses a real account or live data.
test('HusPass AI opens at the top after a signed-in user scrolls down', async ({ page }) => {
  const userId = '00000000-0000-4000-8000-000000000077';
  const user = { id: userId, aud: 'authenticated', role: 'authenticated',
    email: 'scroll-test@example.invalid', app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' };
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;

  await page.route('https://kmnsxsctgpsaroipomlt.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const json = url.pathname.endsWith('/rpc/huspass_ai_access') ? true
      : url.pathname.endsWith('/auth/v1/user') ? user : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.addInitScript(({ user, expiresAt }) => {
    localStorage.setItem('sb-kmnsxsctgpsaroipomlt-auth-token', JSON.stringify({
      access_token: 'synthetic-browser-test-token',
      refresh_token: 'synthetic-browser-test-refresh',
      token_type: 'bearer', expires_in: 3600, expires_at: expiresAt, user
    }));
  }, { user, expiresAt });

  await page.goto('/');
  const aiCard = page.locator('button.sectionCard').filter({ hasText: 'HusPass AI' });
  await expect(aiCard).toBeVisible();
  await expect(aiCard).toHaveAttribute('aria-label', 'HusPass AI');

  // Force a genuinely scrolled document before the navigation event.
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'scroll-regression-spacer';
    spacer.style.height = '2200px';
    document.body.appendChild(spacer);
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

  // DOM click preserves the pre-navigation scroll position (Playwright click auto-scrolls).
  await aiCard.evaluate(button => button.click());
  await expect(page.getByRole('heading', { name: 'HusPass AI' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(2);
});
