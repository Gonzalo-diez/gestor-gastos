import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'test',
  testMatch: ['**/*.e2e.(ts|tsx|js)'],   // solo E2E
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  // Dev server para no exigir build
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  globalSetup: './playwright.global-setup.ts',
  projects: [
    { name: 'chromium', use: { storageState: 'storageState.auth.json' } },
  ],
});
