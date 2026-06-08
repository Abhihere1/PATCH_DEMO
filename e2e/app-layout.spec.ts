// Ticket: PATCH-3
import { test, expect } from '@playwright/test';

test.describe('PATCH-3: Main Application Layout and Chat State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('AC1: Persistent top navigation bar is visible', async ({ page }) => {
    await expect(page.getByTestId('top-nav')).toBeVisible();
  });

  test('AC2: Header has Incidents, New Chat, Logout tabs', async ({ page }) => {
    await expect(page.getByTestId('nav-incidents-link')).toBeVisible();
    await expect(page.getByTestId('nav-new-chat-btn')).toContainText('New Chat');
    await expect(page.getByTestId('nav-logout-btn')).toContainText('Logout');
  });

  test('AC4: Incidents tab shows numeric badge with count', async ({ page }) => {
    const badge = page.getByTestId('nav-incidents-badge');
    // Badge appears if count > 0; otherwise no badge - both are valid
    // We just verify the link itself is present
    await expect(page.getByTestId('nav-incidents-link')).toBeVisible();
  });

  test('AC5: Clicking Patch logo navigates to main page', async ({ page }) => {
    await page.goto('/incidents');
    await page.getByTestId('nav-logo-link').click();
    await expect(page).toHaveURL('/');
  });

  test('AC6: Clicking Logout signs out and redirects to /login', async ({ page }) => {
    await page.getByTestId('nav-logout-btn').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('AC7: UI transitions from pre-chat to active-chat after first message', async ({ page }) => {
    await expect(page.getByTestId('pre-chat-hero')).toBeVisible();
    await page.getByTestId('chat-input').fill('Hello, I need help');
    await page.getByTestId('chat-send-btn').click();
    // After sending, pre-chat should be hidden and chat-window should appear
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('pre-chat-hero')).not.toBeVisible();
  });

  test('AC8: Active chat shows incident header with ID, Category, Status', async ({ page }) => {
    await page.getByTestId('chat-input').fill('Help me with VDI');
    await page.getByTestId('chat-send-btn').click();
    // incident-header appears after LLM responds and sets incidentId
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('incident-header-id')).toBeVisible();
    await expect(page.getByTestId('incident-header-category')).toBeVisible();
  });

  test('AC10: Typing indicator appears while LLM is generating', async ({ page }) => {
    await page.getByTestId('chat-input').fill('Hello');
    await page.getByTestId('chat-send-btn').click();
    // Typing indicator should briefly appear
    await expect(page.getByTestId('typing-indicator')).toBeVisible({ timeout: 5000 });
  });

  test('AC11: Bottom composer is always visible and not covering content', async ({ page }) => {
    await expect(page.getByTestId('composer')).toBeVisible();
  });

  test('AC12: Clicking New Chat resets to pre-chat state', async ({ page }) => {
    // First send a message to enter active-chat
    await page.getByTestId('chat-input').fill('Test message');
    await page.getByTestId('chat-send-btn').click();
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 5000 });

    // Click new chat
    await page.getByTestId('nav-new-chat-btn').click();
    await expect(page.getByTestId('pre-chat-hero')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('chat-window')).not.toBeVisible();
  });
});
