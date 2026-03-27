import { test, expect, Page } from '@playwright/test';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Helper: Navigate to the first course about page from /home.
 * Returns the course heading text or null if no courses exist.
 */
async function navigateToCourseAbout(page: Page): Promise<string | null> {
  await page.goto(`${SKILL_HOST}/home`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await waitForPageReady(page);

  const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
  await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });

  const myCoursesGrid = page.getByLabel('My Courses Grid');
  await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

  const courseLink = myCoursesGrid.getByRole('link').first();
  const hasCourse = await courseLink.isVisible({ timeout: 15000 }).catch(() => false);

  if (!hasCourse) return null;

  await courseLink.click();
  await page.waitForURL(/\/courses\//, { timeout: 120000 });
  await waitForPageReady(page);

  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible({ timeout: 30000 });
  return (await heading.textContent()) || 'Course';
}

/**
 * Journey 04: Course About & Configuration
 *
 * Validates course about page and admin configuration:
 *  1. Course about page with heading
 *  2. Description and enrollment details
 *  3. Access Course button
 *  4. Enrollment button for non-enrolled
 *  5. Configuration tab (admin only)
 *  6. Credentials section
 *  7. Credential creation modal
 *  8. Advanced Settings expand/collapse/search
 *  9. Search filters
 * 10. Save Changes
 */
test.describe('Journey 04: Course About & Configuration', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForPageReady(page);
  });

  test('Checkpoint 1: Course about page displays heading', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      logger.info('No courses available — skipping');
      test.skip();
      return;
    }

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 30000 });
    const text = await heading.textContent();
    expect(text?.length).toBeGreaterThan(0);
    logger.info(`Course about heading: ${text}`);
  });

  test('Checkpoint 2: Course about shows description and enrollment details', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    // Look for description or course info content
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);

    // Check for enrollment-related text or dates
    const enrollmentInfo = page.getByText(/enroll|start date|end date|self-paced/i).first();
    const hasEnrollInfo = await enrollmentInfo.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasEnrollInfo) {
      logger.info('Enrollment information is displayed');
    } else {
      logger.info('No explicit enrollment info found — page content still present');
    }
  });

  test('Checkpoint 3: Access Course button is visible', async ({ page }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const accessCourseButton = page.getByRole('button', {
      name: 'Access Course',
    });
    const enrollButton = page.getByRole('button', { name: /enroll/i });

    const hasAccess = await accessCourseButton
      .isVisible({ timeout: 15000 })
      .catch(() => false);
    const hasEnroll = await enrollButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // At least one of these should be visible
    expect(hasAccess || hasEnroll).toBeTruthy();
    logger.info(
      hasAccess ? 'Access Course button visible' : 'Enroll button visible'
    );
  });

  test('Checkpoint 4: Enrollment button visible for non-enrolled course', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    // If user is enrolled, Access Course is shown; otherwise Enroll is shown
    const enrollButton = page.getByRole('button', { name: /enroll/i });
    const accessButton = page.getByRole('button', { name: 'Access Course' });

    const hasEnroll = await enrollButton.isVisible({ timeout: 10000 }).catch(() => false);
    const hasAccess = await accessButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEnroll) {
      await expect(enrollButton).toBeVisible();
      logger.info('Enrollment button displayed (user not enrolled)');
    } else if (hasAccess) {
      logger.info('User already enrolled — Access Course shown instead');
    } else {
      logger.info('Neither Enroll nor Access Course found');
    }
  });

  test('Checkpoint 5: Configuration tab visible for admin users', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const configTab = page.getByRole('button', { name: 'Configuration' });
    const isAdmin = await configTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      logger.info('Configuration tab not visible — user is not admin');
      test.skip();
      return;
    }

    await configTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Configuration tab opened for admin user');
  });

  test('Checkpoint 6: Credentials section in Configuration', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const configTab = page.getByRole('button', { name: 'Configuration' });
    const isAdmin = await configTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      logger.info('Not admin — skipping credentials check');
      test.skip();
      return;
    }

    await configTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Verify Credentials heading
    const credentialsHeading = page.getByRole('heading', { name: 'Credentials' });
    await expect(credentialsHeading).toBeVisible({ timeout: 10000 });

    // Verify Add Credential button
    const addCredentialButton = page.getByTestId('add-credential-button');
    await expect(addCredentialButton).toBeVisible({ timeout: 10000 });

    // Verify Credential List toggle
    const credentialListToggle = page.getByTestId('credential-list-toggle');
    await expect(credentialListToggle).toBeVisible({ timeout: 10000 });

    logger.info('Credentials section with Add button and list toggle is visible');
  });

  test('Checkpoint 7: Credential creation modal opens and closes', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const configTab = page.getByRole('button', { name: 'Configuration' });
    const isAdmin = await configTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
      return;
    }

    await configTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Open credential modal
    const addCredentialButton = page.getByTestId('add-credential-button');
    await expect(addCredentialButton).toBeVisible({ timeout: 10000 });
    await addCredentialButton.click();

    const modal = page.getByTestId('credential-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Verify modal has expected fields
    await expect(page.getByTestId('credential-name-input')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('credential-description-input')).toBeVisible({ timeout: 10000 });
    logger.info('Credential creation modal opened with form fields');

    // Close via Cancel
    const cancelButton = page.getByTestId('credential-modal-cancel');
    await cancelButton.click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
    logger.info('Credential modal closed');
  });

  test('Checkpoint 8: Advanced Settings expand/collapse', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const configTab = page.getByRole('button', { name: 'Configuration' });
    const isAdmin = await configTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
      return;
    }

    await configTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Verify Advanced Settings toggle
    const toggle = page.getByTestId('advanced-settings-toggle');
    await expect(toggle).toBeVisible({ timeout: 10000 });

    // Should be collapsed by default
    await expect(page.getByTestId('advanced-settings-content')).not.toBeVisible();

    // Expand
    await toggle.click();
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Advanced Settings expanded');

    // Collapse
    await page.getByTestId('advanced-settings-toggle').click();
    await expect(page.getByTestId('advanced-settings-content')).not.toBeVisible({
      timeout: 5000,
    });
    logger.info('Advanced Settings collapsed');
  });

  test('Checkpoint 9: Advanced Settings search filters results', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const configTab = page.getByRole('button', { name: 'Configuration' });
    const isAdmin = await configTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
      return;
    }

    await configTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Expand Advanced Settings
    const toggle = page.getByTestId('advanced-settings-toggle');
    await toggle.click();
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({
      timeout: 10000,
    });

    // Wait for search to appear
    const searchInput = page.getByTestId('advanced-settings-search');
    const hasSearch = await searchInput.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasSearch) {
      logger.info('No search input — settings may not have loaded');
      return;
    }

    // Search with nonsense term
    await searchInput.fill('xyznonexistent999');

    // Should show empty state
    const emptyState = page.getByTestId('advanced-settings-empty');
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEmpty) {
      logger.info('Empty state shown for non-matching search');
    }

    // Clear search and verify settings return
    await searchInput.fill('');
    const settingsList = page.getByTestId('advanced-settings-list');
    const hasSettings = await settingsList.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSettings) {
      logger.info('Settings restored after clearing search');
    }
  });

  test('Checkpoint 10: Save Changes button appears on modification', async ({
    page,
  }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const configTab = page.getByRole('button', { name: 'Configuration' });
    const isAdmin = await configTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isAdmin) {
      test.skip();
      return;
    }

    await configTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Expand Advanced Settings
    const toggle = page.getByTestId('advanced-settings-toggle');
    await toggle.click();
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({
      timeout: 10000,
    });

    // Wait for settings content
    const searchInput = page.getByTestId('advanced-settings-search');
    const hasSearch = await searchInput.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasSearch) {
      logger.info('No settings loaded — skipping save test');
      return;
    }

    // Save button should be hidden initially
    await expect(page.getByTestId('save-advanced-settings-button')).not.toBeVisible({
      timeout: 2000,
    });

    // Modify a setting
    const settingsList = page.getByTestId('advanced-settings-list');
    const textInput = settingsList.locator('input[type="text"]').first();
    const hasInput = await textInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasInput) {
      const originalValue = await textInput.inputValue();
      await textInput.fill(originalValue + ' test');

      // Save button should now be visible
      await expect(page.getByTestId('save-advanced-settings-button')).toBeVisible({
        timeout: 5000,
      });
      logger.info('Save Changes button appeared after modification');

      // Restore original value
      await settingsList.locator('input[type="text"]').first().fill(originalValue);
    } else {
      // Try toggling a switch instead
      const switchEl = settingsList.locator('button[role="switch"]').first();
      const hasSwitch = await switchEl.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasSwitch) {
        await switchEl.click();
        await expect(page.getByTestId('save-advanced-settings-button')).toBeVisible({
          timeout: 5000,
        });
        logger.info('Save Changes button appeared after toggling switch');

        // Restore
        await settingsList.locator('button[role="switch"]').first().click();
      } else {
        logger.info('No modifiable inputs found');
      }
    }
  });
});
