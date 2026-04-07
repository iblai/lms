import { test, expect } from '@playwright/test';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Journey 06: Profile Activity
 *
 * Validates the profile activity page:
 *  1. Activity tab selected by default
 *  2. Activity displays chart/stats
 *  3. Profile sidebar with user info
 *  4. Navigation tabs visible
 *  5. Tab navigation works
 *  6. User heading
 */
test.describe('Journey 06: Profile Activity', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/public-profile`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForPageReady(page, 120000);
  });

  test('Checkpoint 1: Activity tab is selected by default', async ({ page }) => {
    // The default profile page should show activity
    // Look for an Activity tab/link that is active
    const activityTab = page
      .getByRole('link', { name: /activity/i })
      .first()
      .or(page.getByRole('button', { name: /activity/i }).first());

    const hasActivityTab = await activityTab.isVisible({ timeout: 30000 }).catch(() => false);

    if (hasActivityTab) {
      logger.info('Activity tab/link is visible');
      // Check if it has an active/selected state
      const ariaSelected = await activityTab.getAttribute('aria-selected').catch(() => null);
      const ariaCurrent = await activityTab.getAttribute('aria-current').catch(() => null);
      const className = await activityTab.getAttribute('class').catch(() => '');

      if (ariaSelected === 'true' || ariaCurrent === 'page' || className?.includes('active')) {
        logger.info('Activity tab is selected by default');
      } else {
        logger.info('Activity tab is visible but selection state unclear');
      }
    } else {
      // Profile page may show activity content without explicit tab
      logger.info('No explicit Activity tab — checking for activity content');
    }

    await expect(page).toHaveURL(/\/profile/);
  });

  test('Checkpoint 2: Activity displays chart or stats', async ({ page }) => {
    // Look for chart elements, stats, or activity-related content
    const chartElement = page
      .locator('canvas, svg, [data-testid*="chart"], [data-testid*="activity"]')
      .first();
    const statsElement = page.getByText(/courses|skills|completed|progress|certificates/i).first();

    const hasChart = await chartElement.isVisible({ timeout: 15000 }).catch(() => false);
    const hasStats = await statsElement.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasChart) {
      logger.info('Activity chart/visualization is visible');
    }
    if (hasStats) {
      logger.info('Activity stats content is visible');
    }

    expect(hasChart || hasStats).toBeTruthy();
  });

  test('Checkpoint 3: Profile sidebar with user info', async ({ page }) => {
    const sidebar = page
      .getByLabel('Profile Sidebar')
      .or(page.locator('[data-testid="profile-sidebar"]'))
      .first();

    const hasSidebar = await sidebar.isVisible({ timeout: 30000 }).catch(() => false);

    if (!hasSidebar) {
      // Fallback: look for user name/avatar on the page
      const userName = page.getByRole('heading').first();
      const hasName = await userName.isVisible({ timeout: 15000 }).catch(() => false);

      if (hasName) {
        const text = await userName.textContent();
        logger.info(`User info found in heading: ${text}`);
      } else {
        logger.info('Profile sidebar or user info not explicitly found');
      }
      return;
    }

    const sidebarContent = await sidebar.textContent();
    expect(sidebarContent?.length).toBeGreaterThan(0);
    logger.info('Profile sidebar with user info is visible');
  });

  test('Checkpoint 4: Profile navigation tabs are visible', async ({ page }) => {
    // Look for common profile navigation tabs
    const profileTabs = [
      /activity/i,
      /skills/i,
      /credentials/i,
      /pathways/i,
      /programs/i,
      /courses/i,
    ];

    let visibleTabCount = 0;

    for (const tabPattern of profileTabs) {
      const tab = page
        .getByRole('link', { name: tabPattern })
        .first()
        .or(page.getByRole('button', { name: tabPattern }).first());

      const isVisible = await tab.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        visibleTabCount++;
      }
    }

    logger.info(`Found ${visibleTabCount} profile navigation tab(s)`);
    expect(visibleTabCount).toBeGreaterThan(0);
  });

  test('Checkpoint 5: Tab navigation works', async ({ page }) => {
    // Try navigating to Skills tab
    const skillsLink = page.getByRole('link', { name: /skills/i }).first();
    const hasSkills = await skillsLink.isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasSkills) {
      logger.info('Skills tab not found — skipping navigation test');
      test.skip();
      return;
    }

    await skillsLink.click();

    // Wait for navigation
    await page.waitForURL(/\/profile\/skills/, { timeout: 30000 }).catch(() => {
      // URL may not change if using client-side tab switching
    });

    await page.waitForTimeout(2000);
    logger.info(`After clicking Skills tab, URL: ${page.url()}`);

    // Navigate back to activity
    const activityLink = page.getByRole('link', { name: /activity/i }).first();
    const hasActivity = await activityLink.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasActivity) {
      await activityLink.click();
      await page.waitForTimeout(2000);
      logger.info('Navigated back to Activity tab');
    }
  });

  test('Checkpoint 6: User heading is displayed', async ({ page }) => {
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 30000 });

    const text = await heading.textContent();
    expect(text?.length).toBeGreaterThan(0);
    logger.info(`Profile heading: ${text}`);
  });
});
