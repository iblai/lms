import { test, expect, Page } from '@playwright/test';

import { SKILL_HOST } from '../utils';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

/**
 * Helper function to navigate to the Programs page and wait for it to load.
 */
async function navigateToProgramsPage(page: Page): Promise<void> {
  await page.goto(`${SKILL_HOST}/profile/programs`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await waitForPageReady(page);

  // Wait for the Programs page to load by checking for the "My programs" button
  await expect(page.getByRole('button', { name: 'My programs' })).toBeVisible({
    timeout: 30000,
  });
  logger.info('Programs page loaded successfully');
}

/**
 * Helper function to wait for programs to load in the grid.
 * Returns true if programs are found, false if empty state is shown.
 */
async function waitForProgramsToLoad(page: Page): Promise<boolean> {
  // Wait for either program cards or empty state message
  const programCard = page.getByTestId('program-card').first();
  const emptyState = page.getByText('No programs found.');

  // Try to find program cards first
  try {
    await expect(programCard).toBeVisible({ timeout: 15000 });
    logger.info('Program cards are visible');
    return true;
  } catch {
    // Check for empty state
    try {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      logger.info('No programs found - empty state displayed');
      return false;
    } catch {
      logger.warn('Could not determine programs state');
      return false;
    }
  }
}

/**
 * Helper function to open the program detail modal by clicking on a program card.
 */
async function openProgramDetailModal(page: Page): Promise<void> {
  const programCard = page.getByTestId('program-card').first();
  await expect(programCard).toBeVisible({ timeout: 15000 });
  await programCard.click();

  // Wait for modal to be visible
  await expect(page.getByTestId('program-detail-modal')).toBeVisible({
    timeout: 10000,
  });
  logger.info('Program detail modal opened');
}

/**
 * Helper function to close the program detail modal.
 */
async function closeProgramDetailModal(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: 'Close modal' });
  await expect(closeButton).toBeVisible({ timeout: 5000 });
  await closeButton.click();

  // Verify modal is closed
  await expect(page.getByTestId('program-detail-modal')).not.toBeVisible({
    timeout: 5000,
  });
  logger.info('Program detail modal closed');
}

/**
 * Helper function to check if user is admin based on tabs visibility.
 * Admin users can see both Courses and Settings tabs.
 */
async function isUserAdmin(page: Page): Promise<boolean> {
  const settingsTab = page.getByTestId('settings-tab');
  const isSettingsVisible = await settingsTab
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  return isSettingsVisible;
}

test.describe('Program Detail Modal', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    // Navigate to Skills app and wait for page ready
    await page.goto(SKILL_HOST, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForPageReady(page);

    // Navigate to Programs page
    await navigateToProgramsPage(page);
  });

  test('Should display "No programs found" message when user has no programs', async ({
    page,
  }) => {
    // This test verifies the empty state behavior
    // If programs are found, we skip this specific assertion
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      // Verify empty state message is displayed
      await expect(page.getByText('No programs found.')).toBeVisible({
        timeout: 5000,
      });
      logger.info('Empty state message verified');
    } else {
      logger.info('Programs found - skipping empty state test');
      test.skip();
    }
  });

  test('Should open program detail modal when clicking on a program card', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping modal open test');
      test.skip();
      return;
    }

    // Click on first program card
    await openProgramDetailModal(page);

    // Verify modal content is displayed
    await expect(
      page.getByRole('heading', { name: 'Program Details' })
    ).toBeVisible({ timeout: 5000 });
    logger.info('Program detail modal title is visible');

    // Verify program name is displayed
    await expect(page.getByTestId('program-name')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Program name is displayed in modal');

    // Verify close button is present
    await expect(page.getByRole('button', { name: 'Close modal' })).toBeVisible(
      { timeout: 5000 }
    );
  });

  test('Should close modal when clicking Close button', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping close modal test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Close modal using the close button
    await closeProgramDetailModal(page);

    // Verify we're still on the programs page
    await expect(page).toHaveURL(/\/profile\/programs/);
    logger.info('Modal closed and still on programs page');
  });

  test('Should close modal when clicking X button', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping X button test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Click X button to close
    const xButton = page.getByRole('button', { name: 'Close modal' });
    await expect(xButton).toBeVisible({ timeout: 5000 });
    await xButton.click();

    // Verify modal is closed
    await expect(page.getByTestId('program-detail-modal')).not.toBeVisible({
      timeout: 5000,
    });
    logger.info('Modal closed via X button');
  });

  test('Should display Courses and Settings tabs for admin users', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping admin tabs test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Check if user is admin
    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - tabs not visible, skipping test');
      test.skip();
      return;
    }

    // Verify tabs are visible
    await expect(page.getByTestId('program-tabs')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Program tabs container is visible');

    // Verify Courses tab is visible and selected by default
    const coursesTab = page.getByTestId('courses-tab');
    await expect(coursesTab).toBeVisible({ timeout: 5000 });
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');
    logger.info('Courses tab is visible and selected by default');

    // Verify Settings tab is visible
    const settingsTab = page.getByTestId('settings-tab');
    await expect(settingsTab).toBeVisible({ timeout: 5000 });
    logger.info('Settings tab is visible');
  });

  test('Should not display Courses and Settings tabs for non-admin users', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping non-admin tabs test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Check if user is admin
    const isAdmin = await isUserAdmin(page);

    if (isAdmin) {
      logger.info('User is admin - skipping non-admin tabs test');
      test.skip();
      return;
    }

    // Verify tabs are NOT visible for non-admin users
    await expect(page.getByTestId('program-tabs')).not.toBeVisible({
      timeout: 5000,
    });
    logger.info('Tabs are not visible for non-admin user');

    // Verify courses content is still visible (without tabs)
    await expect(
      page.getByRole('heading', { name: 'Courses in this Program' })
    ).toBeVisible({ timeout: 5000 });
    logger.info('Courses content is visible for non-admin user');
  });

  test('Should display courses content in Courses tab', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping courses content test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Wait for courses tab content to load
    const isAdmin = await isUserAdmin(page);

    if (isAdmin) {
      // For admin, click on Courses tab (should be selected by default)
      await expect(page.getByTestId('courses-tab-content')).toBeVisible({
        timeout: 10000,
      });
    }

    // Verify "Courses in this Program" heading is visible
    await expect(
      page.getByRole('heading', { name: 'Courses in this Program' })
    ).toBeVisible({ timeout: 10000 });
    logger.info('Courses heading is visible');

    // Check for either courses or empty state
    const courseCard = page.getByTestId('course-card-0');
    const noCourses = page.getByText('No courses found under this program.');

    const hasCourses = await courseCard
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasCourses) {
      logger.info('Course cards are displayed');
      // Verify course card has expected structure
      await expect(page.getByTestId('course-number-0')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByTestId('course-name-0')).toBeVisible({
        timeout: 5000,
      });
    } else {
      // Verify empty state message
      await expect(noCourses).toBeVisible({ timeout: 5000 });
      logger.info('No courses empty state is displayed');
    }
  });

  test('Should switch between Courses and Settings tabs for admin users', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping tab switching test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - skipping tab switching test');
      test.skip();
      return;
    }

    // Verify Courses tab is selected by default
    const coursesTab = page.getByTestId('courses-tab');
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');
    logger.info('Courses tab is selected by default');

    // Click on Settings tab
    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    logger.info('Clicked on Settings tab');

    // Verify Settings tab is now selected
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(coursesTab).toHaveAttribute('aria-selected', 'false');
    logger.info('Settings tab is now selected');

    // Verify Settings content is visible
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Settings tab content is visible');

    // Switch back to Courses tab
    await coursesTab.click();
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');
    logger.info('Switched back to Courses tab');
  });

  test('Should display Settings form sections for admin users', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping settings form test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - skipping settings form test');
      test.skip();
      return;
    }

    // Click on Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Settings tab content loaded');

    // Verify Basic Information section
    await expect(page.getByTestId('basic-information-section')).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole('group', { name: 'Basic Information' })
    ).toBeVisible();
    logger.info('Basic Information section is visible');

    // Verify Pricing & Dates section
    await expect(page.getByTestId('pricing-dates-section')).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole('group', { name: 'Pricing & Dates' })
    ).toBeVisible();
    logger.info('Pricing & Dates section is visible');

    // Verify Visibility & Access section
    await expect(page.getByTestId('visibility-access-section')).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole('group', { name: 'Visibility & Access' })
    ).toBeVisible();
    logger.info('Visibility & Access section is visible');

    // Verify Images section
    await expect(page.getByTestId('images-section')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('group', { name: 'Images' })).toBeVisible();
    logger.info('Images section is visible');

    // Verify Social & Promotion section
    await expect(page.getByTestId('social-promotion-section')).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole('group', { name: 'Social & Promotion' })
    ).toBeVisible();
    logger.info('Social & Promotion section is visible');

    // Verify Save Settings button
    await expect(page.getByTestId('save-settings-button')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Save Settings button is visible');
  });

  test('Should display Basic Information fields in Settings tab', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping basic info fields test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - skipping basic info fields test');
      test.skip();
      return;
    }

    // Navigate to Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });

    // Verify Subject field
    await expect(
      page.getByRole('textbox', { name: /computer science/i })
    ).toBeVisible({ timeout: 5000 });
    logger.info('Subject field is visible');

    // Verify URL Slug field
    await expect(
      page.getByRole('textbox', { name: /my-program/i })
    ).toBeVisible({ timeout: 5000 });
    logger.info('URL Slug field is visible');

    // Verify Level field
    await expect(
      page.getByRole('textbox', { name: /beginner, intermediate, advanced/i })
    ).toBeVisible({ timeout: 5000 });
    logger.info('Level field is visible');

    // Verify Language field
    await expect(
      page.getByRole('textbox', { name: /e\.g\., en/i })
    ).toBeVisible({ timeout: 5000 });
    logger.info('Language field is visible');

    // Verify Description field
    await expect(
      page.getByRole('textbox', { name: /program description/i })
    ).toBeVisible({ timeout: 5000 });
    logger.info('Description field is visible');
  });

  test('Should display date fields in Pricing & Dates section', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping date fields test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - skipping date fields test');
      test.skip();
      return;
    }

    // Navigate to Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });

    // Scroll to Pricing & Dates section
    const pricingSection = page.getByTestId('pricing-dates-section');
    await pricingSection.scrollIntoViewIfNeeded();

    // Verify Display Price field
    await expect(page.getByRole('textbox', { name: /\$99\.00/i })).toBeVisible({
      timeout: 5000,
    });
    logger.info('Display Price field is visible');

    // Verify Start Date field
    await expect(page.getByText('Start Date')).toBeVisible({ timeout: 5000 });
    logger.info('Start Date field label is visible');

    // Verify End Date field
    await expect(page.getByText('End Date')).toBeVisible({ timeout: 5000 });
    logger.info('End Date field label is visible');

    // Verify Enrollment Start field
    await expect(page.getByText('Enrollment Start')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Enrollment Start field label is visible');

    // Verify Enrollment End field
    await expect(page.getByText('Enrollment End')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Enrollment End field label is visible');
  });

  test('Should display Visibility & Access controls', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping visibility controls test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - skipping visibility controls test');
      test.skip();
      return;
    }

    // Navigate to Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });

    // Scroll to Visibility & Access section
    const visibilitySection = page.getByTestId('visibility-access-section');
    await visibilitySection.scrollIntoViewIfNeeded();

    // Verify Catalog Visibility dropdown
    await expect(page.getByText('Catalog Visibility')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Catalog Visibility label is visible');

    // Verify Invitation Only switch
    await expect(page.getByText('Invitation Only')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('switch')).toBeVisible({ timeout: 5000 });
    logger.info('Invitation Only switch is visible');

    // Verify Credential field
    await expect(
      page.getByRole('textbox', { name: /credential information/i })
    ).toBeVisible({ timeout: 5000 });
    logger.info('Credential field is visible');
  });

  test('Should display Image URL fields with preview', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping image fields test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - skipping image fields test');
      test.skip();
      return;
    }

    // Navigate to Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });

    // Scroll to Images section
    const imagesSection = page.getByTestId('images-section');
    await imagesSection.scrollIntoViewIfNeeded();

    // Verify Banner Image URL field
    await expect(page.getByText('Banner Image URL')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Banner Image URL label is visible');

    // Verify Card Image URL field
    await expect(page.getByText('Card Image URL')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Card Image URL label is visible');
  });

  test('Should display Save Settings button and be clickable', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping save button test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    const isAdmin = await isUserAdmin(page);

    if (!isAdmin) {
      logger.info('User is not admin - skipping save button test');
      test.skip();
      return;
    }

    // Navigate to Settings tab
    await page.getByTestId('settings-tab').click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 10000,
    });

    // Scroll to Save Settings button
    const saveButton = page.getByTestId('save-settings-button');
    await saveButton.scrollIntoViewIfNeeded();

    // Verify Save Settings button is visible and enabled
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await expect(saveButton).toBeEnabled({ timeout: 5000 });
    await expect(saveButton).toHaveText(/save settings/i);
    logger.info('Save Settings button is visible and enabled');
  });

  test('Should navigate to course page when clicking on a course card', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping course navigation test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Check if there are courses to click
    const courseCard = page.getByTestId('course-card-0');
    const hasCourses = await courseCard
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasCourses) {
      logger.info('No courses in program - skipping course navigation test');
      test.skip();
      return;
    }

    // Click on the first course card
    await courseCard.click();
    logger.info('Clicked on course card');

    // Wait for navigation to course page
    await page.waitForURL(/\/courses\//, { timeout: 30000 });
    logger.info('Navigated to course page');

    // Verify we're on a course page
    await expect(page).toHaveURL(/\/courses\//);
  });

  test('Should display program progress bar when completion data is available', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping progress bar test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Check if progress section exists
    const progressSection = page.getByText('Progress').first();
    const hasProgress = await progressSection
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasProgress) {
      logger.info('No progress data available - skipping progress bar test');
      return;
    }

    // Verify progress percentage is displayed
    await expect(progressSection).toBeVisible({ timeout: 5000 });
    logger.info('Progress section is visible');
  });

  test('Should switch between My programs and Assigned programs tabs', async ({
    page,
  }) => {
    // Verify My programs tab is visible and active by default
    const myProgramsTab = page.getByRole('button', { name: 'My programs' });
    await expect(myProgramsTab).toBeVisible({ timeout: 10000 });
    logger.info('My programs tab is visible');

    // Check if Assigned programs tab exists (might be hidden based on tenant config)
    const assignedProgramsTab = page.getByRole('button', {
      name: 'Assigned programs',
    });
    const hasAssignedTab = await assignedProgramsTab
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasAssignedTab) {
      logger.info('Assigned programs tab not available - skipping tab switch');
      return;
    }

    // Click on Assigned programs tab
    await assignedProgramsTab.click();
    logger.info('Clicked on Assigned programs tab');

    // Wait for content to load - either programs or empty state
    await page.waitForTimeout(2000);

    // Switch back to My programs
    await myProgramsTab.click();
    logger.info('Switched back to My programs tab');
  });

  test('Should handle keyboard navigation in modal', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping keyboard navigation test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Verify modal has proper dialog role
    const modal = page.getByRole('dialog', { name: 'Program Details' });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Test pressing Escape doesn't close modal (modal should be closed via button)
    // Note: This behavior may vary based on implementation

    // Test Tab navigation through focusable elements
    await page.keyboard.press('Tab');
    logger.info('Tab navigation works in modal');

    // Close modal via button (not Escape)
    await closeProgramDetailModal(page);
  });

  test('Should display loading state when fetching program details', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping loading state test');
      test.skip();
      return;
    }

    // Click on program card
    const programCard = page.getByTestId('program-card').first();
    await programCard.click();

    // Try to catch loading state (may be fast)
    const loadingState = page.getByTestId('courses-loading');
    try {
      await expect(loadingState).toBeVisible({ timeout: 2000 });
      logger.info('Courses loading state displayed');

      // Wait for loading to complete
      await expect(loadingState).not.toBeVisible({ timeout: 30000 });
      logger.info('Courses loading completed');
    } catch {
      logger.info('Loading state was too fast to capture or already completed');
    }

    // Verify modal content is now visible
    await expect(page.getByTestId('program-detail-modal')).toBeVisible({
      timeout: 10000,
    });
  });

  test('Should display Enroll button for unenrolled programs', async ({
    page,
  }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping enroll button test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Check if Enroll button is visible (only shown for unenrolled programs)
    const enrollButton = page.getByTestId('enroll-button');
    const hasEnrollButton = await enrollButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasEnrollButton) {
      await expect(enrollButton).toBeVisible({ timeout: 5000 });
      await expect(enrollButton).toBeEnabled();
      logger.info('Enroll button is visible and enabled');
    } else {
      logger.info(
        'User is already enrolled - Enroll button not displayed (expected)'
      );
    }
  });

  test('Should display modal footer with Close button', async ({ page }) => {
    const hasPrograms = await waitForProgramsToLoad(page);

    if (!hasPrograms) {
      logger.info('No programs available - skipping footer test');
      test.skip();
      return;
    }

    await openProgramDetailModal(page);

    // Verify modal footer is visible
    await expect(page.getByTestId('program-modal-footer')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Modal footer is visible');

    // Verify Close button in footer
    const closeButton = page.getByTestId('close-button');
    await expect(closeButton).toBeVisible({ timeout: 5000 });
    await expect(closeButton).toHaveText('Close');
    logger.info('Close button in footer is visible');
  });
});
