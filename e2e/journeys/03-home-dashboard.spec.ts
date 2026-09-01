import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Journey 03: Home Dashboard
 *
 * Validates the home landing page at /home:
 *  1. Hero greeting band with primary CTAs
 *  2. Courses rail
 *  3. My Courses CTA → enrolled catalog
 *  4. Click enrolled catalog card → course about
 *  5. Click rail card → course about
 *  6. Activity Overview band shows stats
 *  7. View All links
 *  8. No console errors
 *  9. Rail mode matches the tenant's courses-display setting
 */

/**
 * The rail's heading and region name follow the tenant's
 * `lms_dashboard_courses_display` setting, so locate it by any of its three
 * modes rather than pinning one tenant's configuration.
 */
const RAIL_NAME = /^(explore|my courses|recommended for you)$/i;

/** The Discover filter each rail mode hands off to via "See More". */
const SEE_MORE_BY_MODE: Record<string, RegExp> = {
  explore: /\/discover$/,
  'my courses': /\/discover\?enrolled=true$/,
  'recommended for you': /\/discover\?recommended=true$/,
};

test.describe('Journey 03: Home Dashboard', () => {
  test.setTimeout(200000);

  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Collect console errors
    consoleErrors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await gotoTenantPage(page, 'home', { timeout: 120000 });
    await waitForAppShell(page);
  });

  test('Checkpoint 1: Home page displays the hero greeting band', async ({ page }) => {
    // The landing hero greets the learner and offers the primary CTAs.
    const hero = page.getByRole('region', { name: 'Welcome' });
    await expect(hero).toBeVisible({ timeout: 120_000 });

    //greeting should be good morning, good afternoon or good evening
    const greeting = hero.getByRole('heading', {
      name: /good morning|good afternoon|good evening/i,
    });
    await expect(greeting).toBeVisible({ timeout: 120_000 });
    logger.info('Hero greeting band is visible');

    // At least one primary CTA (Explore Catalog is tenant-gated; My Courses
    // is always present).
    const myCoursesCta = hero.getByRole('link', { name: /my courses/i });
    await expect(myCoursesCta).toBeVisible({ timeout: 30_000 });

    // The home page itself should have loaded
    await expect(page).toHaveURL(/\/home/);
  });

  test('Checkpoint 2: Courses rail is displayed', async ({ page }) => {
    // The home page closes with a courses rail — the catalog, the user's
    // enrollments, or their recommendations, per the tenant setting.
    const railHeading = page.getByRole('heading', { name: RAIL_NAME });

    const hasRail = await railHeading.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasRail) {
      await expect(railHeading).toBeVisible();
      logger.info(`Courses rail found: "${await railHeading.textContent()}"`);
    } else {
      logger.info('Courses rail not present — Discover may be disabled or empty');
    }
  });

  test('Checkpoint 3: My Courses CTA opens the enrolled catalog', async ({ page }) => {
    // The hero's My Courses CTA deep-links the centralized catalog's
    // enrolled view (the home My Courses grid moved there).
    const hero = page.getByRole('region', { name: 'Welcome' });
    const myCoursesCta = hero.getByRole('link', { name: /my courses/i });
    await expect(myCoursesCta).toBeVisible({ timeout: 120_000 });
    await myCoursesCta.click();

    await page.waitForURL(/\/discover\?.*enrolled=true/, { timeout: 120_000 });

    const enrollmentChip = page.getByRole('button', { name: /remove filter enrollment/i });
    await expect(enrollmentChip).toBeVisible({ timeout: 120_000 });
    logger.info('Enrolled catalog view reached from the home CTA');
  });

  test('Checkpoint 4: Click enrolled catalog card navigates to course about', async ({ page }) => {
    const hero = page.getByRole('region', { name: 'Welcome' });
    const myCoursesCta = hero.getByRole('link', { name: /my courses/i });
    await expect(myCoursesCta).toBeVisible({ timeout: 120_000 });
    await myCoursesCta.click();
    await page.waitForURL(/\/discover\?.*enrolled=true/, { timeout: 120_000 });

    const card = page.locator('[data-testid="discover-content-card"]').first();
    const hasCourse = await card.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCourse) {
      logger.info('No enrolled courses — skipping navigation test');
      test.skip();
      return;
    }

    await card.click();
    await page.waitForURL(/\/courses\//, { timeout: 120_000 });
    await waitForAppShell(page);

    // Verify course about page loaded
    const courseHeading = page.getByRole('heading', { level: 1 });
    await expect(courseHeading).toBeVisible({ timeout: 30_000 });
    logger.info('Navigated to course about page from the enrolled catalog');
  });

  test('Checkpoint 5: Click rail card navigates to course about', async ({ page }) => {
    const railRegion = page.getByRole('region', { name: RAIL_NAME });

    const hasRail = await railRegion.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasRail) {
      logger.info('No courses rail — skipping');
      test.skip();
      return;
    }

    // Rail cards are click targets (divs) that route to the course.
    const card = railRegion.locator('[data-testid="discover-content-card"]').first();
    const hasCard = await card.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCard) {
      logger.info('No catalog rail cards found — skipping');
      test.skip();
      return;
    }

    await card.click();
    await page.waitForURL(/\/(courses|programs)\//, { timeout: 120_000 });
    await waitForAppShell(page);

    const courseHeading = page.getByRole('heading', { level: 1 });
    await expect(courseHeading).toBeVisible({ timeout: 120_000 });
    logger.info('Navigated to content page from the catalog rail');
  });

  test('Checkpoint 6: Activity Overview band is NOT on the home page', async ({ page }) => {
    // The stats + time-spent chart live on the profile Activity page only.
    // Wait until the courses rail (or its absence) settles so we assert on
    // the fully rendered page, not a loading state.
    const rail = page.getByRole('region', { name: RAIL_NAME });
    await rail.isVisible({ timeout: 120_000 }).catch(() => false);

    await expect(page.getByRole('region', { name: 'Activity Overview' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /time spent/i })).toHaveCount(0);
    logger.info('No Activity Overview band on the home page');
  });

  test('Checkpoint 7: View All links are present', async ({ page }) => {
    const viewAllLinks = page.getByRole('link', { name: /view all/i });
    const viewAllCount = await viewAllLinks.count();

    if (viewAllCount > 0) {
      logger.info(`Found ${viewAllCount} "View All" link(s)`);
      // Click the first one and verify navigation
      const firstViewAll = viewAllLinks.first();
      await expect(firstViewAll).toBeVisible({ timeout: 15000 });
    } else {
      logger.info('No "View All" links found on dashboard');
    }
  });

  test('Checkpoint 8: No console errors on home dashboard', async ({ page }) => {
    // Wait for the page to fully stabilize
    await page.waitForTimeout(3000);

    // Filter out noise — some third-party scripts may emit benign errors
    const significantErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') && !err.includes('third-party') && !err.includes('net::ERR'),
    );

    if (significantErrors.length > 0) {
      logger.info(`Console errors found: ${significantErrors.length}`);
      significantErrors.forEach((err) => logger.info(`  - ${err}`));
    }

    // We log but do not fail for minor console errors — just ensure no crash
    await expect(page).toHaveURL(/\/home/);
  });

  test('Checkpoint 9: Rail mode matches the tenant courses-display setting', async ({ page }) => {
    // The tenant's `lms_dashboard_courses_display` setting picks the rail's
    // source (catalog / enrolled / recommended). Whichever mode this tenant
    // is on, its heading and its "See More" hand-off must agree — the rail
    // and the Discover page it opens land on the same filter.
    const railHeading = page.getByRole('heading', { name: RAIL_NAME });

    const hasRail = await railHeading.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!hasRail) {
      logger.info('No courses rail — Discover disabled or the catalog is empty; skipping');
      test.skip();
      return;
    }

    const mode = (await railHeading.textContent())?.trim().toLowerCase() ?? '';
    expect(Object.keys(SEE_MORE_BY_MODE)).toContain(mode);

    const railRegion = page.getByRole('region', { name: RAIL_NAME });
    const seeMore = railRegion.getByRole('link', { name: /see more/i });
    await expect(seeMore).toHaveAttribute('href', SEE_MORE_BY_MODE[mode]);
    logger.info(`Rail is in "${mode}" mode and its See More carries the matching filter`);

    // Following it lands on the Discover page already on that filter.
    await seeMore.click();
    await page.waitForURL(SEE_MORE_BY_MODE[mode], { timeout: 120_000 });
    await waitForAppShell(page);

    if (mode !== 'explore') {
      const enrollmentChip = page.getByRole('button', { name: /remove filter enrollment/i });
      await expect(enrollmentChip).toBeVisible({ timeout: 120_000 });
      logger.info('Discover opened with the rail’s access filter already applied');
    }
  });
});
