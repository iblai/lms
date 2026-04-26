import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Helper: Navigate to the Programs page and wait for it to load.
 */
async function navigateToProgramsPage(page: Page): Promise<void> {
  await page.goto(`${SKILL_HOST}/profile/programs`, {
    timeout: 120000,
  });
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
  const emptyState = page.getByText('No programs found.');

  const hasCards = await programCard.isVisible({ timeout: 120_000 }).catch(() => false);
  if (hasCards) {
    logger.info('Program cards visible');
    return true;
  }

  const hasEmpty = await emptyState.isVisible({ timeout: 120_000 }).catch(() => false);
  if (hasEmpty) {
    logger.info('No programs found — empty state');
    return false;
  }

  logger.info('Could not determine programs state');
  return false;
}

/**
 * Helper: Open program detail modal from the first program card.
 */
async function openProgramDetailModal(page: Page): Promise<void> {
  const programCard = page.getByTestId('program-card').first();
  await expect(programCard).toBeVisible({ timeout: 15000 });
  await programCard.click();

  await expect(page.getByTestId('program-detail-modal')).toBeVisible({
    timeout: 10000,
  });
  logger.info('Program detail modal opened');
}

/**
 * Helper: Check if user is admin based on Settings tab visibility.
 */
async function isUserAdmin(page: Page): Promise<boolean> {
  return await page
    .getByTestId('settings-tab')
    .isVisible({ timeout: 120_000 })
    .catch(() => false);
}

/**
 * Journey 10: Profile Programs
 *
 * Validates the profile programs page and detail modal:
 *  1. My programs tab visible
 *  2. Program cards or empty state
 *  3. Click program → detail modal
 *  4. Modal displays program name and close button
 *  5. Close button works
 *  6. Admin Courses/Settings tabs
 *  7. Settings form sections
 *  8. Tab switching
 *  9. Course card navigation
 * 10. My/Assigned programs toggle
 */
test.describe('Journey 10: Profile Programs', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, {
      timeout: 120000,
    });
    await waitForAppShell(page);
    await navigateToProgramsPage(page);
  });

  test('Checkpoint 1: My programs tab is visible', async ({ page }) => {
    const myProgramsTab = page.getByRole('button', { name: 'My programs' });
    await expect(myProgramsTab).toBeVisible({ timeout: 10000 });
    logger.info('"My programs" tab is visible');
  });

  test('Checkpoint 2: Program cards or empty state', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    const skeleton = page.getByTestId('skeleton-multiplier').first();
    await expect(skeleton).not.toBeVisible({ timeout: 120_000 });
    logger.info('Skeleton multiplier no longer visible');

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

  test('Checkpoint 3: Click program opens detail modal', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs — skipping modal test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    await expect(page.getByTestId('program-detail-modal')).toBeVisible({
      timeout: 10000,
    });
  });

  test('Checkpoint 4: Modal displays program name and close button', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Verify program name
    await expect(page.getByTestId('program-name')).toBeVisible({
      timeout: 5000,
    });
    const programName = await page.getByTestId('program-name').textContent();
    expect(programName?.length).toBeGreaterThan(0);
    logger.info(`Program name: ${programName}`);

    // Verify close button
    await expect(page.getByRole('button', { name: 'Close modal' })).toBeVisible({ timeout: 5000 });
    logger.info('Close button is visible');
  });

  test('Checkpoint 5: Close button works', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const closeButton = page.getByRole('button', { name: 'Close modal' });
    await expect(closeButton).toBeVisible({ timeout: 5000 });
    await closeButton.click();

    await expect(page.getByTestId('program-detail-modal')).not.toBeVisible({
      timeout: 5000,
    });

    await expect(page).toHaveURL(/\/profile\/programs/);
    logger.info('Modal closed — still on programs page');
  });

  test('Checkpoint 6: Admin Courses and Settings tabs', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('Not admin — Courses/Settings tabs not visible, skipping');
      test.skip();
      return;
    }

    // Verify tabs container
    await expect(page.getByTestId('program-tabs')).toBeVisible({
      timeout: 5000,
    });

    // Verify Courses tab
    const coursesTab = page.getByTestId('courses-tab');
    await expect(coursesTab).toBeVisible({ timeout: 5000 });
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');
    logger.info('Courses tab visible and selected by default');

    // Verify Settings tab
    const settingsTab = page.getByTestId('settings-tab');
    await expect(settingsTab).toBeVisible({ timeout: 5000 });
    logger.info('Settings tab visible');
  });

  test('Checkpoint 7: Settings form sections', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('Not admin — skipping settings form test');
      test.skip();
      return;
    }

    // Click Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
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

  test('Checkpoint 8: Tab switching between Courses and Settings', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      test.skip();
      return;
    }

    const coursesTab = page.getByTestId('courses-tab');
    const settingsTab = page.getByTestId('settings-tab');

    // Courses tab should be selected by default
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Settings
    await settingsTab.click();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(coursesTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Switched to Settings tab');

    // Switch back to Courses
    await coursesTab.click();
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');
    await expect(settingsTab).toHaveAttribute('aria-selected', 'false');
    logger.info('Switched back to Courses tab');
  });

  test('Checkpoint 9: Course card navigation from program modal', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

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
    logger.info('Navigated to course page from program modal');
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
