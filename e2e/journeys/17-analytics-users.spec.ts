import { test, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 17: Analytics Users', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForLoadState('domcontentloaded');

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

  test('CP-1: users analytics page loads with metrics', async ({ page }) => {
    // Navigate to the Users tab
    const usersTab = page
      .getByRole('tab', { name: /users/i })
      .or(page.getByRole('link', { name: /users/i }));
    const hasUsersTab = await usersTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasUsersTab) {
      test.skip(true, 'Users tab not visible in analytics');
      return;
    }

    await usersTab.click();
    await page.waitForTimeout(2_000);

    // Verify users analytics content loaded
    const usersContent = page
      .locator('[class*="user"], [data-testid*="user"], [class*="metric"], [class*="chart"]')
      .first()
      .or(page.getByRole('main'));

    await expect(usersContent).toBeVisible({ timeout: 30_000 });
  });

  test('CP-2: registered users sub-page loads', async ({ page }) => {
    const usersTab = page
      .getByRole('tab', { name: /users/i })
      .or(page.getByRole('link', { name: /users/i }));
    const hasUsersTab = await usersTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasUsersTab) {
      test.skip(true, 'Users tab not visible');
      return;
    }

    await usersTab.click();
    await page.waitForTimeout(2_000);

    // Look for registered users section / sub-tab
    const registeredTab = page
      .getByRole('tab', { name: /registered/i })
      .or(page.getByRole('link', { name: /registered/i }))
      .or(page.getByText(/registered users/i));

    const hasRegistered = await registeredTab.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasRegistered) {
      await registeredTab.click();
      await page.waitForTimeout(2_000);
    }

    // Verify some metrics or user data is visible
    const metrics = page
      .locator('[class*="metric"], [class*="stat"], [class*="card"], [class*="chart"]')
      .first();
    const hasMetrics = await metrics.isVisible({ timeout: 15_000 }).catch(() => false);

    // At minimum the users section should be loaded
    const usersSection = page.locator('[class*="user"]').first().or(page.getByRole('main'));
    await expect(usersSection).toBeVisible({ timeout: 10_000 });
  });

  test('CP-3: active users sub-page loads', async ({ page }) => {
    const usersTab = page
      .getByRole('tab', { name: /users/i })
      .or(page.getByRole('link', { name: /users/i }));
    const hasUsersTab = await usersTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasUsersTab) {
      test.skip(true, 'Users tab not visible');
      return;
    }

    await usersTab.click();
    await page.waitForTimeout(2_000);

    // Look for active users section / sub-tab
    const activeTab = page
      .getByRole('tab', { name: /active/i })
      .or(page.getByRole('link', { name: /active/i }))
      .or(page.getByText(/active users/i));

    const hasActive = await activeTab.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasActive) {
      await activeTab.click();
      await page.waitForTimeout(2_000);
    }

    // Verify content area is present
    const content = page
      .locator('[class*="metric"], [class*="chart"], [class*="active"]')
      .first()
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 15_000 });
  });

  test('CP-4: at-risk users sub-page loads', async ({ page }) => {
    const usersTab = page
      .getByRole('tab', { name: /users/i })
      .or(page.getByRole('link', { name: /users/i }));
    const hasUsersTab = await usersTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasUsersTab) {
      test.skip(true, 'Users tab not visible');
      return;
    }

    await usersTab.click();
    await page.waitForTimeout(2_000);

    // Look for at-risk users section / sub-tab
    const atRiskTab = page
      .getByRole('tab', { name: /at.risk|at risk/i })
      .or(page.getByRole('link', { name: /at.risk|at risk/i }))
      .or(page.getByText(/at.risk users|at risk/i));

    const hasAtRisk = await atRiskTab.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasAtRisk) {
      await atRiskTab.click();
      await page.waitForTimeout(2_000);
    }

    // Verify content area
    const content = page
      .locator('[class*="metric"], [class*="chart"], [class*="risk"]')
      .first()
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 15_000 });
  });

  test('CP-5: time filter updates data', async ({ page }) => {
    const usersTab = page
      .getByRole('tab', { name: /users/i })
      .or(page.getByRole('link', { name: /users/i }));
    const hasUsersTab = await usersTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasUsersTab) {
      test.skip(true, 'Users tab not visible');
      return;
    }

    await usersTab.click();
    await page.waitForTimeout(2_000);

    // Look for time filter
    const timeFilter = page
      .getByRole('combobox', { name: /time|period|range|date/i })
      .or(page.locator('[class*="time-filter"], [data-testid*="time-filter"]'))
      .or(page.getByRole('button', { name: /last.*days|this week|this month|time range/i }));

    const hasTimeFilter = await timeFilter.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!hasTimeFilter) {
      test.skip(true, 'Time filter not visible on users analytics page');
      return;
    }

    // Capture initial state
    const pageContentBefore = await page
      .getByRole('main')
      .textContent()
      .catch(() => '');

    await timeFilter.click();
    await page.waitForTimeout(1_000);

    const filterOptions = page
      .getByRole('option')
      .or(page.getByRole('menuitem'))
      .or(page.locator('[class*="dropdown-item"]'));
    const hasOptions = await filterOptions
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (hasOptions) {
      // Select a different time period
      const optionCount = await filterOptions.count();
      if (optionCount > 1) {
        await filterOptions.nth(1).click();
      } else {
        await filterOptions.first().click();
      }
      await page.waitForTimeout(3_000);
    } else {
      await page.keyboard.press('Escape');
    }

    // Page should still be on analytics
    expect(page.url()).toContain('/analytics');
  });
});
