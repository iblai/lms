import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

test.describe('Journey 33: Analytics Audit', () => {
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

    logger.info('Navigating to Analytics');
    await analyticsLink.click();
    await page.waitForURL((url) => url.href.includes('/analytics'), { timeout: 30_000 });
  });

  /**
   * Clicks the Audit tab and returns false (skipping the test) when the tab is
   * not visible. The audit log view itself renders one of: the filters + table,
   * the empty state, or a permission notice for non-authorized users.
   */
  async function openAuditTab(page: import('@playwright/test').Page): Promise<boolean> {
    const auditTab = page.getByRole('tab', { name: 'Audit', exact: true });
    const hasAuditTab = await auditTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!hasAuditTab) {
      return false;
    }

    await auditTab.click();
    await expect(auditTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });
    return true;
  }

  test('CP-1: audit tab routes to the audit log view', async ({ page }) => {
    logger.info('CP-1: navigating to Audit tab');
    const opened = await openAuditTab(page);
    if (!opened) {
      test.skip(true, 'Audit analytics tab not visible');
      return;
    }

    await page.waitForURL((url) => url.pathname.endsWith('/analytics/audit'), {
      timeout: 30_000,
    });

    logger.info('CP-1: checking the audit log view rendered');
    // After loading completes, one of these will appear:
    // - the USER/ACTION/TIME table (has results)
    // - "No audit log entries found for this tenant." (empty)
    // - "You do not have permission to view audit logs." (403)
    const loadedIndicator = page
      .getByRole('columnheader', { name: 'USER', exact: true })
      .or(page.getByText('No audit log entries found for this tenant.'))
      .or(page.getByText('You do not have permission to view audit logs.'));

    await expect(loadedIndicator.first()).toBeVisible({ timeout: 120_000 });
    logger.info('CP-1: audit log view rendered — table, empty state, or permission notice');
  });

  test('CP-2: audit log filters are visible', async ({ page }) => {
    logger.info('CP-2: navigating to Audit tab');
    const opened = await openAuditTab(page);
    if (!opened) {
      test.skip(true, 'Audit analytics tab not visible');
      return;
    }

    const permissionNotice = page.getByText('You do not have permission to view audit logs.');
    const hasNoPermission = await permissionNotice.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasNoPermission) {
      test.skip(true, 'User lacks permission to view audit logs — filters not rendered');
      return;
    }

    logger.info('CP-2: checking user search and action filters');
    const userSearch = page.getByRole('button', { name: 'Search for User' });
    const actionFilter = page.getByText('All Actions');

    const hasUserSearch = await userSearch.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasActionFilter = await actionFilter
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    logger.info(`CP-2: userSearch=${hasUserSearch} actionFilter=${hasActionFilter}`);
    expect(hasUserSearch, 'User search filter should be visible').toBe(true);
    expect(hasActionFilter, 'Action filter should be visible').toBe(true);
  });

  test('CP-3: audit log table or empty state is visible', async ({ page }) => {
    logger.info('CP-3: navigating to Audit tab');
    const opened = await openAuditTab(page);
    if (!opened) {
      test.skip(true, 'Audit analytics tab not visible');
      return;
    }

    const permissionNotice = page.getByText('You do not have permission to view audit logs.');
    const hasNoPermission = await permissionNotice.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasNoPermission) {
      test.skip(true, 'User lacks permission to view audit logs — table not rendered');
      return;
    }

    logger.info('CP-3: checking for audit entries table or empty state');
    const tableHeader = page.getByRole('columnheader', { name: 'USER', exact: true });
    const emptyState = page.getByText('No audit log entries found for this tenant.');

    await expect(tableHeader.or(emptyState).first()).toBeVisible({ timeout: 120_000 });

    const hasTable = await tableHeader.isVisible({ timeout: 1_000 }).catch(() => false);
    if (hasTable) {
      logger.info('CP-3: audit table rendered — verifying ACTION and TIME headers');
      await expect(page.getByRole('columnheader', { name: 'ACTION', exact: true })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole('columnheader', { name: 'TIME', exact: true })).toBeVisible({
        timeout: 30_000,
      });
    } else {
      logger.info('CP-3: empty state rendered — no audit log entries for this tenant');
    }
  });
});
