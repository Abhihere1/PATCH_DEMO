import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 120000,
  expect: { timeout: 30000 },
  retries: 1,
  use: {
    baseURL: 'https://patch-demo-three.vercel.app',
    headless: true,
    storageState: 'e2e/auth-state.json',
  },
});
