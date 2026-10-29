import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['packages/**/*.e2e.ts', 'apps/**/*.e2e.ts'],
  // CDN-backed specs (C22) run only from the cdn-check workflow under LINE_E2E_CDN; the visual project sets its own.
  testIgnore: process.env.LINE_E2E_CDN ? [] : ['**/*cdn.e2e.ts'],
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
    {
      // Serves the C1 fixture pages for the keyboard, form and htmx tiers; those tests set this baseURL themselves.
      command: 'vite packages/line-components/__tests__/integration --host 127.0.0.1 --port 4321 --strictPort',
      url: 'http://127.0.0.1:4321/button/',
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // Visual tier: Chromium only (SD98); off-pair files run only under LINE_VISUAL_OFF_PAIRS (AM-033).
    {
      name: 'visual',
      testMatch: 'packages/line-components/__tests__/visual/*.visual.ts',
      testIgnore: process.env.LINE_VISUAL_OFF_PAIRS ? [] : '**/*.off-pairs.visual.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [['html', { open: 'never' }], ['github']],
});
