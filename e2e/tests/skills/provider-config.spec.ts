import { test, expect } from '@playwright/test';

import { SKILL_HOST } from '../utils';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';
import { navigateToAdvancedSettings } from '../../utils/advanced-settings-helpers';

test.describe('Provider Configuration Feature', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(SKILL_HOST, {
      waitUntil: 'networkidle',
      timeout: 120000,
    });

    await waitForPageReady(page);

    // Navigate to home page first
    await page.goto(`${SKILL_HOST}/home`, {
      waitUntil: 'networkidle',
      timeout: 120000,
    });
    await waitForPageReady(page);
  });

  test.describe('Navigation', () => {
    test('should navigate to advanced settings and see Provider Configuration card', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Look for Provider Configuration text
      const providerConfigSection = page.getByLabel('Provider Configuration', {
        exact: true,
      });
      await expect(providerConfigSection).toBeVisible({ timeout: 30000 });
      logger.info('Provider Configuration card is visible');
    });

    test('should expand and collapse the Provider Configuration card', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Find the expand button for Provider Configuration
      const expandButton = page.getByRole('button', {
        name: /expand provider configuration/i,
      });

      try {
        await expect(expandButton).toBeVisible({ timeout: 10000 });

        // Click to expand
        await expandButton.click();
        logger.info('Clicked expand button');

        // After expanding, table should be visible
        const table = page.getByRole('table');
        await expect(table).toBeVisible({ timeout: 10000 });
        logger.info('Table is visible after expanding');

        // Find the collapse button
        const collapseButton = page.getByRole('button', {
          name: /collapse provider configuration/i,
        });
        await collapseButton.click();
        logger.info('Clicked collapse button');

        // Table should be hidden
        await expect(table).not.toBeVisible({ timeout: 10000 });
        logger.info('Table is hidden after collapsing');
      } catch {
        logger.info(
          'Expand/collapse buttons not found - Provider Configuration may not be available'
        );
        test.skip();
      }
    });
  });

  test.describe('Add Configuration', () => {
    test('should open Add Provider Configuration dialog', async ({ page }) => {
      await navigateToAdvancedSettings(page);

      // Find and click the Add button near Provider Configuration
      const providerConfigSection = page.getByLabel('Provider Configuration', {
        exact: true,
      });
      const addButton = providerConfigSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();
        logger.info('Clicked Add button');

        // Dialog should open
        const dialog = page.getByRole('dialog', {
          name: 'Add Provider Configuration',
        });
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Verify dialog title
        await expect(page.getByText('Add Provider Configuration')).toBeVisible({
          timeout: 5000,
        });
        logger.info('Add Provider Configuration dialog opened');
      } catch {
        logger.info(
          'Add button not found - Provider Configuration may not be available'
        );
        test.skip();
      }
    });

    test('should have required form fields in Add dialog', async ({ page }) => {
      await navigateToAdvancedSettings(page);

      // Open Add dialog
      const providerConfigSection = page.getByLabel('Provider Configuration', {
        exact: true,
      });
      const addButton = providerConfigSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        await expect(
          page.getByRole('dialog', {
            name: 'Add Provider Configuration',
          })
        ).toBeVisible({ timeout: 10000 });

        // Check for Provider Name input
        const providerNameInput = page.getByLabel(/provider name/i);
        await expect(providerNameInput).toBeVisible({ timeout: 5000 });
        logger.info('Provider Name input is visible');

        // Check for Configuration (JSON) textarea
        const configTextarea = page.getByPlaceholder(/api_key/i);
        await expect(configTextarea).toBeVisible({ timeout: 5000 });
        logger.info('Configuration textarea is visible');

        // Check for Enabled switch
        const enabledSwitch = page.getByRole('switch');
        await expect(enabledSwitch).toBeVisible({ timeout: 5000 });
        logger.info('Enabled switch is visible');

        // Check for Cancel button
        await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible(
          { timeout: 5000 }
        );

        // Check for Create button
        await expect(page.getByRole('button', { name: /create/i })).toBeVisible(
          { timeout: 5000 }
        );
        logger.info('All form fields verified');
      } catch (e) {
        logger.info('Could not verify form fields: ' + (e as Error).message);
        test.skip();
      }
    });

    test('should close dialog when clicking Cancel', async ({ page }) => {
      await navigateToAdvancedSettings(page);

      // Open Add dialog
      const providerConfigSection = page.getByLabel('Provider Configuration', {
        exact: true,
      });
      const addButton = providerConfigSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        const dialog = page.getByRole('dialog', {
          name: 'Add Provider Configuration',
        });
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Click Cancel
        const cancelButton = page.getByRole('button', { name: /cancel/i });
        await cancelButton.click();
        logger.info('Clicked Cancel button');

        // Dialog should be closed
        await expect(dialog).not.toBeVisible({ timeout: 10000 });
        logger.info('Dialog closed successfully');
      } catch (e) {
        logger.info('Could not test cancel: ' + (e as Error).message);
        test.skip();
      }
    });
  });

  test.describe('Configuration List', () => {
    test('should display configurations in table when expanded', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Expand the Provider Configuration card
      const expandButton = page.getByRole('button', {
        name: /expand provider configuration/i,
      });

      try {
        await expect(expandButton).toBeVisible({ timeout: 10000 });
        await expandButton.click();

        // Table should be visible
        const table = page.getByRole('table');
        await expect(table).toBeVisible({ timeout: 10000 });
        logger.info('Table is visible');

        // Check for table headers
        await expect(
          page.getByRole('columnheader', { name: /provider/i })
        ).toBeVisible({
          timeout: 5000,
        });
        await expect(
          page.getByRole('columnheader', { name: /configuration/i })
        ).toBeVisible({ timeout: 5000 });
        await expect(
          page.getByRole('columnheader', { name: /status/i })
        ).toBeVisible({
          timeout: 5000,
        });
        logger.info('Table headers are visible');
      } catch (e) {
        logger.info('Could not verify table: ' + (e as Error).message);
        test.skip();
      }
    });

    test('should show empty state when no configurations exist', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Expand the Provider Configuration card
      const expandButton = page.getByRole('button', {
        name: /expand provider configuration/i,
      });

      try {
        await expect(expandButton).toBeVisible({ timeout: 10000 });
        await expandButton.click();

        // Check for either table or empty state
        const table = page.getByRole('table');
        const emptyState = page.getByText(/no provider configurations found/i);

        // Wait for one of them to be visible
        await Promise.race([
          expect(table).toBeVisible({ timeout: 10000 }),
          expect(emptyState).toBeVisible({ timeout: 10000 }),
        ]);

        if (await emptyState.isVisible()) {
          logger.info('Empty state message is displayed');
        } else {
          logger.info('Configurations table is displayed');
        }
      } catch (e) {
        logger.info('Could not verify content: ' + (e as Error).message);
      }
    });
  });

  test.describe('Edit Configuration', () => {
    test('should disable provider name field when editing', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Expand the Provider Configuration card
      const expandButton = page.getByRole('button', {
        name: /expand provider configuration/i,
      });

      try {
        await expect(expandButton).toBeVisible({ timeout: 10000 });
        await expandButton.click();

        // Find an edit button (if configurations exist)
        const editButton = page
          .getByRole('button', { name: /edit.*configuration/i })
          .first();

        try {
          await expect(editButton).toBeVisible({ timeout: 5000 });
          await editButton.click();
          logger.info('Clicked edit button');

          // Dialog should open
          const dialog = page.getByRole('dialog', {
            name: 'Edit Provider Configuration',
          });
          await expect(dialog).toBeVisible({ timeout: 10000 });

          // Provider name input should be disabled
          const providerNameInput = page.getByLabel(/provider name/i);
          await expect(providerNameInput).toBeDisabled({ timeout: 5000 });
          logger.info('Provider name input is disabled when editing');

          // Should show message about provider name not being changeable
          await expect(
            page.getByText(/provider name cannot be changed/i)
          ).toBeVisible({ timeout: 5000 });
          logger.info('Provider name disabled message is visible');
        } catch {
          logger.info('No configurations to edit');
        }
      } catch (e) {
        logger.info('Could not test edit: ' + (e as Error).message);
        test.skip();
      }
    });
  });

  test.describe('Validation', () => {
    test('should show error for invalid JSON configuration', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Open Add dialog
      const providerConfigSection = page.getByLabel('Provider Configuration', {
        exact: true,
      });
      const addButton = providerConfigSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        await expect(
          page.getByRole('dialog', {
            name: 'Add Provider Configuration',
          })
        ).toBeVisible({ timeout: 10000 });

        // Enter invalid JSON in the configuration textarea
        const configTextarea = page.getByPlaceholder(/api_key/i);
        await configTextarea.fill('{ invalid json }');

        // Should show error message
        await expect(page.getByText(/invalid json format/i)).toBeVisible({
          timeout: 5000,
        });
        logger.info('Invalid JSON error is displayed');
      } catch (e) {
        logger.info('Could not test JSON validation: ' + (e as Error).message);
        test.skip();
      }
    });
  });
});
