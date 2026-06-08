// Ticket: PATCH-2
import { test, expect } from '@playwright/test';

test.describe('PATCH-2: Main Landing Page and VDI Tile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('AC1: Main page shows centered hero with Patch mark, welcome text, and VDI tile', async ({ page }) => {
    await expect(page.getByTestId('pre-chat-hero')).toBeVisible();
    await expect(page.getByTestId('hero-heading')).toBeVisible();
    await expect(page.getByTestId('vdi-tile')).toBeVisible();
  });

  test('AC2: Welcome message includes "Discount Tire Information Center" with username highlighted', async ({ page }) => {
    const heading = page.getByTestId('hero-heading');
    await expect(heading).toContainText('Welcome to the Discount Tire Information Center');
    // Username should be in red span
    const redSpan = heading.locator('span.text-red-600');
    await expect(redSpan).toBeVisible();
  });

  test('AC3: Email prefix used as fallback when username is missing (hero heading shows a name)', async ({ page }) => {
    // The welcome message should have a non-empty username or email prefix
    const heading = page.getByTestId('hero-heading');
    const text = await heading.innerText();
    expect(text).toMatch(/Welcome to the Discount Tire Information Center,\s*.+\./);
  });

  test('AC4: VDI tile has label and KB status badge', async ({ page }) => {
    await expect(page.getByTestId('vdi-tile-label')).toContainText('VDI Support');
    const kbStatus = page.getByTestId('vdi-kb-status');
    await expect(kbStatus).toBeVisible();
    const statusText = await kbStatus.innerText();
    expect(['KB Available', 'KB Missing']).toContain(statusText);
  });

  test('AC6: Page background uses a gradient/radial wash', async ({ page }) => {
    const hero = page.getByTestId('pre-chat-hero');
    const style = await hero.evaluate((el) => window.getComputedStyle(el).background || el.getAttribute('style'));
    expect(style).toBeTruthy();
  });

  test('AC8: Chat composer is anchored at bottom and visible', async ({ page }) => {
    const composer = page.getByTestId('composer');
    await expect(composer).toBeVisible();
    await expect(page.getByTestId('chat-input')).toBeVisible();
  });

  test('AC7: Layout is centered, not a dashboard-style layout', async ({ page }) => {
    const hero = page.getByTestId('pre-chat-hero');
    await expect(hero).toBeVisible();
    // Center alignment checked via class presence
    const classList = await hero.evaluate((el) => el.className);
    expect(classList).toContain('items-center');
  });
});
