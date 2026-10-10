import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['packages/**/*.e2e.ts', 'apps/**/*.e2e.ts'],
  // A testDir turns off the .gitignore default; keep it so temp/, dist and storybook-static are never walked.
  respectGitIgnore: true,
  use: { baseURL: 'http://127.0.0.1:4319', trace: 'on-first-retry' },
  webServer: [
    {
      command: 'vite packages/line-core/__tests__/integration --host 127.0.0.1 --port 4319 --strictPort',
      url: 'http://127.0.0.1:4319/hello-world/',
      reuseExistingServer: !process.env.CI,
    },
    {
      // Serves the storybook-static that `bun run build` produces; the smoke tier sets this baseURL itself.
      command: 'vite preview apps/storybook --outDir storybook-static --host 127.0.0.1 --port 4320 --strictPort',
      url: 'http://127.0.0.1:4320/iframe.html',
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  reporter: [['html', { open: 'never' }], ['github']],
});
