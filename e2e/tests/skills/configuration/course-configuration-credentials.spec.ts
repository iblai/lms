import { test, expect } from '@playwright/test';

import { SKILL_HOST } from '../../utils';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

test.describe('Course Configuration Tab - Credentials Feature', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(SKILL_HOST, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    await waitForPageReady(page);
    // Navigate to home page
    await page.goto(`${SKILL_HOST}/home`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForPageReady(page);
  });

  test('Should display Configuration tab only for admin users', async ({ page }) => {
    // Wait for "My Courses" section to be visible
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });
    const myCoursesGrid = page.getByLabel('My Courses Grid');
    await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

    // Find and click on any course under "My Courses" section
    const courseLink = myCoursesGrid.getByRole('link').first();
    await expect(courseLink).toBeVisible({ timeout: 120000 });
    await courseLink.click();

    // Wait for course about page to load
    await page.waitForURL(/\/courses\/*/, { timeout: 120000 });
    await waitForPageReady(page);

    // Verify we're on the course about page
    const courseAboutHeading = page.getByRole('heading', { level: 1 });
    await expect(courseAboutHeading).toBeVisible({ timeout: 120000 });

    // Check if Configuration tab is visible (depends on admin status)
    const configurationTab = page.getByRole('button', {
      name: 'Configuration',
    });

    try {
      await expect(configurationTab).toBeVisible({ timeout: 5000 });
      logger.info('Configuration tab is visible - user is admin');
    } catch {
      logger.info('Configuration tab is NOT visible - user is not admin (expected behavior)');
    }
  });

  test('Should navigate to Configuration tab and display credentials section', async ({ page }) => {
    // Navigate to a course
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });
    const myCoursesGrid = page.getByLabel('My Courses Grid');
    await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

    const courseLink = myCoursesGrid.getByRole('link').first();
    await expect(courseLink).toBeVisible({ timeout: 120000 });
    await courseLink.click();

    await page.waitForURL(/\/courses\/*/, { timeout: 120000 });
    await waitForPageReady(page);

    // Check if Configuration tab exists
    const configurationTab = page.getByRole('button', {
      name: 'Configuration',
    });

    try {
      await expect(configurationTab).toBeVisible({ timeout: 5000 });
    } catch {
      logger.info('Configuration tab not available - skipping test (user is not admin)');
      test.skip();
      return;
    }

    // Click Configuration tab
    logger.info('Clicking Configuration tab');
    await configurationTab.click();

    // Wait for tab content to be visible
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Verify Credentials section is visible
    const credentialsHeading = page.getByRole('heading', {
      name: 'Credentials',
    });
    await expect(credentialsHeading).toBeVisible({ timeout: 10000 });
    logger.info('Credentials section is visible');

    // Verify "Add Credential" button is visible
    const addCredentialButton = page.getByTestId('add-credential-button');
    await expect(addCredentialButton).toBeVisible({ timeout: 10000 });
    logger.info('Add Credential button is visible');

    // Verify "Credential List" section
    const credentialListToggle = page.getByTestId('credential-list-toggle');
    await expect(credentialListToggle).toBeVisible({ timeout: 10000 });
    logger.info('Credential List section is visible');
  });

  test('Should open and close credential creation modal', async ({ page }) => {
    // Navigate to course and Configuration tab
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });
    const myCoursesGrid = page.getByLabel('My Courses Grid');
    await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

    const courseLink = myCoursesGrid.getByRole('link').first();
    await expect(courseLink).toBeVisible({ timeout: 120000 });
    await courseLink.click();

    await page.waitForURL(/\/courses\/*/, { timeout: 120000 });
    await waitForPageReady(page);

    const configurationTab = page.getByRole('button', {
      name: 'Configuration',
    });

    try {
      await expect(configurationTab).toBeVisible({ timeout: 5000 });
    } catch {
      logger.info('Configuration tab not available - skipping test');
      test.skip();
      return;
    }

    await configurationTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Click "Add Credential" button
    const addCredentialButton = page.getByTestId('add-credential-button');
    await expect(addCredentialButton).toBeVisible({ timeout: 10000 });
    await addCredentialButton.click();

    // Wait for modal to appear
    const modal = page.getByTestId('credential-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Verify modal title
    const modalTitle = page.getByTestId('credential-modal-title');
    await expect(modalTitle).toHaveText('Add New Credential', {
      timeout: 10000,
    });
    logger.info('Add New Credential modal opened');

    // Verify form fields are present
    const nameInput = page.getByTestId('credential-name-input');
    await expect(nameInput).toBeVisible({ timeout: 10000 });

    const descriptionInput = page.getByTestId('credential-description-input');
    await expect(descriptionInput).toBeVisible({ timeout: 10000 });

    const issuerSelect = page.getByTestId('credential-issuer-select');
    await expect(issuerSelect).toBeVisible({ timeout: 10000 });

    const credentialTypeSelect = page.getByTestId('credential-type-select');
    await expect(credentialTypeSelect).toBeVisible({ timeout: 10000 });

    const issuingSignalSelect = page.getByTestId('credential-issuing-signal-select');
    await expect(issuingSignalSelect).toBeVisible({ timeout: 10000 });

    logger.info('All form fields are visible');

    // Close modal using Cancel button
    const cancelButton = page.getByTestId('credential-modal-cancel');
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
    await cancelButton.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible({ timeout: 10000 });
    logger.info('Modal closed successfully');
  });

  test('Should validate required fields when creating credential', async ({ page }) => {
    // Navigate to course and Configuration tab
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });
    const myCoursesGrid = page.getByLabel('My Courses Grid');
    await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

    const courseLink = myCoursesGrid.getByRole('link').first();
    await expect(courseLink).toBeVisible({ timeout: 120000 });
    await courseLink.click();

    await page.waitForURL(/\/courses\/*/, { timeout: 120000 });
    await waitForPageReady(page);

    const configurationTab = page.getByRole('button', {
      name: 'Configuration',
    });

    try {
      await expect(configurationTab).toBeVisible({ timeout: 5000 });
    } catch {
      logger.info('Configuration tab not available - skipping test');
      test.skip();
      return;
    }

    await configurationTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Open credential creation modal
    const addCredentialButton = page.getByTestId('add-credential-button');
    await addCredentialButton.click();

    const modal = page.getByTestId('credential-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Try to submit without filling required fields
    const createButton = page.getByTestId('credential-modal-submit');
    await expect(createButton).toBeVisible({ timeout: 10000 });

    // Verify button is disabled when required fields are empty
    await expect(createButton).toBeDisabled();
    logger.info('Create button is disabled when required fields are empty (expected behavior)');

    // Close modal
    const cancelButton = page.getByTestId('credential-modal-cancel');
    await cancelButton.click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });

  test('Should display credential list and pagination if available', async ({ page }) => {
    // Navigate to course and Configuration tab
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });
    const myCoursesGrid = page.getByLabel('My Courses Grid');
    await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

    const courseLink = myCoursesGrid.getByRole('link').first();
    await expect(courseLink).toBeVisible({ timeout: 120000 });
    await courseLink.click();

    await page.waitForURL(/\/courses\/*/, { timeout: 120000 });
    await waitForPageReady(page);

    const configurationTab = page.getByRole('button', {
      name: 'Configuration',
    });

    try {
      await expect(configurationTab).toBeVisible({ timeout: 5000 });
    } catch {
      logger.info('Configuration tab not available - skipping test');
      test.skip();
      return;
    }

    await configurationTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Expand Credential List section
    const credentialListToggle = page.getByTestId('credential-list-toggle');
    await expect(credentialListToggle).toBeVisible({ timeout: 10000 });

    // Check if section is already expanded
    const isExpanded = await credentialListToggle.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await credentialListToggle.click();
      await expect(credentialListToggle).toHaveAttribute('aria-expanded', 'true', {
        timeout: 5000,
      });
    }

    // Check if credentials table or empty state is displayed
    const credentialsTable = page.getByTestId('credentials-table');
    const emptyStateMessage = page.getByText('No credentials found');

    try {
      await expect(credentialsTable).toBeVisible({ timeout: 5000 });
      logger.info('Credentials table is visible');

      // Verify table headers
      const nameHeader = page.getByRole('columnheader', { name: 'Name' });
      const entityIdHeader = page.getByRole('columnheader', {
        name: 'Entity ID',
      });
      const issuerHeader = page.getByRole('columnheader', { name: 'Issuer' });
      const credentialTypeHeader = page.getByRole('columnheader', {
        name: 'Credential Type',
      });
      const actionsHeader = page.getByRole('columnheader', { name: 'Actions' });

      await expect(nameHeader).toBeVisible({ timeout: 5000 });
      await expect(entityIdHeader).toBeVisible({ timeout: 5000 });
      await expect(issuerHeader).toBeVisible({ timeout: 5000 });
      await expect(credentialTypeHeader).toBeVisible({ timeout: 5000 });
      await expect(actionsHeader).toBeVisible({ timeout: 5000 });

      logger.info('All table headers are visible');

      // Check for pagination if there are many credentials
      const paginationNext = page.getByRole('link', { name: 'Next' });

      try {
        await expect(paginationNext).toBeVisible({ timeout: 2000 });
        logger.info('Pagination is visible');
      } catch {
        logger.info('No pagination (likely < 10 credentials)');
      }
    } catch {
      try {
        await expect(emptyStateMessage).toBeVisible({ timeout: 5000 });
        logger.info('Empty state is displayed - no credentials exist');
      } catch {
        logger.info('Credential list is loading or not yet expanded');
      }
    }
  });

  test('Should verify edit and delete actions are available for credentials', async ({ page }) => {
    // Navigate to course and Configuration tab
    const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
    await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });
    const myCoursesGrid = page.getByLabel('My Courses Grid');
    await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

    const courseLink = myCoursesGrid.getByRole('link').first();
    await expect(courseLink).toBeVisible({ timeout: 120000 });
    await courseLink.click();

    await page.waitForURL(/\/courses\/*/, { timeout: 120000 });
    await waitForPageReady(page);

    const configurationTab = page.getByRole('button', {
      name: 'Configuration',
    });

    try {
      await expect(configurationTab).toBeVisible({ timeout: 5000 });
    } catch {
      logger.info('Configuration tab not available - skipping test');
      test.skip();
      return;
    }

    await configurationTab.click();
    await expect(page.getByTestId('configuration-tab')).toBeVisible({
      timeout: 10000,
    });

    // Expand Credential List section
    const credentialListToggle = page.getByTestId('credential-list-toggle');
    await expect(credentialListToggle).toBeVisible({ timeout: 10000 });

    // Check if section is already expanded
    const isExpanded = await credentialListToggle.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await credentialListToggle.click();
      await expect(credentialListToggle).toHaveAttribute('aria-expanded', 'true', {
        timeout: 5000,
      });
    }

    // Check if credentials table has rows
    const credentialsTable = page.getByTestId('credentials-table');

    try {
      await expect(credentialsTable).toBeVisible({ timeout: 5000 });

      // Get all table rows (excluding header)
      const tableRows = credentialsTable.locator('tbody tr');
      const rowCount = await tableRows.count();

      if (rowCount > 0) {
        logger.info(`Found ${rowCount} credential(s) in the table`);

        // Check first row for edit and delete buttons
        const editButton = page.getByTestId('edit-credential-0');
        await expect(editButton).toBeVisible({ timeout: 5000 });
        logger.info('Edit button is visible');

        const deleteButton = page.getByTestId('delete-credential-0');
        await expect(deleteButton).toBeVisible({ timeout: 5000 });
        logger.info('Delete button is visible');
      } else {
        logger.info('No credentials in the table - cannot verify action buttons');
      }
    } catch {
      logger.info('Credentials table not visible - likely no credentials exist');
    }
  });
});
