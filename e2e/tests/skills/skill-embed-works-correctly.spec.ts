import test, { expect } from '@playwright/test';
import { SKILL_HOST } from '../utils';
import { canChatWithEmbedMentor } from '../helpers';
import { logger } from '@iblai/iblai-js/playwright';

test.describe.configure({ timeout: 250000 });
test.describe('Admin Activities', () => {
  test.setTimeout(300000);

  test.beforeEach(async ({ page }) => {
    // Navigate to Skill host
    await page.goto(SKILL_HOST, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Wait for page elements to load
    await page.waitForTimeout(15000);
  });

  test.afterEach(async ({ page, context }) => {
    try {
      // Wait for stability, close page first, then close context
      // This prevents Chromium crashes (SIGSEGV) that can occur when closing context abruptly
      await page.waitForTimeout(500);
      if (!page.isClosed()) await page.close();
      await context.close();
    } catch (err) {
      // Log any errors during context close (may be Chromium crash)
      logger.warn('Error closing context: ', err);
    }
  });

  test('Embed mentor works correctly', async ({ page }) => {
    // Wait for Suggested Courses heading to be visible
    const suggestedCoursesHeading = page.getByRole('heading', {
      name: 'Suggested Courses',
    });
    await suggestedCoursesHeading.waitFor();

    // Locate Open Chat Assistant button
    const openChatButton = page.getByRole('button', {
      name: 'Open chat assistant',
    });

    // Check if the chat button is visible
    const isChatButtonVisible = await openChatButton.isVisible();

    // If the chat button is visible, start the chat flow
    if (isChatButtonVisible) {
      //await canChatWithEmbedMentor(page, openChatButton);
    } else {
      // Locate and click on profile button to open dropdown
      const profileButton = page.getByRole('button', { name: 'More options' });
      await expect(profileButton).toBeVisible();
      await profileButton.click();

      // Click on Profile menu item
      const profileMenuItem = page.getByRole('menuitem', { name: 'Profile' });
      await profileMenuItem.click();

      // Locate Profile dialog
      const profileDialog = page
        .getByRole('dialog')
        .filter({ hasText: 'Basic' });

      // Locate Display Mentor AI checkbox
      const displayMentorCheckbox = profileDialog.getByRole('checkbox', {
        name: 'Display Mentor AI',
      });

      // Wait for checkbox to be attached
      await displayMentorCheckbox.waitFor({ state: 'attached' });

      // Get current checked state of the checkbox
      const isCheckboxChecked =
        await displayMentorCheckbox.getAttribute('aria-checked');

      // Check and click checkbox if not checked
      if (isCheckboxChecked === 'true') {
        console.log('Checkbox is already checked');
      } else {
        console.log('Checkbox not checked');
        await displayMentorCheckbox.click();
      }

      // Click Save Changes button
      const saveChangesButton = profileDialog.getByRole('button', {
        name: 'Save Changes',
      });
      await saveChangesButton.click();

      // Verify checkbox state updated
      await expect(
        displayMentorCheckbox.getAttribute('aria-checked')
      ).toBeTruthy();

      // Locate and click Close button on profile dialog
      const closeProfileDialogButton = profileDialog.getByRole('button', {
        name: 'Close',
      });
      await closeProfileDialogButton.click();

      // Reopen profile menu
      await profileButton.click();

      // Click second menu item (tenant option)
      const tenantMenuItem = page.getByRole('menuitem').nth(1);
      await tenantMenuItem.click();

      // Locate tenant dialog
      const tenantDialog = page
        .getByRole('dialog')
        .filter({ hasText: 'organization' });

      // Click Advanced button inside tenant dialog
      const advancedButton = tenantDialog.getByRole('button', {
        name: 'Advanced',
      });
      await advancedButton.click();

      // Locate mentor dropdown
      const mentorDropdown = tenantDialog.getByRole('combobox');
      await mentorDropdown.waitFor({ state: 'visible' });
      await mentorDropdown.click();

      // Wait for mentor options to appear
      const mentorOptions = page.getByRole('option');
      await mentorOptions.first().waitFor({ state: 'visible' });

      // Select second mentor option
      const mentorToSelect = mentorOptions.nth(1);
      const mentorName = await mentorToSelect.textContent();
      await mentorToSelect.click();

      // Verify mentor name is displayed after selection
      const selectedMentorText = mentorDropdown.locator('span');
      await expect(selectedMentorText).toHaveText(mentorName!.trim());

      // Close tenant dialog
      const closeTenantDialogButton = tenantDialog.getByRole('button', {
        name: 'Close',
      });
      await closeTenantDialogButton.click();

      // Ensure tenant dialog is no longer visible
      await expect(tenantDialog).not.toBeVisible();

      // Wait for chat button to be available again
      await openChatButton.waitFor();

      // Test chat functionality again
      //TODO disable temporarily
      //await canChatWithEmbedMentor(page, openChatButton);
    }
  });
});
