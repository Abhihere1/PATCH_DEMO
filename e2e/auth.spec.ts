// Ticket: PATCH-1
import { test, expect } from '@playwright/test';

// Use a fresh context (no stored auth state) so we can test login/signup forms cleanly
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('PATCH-1: Authentication – Login Page', () => {
  test('AC1: /login shows split-screen layout with brand panel and form panel', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('auth-layout')).toBeVisible();
    await expect(page.getByTestId('form-panel')).toBeVisible();
  });

  test('AC2: Left panel has hero text with correct copy', async ({ page }) => {
    await page.goto('/login');
    // Brand panel is hidden on small viewports; use a large viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId('brand-hero-title')).toContainText('Discount Tire');
    await expect(page.getByTestId('brand-hero-title')).toContainText('Information Center');
    await expect(page.getByTestId('brand-hero-subtitle')).toContainText('IT support, resolved faster.');
  });

  test('AC3: Login form has Email, Password fields and Sign In button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toContainText('Sign In');
  });

  test('AC5: Invalid credentials show inline error without alert', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill('nonexistent-user@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');

    // Verify no alert dialog appears
    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });

    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10000 });
    expect(alertFired).toBe(false);
  });

  test('AC5: Empty form submission shows validation error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
  });

  test('AC6: "Sign up" link navigates to /signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('signup-link').click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('PATCH-1: Authentication – Signup Page', () => {
  test('AC7: Signup page has same split layout and Username/Email/Password fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('auth-layout')).toBeVisible();
    await expect(page.getByTestId('form-panel')).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
  });

  test('AC8: Successful signup redirects to /login with success message', async ({ page }) => {
    await page.goto('/signup');
    const uniqueEmail = `e2e-signup-${Date.now()}@patch-test.internal`;
    await page.getByTestId('username-input').fill('NewUser');
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPass123!');
    await page.getByTestId('signup-submit-btn').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.getByTestId('signup-success-msg')).toBeVisible();
  });

  test('AC9: "Sign in" link navigates to /login', async ({ page }) => {
    await page.goto('/signup');
    await page.getByTestId('signin-link').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Signup with empty fields shows error', async ({ page }) => {
    await page.goto('/signup');
    await page.getByTestId('signup-submit-btn').click();
    await expect(page.getByTestId('signup-error')).toBeVisible();
  });
});

test.describe('PATCH-1: Authentication – Valid Login', () => {
  test('AC4: Valid credentials redirect to main page', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill('playwright-e2e@patch-test.internal');
    await page.getByTestId('password-input').fill('PlaywrightTest123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });
});
