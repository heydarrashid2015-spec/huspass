import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-browser-emulation', use: { ...devices['Pixel 7'] , browserName: 'chromium' } }
  ],
  webServer: { command: 'npm run start -- -H 127.0.0.1', url: 'http://127.0.0.1:3000', timeout: 120000, reuseExistingServer: !process.env.CI },
  reporter: [['list'], ['html', { open: 'never' }]]
});
