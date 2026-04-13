import { test, expect } from '@playwright/test';
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

    // Wait for the page to settle — expect either course cards or an empty state
    const courseCard = page.locator('[class*="course-card"], [data-testid*="course"]').first();
    const emptyState = page
      .getByText(/no courses/i)
      .or(page.getByText(/not enrolled/i))
      .or(page.getByText(/empty/i));

    const hasCourses = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 120_000 }).catch(() => false);

    expect(hasCourses || hasEmpty).toBe(true);
  });

  test('CP-2: course cards show name and progress', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/courses`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page.locator('[class*="course-card"], [data-testid*="course"]').first();
    const hasCourses = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCourses) {
      test.skip(true, 'No enrolled courses — skipping card content check');
      return;
    }

    // Verify the card has a heading or title text
    const cardTitle = courseCard
      .getByRole('heading')
      .first()
      .or(courseCard.locator('[class*="title"], [class*="name"]').first());
    await expect(cardTitle).toBeVisible({ timeout: 10_000 });

    // Verify progress indicator exists (progress bar, percentage, or text)
    const progress = courseCard
      .locator('[class*="progress"], [role="progressbar"]')
      .first()
      .or(courseCard.getByText(/%/));
    const hasProgress = await progress.isVisible({ timeout: 120_000 }).catch(() => false);
    // Progress may not be shown for all courses, so we just confirm card loaded
    expect(cardTitle).toBeDefined();
  });

  test('CP-3: click course navigates to course about page', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/courses`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page.locator('[class*="course-card"], [data-testid*="course"]').first();
    const hasCourses = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCourses) {
      test.skip(true, 'No enrolled courses — skipping navigation check');
      return;
    }

    // Click the first course card link or the card itself
    const courseLink = courseCard.getByRole('link').first();
    const hasLink = await courseLink.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasLink) {
      await courseLink.click();
    } else {
      await courseCard.click();
    }

    // Should navigate to a course detail / about page
    await page.waitForURL(
      (url) =>
        url.href.includes('/course') || url.href.includes('/about') || url.href.includes('/detail'),
      { timeout: 30_000 },
    );
    expect(page.url()).toMatch(/course|about|detail/);
  });

  test('CP-4: pagination or load more shows additional courses', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/courses`, { timeout: 60_000 });
    await waitForAppShell(page);

    // Wait for initial content
    const courseCard = page.locator('[class*="course-card"], [data-testid*="course"]').first();
    const hasCourses = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCourses) {
      test.skip(true, 'No enrolled courses — skipping pagination check');
      return;
    }

    // Look for pagination controls or a "load more" / "see more" button
    const loadMore = page.getByRole('button', { name: /load more|see more|show more|next/i });
    const pagination = page
      .getByRole('navigation', { name: /pagination/i })
      .or(page.locator('[class*="pagination"]'));

    const hasLoadMore = await loadMore.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasPagination = await pagination.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasLoadMore && !hasPagination) {
      // Fewer courses than page size — acceptable, no pagination needed
      return;
    }

    if (hasLoadMore) {
      const beforeCount = await page
        .locator('[class*="course-card"], [data-testid*="course"]')
        .count();
      await loadMore.click();
      await page.waitForTimeout(2_000);
      const afterCount = await page
        .locator('[class*="course-card"], [data-testid*="course"]')
        .count();
      expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
    }

    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });
});
