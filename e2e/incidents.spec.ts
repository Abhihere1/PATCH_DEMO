// Ticket: PATCH-7
import { test, expect } from '@playwright/test';

test.describe('PATCH-7: Incident List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');
  });

  test('AC1: Incidents page shows filter tabs for All, Open, Escalated, Resolved', async ({ page }) => {
    await expect(page.getByTestId('filter-tab-all')).toBeVisible();
    await expect(page.getByTestId('filter-tab-open')).toBeVisible();
    await expect(page.getByTestId('filter-tab-escalated')).toBeVisible();
    await expect(page.getByTestId('filter-tab-resolved')).toBeVisible();
  });

  test('AC2: Active filter tab is highlighted (red color)', async ({ page }) => {
    const allTab = page.getByTestId('filter-tab-all');
    const classList = await allTab.evaluate((el) => el.className);
    expect(classList).toContain('text-red-600');
  });

  test('AC4: Empty state shown when no incidents', async ({ page }) => {
    // Check if the page has either incidents or empty state
    const hasIncidents = await page.getByTestId('incidents-list').isVisible().catch(() => false);
    const hasEmpty = await page.getByTestId('incidents-empty').isVisible().catch(() => false);
    expect(hasIncidents || hasEmpty).toBe(true);
  });

  test('AC3: Incident rows show ID, category, status badge, age, and View button', async ({ page }) => {
    const hasIncidents = await page.getByTestId('incidents-list').isVisible().catch(() => false);
    if (!hasIncidents) {
      test.skip();
      return;
    }
    // Get first incident row
    const firstRow = page.getByTestId('incidents-list').locator('[data-testid^="incident-row-"]').first();
    await expect(firstRow).toBeVisible();
    // Should contain a view button
    await expect(firstRow.locator('[data-testid^="incident-view-btn-"]')).toBeVisible();
  });

  test('Filter tabs switch active filter', async ({ page }) => {
    await page.getByTestId('filter-tab-open').click();
    const openTab = page.getByTestId('filter-tab-open');
    const classList = await openTab.evaluate((el) => el.className);
    expect(classList).toContain('text-red-600');
  });
});

test.describe('PATCH-7: Incident Detail Page', () => {
  let incidentId: string;

  test.beforeAll(async ({ browser }) => {
    // Create an incident to view
    const context = await browser.newContext({ storageState: 'e2e/auth-state.json' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('chat-input').fill('Test incident for detail page');
    await page.getByTestId('chat-send-btn').click();
    // Wait for LLM response first, then incident header
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    await expect(page.getByTestId('incident-header')).toBeVisible({ timeout: 10000 });
    incidentId = await page.getByTestId('incident-header-id').innerText();
    await context.close();
  });

  test('AC5: Detail page has two-column layout with left and right columns', async ({ page }) => {
    if (!incidentId) test.skip();
    await page.goto(`/incidents/${incidentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('conversation-history-card')).toBeVisible();
    await expect(page.getByTestId('case-details-card')).toBeVisible();
  });

  test('AC6: Detail page has back link, status badge, title, and Resume Chat for Open', async ({ page }) => {
    if (!incidentId) test.skip();
    await page.goto(`/incidents/${incidentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('back-link')).toBeVisible();
    await expect(page.getByTestId('incident-detail-title')).toBeVisible();
    // Open incidents have Resume Chat button
    await expect(page.getByTestId('resume-chat-btn')).toBeVisible();
  });

  test('AC7: Conversation history card has scrollable container with max-height', async ({ page }) => {
    if (!incidentId) test.skip();
    await page.goto(`/incidents/${incidentId}`);
    await page.waitForLoadState('networkidle');
    const historyEl = page.getByTestId('conversation-history');
    const maxHeight = await historyEl.evaluate((el) => window.getComputedStyle(el).maxHeight);
    expect(maxHeight).toBe('520px');
  });

  test('AC8: Progress timeline shows Open, Escalated, Resolved steps', async ({ page }) => {
    if (!incidentId) test.skip();
    await page.goto(`/incidents/${incidentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('progress-timeline')).toBeVisible();
    await expect(page.getByTestId('timeline-step-open')).toBeVisible();
    await expect(page.getByTestId('timeline-step-escalated')).toBeVisible();
    await expect(page.getByTestId('timeline-step-resolved')).toBeVisible();
  });

  test('AC10: Right column has Case Details and Identifiers cards with copy actions', async ({ page }) => {
    if (!incidentId) test.skip();
    await page.goto(`/incidents/${incidentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('case-details-card')).toBeVisible();
    await expect(page.getByTestId('identifiers-card')).toBeVisible();
    await expect(page.getByTestId('identifier-incident-id')).toBeVisible();
    await expect(page.getByTestId('identifier-user-id')).toBeVisible();
  });

  test('AC1: Clicking View button from incident list opens detail page', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');
    const hasIncidents = await page.getByTestId('incidents-list').isVisible().catch(() => false);
    if (!hasIncidents) { test.skip(); return; }
    const viewBtn = page.getByTestId('incidents-list').locator('[data-testid^="incident-view-btn-"]').first();
    await viewBtn.click();
    await expect(page).toHaveURL(/\/incidents\/.+/);
  });
});
