import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Helper: Navigate to the Programs page and wait for it to load.
 */
async function navigateToProgramsPage(page: Page): Promise<void> {
  await gotoTenantPage(page, 'profile/programs', { timeout: 120000 });
  await waitForAppShell(page);

  // Wait for the My programs button to confirm page is ready
  await expect(page.getByRole('button', { name: 'My programs' })).toBeVisible({
    timeout: 30000,
  });
  logger.info('Programs page loaded');
}

/**
 * Helper: Wait for programs to load. Returns true if programs exist, false for empty state.
 */
async function waitForProgramsToLoad(page: Page): Promise<boolean> {
  const programCard = page.getByTestId('program-card').first();

  try {
    await expect(programCard).toBeVisible({ timeout: 20_000 });
    return true;
  } catch (error) {
    logger.info('Program cards not visible');
    return false;
  }
}

/**
 * Helper: Click the first program card and wait for the program detail page
 * (/programs/[program_id]) to render.
 */
async function openProgramDetailPage(page: Page): Promise<void> {
  const programCard = page.getByTestId('program-card').first();
  await expect(programCard).toBeVisible({ timeout: 15000 });
  await programCard.click();

  await page.waitForURL(/\/programs\/[^/]+$/, { timeout: 60_000 });
  await expect(page.getByTestId('program-detail-content')).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByTestId('navbar-page-title')).toBeVisible({
    timeout: 10_000,
  });
  logger.info('Program detail page opened');
}

/**
 * Helper: Check if user is admin / has tenant access based on Settings tab visibility.
 * Tabs only render when `program.platform_key === current_tenant && isAdmin`.
 */
async function isUserAdmin(page: Page): Promise<boolean> {
  return await page
    .getByTestId('settings-tab')
    .isVisible({ timeout: 10_000 })
    .catch(() => false);
}

/**
 * Journey 10: Profile Programs
 *
 * Validates the profile programs listing page and the navigation into the
 * new program detail page at /programs/[program_id]:
 *  1. My programs tab visible
 *  2. Program cards or empty state
 *  3. Click program → navigates to /programs/[program_id]
 *  4. Detail page displays program name and card image
 *  5. Browser back returns to /profile/programs
 *  6. Admin About/Courses/Settings tabs
 *  7. Settings form sections
 *  8. Tab switching About → Courses → Settings
 *  9. Course card navigation
 * 10. My/Assigned programs toggle
 */
test.describe('Journey 10: Profile Programs', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120000 });
    await waitForAppShell(page);
    await navigateToProgramsPage(page);
  });

  test('Checkpoint 1: My programs tab is visible', async ({ page }) => {
    const myProgramsTab = page.getByRole('button', { name: 'My programs' });
    await expect(myProgramsTab).toBeVisible({ timeout: 10000 });
    logger.info('"My programs" tab is visible');
  });

  test('Checkpoint 2: Program cards or empty state', async ({ page }) => {
    const skeleton = page.getByTestId('skeleton-multiplier').first();
    await expect(skeleton).not.toBeVisible({ timeout: 120_000 });
    logger.info('Skeleton multiplier no longer visible');

    const hasPrograms = await waitForProgramsToLoad(page);
    if (hasPrograms) {
      const cardCount = await page.getByTestId('program-card').count();
      expect(cardCount).toBeGreaterThan(0);
      logger.info(`Found ${cardCount} program card(s)`);
    } else {
      await expect(page.getByText('No programs found.')).toBeVisible({
        timeout: 5000,
      });
      logger.info('Empty state confirmed');
    }
  });

  test('Checkpoint 3: Click program navigates to /programs/[program_id]', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs — skipping navigation test');
      test.skip();
      return;
    }

    await openProgramDetailPage(page);

    expect(page.url()).toMatch(/\/programs\/[^/]+$/);
  });

  test('Checkpoint 4: Detail page shows program name and card image', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailPage(page);

    const name = page.getByTestId('navbar-page-title');
    await expect(name).toBeVisible({ timeout: 5000 });
    const programName = (await name.textContent())?.trim() ?? '';
    expect(programName.length).toBeGreaterThan(0);
    logger.info(`Program name: ${programName}`);

    await expect(page.getByTestId('program-page-card-image')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Checkpoint 5: Browser back returns to /profile/programs', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailPage(page);

    await page.goBack();
    await page.waitForURL(/\/profile\/programs/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'My programs' })).toBeVisible({
      timeout: 30_000,
    });
    logger.info('Returned to /profile/programs via browser back');
  });

  test('Checkpoint 6: Admin About, Courses, and Settings tabs', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailPage(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('Not admin / platform mismatch — tabs not visible, skipping');
      test.skip();
      return;
    }

    // Verify tabs container
    await expect(page.getByTestId('program-tabs')).toBeVisible({
      timeout: 5000,
    });

    // About is selected by default in the new page
    const aboutTab = page.getByTestId('about-tab');
    await expect(aboutTab).toBeVisible({ timeout: 5000 });
    await expect(aboutTab).toHaveAttribute('aria-selected', 'true');
    logger.info('About tab visible and selected by default');

    // Courses tab
    await expect(page.getByTestId('courses-tab')).toBeVisible({ timeout: 5000 });

    // Settings tab
    await expect(page.getByTestId('settings-tab')).toBeVisible({ timeout: 5000 });
    logger.info('Courses and Settings tabs visible');
  });

  test('Checkpoint 7: Settings form sections', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailPage(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('Not admin — skipping settings form test');
      test.skip();
      return;
    }

    // Click Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 30000,
    });

    // Verify form sections
    const sections = [
      { testId: 'basic-information-section', name: 'Basic Information' },
      { testId: 'pricing-dates-section', name: 'Pricing & Dates' },
      { testId: 'visibility-access-section', name: 'Visibility & Access' },
      { testId: 'images-section', name: 'Images' },
      { testId: 'social-promotion-section', name: 'Social & Promotion' },
    ];

    for (const section of sections) {
      const sectionEl = page.getByTestId(section.testId);
      const isVisible = await sectionEl.isVisible({ timeout: 120_000 }).catch(() => false);

      if (isVisible) {
        logger.info(`${section.name} section is visible`);
      } else {
        logger.info(`${section.name} section not found`);
      }
    }

    // Verify Save Settings button
    const saveButton = page.getByTestId('save-settings-button');
    const hasSave = await saveButton.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasSave) {
      logger.info('Save Settings button is visible');
    }
  });

  test('Checkpoint 8: Tab switching About → Courses → Settings', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailPage(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      test.skip();
      return;
    }

    const aboutTab = page.getByTestId('about-tab');
    const coursesTab = page.getByTestId('courses-tab');
    const settingsTab = page.getByTestId('settings-tab');

    // About is selected by default
    await expect(aboutTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('about-tab-content')).toBeVisible();

    // Switch to Courses
    await coursesTab.click();
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');
    await expect(aboutTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByTestId('courses-tab-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Switched to Courses tab');

    // Switch to Settings
    await settingsTab.click();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(coursesTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 30000,
    });
    logger.info('Switched to Settings tab');

    // Switch back to About
    await aboutTab.click();
    await expect(aboutTab).toHaveAttribute('aria-selected', 'true');
    await expect(settingsTab).toHaveAttribute('aria-selected', 'false');
    logger.info('Switched back to About tab');
  });

  test('Checkpoint 9: Course card navigation from program detail page', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailPage(page);

    // If tabs are rendered, the courses list lives under the Courses tab.
    if (
      await page
        .getByTestId('program-tabs')
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      await page.getByTestId('courses-tab').click();
      await expect(page.getByTestId('courses-tab-content')).toBeVisible({ timeout: 10_000 });
    }

    // Check for course cards
    const courseCard = page.getByTestId('course-card-0');
    const hasCourses = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCourses) {
      logger.info('No course cards in program — skipping navigation test');
      test.skip();
      return;
    }

    await courseCard.click();
    logger.info('Clicked on course card');

    // Wait for navigation to course page
    await page.waitForURL(/\/courses\//, { timeout: 30000 });
    await expect(page).toHaveURL(/\/courses\//);
    logger.info('Navigated to course page from program detail page');
  });

  test('Checkpoint 10: My programs / Assigned programs toggle', async ({ page }) => {
    // My programs tab should be visible
    const myProgramsTab = page.getByRole('button', { name: 'My programs' });
    await expect(myProgramsTab).toBeVisible({ timeout: 10000 });

    // Check for Assigned programs tab
    const assignedProgramsTab = page.getByRole('button', {
      name: 'Assigned programs',
    });
    const hasAssignedTab = await assignedProgramsTab
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasAssignedTab) {
      logger.info('Assigned programs tab not available — skipping toggle test');
      return;
    }

    // Switch to Assigned programs
    await assignedProgramsTab.click();
    logger.info('Clicked Assigned programs tab');

    // Wait for content update
    await page.waitForTimeout(2000);

    // Check for program cards or empty state in assigned view
    const assignedCard = page.getByTestId('program-card').first();
    const assignedEmpty = page.getByText(/no programs found/i);

    const hasAssignedCards = await assignedCard.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasAssignedEmpty = await assignedEmpty.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasAssignedCards) {
      logger.info('Assigned program cards found');
    } else if (hasAssignedEmpty) {
      logger.info('No assigned programs — empty state');
    }

    // Switch back to My programs
    await myProgramsTab.click();
    logger.info('Switched back to My programs');

    await page.waitForTimeout(1000);
  });
});
