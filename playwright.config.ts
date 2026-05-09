import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1, // serial execution — tests share john.doe's cart and DB state
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Full regression suite — no grep filter, runs all 56 tests
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      // Smoke suite — only @smoke-tagged tests; used in CI on every PR
      // Run locally: pnpm e2e:smoke
      name: 'smoke',
      grep: /@smoke/,
      use: { browserName: 'chromium' },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
});
