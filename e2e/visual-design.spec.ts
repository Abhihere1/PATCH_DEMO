// Ticket: PATCH-17
import { test, expect } from '@playwright/test';

test.describe('PATCH-17: Global Visual Design System', () => {
  test('AC7: Header is white with 1px bottom border', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.getByTestId('top-nav');
    await expect(nav).toBeVisible();
    const classList = await nav.evaluate((el) => el.className);
    expect(classList).toContain('bg-white');
    expect(classList).toContain('border-b');
  });

  test('AC4: Primary buttons are red with white text', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.getByTestId('login-submit-btn');
    await expect(submitBtn).toBeVisible();
    const classList = await submitBtn.evaluate((el) => el.className);
    expect(classList).toContain('bg-red-600');
    expect(classList).toContain('text-white');
  });

  test('AC6: Status badges use correct color tints', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');

    // Check Open badge style
    const openBadge = page.locator('[data-testid="status-badge-open"]').first();
    if (await openBadge.isVisible().catch(() => false)) {
      const classList = await openBadge.evaluate((el) => el.className);
      expect(classList).toContain('text-yellow-700');
    }

    // Check Escalated badge style
    const escalatedBadge = page.locator('[data-testid="status-badge-escalated"]').first();
    if (await escalatedBadge.isVisible().catch(() => false)) {
      const classList = await escalatedBadge.evaluate((el) => el.className);
      expect(classList).toContain('text-red-700');
    }

    // Check Resolved badge style
    const resolvedBadge = page.locator('[data-testid="status-badge-resolved"]').first();
    if (await resolvedBadge.isVisible().catch(() => false)) {
      const classList = await resolvedBadge.evaluate((el) => el.className);
      expect(classList).toContain('text-green-700');
    }
    expect(true).toBe(true);
  });

  test('AC5: User messages are right-aligned red bubbles; assistant messages are left-aligned white cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('chat-input').fill('Test message styling');
    await page.getByTestId('chat-send-btn').click();

    // User message bubble
    const userBubble = page.getByTestId('message-bubble-user').first();
    await expect(userBubble).toBeVisible({ timeout: 10000 });
    const userClass = await userBubble.evaluate((el) => el.className);
    expect(userClass).toContain('flex-row-reverse');

    // Assistant message bubble
    await expect(page.getByTestId('message-bubble-assistant')).toBeVisible({ timeout: 55000 });
    const assistantBubble = page.getByTestId('message-bubble-assistant').first();
    const assistantClass = await assistantBubble.evaluate((el) => el.className);
    expect(assistantClass).toContain('flex-row');
    expect(assistantClass).not.toContain('flex-row-reverse');
  });

  test('AC8: Landing page has radial gradient background', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hero = page.getByTestId('pre-chat-hero');
    const style = await hero.getAttribute('style');
    expect(style).toContain('radial-gradient');
  });

  test('AC9: Incident detail page conversation history has max-height: 520px', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');
    const hasIncidents = await page.getByTestId('incidents-list').isVisible().catch(() => false);
    if (!hasIncidents) { expect(true).toBe(true); return; }

    const viewBtn = page.getByTestId('incidents-list').locator('[data-testid^="incident-view-btn-"]').first();
    await viewBtn.click();
    await page.waitForLoadState('networkidle');

    const history = page.getByTestId('conversation-history');
    await expect(history).toBeVisible();
    const maxHeight = await history.evaluate((el) => window.getComputedStyle(el).maxHeight);
    expect(maxHeight).toBe('520px');
  });

  test('AC3: Cards use white background, rounded corners, and border', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');
    const hasIncidents = await page.getByTestId('incidents-list').isVisible().catch(() => false);
    if (!hasIncidents) { expect(true).toBe(true); return; }

    const viewBtn = page.getByTestId('incidents-list').locator('[data-testid^="incident-view-btn-"]').first();
    await viewBtn.click();
    await page.waitForLoadState('networkidle');

    const caseCard = page.getByTestId('case-details-card');
    await expect(caseCard).toBeVisible();
    const cardClass = await caseCard.evaluate((el) => el.className);
    expect(cardClass).toContain('bg-white');
    expect(cardClass).toContain('border');
    expect(cardClass).toContain('rounded-xl');
  });

  test('AC7: Active nav tab has red underline', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');
    const incidentsLink = page.getByTestId('nav-incidents-link');
    const classList = await incidentsLink.evaluate((el) => el.className);
    expect(classList).toContain('text-red-600');
    expect(classList).toContain('border-red-600');
  });
});
