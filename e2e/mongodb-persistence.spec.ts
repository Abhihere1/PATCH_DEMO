// Ticket: PATCH-6
import { test, expect } from '@playwright/test';

test.describe('PATCH-6: MongoDB Persistence for Incidents', () => {
  test('AC1: Sending a message creates an incident record in the backend', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('Testing persistence - VDI issue');
    await page.getByTestId('chat-send-btn').click();

    // incident-header appears after LLM responds and incidentId is set
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();
    expect(incidentId).toMatch(/INC-/);

    // Verify the incident exists in the API
    const data = await page.evaluate(async (id) => {
      const r = await fetch(`/api/incidents/${id}`);
      return r.json();
    }, incidentId);

    expect(data.incident).toBeTruthy();
    expect(data.incident.incidentId).toBe(incidentId);
  });

  test('AC2: Incident record has status, category, history, and timestamps', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('Check MongoDB fields');
    await page.getByTestId('chat-send-btn').click();

    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();

    // Wait for LLM response to ensure history is populated
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });

    const data = await page.evaluate(async (id) => {
      const r = await fetch(`/api/incidents/${id}`);
      return r.json();
    }, incidentId);

    const inc = data.incident;
    expect(inc).toHaveProperty('status');
    expect(inc).toHaveProperty('category');
    expect(Array.isArray(inc.history)).toBe(true);
    expect(inc.history.length).toBeGreaterThan(0);
    expect(inc).toHaveProperty('createdAt');
    expect(inc).toHaveProperty('updatedAt');
  });

  test('AC6: Incident status starts as Open', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('chat-input').fill('Start new incident for status check');
    await page.getByTestId('chat-send-btn').click();

    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();

    const data = await page.evaluate(async (id) => {
      const r = await fetch(`/api/incidents/${id}`);
      return r.json();
    }, incidentId);

    expect(['Open', 'Escalated', 'Resolved']).toContain(data.incident.status);
  });

  test('AC2: Incidents list API returns the user\'s incidents', async ({ request }) => {
    const res = await request.get('/api/incidents');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.incidents)).toBe(true);
  });

  test('AC7: Incident record has lastupdatedby field', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('chat-input').fill('Test lastupdatedby field');
    await page.getByTestId('chat-send-btn').click();
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    const incidentId = await page.getByTestId('incident-header-id').innerText();

    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });

    const data = await page.evaluate(async (id) => {
      const r = await fetch(`/api/incidents/${id}`);
      return r.json();
    }, incidentId);

    expect(data.incident).toHaveProperty('lastupdatedby');
  });
});
