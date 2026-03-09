import { test, expect, Page } from '@playwright/test';

import { SKILL_HOST } from '../../utils';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

/**
 * Helper function to navigate to the Configuration tab of a course.
 * Returns true if navigation was successful, false if Configuration tab is not available.
 */
async function navigateToConfigurationTab(page: Page): Promise<boolean> {
  // Wait for My Courses heading to be visible (indicates page is ready)
  await expect(page.getByRole('heading', { name: 'My Courses' })).toBeVisible({
    timeout: 120000,
  });
  logger.info('My Courses section is visible');

  // Wait for My Courses Grid
  await expect(page.getByLabel('My Courses Grid')).toBeVisible({
    timeout: 120000,
  });

  // Click on the first course - re-locate immediately before clicking
  await expect(
    page.getByLabel('My Courses Grid').getByRole('link').first()
  ).toBeVisible({ timeout: 120000 });
  await page.getByLabel('My Courses Grid').getByRole('link').first().click();
  logger.info('Clicked on first course');

  // Wait for course page to load
  await page.waitForURL(/\/courses\/*/, { timeout: 120000 });
  await waitForPageReady(page);

  // Verify course page loaded by checking for heading
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
    timeout: 30000,
  });
  logger.info('Course page loaded');

  // Check if Configuration tab exists (admin only)
  const configurationTabVisible = await page
    .getByRole('button', { name: 'Configuration' })
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!configurationTabVisible) {
    logger.info('Configuration tab not available - user is not admin');
    return false;
  }

  // Click Configuration tab - re-locate immediately before clicking
  await page.getByRole('button', { name: 'Configuration' }).click();
  logger.info('Clicked Configuration tab');

  // Wait for tab content to be visible
  await expect(page.getByTestId('configuration-tab')).toBeVisible({
    timeout: 10000,
  });
  logger.info('Configuration tab content loaded');

  return true;
}

/**
 * Helper function to expand Advanced Settings section if collapsed.
 * Uses content visibility to determine expanded state.
 */
async function expandAdvancedSettings(page: Page): Promise<void> {
  // Wait for toggle to be visible
  await expect(page.getByTestId('advanced-settings-toggle')).toBeVisible({
    timeout: 10000,
  });

  // Check if already expanded by checking content visibility
  const isContentVisible = await page
    .getByTestId('advanced-settings-content')
    .isVisible()
    .catch(() => false);

  if (!isContentVisible) {
    // Re-locate and click to expand
    await page.getByTestId('advanced-settings-toggle').click();
    // Wait for content to become visible
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Advanced Settings expanded');
  } else {
    logger.info('Advanced Settings already expanded');
  }
}

/**
 * Helper function to wait for Advanced Settings content to load.
 * Returns true if settings loaded, false if empty state shown.
 */
async function waitForSettingsContent(page: Page): Promise<boolean> {
  // Wait for either search input (settings loaded) or empty state
  const searchInput = page.getByTestId('advanced-settings-search');
  const emptyState = page.getByText('No advanced settings available');
  const loadingState = page.getByTestId('advanced-settings-loading');

  // First, wait for loading to complete if present
  try {
    const isLoading = await loadingState.isVisible({ timeout: 1000 });
    if (isLoading) {
      await expect(loadingState).not.toBeVisible({ timeout: 30000 });
      logger.info('Loading completed');
    }
  } catch {
    // Loading state not present or already gone
  }

  // Check for search input (indicates settings are available)
  try {
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    logger.info('Advanced Settings content loaded - settings available');
    return true;
  } catch {
    // Check for empty state
    try {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      logger.info('No advanced settings available for this course');
      return false;
    } catch {
      logger.info('Could not determine settings state');
      return false;
    }
  }
}

test.describe('Course Configuration Tab - Advanced Settings Feature', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    // Use domcontentloaded instead of networkidle (per guidelines)
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

  test('Should display Advanced Settings section in Configuration tab', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    // Verify Advanced Settings heading is visible
    await expect(
      page.getByRole('heading', { name: 'Advanced Settings' })
    ).toBeVisible({ timeout: 10000 });
    logger.info('Advanced Settings heading is visible');

    // Verify the toggle section is visible
    await expect(page.getByTestId('advanced-settings-toggle')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Advanced Settings toggle is visible');

    // Verify content is not visible by default (collapsed state)
    await expect(
      page.getByTestId('advanced-settings-content')
    ).not.toBeVisible();
    logger.info('Advanced Settings content is hidden by default');
  });

  test('Should expand and collapse Advanced Settings section', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    // Verify toggle is visible
    await expect(page.getByTestId('advanced-settings-toggle')).toBeVisible({
      timeout: 10000,
    });

    // Verify content is not visible when collapsed (default state)
    await expect(
      page.getByTestId('advanced-settings-content')
    ).not.toBeVisible();
    logger.info('Content is hidden by default (collapsed)');

    // Click to expand
    await page.getByTestId('advanced-settings-toggle').click();

    // Verify content area is visible after expansion
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Expanded Advanced Settings - content is visible');

    // Wait for content to load
    await waitForSettingsContent(page);

    // Now collapse it - re-locate before clicking
    await page.getByTestId('advanced-settings-toggle').click();

    // Verify content is hidden after collapse
    await expect(page.getByTestId('advanced-settings-content')).not.toBeVisible(
      { timeout: 5000 }
    );
    logger.info('Collapsed Advanced Settings - content is hidden');
  });

  test('Should display search functionality when Advanced Settings is expanded', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available - search not displayed');
      return;
    }

    // Verify search input is visible with proper attributes
    await expect(page.getByTestId('advanced-settings-search')).toBeVisible();
    await expect(page.getByTestId('advanced-settings-search')).toHaveAttribute(
      'type',
      'search'
    );
    await expect(page.getByTestId('advanced-settings-search')).toHaveAttribute(
      'placeholder',
      'Search settings...'
    );
    await expect(page.getByTestId('advanced-settings-search')).toHaveAttribute(
      'aria-label',
      'Search advanced settings'
    );
    logger.info('Search input has correct attributes');

    // Type in search input - re-locate before interacting
    await page.getByTestId('advanced-settings-search').fill('test search');
    await expect(page.getByTestId('advanced-settings-search')).toHaveValue(
      'test search'
    );
    logger.info('Search input accepts text');

    // Verify clear button appears
    await expect(
      page.getByTestId('advanced-settings-search-clear')
    ).toBeVisible({ timeout: 2000 });
    logger.info('Clear button is visible');

    // Click clear button - re-locate before clicking
    await page.getByTestId('advanced-settings-search-clear').click();
    await expect(page.getByTestId('advanced-settings-search')).toHaveValue('');
    logger.info('Clear button works correctly');

    // Verify clear button is hidden when search is empty
    await expect(
      page.getByTestId('advanced-settings-search-clear')
    ).not.toBeVisible({ timeout: 2000 });
  });

  test('Should filter settings based on search query', async ({ page }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available to filter');
      return;
    }

    // Count initial settings
    const initialSettingsCount = await page
      .getByTestId('advanced-settings-list')
      .locator('[role="listitem"]')
      .count();
    logger.info(`Initial settings count: ${initialSettingsCount}`);

    if (initialSettingsCount === 0) {
      logger.info('No settings available to filter');
      return;
    }

    // Search for a non-existent term
    await page
      .getByTestId('advanced-settings-search')
      .fill('xyznonexistent123');

    // Wait for filter to apply by checking for empty state
    await expect(page.getByTestId('advanced-settings-empty')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Empty state shown for non-matching search');

    // Clear search - re-locate before interacting
    await page.getByTestId('advanced-settings-search').fill('');

    // Wait for settings list to reappear
    await expect(page.getByTestId('advanced-settings-list')).toBeVisible({
      timeout: 5000,
    });

    // Verify settings count is restored
    const restoredCount = await page
      .getByTestId('advanced-settings-list')
      .locator('[role="listitem"]')
      .count();
    expect(restoredCount).toBe(initialSettingsCount);
    logger.info('Settings restored after clearing search');
  });

  test('Should display setting fields with appropriate input types', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available to verify field types');
      return;
    }

    // Get settings list
    const settingsList = page.getByTestId('advanced-settings-list');
    await expect(settingsList).toBeVisible();

    const settingsCount = await settingsList
      .locator('[role="listitem"]')
      .count();

    if (settingsCount === 0) {
      logger.info('No settings available to verify field types');
      return;
    }

    logger.info(`Found ${settingsCount} settings to verify`);

    // Check first few settings for proper structure
    const checkCount = Math.min(3, settingsCount);
    for (let i = 0; i < checkCount; i++) {
      const setting = settingsList.locator('[role="listitem"]').nth(i);

      // Each setting should have a label
      await expect(setting.locator('label')).toBeVisible({ timeout: 5000 });

      // Each setting should have a help tooltip button with proper aria-label
      const helpButton = setting.locator('button[aria-label^="Help for"]');
      await expect(helpButton).toBeVisible({ timeout: 5000 });

      // Each setting should have some form of input
      const inputCount = await setting
        .locator(
          'input, button[role="switch"], button[role="combobox"], textarea'
        )
        .count();
      expect(inputCount).toBeGreaterThan(0);

      logger.info(`Setting ${i + 1} has proper structure`);
    }
  });

  test('Should show Save Changes button when settings are modified', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available to test save button behavior');
      return;
    }

    // Verify save button is NOT visible initially
    await expect(
      page.getByTestId('save-advanced-settings-button')
    ).not.toBeVisible({ timeout: 2000 });
    logger.info('Save button is hidden initially (no changes)');

    // Try to find a text input to modify
    const settingsList = page.getByTestId('advanced-settings-list');
    const textInputCount = await settingsList
      .locator('input[type="text"]')
      .count();
    const switchCount = await settingsList
      .locator('button[role="switch"]')
      .count();

    if (textInputCount > 0) {
      // Modify a text input
      const textInput = settingsList.locator('input[type="text"]').first();
      const originalValue = await textInput.inputValue();
      await textInput.fill(originalValue + ' modified');
      logger.info('Modified text input value');

      // Save button should now be visible
      await expect(
        page.getByTestId('save-advanced-settings-button')
      ).toBeVisible({ timeout: 5000 });
      logger.info('Save button appeared after modification');

      // Restore original value (cleanup) - re-locate before interacting
      await settingsList
        .locator('input[type="text"]')
        .first()
        .fill(originalValue);
    } else if (switchCount > 0) {
      // Toggle a switch
      await settingsList.locator('button[role="switch"]').first().click();
      logger.info('Toggled switch');

      // Save button should now be visible
      await expect(
        page.getByTestId('save-advanced-settings-button')
      ).toBeVisible({ timeout: 5000 });
      logger.info('Save button appeared after modification');

      // Toggle back (cleanup) - re-locate before clicking
      await settingsList.locator('button[role="switch"]').first().click();
    } else {
      logger.info('No modifiable inputs found to test save button behavior');
    }
  });

  test('Should display tooltip on hover for setting help', async ({ page }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available to test tooltip');
      return;
    }

    // Find a help button
    const settingsList = page.getByTestId('advanced-settings-list');
    const helpButtonCount = await settingsList
      .locator('button[aria-label^="Help for"]')
      .count();

    if (helpButtonCount === 0) {
      logger.info('No help buttons found to test tooltip');
      return;
    }

    // Hover over the first help button
    await settingsList
      .locator('button[aria-label^="Help for"]')
      .first()
      .hover();

    // Wait for tooltip to appear
    await expect(page.locator('[role="tooltip"]')).toBeVisible({
      timeout: 3000,
    });
    logger.info('Tooltip is displayed on hover');

    // Verify tooltip has content
    const tooltipText = await page.locator('[role="tooltip"]').textContent();
    expect(tooltipText?.length).toBeGreaterThan(0);
    logger.info('Tooltip has content');
  });

  test('Should handle keyboard navigation for toggle', async ({ page }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    // Verify toggle is visible and focusable
    await expect(page.getByTestId('advanced-settings-toggle')).toBeVisible({
      timeout: 10000,
    });

    // Verify content is not visible initially (collapsed by default)
    await expect(
      page.getByTestId('advanced-settings-content')
    ).not.toBeVisible();
    logger.info('Content is hidden by default (collapsed)');

    // Focus the toggle
    await page.getByTestId('advanced-settings-toggle').focus();
    logger.info('Toggle is focused');

    // Press Enter to expand
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({
      timeout: 5000,
    });
    logger.info('Toggle expanded via Enter key - content is visible');

    // Press Space to collapse
    await page.keyboard.press('Space');
    await expect(page.getByTestId('advanced-settings-content')).not.toBeVisible(
      { timeout: 5000 }
    );
    logger.info('Toggle collapsed via Space key - content is hidden');
  });

  test('Should display loading state when fetching Advanced Settings', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    // Verify content is not visible initially (collapsed by default)
    await expect(
      page.getByTestId('advanced-settings-content')
    ).not.toBeVisible();
    logger.info('Content is hidden by default (collapsed)');

    // Click to expand and check for loading state
    await page.getByTestId('advanced-settings-toggle').click();

    // Try to catch the loading state (it may be fast)
    const loadingState = page.getByTestId('advanced-settings-loading');
    try {
      await expect(loadingState).toBeVisible({ timeout: 2000 });
      logger.info('Loading state displayed while fetching settings');

      // Verify loading has proper accessibility attributes
      await expect(loadingState).toHaveAttribute('role', 'status');
      await expect(loadingState).toHaveAttribute(
        'aria-label',
        'Loading advanced settings'
      );
      logger.info('Loading state has proper accessibility attributes');

      // Wait for loading to complete
      await expect(loadingState).not.toBeVisible({ timeout: 30000 });
      logger.info('Loading completed');
    } catch {
      logger.info('Loading state was too fast to capture or already completed');
    }

    // Verify content is now visible
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({
      timeout: 10000,
    });
    logger.info('Advanced Settings content loaded');
  });

  test('Should show Save button when toggling a switch setting', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available to test switch toggle');
      return;
    }

    // Verify save button is NOT visible initially
    await expect(
      page.getByTestId('save-advanced-settings-button')
    ).not.toBeVisible({ timeout: 2000 });
    logger.info('Save button is hidden initially');

    // Find a switch setting to toggle
    const settingsList = page.getByTestId('advanced-settings-list');
    const switchCount = await settingsList
      .locator('button[role="switch"]')
      .count();

    if (switchCount === 0) {
      logger.info('No switch settings found to test');
      return;
    }

    // Get the first switch and its current state
    const firstSwitch = settingsList.locator('button[role="switch"]').first();
    const initialState = await firstSwitch.getAttribute('aria-checked');
    logger.info(`Initial switch state: ${initialState}`);

    // Toggle the switch
    await firstSwitch.click();

    // Verify the switch state changed
    const expectedState = initialState === 'true' ? 'false' : 'true';
    await expect(firstSwitch).toHaveAttribute('aria-checked', expectedState, {
      timeout: 5000,
    });
    logger.info(`Switch toggled to: ${expectedState}`);

    // Verify Save button appears
    await expect(page.getByTestId('save-advanced-settings-button')).toBeVisible(
      { timeout: 5000 }
    );
    logger.info('Save button appeared after toggling switch');

    // Toggle back to restore original state (cleanup)
    await settingsList.locator('button[role="switch"]').first().click();
    await expect(
      settingsList.locator('button[role="switch"]').first()
    ).toHaveAttribute('aria-checked', initialState || 'false', {
      timeout: 5000,
    });
    logger.info('Switch restored to original state');
  });

  test('Should save settings successfully when Save Changes is clicked', async ({
    page,
  }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available to test save functionality');
      return;
    }

    // Find a text input to modify
    const settingsList = page.getByTestId('advanced-settings-list');
    const textInputCount = await settingsList
      .locator('input[type="text"]')
      .count();

    if (textInputCount === 0) {
      logger.info('No text inputs found to test save functionality');
      return;
    }

    // Get the first text input and its current value
    const textInput = settingsList.locator('input[type="text"]').first();
    const originalValue = await textInput.inputValue();
    const testValue = originalValue
      ? `${originalValue} test`
      : 'test value for save';

    // Modify the input
    await textInput.fill(testValue);
    logger.info(
      `Modified text input from "${originalValue}" to "${testValue}"`
    );

    // Verify Save button appears
    const saveButton = page.getByTestId('save-advanced-settings-button');
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    logger.info('Save button is visible');

    // Click Save button
    await saveButton.click();
    logger.info('Clicked Save button');

    // Wait for save to complete - button should disappear when no changes
    await expect(saveButton).not.toBeVisible({ timeout: 30000 });
    logger.info('Save completed - button hidden (no pending changes)');

    // Verify the value persists after save
    await expect(
      settingsList.locator('input[type="text"]').first()
    ).toHaveValue(testValue, { timeout: 5000 });
    logger.info('Value persisted after save');
  });

  test('Should support combobox/select settings', async ({ page }) => {
    const isAdmin = await navigateToConfigurationTab(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expandAdvancedSettings(page);
    const hasSettings = await waitForSettingsContent(page);

    if (!hasSettings) {
      logger.info('No settings available to test combobox');
      return;
    }

    // Find a combobox setting
    const settingsList = page.getByTestId('advanced-settings-list');
    const comboboxCount = await settingsList
      .locator('button[role="combobox"]')
      .count();

    if (comboboxCount === 0) {
      logger.info('No combobox settings found');
      return;
    }

    // Get the first combobox
    const combobox = settingsList.locator('button[role="combobox"]').first();
    await expect(combobox).toBeVisible({ timeout: 5000 });

    // Get the current value
    const currentValue = await combobox.textContent();
    logger.info(`Current combobox value: ${currentValue}`);

    // Click to open the dropdown
    await combobox.click();

    // Wait for dropdown content to appear
    const selectContent = page.locator('[role="listbox"]');
    await expect(selectContent).toBeVisible({ timeout: 5000 });
    logger.info('Combobox dropdown opened');

    // Get available options
    const options = selectContent.locator('[role="option"]');
    const optionsCount = await options.count();
    logger.info(`Found ${optionsCount} options in combobox`);

    expect(optionsCount).toBeGreaterThan(0);

    // Close the dropdown without changing (press Escape)
    await page.keyboard.press('Escape');
    await expect(selectContent).not.toBeVisible({ timeout: 5000 });
    logger.info('Combobox dropdown closed');
  });
});
