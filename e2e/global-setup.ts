import { chromium, request as playwrightRequest } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export const TEST_USER = {
  email: 'playwright-e2e@patch-test.internal',
  password: 'PlaywrightTest123!',
  username: 'PlaywrightTester',
};

export const AUTH_STATE_PATH = path.join(__dirname, 'auth-state.json');

async function globalSetup() {
  const BASE_URL = 'https://patch-demo-three.vercel.app';

  // Try to create the user; ignore 409 (already exists)
  const apiCtx = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const signupRes = await apiCtx.post('/api/auth/signup', {
    data: TEST_USER,
  });
  if (!signupRes.ok()) {
    const body = await signupRes.json();
    // 409 = already exists, that is fine
    if (signupRes.status() !== 409) {
      console.warn('[global-setup] signup returned', signupRes.status(), body);
    }
  }
  await apiCtx.dispose();

  // Login via browser to capture cookie-based session
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto('/login');
  await page.getByTestId('email-input').fill(TEST_USER.email);
  await page.getByTestId('password-input').fill(TEST_USER.password);
  await page.getByTestId('login-submit-btn').click();
  await page.waitForURL('/', { timeout: 15000 });

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}

export default globalSetup;
