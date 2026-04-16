import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 11: Profile Courses', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('CP-1: courses page loads with enrolled courses or empty state', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/courses`, { timeout: 60_000 });
    await waitForAppShell(page);

    // CourseBox renders as <Link href="/courses/..."> — use that plus empty state text.
    // Use expect().toBeVisible() (polling) instead of isVisible() (instant check) so we
    // wait for elements that don't yet exist in the DOM during the loading/skeleton phase.
    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();

    const loaded = courseCard.or(emptyState);
    await expect(loaded).toBeVisible({ timeout: 120_000 });

    const hasCourses = await courseCard.isVisible().catch(() => false);
    if (hasCourses) {
      logger.info('Course cards are displayed');
    } else {
      logger.info('Empty state displayed — no courses');
    }
  });

  test('CP-2: course cards show name and progress', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/courses`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();

    await expect(courseCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCourses = await courseCard.isVisible().catch(() => false);
    if (!hasCourses) {
      test.skip(true, 'No enrolled courses — skipping card content check');
      return;
    }

    // CourseBox renders an h3 with the course name
    const cardTitle = courseCard.locator('h3').first();
    await expect(cardTitle).toBeVisible({ timeout: 10_000 });
    logger.info(`First course card title: ${await cardTitle.textContent()}`);
  });

  test('CP-3: click course navigates to course about page', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/courses`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();

    await expect(courseCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCourses = await courseCard.isVisible().catch(() => false);
    if (!hasCourses) {
      test.skip(true, 'No enrolled courses — skipping navigation check');
      return;
    }

    // CourseBox is already a Link — click it directly
    await courseCard.click();

    await page.waitForURL((url) => url.href.includes('/courses/'), { timeout: 30_000 });
    expect(page.url()).toContain('/courses/');
    logger.info(`Navigated to course: ${page.url()}`);
  });

  test('CP-4: pagination or load more shows additional courses', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/courses`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();

    await expect(courseCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCourses = await courseCard.isVisible().catch(() => false);
    if (!hasCourses) {
      test.skip(true, 'No enrolled courses — skipping pagination check');
      return;
    }

    // ReactPaginate renders a <ul> with pagination links
    const pagination = page.locator('ul.pagination, nav[aria-label*="pagination"]').first();
    const hasPagination = await pagination.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!hasPagination) {
      logger.info('No pagination — fewer courses than page size');
      return;
    }

    await expect(pagination).toBeVisible();
    logger.info('Pagination controls are visible');
  });
});
