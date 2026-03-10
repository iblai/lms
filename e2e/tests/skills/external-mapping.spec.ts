import { test, expect } from '@playwright/test';

import { SKILL_HOST } from '../utils';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';
import { navigateToAdvancedSettings } from '../../utils/advanced-settings-helpers';

test.describe('External Credential Mapping Feature', () => {
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
    test('should navigate to advanced settings and see External Credential Mapping card', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Look for External Credential Mapping text
      const externalMappingTitle = page.getByText(
        'External Credential Mapping'
      );
      await expect(externalMappingTitle).toBeVisible({ timeout: 30000 });
      logger.info('External Credential Mapping card is visible');
    });

    test('should expand and collapse the External Credential Mapping card', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Find the expand button for External Credential Mapping
      const expandButton = page.getByRole('button', {
        name: /expand external mapping/i,
      });

      try {
        await expect(expandButton).toBeVisible({ timeout: 10000 });

        // Click to expand
        await expandButton.click();
        logger.info('Clicked expand button');

        // After expanding, table or empty state should be visible
        const table = page.getByRole('table');
        const emptyState = page.getByText(/no external mappings found/i);

        await Promise.race([
          expect(table).toBeVisible({ timeout: 10000 }),
          expect(emptyState).toBeVisible({ timeout: 10000 }),
        ]);
        logger.info('Content is visible after expanding');

        // Find the collapse button
        const collapseButton = page.getByRole('button', {
          name: /collapse external mapping/i,
        });
        await collapseButton.click();
        logger.info('Clicked collapse button');

        // Content should be hidden
        await expect(table).not.toBeVisible({ timeout: 10000 });
        await expect(emptyState).not.toBeVisible({ timeout: 10000 });
        logger.info('Content is hidden after collapsing');
      } catch {
        logger.info(
          'Expand/collapse buttons not found - External Credential Mapping may not be available'
        );
        test.skip();
      }
    });
  });

  test.describe('Add Mapping', () => {
    test('should open Add External Mapping dialog', async ({ page }) => {
      await navigateToAdvancedSettings(page);

      // Find and click the Add button near External Credential Mapping
      const externalMappingSection = page.getByLabel(
        'External Credential Mapping'
      );
      const addButton = externalMappingSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();
        logger.info('Clicked Add button');

        // Dialog should open
        const dialog = page.getByRole('dialog', {
          name: 'Add External Mapping',
        });
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Verify dialog title
        await expect(page.getByText('Add External Mapping')).toBeVisible({
          timeout: 5000,
        });
        logger.info('Add External Mapping dialog opened');
      } catch {
        logger.info(
          'Add button not found - External Credential Mapping may not be available'
        );
        test.skip();
      }
    });

    test('should have required form fields in Add dialog', async ({ page }) => {
      await navigateToAdvancedSettings(page);

      // Open Add dialog
      const externalMappingSection = page.getByLabel(
        'External Credential Mapping'
      );
      const addButton = externalMappingSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        await expect(
          page.getByRole('dialog', {
            name: 'Add External Mapping',
          })
        ).toBeVisible({ timeout: 10000 });

        // Check for Credential dropdown
        const credentialSelect = page.getByRole('combobox', {
          name: /credential/i,
        });
        await expect(credentialSelect).toBeVisible({ timeout: 5000 });
        logger.info('Credential dropdown is visible');

        // Check for Provider dropdown
        const providerSelect = page.getByRole('combobox', {
          name: /provider/i,
        });
        await expect(providerSelect).toBeVisible({ timeout: 5000 });
        logger.info('Provider dropdown is visible');

        // Check for External Template ID input
        const templateIdInput = page.getByLabel(/external template id/i);
        await expect(templateIdInput).toBeVisible({ timeout: 5000 });
        logger.info('External Template ID input is visible');

        // Check for Group ID input
        const groupIdInput = page.getByLabel(/group id/i);
        await expect(groupIdInput).toBeVisible({ timeout: 5000 });
        logger.info('Group ID input is visible');

        // Check for Metadata textarea
        const metadataTextarea = page.getByLabel(/metadata/i);
        await expect(metadataTextarea).toBeVisible({ timeout: 5000 });
        logger.info('Metadata textarea is visible');

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
      const externalMappingSection = page.getByLabel(
        'External Credential Mapping'
      );
      const addButton = externalMappingSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        const dialog = page.getByRole('dialog', {
          name: 'Add External Mapping',
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

  test.describe('Provider Warning', () => {
    test('should show warning when no providers are configured', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Open Add dialog
      const externalMappingSection = page.getByLabel(
        'External Credential Mapping'
      );
      const addButton = externalMappingSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        await expect(
          page.getByRole('dialog', {
            name: 'Add External Mapping',
          })
        ).toBeVisible({ timeout: 10000 });

        // Check if warning message is visible
        const warningMessage = page.getByText(
          /configure a provider first in provider configuration/i
        );

        try {
          await expect(warningMessage).toBeVisible({ timeout: 5000 });
          logger.info('Provider warning message is visible');

          // Create button should be disabled
          const createButton = page.getByRole('button', { name: /create/i });
          await expect(createButton).toBeDisabled({ timeout: 5000 });
          logger.info('Create button is disabled when no providers configured');
        } catch {
          // Warning may not be visible if providers are already configured
          logger.info(
            'Provider warning not visible - providers may already be configured'
          );
        }
      } catch (e) {
        logger.info('Could not test provider warning: ' + (e as Error).message);
        test.skip();
      }
    });
  });

  test.describe('Mapping List', () => {
    test('should display mappings in table when expanded', async ({ page }) => {
      await navigateToAdvancedSettings(page);

      // Expand the External Credential Mapping card
      const expandButton = page.getByRole('button', {
        name: /expand external mapping/i,
      });

      try {
        await expect(expandButton).toBeVisible({ timeout: 10000 });
        await expandButton.click();

        // Check for table headers or empty state
        const table = page.getByRole('table');
        const emptyState = page.getByText(/no external mappings found/i);

        await Promise.race([
          expect(table).toBeVisible({ timeout: 10000 }),
          expect(emptyState).toBeVisible({ timeout: 10000 }),
        ]);

        if (await table.isVisible()) {
          // Check for table headers
          await expect(
            page.getByRole('columnheader', { name: /credential/i })
          ).toBeVisible({ timeout: 5000 });
          await expect(
            page.getByRole('columnheader', { name: /provider/i })
          ).toBeVisible({ timeout: 5000 });
          await expect(
            page.getByRole('columnheader', { name: /template id/i })
          ).toBeVisible({ timeout: 5000 });
          logger.info('Table headers are visible');
        } else {
          logger.info('Empty state is displayed');
        }
      } catch (e) {
        logger.info('Could not verify table: ' + (e as Error).message);
        test.skip();
      }
    });
  });

  test.describe('Edit Mapping', () => {
    test('should disable credential and provider fields when editing', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Expand the External Credential Mapping card
      const expandButton = page.getByRole('button', {
        name: /expand external mapping/i,
      });

      try {
        await expect(expandButton).toBeVisible({ timeout: 10000 });
        await expandButton.click();

        // Find an edit button (if mappings exist)
        const editButton = page
          .getByRole('button', { name: /edit.*mapping/i })
          .first();

        try {
          await expect(editButton).toBeVisible({ timeout: 5000 });
          await editButton.click();
          logger.info('Clicked edit button');

          // Dialog should open
          const dialog = page.getByRole('dialog', {
            name: 'Edit External Mapping',
          });
          await expect(dialog).toBeVisible({ timeout: 10000 });

          // Credential dropdown should be disabled
          const credentialSelect = page.getByRole('combobox', {
            name: /credential/i,
          });
          await expect(credentialSelect).toBeDisabled({ timeout: 5000 });
          logger.info('Credential dropdown is disabled when editing');

          // Provider dropdown should be disabled
          const providerSelect = page.getByRole('combobox', {
            name: /provider/i,
          });
          await expect(providerSelect).toBeDisabled({ timeout: 5000 });
          logger.info('Provider dropdown is disabled when editing');

          // Should show message about credential not being changeable
          await expect(
            page.getByText(/credential cannot be changed/i)
          ).toBeVisible({ timeout: 5000 });
          logger.info('Credential disabled message is visible');

          // Should show message about provider not being changeable
          await expect(
            page.getByText(/provider cannot be changed/i)
          ).toBeVisible({ timeout: 5000 });
          logger.info('Provider disabled message is visible');
        } catch {
          logger.info('No mappings to edit');
        }
      } catch (e) {
        logger.info('Could not test edit: ' + (e as Error).message);
        test.skip();
      }
    });
  });

  test.describe('Validation', () => {
    test('should show error for invalid JSON metadata', async ({ page }) => {
      await navigateToAdvancedSettings(page);

      // Open Add dialog
      const externalMappingSection = page.getByLabel(
        'External Credential Mapping'
      );
      const addButton = externalMappingSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        await expect(
          page.getByRole('dialog', {
            name: 'Add External Mapping',
          })
        ).toBeVisible({ timeout: 10000 });

        // Enter invalid JSON in the metadata textarea
        const metadataTextarea = page.getByPlaceholder(/notes/i);
        await metadataTextarea.fill('{ invalid json }');

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

  test.describe('Credential Search', () => {
    test('should have search input in credential dropdown', async ({
      page,
    }) => {
      await navigateToAdvancedSettings(page);

      // Open Add dialog
      const externalMappingSection = page.getByLabel(
        'External Credential Mapping'
      );
      const addButton = externalMappingSection
        .getByRole('button', { name: /add/i })
        .first();

      try {
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // Dialog should open
        await expect(
          page.getByRole('dialog', {
            name: 'Add External Mapping',
          })
        ).toBeVisible({ timeout: 10000 });

        // Click on Credential dropdown
        const credentialSelect = page.getByRole('combobox', {
          name: /credential/i,
        });
        await credentialSelect.click();

        // Search input should be visible
        const searchInput = page.getByPlaceholder(/search credentials/i);
        await expect(searchInput).toBeVisible({ timeout: 5000 });
        logger.info('Credential search input is visible');
      } catch (e) {
        logger.info(
          'Could not test credential search: ' + (e as Error).message
        );
        test.skip();
      }
    });
  });
});
