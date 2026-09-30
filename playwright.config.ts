import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './packages',
  testMatch: '**/*.e2e.ts',
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  reporter: [['html', { open: 'never' }], ['github']],
});
