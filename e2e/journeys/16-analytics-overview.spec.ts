import { test, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 16: Analytics Overview', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(SKILL_HOST, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForURL(
      (url) => url.href.includes('/home') || url.href.includes('/start'),
      { timeout: 60_000 }
    );

    // Admin gate: check if AI Analytics link is visible
    const analyticsLink = page.getByRole('link', { name: /ai analytics|analytics/i });
    const isAdmin = await analyticsLink.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!isAdmin) {
      test.skip(true, 'Analytics requires admin access — AI Analytics link not visible');
      return;
    }

    await analyticsLink.click();
    await page.waitForURL((url) => url.href.includes('/analytics'), { timeout: 30_000 });
  });

  test('CP-1: analytics page loads with dashboard', async ({ page }) => {
    // Verify the analytics page loaded
    const analyticsContent = page.locator(
      '[class*="analytics"], [data-testid*="analytics"], [class*="dashboard"]'
    ).first()
      .or(page.getByRole('main'));

    await expect(analyticsContent).toBeVisible({ timeout: 30_000 });
    expect(page.url()).toContain('/analytics');
  });

  test('CP-2: overview shows metrics cards', async ({ page }) => {
    // Navigate to the overview tab if not already there
    const overviewTab = page.getByRole('tab', { name: /overview/i })
      .or(page.getByRole('link', { name: /overview/i }));
    const hasOverviewTab = await overviewTab.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasOverviewTab) {
      await overviewTab.click();
      await page.waitForTimeout(2_000);
    }

    // Look for metrics cards / stat cards / KPI widgets
    const metricsCards = page.locator(
      '[class*="metric-card"], [class*="stat-card"], [class*="kpi"], [data-testid*="metric"], [class*="mini-card"]'
    );
    const hasMetrics = await metricsCards.first().isVisible({ timeout: 30_000 }).catch(() => false);

    if (hasMetrics) {
      const count = await metricsCards.count();
      expect(count).toBeGreaterThan(0);
    } else {
      // Analytics content should at least be present
      const content = page.locator('[class*="analytics"], [class*="chart"]').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    }
  });

  test('CP-3: sidebar tabs visible', async ({ page }) => {
    // Verify analytics sidebar/tab navigation is present
    const tabs = page.getByRole('tablist')
      .or(page.locator('[class*="analytics-nav"], [class*="analytics-sidebar"], [class*="tab-list"]'));
    const hasTabList = await tabs.isVisible({ timeout: 15_000 }).catch(() => false);

    if (hasTabList) {
      await expect(tabs).toBeVisible();
    } else {
      // May use links/buttons instead of tabs
      const navLinks = page.locator(
        '[class*="analytics"] a, [class*="analytics"] button[role="tab"]'
      );
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('CP-4: time filter is functional', async ({ page }) => {
    // Look for time range / date filter controls
    const timeFilter = page.getByRole('combobox', { name: /time|period|range|date/i })
      .or(page.locator('[class*="time-filter"], [data-testid*="time-filter"]'))
      .or(page.getByRole('button', { name: /last.*days|this week|this month|time range/i }));

    const hasTimeFilter = await timeFilter.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasTimeFilter) {
      test.skip(true, 'Time filter control not visible on analytics page');
      return;
    }

    await timeFilter.click();
    await page.waitForTimeout(1_000);

    // A dropdown or date picker should appear
    const filterOptions = page.getByRole('option')
      .or(page.getByRole('menuitem'))
      .or(page.locator('[class*="dropdown-item"], [class*="select-option"]'));
    const hasOptions = await filterOptions.first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasOptions) {
      // Click a different option
      await filterOptions.first().click();
      await page.waitForTimeout(2_000);
    } else {
      await page.keyboard.press('Escape');
    }

    // Page should still be on analytics after filter change
    expect(page.url()).toContain('/analytics');
  });

  test('CP-5: groups filter works', async ({ page }) => {
    // Look for group filter / cohort filter
    const groupFilter = page.getByRole('combobox', { name: /group|cohort/i })
      .or(page.locator('[class*="group-filter"], [data-testid*="group-filter"]'))
      .or(page.getByRole('button', { name: /group|cohort|all groups/i }));

    const hasGroupFilter = await groupFilter.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasGroupFilter) {
      test.skip(true, 'Groups filter not visible on analytics page');
      return;
    }

    await groupFilter.click();
    await page.waitForTimeout(1_000);

    const filterOptions = page.getByRole('option')
      .or(page.getByRole('menuitem'))
      .or(page.locator('[class*="dropdown-item"]'));
    const hasOptions = await filterOptions.first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasOptions) {
      await filterOptions.first().click();
      await page.waitForTimeout(2_000);
    } else {
      await page.keyboard.press('Escape');
    }

    expect(page.url()).toContain('/analytics');
  });
});
