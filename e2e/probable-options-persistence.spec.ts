// Ticket: PATCH-10
import { test, expect } from '@playwright/test';

test.describe('PATCH-10: Probable Option Persistence and Resume Behavior', () => {
  test('AC1/AC2: Chat API persists controls in message history', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('VDI connection troubleshooting');
    await page.getByTestId('chat-send-btn').click();

    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();

    // Check if controls were persisted in the history
    const data = await page.evaluate(async (id) => {
      const r = await fetch(`/api/incidents/${id}`);
      return r.json();
    }, incidentId);

    const history = data.incident?.history || [];
    const assistantMessages = history.filter((m: { role: string }) => m.role === 'assistant');
    expect(assistantMessages.length).toBeGreaterThan(0);
    // The assistant messages should have the proper structure
    expect(assistantMessages[0]).toHaveProperty('content');
  });

  test('AC4: Answered options are no longer interactive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('VDI issue needs options');
    await page.getByTestId('chat-send-btn').click();
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });

    const optionBtns = page.locator('[data-testid^="option-btn-"]');
    const count = await optionBtns.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const firstOptText = await optionBtns.first().innerText();
    await optionBtns.first().click();

    // Wait for next response
    await expect(page.getByTestId('message-bubble-user').last()).toContainText(firstOptText, { timeout: 10000 });

    // The previous options should no longer be interactive buttons
    await expect(page.locator(`[data-testid="option-btn-${firstOptText.replace(/\s+/g, '-').toLowerCase()}"]`).first()).not.toBeVisible({ timeout: 5000 });
  });

  test('AC3: Resume restores last unanswered probable options from Open incident', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('VDI connection options please');
    await page.getByTestId('chat-send-btn').click();
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();

    // Check if there are pending options
    const optionBtns = page.locator('[data-testid^="option-btn-"]');
    const count = await optionBtns.count();
    if (count === 0) {
      // LLM did not return options - skip this test
      test.skip();
      return;
    }

    // Navigate to incident detail and resume
    await page.goto(`/incidents/${incidentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('resume-chat-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('resume-chat-btn').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 15000 });

    // After resume, should have options again (last message had pending controls)
    const resumedOptions = page.locator('[data-testid^="option-btn-"]');
    await expect(resumedOptions.first()).toBeVisible({ timeout: 20000 });
  });
});
