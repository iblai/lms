import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

test.describe('Journey 17: Analytics Users', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // Admin gate: check if AI Analytics link is visible
    const analyticsLink = page.getByRole('link', { name: /ai analytics|analytics/i });
    const isAdmin = await analyticsLink.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isAdmin) {
      test.skip(true, 'Analytics requires admin access — AI Analytics link not visible');
      return;
    }

    await analyticsLink.click();
    await page.waitForURL((url) => url.href.includes('/analytics'), { timeout: 30_000 });

    // Navigate to the Users tab in AnalyticsLayout (Radix UI tabs)
    const usersTab = page.getByRole('tab', { name: 'Users', exact: true });
    const hasUsersTab = await usersTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!hasUsersTab) {
      test.skip(true, 'Users tab not visible in analytics layout');
      return;
    }

    logger.info('Clicking Users tab');
    await usersTab.click();
    // Wait for the Users tab to be selected (Radix UI sets data-state="active")
    await expect(usersTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });
  });

  test('CP-1: Users page loads with stat cards', async ({ page }) => {
    logger.info('CP-1: checking stat cards on Users analytics page');

    // Stat cards have aria-label "${title} mini card" (loaded), "${title} mini card loading"
    // (skeleton), or "${title} mini card value". Use starts-with selector to match any state.
    const statCardPrefixes = [
      'Users logged in right now mini card',
      'Users logged in past 30 days mini card',
      'Total registered users mini card',
    ];

    for (const prefix of statCardPrefixes) {
      const card = page.locator(`[aria-label^="${prefix}"]`);
      await expect(card.first()).toBeVisible({ timeout: 120_000 });
      logger.info(`Stat card "${prefix}" is visible`);
    }
  });

  test('CP-2: Chart sections visible', async ({ page }) => {
    logger.info('CP-2: checking chart card wrappers on Users analytics page');

    const activeUsersChart = page.getByLabel('Active Users chart card');
    const accessTimesChart = page.getByLabel('Access Times chart card');

    await expect(activeUsersChart).toBeVisible({ timeout: 120_000 });
    logger.info('Active Users chart card is visible');

    await expect(accessTimesChart).toBeVisible({ timeout: 120_000 });
    logger.info('Access Times chart card is visible');
  });

  test('CP-3: User details table visible with search input', async ({ page }) => {
    logger.info('CP-3: checking user details table and search input');

    const searchInput = page.locator('#search-user');
    await expect(searchInput).toBeVisible({ timeout: 120_000 });
    await expect(searchInput).toHaveAttribute('placeholder', 'Search by email or username...');
    logger.info('Search input #search-user is visible with correct placeholder');

    // Check table column headers
    const userEmailHeader = page.getByRole('columnheader', { name: /user email/i });
    const usernameHeader = page.getByRole('columnheader', { name: /username/i });
    const messagesHeader = page.getByRole('columnheader', { name: /messages/i });
    const lastActiveHeader = page.getByRole('columnheader', { name: /last active/i });

    await expect(userEmailHeader).toBeVisible({ timeout: 120_000 });
    await expect(usernameHeader).toBeVisible({ timeout: 120_000 });
    await expect(messagesHeader).toBeVisible({ timeout: 120_000 });
    await expect(lastActiveHeader).toBeVisible({ timeout: 120_000 });
    logger.info('Table columns User Email, Username, Messages, Last Active are visible');

    // The user details table settles into one of two terminal states: a
    // "No data available" empty message, or pagination controls once rows have
    // loaded. Assert that either one is present (whichever appears first)
    // instead of waiting on a single state.
    const noDataAvailable = page
      .getByLabel('User Details chart card')
      .getByText('No data available');
    const firstPage = page.getByRole('button', { name: 'Go to first page' });

    await expect(noDataAvailable.or(firstPage).first()).toBeVisible({ timeout: 60_000 });

    if (await noDataAvailable.isVisible().catch(() => false)) {
      logger.info('User details table shows "No data available" empty state');
    } else {
      const prevPage = page.getByRole('button', { name: 'Go to previous page' });
      await expect(firstPage).toBeVisible({ timeout: 60_000 });
      await expect(prevPage).toBeVisible({ timeout: 60_000 });
      logger.info('Pagination controls are visible');
    }
  });

  test('CP-4: Time filter buttons work', async ({ page }) => {
    logger.info('CP-4: checking time filter buttons on Active Users chart');

    // The Active Users chart should have TimeFilter buttons: Today, 7D, 30D, 90D, Custom
    // 30D is the default — it should have aria-pressed="true"
    const activeUsersChart = page.getByLabel('Active Users chart card');
    await expect(activeUsersChart).toBeVisible({ timeout: 120_000 });

    const btn30D = activeUsersChart.getByRole('button', { name: '30D' });
    await expect(btn30D).toBeVisible({ timeout: 120_000 });
    await expect(btn30D).toHaveAttribute('aria-pressed', 'true');
    logger.info('30D button is default (aria-pressed="true")');

    const btn7D = activeUsersChart.getByRole('button', { name: '7D' });
    await expect(btn7D).toBeVisible({ timeout: 120_000 });

    await btn7D.click();
    await page.waitForTimeout(1_000);

    await expect(btn7D).toHaveAttribute('aria-pressed', 'true');
    await expect(btn30D).toHaveAttribute('aria-pressed', 'false');
    logger.info('After clicking 7D, aria-pressed updated correctly');
  });

  test('CP-5: User details search works', async ({ page }) => {
    logger.info('CP-5: testing user details search input');

    const searchInput = page.locator('#search-user');
    await expect(searchInput).toBeVisible({ timeout: 120_000 });

    const searchTerm = 'test@example.com';
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(1_000);

    await expect(searchInput).toHaveValue(searchTerm);
    logger.info(`Search input accepted value: "${searchTerm}"`);

    // Clear search and verify it clears
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
    logger.info('Search input cleared successfully');
  });
});
