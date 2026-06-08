// Ticket: PATCH-18
import { test, expect } from '@playwright/test';

test.describe('PATCH-18: Scanner Category Tile on Main Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('AC1: Landing page shows both VDI and Scanner tiles', async ({ page }) => {
    await expect(page.getByTestId('vdi-tile')).toBeVisible();
    await expect(page.getByTestId('scanner-tile')).toBeVisible();
  });

  test('AC2: Scanner tile has icon, label, and KB status badge - same visual pattern as VDI', async ({ page }) => {
    const scannerTile = page.getByTestId('scanner-tile');
    await expect(scannerTile).toBeVisible();

    // Icon (emoji in a div)
    const icon = scannerTile.locator('div').first();
    await expect(icon).toBeVisible();

    // Label
    await expect(page.getByTestId('scanner-tile-label')).toContainText('Scanner');

    // KB status badge
    const kbBadge = page.getByTestId('scanner-kb-status');
    await expect(kbBadge).toBeVisible();
    const badgeText = await kbBadge.innerText();
    expect(['KB Available', 'KB Missing']).toContain(badgeText);
  });

  test('AC3: Scanner KB status badge shows KB Available when scanner.md exists', async ({ page, request }) => {
    // Check the KB status API to determine the expected badge value
    const res = await request.get('/api/kb/status');
    const data = await res.json() as { scannerAvailable?: boolean };

    const kbBadge = page.getByTestId('scanner-kb-status');
    const expectedText = data.scannerAvailable ? 'KB Available' : 'KB Missing';
    await expect(kbBadge).toContainText(expectedText);
  });

  test('AC4: Scanner tile has same hover CSS classes as VDI tile', async ({ page }) => {
    const scannerClasses = await page.getByTestId('scanner-tile').evaluate((el) => el.className);
    const vdiClasses = await page.getByTestId('vdi-tile').evaluate((el) => el.className);

    // Both should have hover shadow, border change, translate classes
    expect(scannerClasses).toContain('hover:shadow-md');
    expect(scannerClasses).toContain('hover:border-red-300');
    expect(scannerClasses).toContain('hover:-translate-y-1');
    // VDI tile has same classes
    expect(vdiClasses).toContain('hover:shadow-md');
    expect(vdiClasses).toContain('hover:border-red-300');
    expect(vdiClasses).toContain('hover:-translate-y-1');
  });

  test('AC5: Clicking Scanner tile triggers sendMessage and initiates a new incident', async ({ page }) => {
    await page.getByTestId('scanner-tile').click();

    // Should transition to active-chat
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 10000 });

    // Incident header should appear after LLM responds
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
  });

  test('AC5 (starter message): Scanner tile sends a Scanner-related starter message', async ({ page }) => {
    // Intercept the chat API to capture the message sent
    let capturedMessage = '';
    await page.route('/api/chat', async (route) => {
      const postData = route.request().postDataJSON() as { message?: string; category?: string };
      capturedMessage = postData?.message ?? '';
      await route.continue();
    });

    await page.getByTestId('scanner-tile').click();
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 10000 });

    expect(capturedMessage.toLowerCase()).toContain('scanner');
  });

  test('AC8: Scanner incident is tagged with Scanner category in incident header', async ({ page }) => {
    await page.getByTestId('scanner-tile').click();
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });

    const categoryEl = page.getByTestId('incident-header-category');
    await expect(categoryEl).toBeVisible();
    const categoryText = await categoryEl.innerText();
    expect(categoryText.toLowerCase()).toContain('scanner');
  });

  test('AC9: Resuming a Scanner incident restores active-chat with Scanner category context', async ({ page }) => {
    // First create a scanner incident
    await page.getByTestId('scanner-tile').click();
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });

    const incidentId = await page.getByTestId('incident-header-id').innerText();
    expect(incidentId).toBeTruthy();

    // Now simulate resume via sessionStorage
    await page.evaluate((id) => {
      sessionStorage.setItem('resume_incident_id', id);
    }, incidentId);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should enter active-chat
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });

    // Category should be scanner
    const categoryEl = page.getByTestId('incident-header-category');
    const categoryText = await categoryEl.innerText();
    expect(categoryText.toLowerCase()).toContain('scanner');
  });

  test('AC10: Clicking New Chat resets UI and shows both VDI and Scanner tiles', async ({ page }) => {
    // Enter active-chat via Scanner tile
    await page.getByTestId('scanner-tile').click();
    await expect(page.getByTestId('chat-window')).toBeVisible({ timeout: 10000 });

    // Click New Chat
    await page.getByTestId('nav-new-chat-btn').click();

    // Should return to pre-chat hero
    await expect(page.getByTestId('pre-chat-hero')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('vdi-tile')).toBeVisible();
    await expect(page.getByTestId('scanner-tile')).toBeVisible();
    await expect(page.getByTestId('chat-window')).not.toBeVisible();
  });

  test('AC1/Layout: Landing page hierarchy is intact - Patch mark, welcome text, tiles, composer all visible', async ({ page }) => {
    await expect(page.getByTestId('pre-chat-hero')).toBeVisible();
    await expect(page.getByTestId('hero-heading')).toBeVisible();
    await expect(page.getByTestId('category-tiles')).toBeVisible();
    await expect(page.getByTestId('vdi-tile')).toBeVisible();
    await expect(page.getByTestId('scanner-tile')).toBeVisible();
    await expect(page.getByTestId('composer')).toBeVisible();
  });
});
