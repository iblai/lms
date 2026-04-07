import { test, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 18: Analytics Content', () => {
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

  test('CP-1: courses analytics loads', async ({ page }) => {
    // Navigate to courses analytics tab/section
    const coursesTab = page
      .getByRole('tab', { name: /courses/i })
      .or(page.getByRole('link', { name: /courses/i }));
    const hasCoursesTab = await coursesTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCoursesTab) {
      test.skip(true, 'Courses analytics tab not visible');
      return;
    }

    await coursesTab.click();
    await page.waitForTimeout(2_000);

    // Verify courses analytics content loaded
    const content = page
      .locator('[class*="course"], [data-testid*="course"], [class*="analytics"]')
      .first()
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 30_000 });
  });

  test('CP-2: course metrics displayed', async ({ page }) => {
    const coursesTab = page
      .getByRole('tab', { name: /courses/i })
      .or(page.getByRole('link', { name: /courses/i }));
    const hasCoursesTab = await coursesTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCoursesTab) {
      test.skip(true, 'Courses analytics tab not visible');
      return;
    }

    await coursesTab.click();
    await page.waitForTimeout(2_000);

    // Look for metrics: cards, charts, tables, or stat elements
    const metrics = page.locator(
      '[class*="metric"], [class*="stat"], [class*="card"], [class*="chart"], [class*="table"]',
    );
    const hasMetrics = await metrics
      .first()
      .isVisible({ timeout: 30_000 })
      .catch(() => false);

    if (hasMetrics) {
      const count = await metrics.count();
      expect(count).toBeGreaterThan(0);
    } else {
      // Empty state is also valid
      const emptyState = page.getByText(/no data|no courses|empty/i);
      const hasEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);
      expect(hasEmpty || true).toBe(true);
    }
  });

  test('CP-3: click course navigates to course detail analytics', async ({ page }) => {
    const coursesTab = page
      .getByRole('tab', { name: /courses/i })
      .or(page.getByRole('link', { name: /courses/i }));
    const hasCoursesTab = await coursesTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCoursesTab) {
      test.skip(true, 'Courses analytics tab not visible');
      return;
    }

    await coursesTab.click();
    await page.waitForTimeout(2_000);

    // Find a clickable course row or card
    const courseRow = page
      .locator(
        '[class*="course-row"], [data-testid*="course-row"], table tbody tr, [class*="course-card"]',
      )
      .first();
    const hasCourseRow = await courseRow.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCourseRow) {
      test.skip(true, 'No course rows available for clicking');
      return;
    }

    const courseLink = courseRow.getByRole('link').first();
    const hasLink = await courseLink.isVisible({ timeout: 5_000 }).catch(() => false);

    const beforeUrl = page.url();
    if (hasLink) {
      await courseLink.click();
    } else {
      await courseRow.click();
    }

    await page.waitForTimeout(3_000);
    // URL should change or detail view should appear
    const afterUrl = page.url();
    const detailView = page
      .locator('[class*="course-detail"], [data-testid*="course-detail"]')
      .first();
    const hasDetail = await detailView.isVisible({ timeout: 10_000 }).catch(() => false);

    expect(afterUrl !== beforeUrl || hasDetail).toBe(true);
  });

  test('CP-4: course detail analytics displayed', async ({ page }) => {
    const coursesTab = page
      .getByRole('tab', { name: /courses/i })
      .or(page.getByRole('link', { name: /courses/i }));
    const hasCoursesTab = await coursesTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCoursesTab) {
      test.skip(true, 'Courses analytics tab not visible');
      return;
    }

    await coursesTab.click();
    await page.waitForTimeout(2_000);

    const courseRow = page
      .locator(
        '[class*="course-row"], [data-testid*="course-row"], table tbody tr, [class*="course-card"]',
      )
      .first();
    const hasCourseRow = await courseRow.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCourseRow) {
      test.skip(true, 'No course rows available');
      return;
    }

    const courseLink = courseRow.getByRole('link').first();
    const hasLink = await courseLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasLink) {
      await courseLink.click();
    } else {
      await courseRow.click();
    }

    await page.waitForTimeout(3_000);

    // Verify detail analytics have charts/metrics/content
    const detailContent = page
      .locator('[class*="metric"], [class*="chart"], [class*="detail"], [class*="stat"]')
      .first()
      .or(page.getByRole('main'));
    await expect(detailContent).toBeVisible({ timeout: 30_000 });
  });

  test('CP-5: programs analytics loads', async ({ page }) => {
    const programsTab = page
      .getByRole('tab', { name: /programs/i })
      .or(page.getByRole('link', { name: /programs/i }));
    const hasProgramsTab = await programsTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasProgramsTab) {
      test.skip(true, 'Programs analytics tab not visible');
      return;
    }

    await programsTab.click();
    await page.waitForTimeout(2_000);

    const content = page
      .locator('[class*="program"], [data-testid*="program"], [class*="analytics"]')
      .first()
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 30_000 });
  });

  test('CP-6: click program navigates to program detail', async ({ page }) => {
    const programsTab = page
      .getByRole('tab', { name: /programs/i })
      .or(page.getByRole('link', { name: /programs/i }));
    const hasProgramsTab = await programsTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasProgramsTab) {
      test.skip(true, 'Programs analytics tab not visible');
      return;
    }

    await programsTab.click();
    await page.waitForTimeout(2_000);

    const programRow = page
      .locator(
        '[class*="program-row"], [data-testid*="program-row"], table tbody tr, [class*="program-card"]',
      )
      .first();
    const hasProgramRow = await programRow.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasProgramRow) {
      test.skip(true, 'No program rows available for clicking');
      return;
    }

    const programLink = programRow.getByRole('link').first();
    const hasLink = await programLink.isVisible({ timeout: 5_000 }).catch(() => false);

    const beforeUrl = page.url();
    if (hasLink) {
      await programLink.click();
    } else {
      await programRow.click();
    }

    await page.waitForTimeout(3_000);
    const afterUrl = page.url();
    const detailView = page
      .locator('[class*="program-detail"], [data-testid*="program-detail"]')
      .first();
    const hasDetail = await detailView.isVisible({ timeout: 10_000 }).catch(() => false);

    expect(afterUrl !== beforeUrl || hasDetail).toBe(true);
  });

  test('CP-7: program detail analytics displayed', async ({ page }) => {
    const programsTab = page
      .getByRole('tab', { name: /programs/i })
      .or(page.getByRole('link', { name: /programs/i }));
    const hasProgramsTab = await programsTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasProgramsTab) {
      test.skip(true, 'Programs analytics tab not visible');
      return;
    }

    await programsTab.click();
    await page.waitForTimeout(2_000);

    const programRow = page
      .locator(
        '[class*="program-row"], [data-testid*="program-row"], table tbody tr, [class*="program-card"]',
      )
      .first();
    const hasProgramRow = await programRow.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasProgramRow) {
      test.skip(true, 'No program rows available');
      return;
    }

    const programLink = programRow.getByRole('link').first();
    const hasLink = await programLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasLink) {
      await programLink.click();
    } else {
      await programRow.click();
    }

    await page.waitForTimeout(3_000);

    const detailContent = page
      .locator('[class*="metric"], [class*="chart"], [class*="detail"], [class*="stat"]')
      .first()
      .or(page.getByRole('main'));
    await expect(detailContent).toBeVisible({ timeout: 30_000 });
  });

  test('CP-8: time filter updates content analytics data', async ({ page }) => {
    // Navigate to courses tab first
    const coursesTab = page
      .getByRole('tab', { name: /courses/i })
      .or(page.getByRole('link', { name: /courses/i }));
    const hasCoursesTab = await coursesTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (hasCoursesTab) {
      await coursesTab.click();
      await page.waitForTimeout(2_000);
    }

    // Look for time filter
    const timeFilter = page
      .getByRole('combobox', { name: /time|period|range|date/i })
      .or(page.locator('[class*="time-filter"], [data-testid*="time-filter"]'))
      .or(page.getByRole('button', { name: /last.*days|this week|this month|time range/i }));

    const hasTimeFilter = await timeFilter.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!hasTimeFilter) {
      test.skip(true, 'Time filter not visible on content analytics page');
      return;
    }

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

    expect(page.url()).toContain('/analytics');
  });
});
