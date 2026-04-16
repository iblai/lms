import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 18: Analytics Content', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
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

    // Navigate to the Courses tab
    const coursesTab = page.getByRole('tab', { name: 'Courses', exact: true });
    const hasCoursesTab = await coursesTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!hasCoursesTab) {
      test.skip(true, 'Courses tab not visible — skipping analytics content journey');
      return;
    }
    await coursesTab.click();
    // Wait for the Courses tab to be selected (Radix UI sets data-state="active" on the selected tab)
    await expect(coursesTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });
    logger.info('Navigated to Courses analytics tab');
  });

  test('CP-1: Courses page loads with stat cards', async ({ page }) => {
    logger.info('CP-1: Checking courses stat cards');

    // Stat cards have aria-label="${title} mini card" (loaded), "${title} mini card loading"
    // (skeleton), or "${title} mini card value" (with value). Use starts-with selector to
    // match any state.
    const statCardPrefixes = [
      'Active Courses mini card',
      'Total Courses mini card',
      'Enrollments mini card',
      'Total Learners mini card',
    ];

    for (const prefix of statCardPrefixes) {
      const card = page.locator(`[aria-label^="${prefix}"]`);
      const isVisible = await card
        .first()
        .isVisible({ timeout: 120_000 })
        .catch(() => false);
      expect(isVisible, `Stat card "${prefix}" should be visible`).toBe(true);
      logger.info(`Stat card visible: ${prefix}`);
    }
  });

  test('CP-2: Courses table is visible with search input', async ({ page }) => {
    logger.info('CP-2: Checking courses table and search input');

    const coursesTable = page.getByLabel('Courses table');
    const isTableVisible = await coursesTable.isVisible({ timeout: 120_000 }).catch(() => false);
    expect(isTableVisible, 'Courses table should be visible').toBe(true);
    logger.info('Courses table is visible');

    const searchInput = page.getByLabel('Search courses');
    const isSearchVisible = await searchInput.isVisible({ timeout: 120_000 }).catch(() => false);
    expect(isSearchVisible, 'Search courses input should be visible').toBe(true);
    logger.info('Search courses input is visible');
  });

  test('CP-3: Click course row navigates to course detail', async ({ page }) => {
    logger.info('CP-3: Clicking a course row to navigate to detail');

    const coursesTable = page.getByLabel('Courses table');
    const isTableVisible = await coursesTable.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isTableVisible) {
      test.skip(true, 'Courses table not visible — skipping row click test');
      return;
    }

    const courseRow = page.getByRole('button').filter({ hasText: /./ }).first();
    // Prefer rows with the specific aria pattern for course detail navigation
    const detailRows = page.locator('[role="button"][aria-label^="View details for "]');
    const hasDetailRows = await detailRows
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasDetailRows) {
      test.skip(true, 'No course rows with "View details for" aria-label found');
      return;
    }

    const firstRow = detailRows.first();
    const rowLabel = await firstRow.getAttribute('aria-label');
    logger.info(`Clicking course row: ${rowLabel}`);

    const beforeUrl = page.url();
    await firstRow.click();
    await page.waitForURL((url) => url.href.includes('/analytics/courses/'), { timeout: 30_000 });

    const afterUrl = page.url();
    expect(afterUrl).toContain('/analytics/courses/');
    expect(afterUrl).not.toBe(beforeUrl);
    logger.info(`Navigated to course detail: ${afterUrl}`);
  });

  test('CP-4: Course detail shows enrollments table and back button', async ({ page }) => {
    logger.info('CP-4: Verifying course detail page');

    const detailRows = page.locator('[role="button"][aria-label^="View details for "]');
    const hasDetailRows = await detailRows
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasDetailRows) {
      test.skip(true, 'No course rows available to navigate to detail');
      return;
    }

    await detailRows.first().click();
    await page.waitForURL((url) => url.href.includes('/analytics/courses/'), { timeout: 30_000 });
    logger.info('Arrived at course detail page');

    const backButton = page.getByLabel('Go back to courses list');
    const isBackVisible = await backButton.isVisible({ timeout: 120_000 }).catch(() => false);
    expect(isBackVisible, 'Back button "Go back to courses list" should be visible').toBe(true);
    logger.info('Back button is visible');

    const enrollmentsTable = page.getByLabel('Course enrollments table');
    const isTableVisible = await enrollmentsTable
      .isVisible({ timeout: 120_000 })
      .catch(() => false);
    expect(isTableVisible, 'Course enrollments table should be visible').toBe(true);
    logger.info('Course enrollments table is visible');
  });

  test('CP-5: Programs page loads with stat cards', async ({ page }) => {
    logger.info('CP-5: Navigating to Programs tab and checking stat cards');

    const programsTab = page.getByRole('tab', { name: 'Programs', exact: true });
    const hasProgramsTab = await programsTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!hasProgramsTab) {
      test.skip(true, 'Programs tab not visible');
      return;
    }

    await programsTab.click();
    // Wait for the Programs tab to be selected (Radix UI sets data-state="active" on the selected tab)
    await expect(programsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });
    logger.info('Navigated to Programs analytics tab');

    // Stat cards have aria-label="${title} mini card" (loaded), "${title} mini card loading"
    // (skeleton), or "${title} mini card value" (with value). Use starts-with selector to
    // match any state.
    const statCardPrefixes = [
      'Active Programs mini card',
      'Total Programs mini card',
      'Enrollments mini card',
      'Total Learners mini card',
    ];

    for (const prefix of statCardPrefixes) {
      const card = page.locator(`[aria-label^="${prefix}"]`);
      const isVisible = await card
        .first()
        .isVisible({ timeout: 120_000 })
        .catch(() => false);
      expect(isVisible, `Stat card "${prefix}" should be visible`).toBe(true);
      logger.info(`Stat card visible: ${prefix}`);
    }
  });

  test('CP-6: Programs table is visible with search input', async ({ page }) => {
    logger.info('CP-6: Checking programs table and search input');

    const programsTab = page.getByRole('tab', { name: 'Programs', exact: true });
    const hasProgramsTab = await programsTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!hasProgramsTab) {
      test.skip(true, 'Programs tab not visible');
      return;
    }

    await programsTab.click();
    // Wait for the Programs tab to be selected (Radix UI sets data-state="active" on the selected tab)
    await expect(programsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    const programsTable = page.getByLabel('Programs table');
    const isTableVisible = await programsTable.isVisible({ timeout: 120_000 }).catch(() => false);
    expect(isTableVisible, 'Programs table should be visible').toBe(true);
    logger.info('Programs table is visible');

    const searchInput = page.getByLabel('Search programs');
    const isSearchVisible = await searchInput.isVisible({ timeout: 120_000 }).catch(() => false);
    expect(isSearchVisible, 'Search programs input should be visible').toBe(true);
    logger.info('Search programs input is visible');
  });

  test('CP-7: Click program row navigates to program detail', async ({ page }) => {
    logger.info('CP-7: Clicking a program row to navigate to detail');

    const programsTab = page.getByRole('tab', { name: 'Programs', exact: true });
    const hasProgramsTab = await programsTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!hasProgramsTab) {
      test.skip(true, 'Programs tab not visible');
      return;
    }

    await programsTab.click();
    // Wait for the Programs tab to be selected (Radix UI sets data-state="active" on the selected tab)
    await expect(programsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    const programsTable = page.getByLabel('Programs table');
    const isTableVisible = await programsTable.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isTableVisible) {
      test.skip(true, 'Programs table not visible — skipping row click test');
      return;
    }

    const detailRows = page.locator('[role="button"][aria-label^="View details for "]');
    const hasDetailRows = await detailRows
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasDetailRows) {
      test.skip(true, 'No program rows with "View details for" aria-label found');
      return;
    }

    const firstRow = detailRows.first();
    const rowLabel = await firstRow.getAttribute('aria-label');
    logger.info(`Clicking program row: ${rowLabel}`);

    const beforeUrl = page.url();
    await firstRow.click();
    await page.waitForURL((url) => url.href.includes('/analytics/programs/'), { timeout: 30_000 });

    const afterUrl = page.url();
    expect(afterUrl).toContain('/analytics/programs/');
    expect(afterUrl).not.toBe(beforeUrl);
    logger.info(`Navigated to program detail: ${afterUrl}`);
  });

  test('CP-8: Time filter works on courses chart', async ({ page }) => {
    logger.info('CP-8: Testing time filter on Course Overtime chart card');

    const chartCard = page.getByLabel('Course Overtime chart card');
    const isChartVisible = await chartCard.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isChartVisible) {
      test.skip(true, 'Course Overtime chart card not visible');
      return;
    }

    logger.info('Course Overtime chart card is visible');

    // TimeFilter buttons live inside the chart card
    const timeFilterButtons = chartCard.getByRole('button');
    const hasButtons = await timeFilterButtons
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasButtons) {
      test.skip(true, 'No TimeFilter buttons found inside Course Overtime chart card');
      return;
    }

    const buttonCount = await timeFilterButtons.count();
    logger.info(`Found ${buttonCount} time filter button(s) in chart card`);
    expect(buttonCount).toBeGreaterThan(0);

    // Click the second button if available, otherwise click the first
    const targetButton = buttonCount > 1 ? timeFilterButtons.nth(1) : timeFilterButtons.first();
    const buttonText = await targetButton.textContent();
    logger.info(`Clicking time filter button: "${buttonText}"`);
    await targetButton.click();

    // Chart card should still be visible after filter change
    await expect(chartCard).toBeVisible({ timeout: 120_000 });
    logger.info('Chart card remains visible after time filter change');

    expect(page.url()).toContain('/analytics');
  });
});
