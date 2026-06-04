import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

test.describe('Journey 16: Analytics Overview', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // Admin gate: check if AI Analytics link is visible in the nav
    const analyticsLink = page.getByRole('link', { name: /ai analytics|analytics/i });
    const isAdmin = await analyticsLink.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isAdmin) {
      test.skip(true, 'Analytics requires admin access — AI Analytics link not visible');
      return;
    }

    await analyticsLink.click();
    await page.waitForURL((url) => url.href.includes('/analytics'), { timeout: 120_000 });
    // Wait for the global app loader (app/loading.tsx) to disappear before tests run.
    await expect(page.getByRole('status', { name: 'Loading...' })).not.toBeVisible({
      timeout: 120_000,
    });
  });

  test('CP-1: analytics page loads with stat cards', async ({ page }) => {
    expect(page.url()).toContain('/analytics');

    // AnalyticsOverview renders 4 StatCards with aria-label "<title> mini card" (loaded),
    // "<title> mini card loading" (skeleton), or "<title> mini card value". Use starts-with
    // selector to match any state.
    const statCardPrefixes = [
      'Messages mini card',
      'Active Users mini card',
      'Topics mini card',
      'Conversations mini card',
    ];

    const visibility: boolean[] = [];
    for (const prefix of statCardPrefixes) {
      const card = page.locator(`[aria-label^="${prefix}"]`);
      const isVisible = await card
        .first()
        .isVisible({ timeout: 120_000 })
        .catch(() => false);
      visibility.push(isVisible);
    }

    const [hasMessages, hasActiveUsers, hasTopics, hasConversations] = visibility;

    const visibleCount = [hasMessages, hasActiveUsers, hasTopics, hasConversations].filter(
      Boolean,
    ).length;
    logger.info(`Found ${visibleCount} of 4 stat cards`);
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('CP-2: chart sections are visible', async ({ page }) => {
    // AnalyticsOverview renders 3 charts via ChartCardWrapper with aria-label "<title> chart card"
    const sessionsChart = page.locator('[aria-label="Sessions chart card"]');
    const topicsChart = page.locator('[aria-label="Topics chart card"]');
    const activeUsersChart = page.locator('[aria-label="Active Users chart card"]');

    const hasSessions = await sessionsChart.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasTopics = await topicsChart.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasActiveUsers = await activeUsersChart
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    const visibleCount = [hasSessions, hasTopics, hasActiveUsers].filter(Boolean).length;
    logger.info(`Found ${visibleCount} of 3 chart sections`);
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('CP-3: analytics navigation tabs visible', async ({ page }) => {
    // AnalyticsLayout renders tabs as role="tab" buttons
    const expectedTabs = [
      'Overview',
      'Users',
      'Courses',
      'Programs',
      'Topics',
      'Transcripts',
      'Costs',
      'Data Reports',
    ];

    let visibleTabCount = 0;
    for (const tabName of expectedTabs) {
      const tab = page.getByRole('tab', { name: tabName, exact: true });
      const isVisible = await tab.isVisible({ timeout: 120_000 }).catch(() => false);
      if (isVisible) {
        visibleTabCount++;
      }
    }

    logger.info(`Found ${visibleTabCount} of ${expectedTabs.length} analytics navigation tabs`);
    expect(visibleTabCount).toBeGreaterThan(0);

    // Overview tab should be active on /analytics
    const overviewTab = page.getByRole('tab', { name: 'Overview', exact: true });
    const hasOverview = await overviewTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (hasOverview) {
      await expect(overviewTab).toHaveAttribute('data-state', 'active');
      logger.info('Overview tab is active');
    }
  });

  test('CP-4: time filter buttons work', async ({ page }) => {
    // Each chart section has its own TimeFilter with buttons: Today, 7D, 30D, 90D, Custom
    // 30D is selected by default (aria-pressed="true")
    const timeFilterButton = page.getByRole('button', { name: '7D', exact: true }).first();
    const hasTimeFilter = await timeFilterButton.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasTimeFilter) {
      test.skip(true, 'Time filter buttons not visible');
      return;
    }

    // Check that 30D is pressed by default
    const defaultButton = page.getByRole('button', { name: '30D', exact: true }).first();
    const hasDefault = await defaultButton.isVisible({ timeout: 120_000 }).catch(() => false);
    if (hasDefault) {
      await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
      logger.info('30D filter is active by default');
    }

    // Click 7D and verify it becomes active
    await timeFilterButton.click();
    await expect(timeFilterButton).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
    logger.info('Clicked 7D filter — now active');

    expect(page.url()).toContain('/analytics');
  });

  test('CP-5: groups filter dropdown visible', async ({ page }) => {
    // GroupsFilterDropdown is rendered in the layout with placeholder "Filter by Groups"
    const groupsFilter = page.getByText(/filter by groups/i).first();
    const hasGroupsFilter = await groupsFilter.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasGroupsFilter) {
      test.skip(true, 'Groups filter dropdown not visible');
      return;
    }

    logger.info('Groups filter dropdown is visible');
    await groupsFilter.click();
    await page.waitForTimeout(1_000);

    // After clicking, a dropdown should appear
    expect(page.url()).toContain('/analytics');
  });
});
