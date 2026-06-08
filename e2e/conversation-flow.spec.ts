// Ticket: PATCH-8
import { test, expect } from '@playwright/test';

test.describe('PATCH-8: Core Conversation Flow', () => {
  test('AC1: Incident record created only when first message is sent', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // No incident header before sending
    await expect(page.getByTestId('incident-header')).not.toBeVisible();

    await page.getByTestId('chat-input').fill('I need help with my VDI');
    await page.getByTestId('chat-send-btn').click();

    // After sending, incident header appears
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();
    expect(incidentId).toBeTruthy();
    expect(incidentId).toMatch(/INC-/);
  });

  test('AC2: LLM generates a response based on KB and history', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('What is VDI?');
    await page.getByTestId('chat-send-btn').click();

    // Wait for assistant response
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    const responseText = await page.getByTestId('message-bubble-assistant').first().innerText();
    expect(responseText.trim().length).toBeGreaterThan(0);
  });

  test('AC6: LLM response is rendered as formatted Markdown', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('Help me with VDI connectivity issue');
    await page.getByTestId('chat-send-btn').click();

    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    // The response is rendered in a prose div
    const proseDivCount = await page.locator('[data-testid="message-bubble-assistant"] .prose').count();
    expect(proseDivCount).toBeGreaterThan(0);
  });

  test('AC10: VDI tile click triggers sendMessage and switches to active-chat', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('pre-chat-hero')).toBeVisible();

    await page.getByTestId('vdi-tile').click();
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 10000 });
    // User message should be sent automatically
    await expect(page.getByTestId('message-bubble-user')).toBeVisible({ timeout: 10000 });
  });

  test('AC7/AC8: User message and assistant response are both in MongoDB (incident history)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('VDI screen is black');
    await page.getByTestId('chat-send-btn').click();

    // Wait for LLM response first (incident-header appears after API returns incidentId)
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();

    // Fetch the incident from API to verify persistence
    const data = await page.evaluate(async (id) => {
      const r = await fetch(`/api/incidents/${id}`);
      return r.json();
    }, incidentId);

    expect(data.incident).toBeTruthy();
    expect(Array.isArray(data.incident.history)).toBe(true);
    expect(data.incident.history.length).toBeGreaterThan(0);
  });
});
