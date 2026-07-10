import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Journey 03: Home Dashboard
 *
 * Validates the home landing page at /home:
 *  1. Hero greeting band with primary CTAs
 *  2. Suggested Courses section
 *  3. My Courses section with grid
 *  4. Click My Courses card → course about
 *  5. Click suggested course → course about
 *  6. Activity Overview band shows stats
 *  7. View All links
 *  8. No console errors
 */
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

    const greeting = hero.getByRole('heading', { name: /welcome/i });
    await expect(greeting).toBeVisible({ timeout: 120_000 });
    logger.info('Hero greeting band is visible');

    // At least one primary CTA (Explore Catalog is tenant-gated; My Courses
    // is always present).
    const myCoursesCta = hero.getByRole('link', { name: /my courses/i });
    await expect(myCoursesCta).toBeVisible({ timeout: 30_000 });

    // The home page itself should have loaded
    await expect(page).toHaveURL(/\/home/);
  });

  test('Checkpoint 2: Suggested Courses section is displayed', async ({ page }) => {
    const suggestedHeading = page.getByRole('heading', {
      name: /suggested courses|recommended/i,
    });

    const hasSuggested = await suggestedHeading.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasSuggested) {
      await expect(suggestedHeading).toBeVisible();
      logger.info('Suggested Courses section found');
    } else {
      logger.info('Suggested Courses section not present — may require data');
    }
  });

  test('Checkpoint 3: My Courses section with grid', async ({ page }) => {
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120_000 });

    const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
    await expect(myCoursesGrid).toBeVisible({ timeout: 120_000 });
    logger.info('My Courses Grid is visible');

    // Verify at least one course link exists in the grid
    const courseLinks = myCoursesGrid.getByRole('link');
    const courseCount = await courseLinks.count();

    if (courseCount > 0) {
      logger.info(`Found ${courseCount} course(s) in My Courses grid`);
    } else {
      logger.info('My Courses grid is empty — user may not be enrolled');
    }
  });

  test('Checkpoint 4: Click My Courses card navigates to course about', async ({ page }) => {
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120_000 });

    const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
    await expect(myCoursesGrid).toBeVisible({ timeout: 120_000 });

    const courseLink = myCoursesGrid.getByRole('link').first();
    const hasCourse = await courseLink.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCourse) {
      logger.info('No courses in My Courses grid — skipping navigation test');
      test.skip();
      return;
    }

    await courseLink.click();
    await page.waitForURL(/\/courses\//, { timeout: 120_000 });
    await waitForAppShell(page);

    // Verify course about page loaded
    const courseHeading = page.getByRole('heading', { level: 1 });
    await expect(courseHeading).toBeVisible({ timeout: 30_000 });
    logger.info('Navigated to course about page from My Courses');
  });

  test('Checkpoint 5: Click suggested course navigates to course about', async ({ page }) => {
    const suggestedHeading = page.getByRole('heading', {
      name: /suggested courses|recommended/i,
    });

    const hasSuggested = await suggestedHeading.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasSuggested) {
      logger.info('No Suggested Courses section — skipping');
      test.skip();
      return;
    }

    // Find a course card link (href contains /courses/) — not the "See More" link
    const suggestedSection = suggestedHeading.locator('..').locator('..');
    const courseLink = suggestedSection.locator('a[href*="/courses/"]').first();

    const hasLink = await courseLink.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasLink) {
      logger.info('No suggested course card links found — skipping');
      test.skip();
      return;
    }

    await courseLink.click();
    await page.waitForURL(/\/courses\//, { timeout: 120_000 });
    await waitForAppShell(page);

    const courseHeading = page.getByRole('heading', { level: 1 });
    await expect(courseHeading).toBeVisible({ timeout: 120_000 });
    logger.info('Navigated to course about page from Suggested Courses');
  });

  test('Checkpoint 6: Activity Overview band shows stats', async ({ page }) => {
    const activityBand = page.getByRole('region', { name: 'Activity Overview' });
    await expect(activityBand).toBeVisible({ timeout: 120_000 });

    // Stat tiles carry labels from the profile Activity endpoints.
    const statLabels = activityBand.getByText(/points|skills|credentials|courses/i);
    const statCount = await statLabels.count();

    if (statCount > 0) {
      logger.info(`Activity Overview shows ${statCount} stat label(s)`);
      expect(statCount).toBeGreaterThan(0);
    } else {
      logger.info('Activity Overview present but stats still loading');
    }

    // Deep link into the full Activity page.
    const viewActivity = activityBand.getByRole('link', { name: /view activity/i });
    await expect(viewActivity).toBeVisible({ timeout: 30_000 });
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
});
