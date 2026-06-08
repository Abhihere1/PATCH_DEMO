// Ticket: PATCH-4
import { test, expect } from '@playwright/test';

test.describe('PATCH-4: Knowledge Base Management and Retrieval', () => {
  test('AC3: /api/kb/status reports VDI availability correctly', async ({ request }) => {
    const res = await request.get('/api/kb/status');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.vdiAvailable).toBe('boolean');
  });

  test('AC3: VDI KB status badge reflects API response', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const apiRes = await page.evaluate(async () => {
      const r = await fetch('/api/kb/status');
      return r.json();
    });

    const badgeText = await page.getByTestId('vdi-kb-status').innerText();

    if (apiRes.vdiAvailable) {
      expect(badgeText).toBe('KB Available');
    } else {
      expect(badgeText).toBe('KB Missing');
    }
  });

  test('AC1: KB status endpoint is accessible and returns expected shape', async ({ request }) => {
    const res = await request.get('/api/kb/status');
    const body = await res.json();
    expect(body).toHaveProperty('vdiAvailable');
  });
});
