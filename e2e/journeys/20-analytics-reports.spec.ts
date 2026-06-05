import { test, expect } from '@playwright/test';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';
import { navigateToDataReports } from '../utils/data-reports-helpers';

import {
  shouldDisplayReportCards,
  shouldOpenCSVEditorDialog,
  shouldDisplayCSVInEditableTableFormat,
  shouldAllowEditingCellValuesInCSVEditor,
  shouldAddNewRowWhenClickingAddRowButton,
  shouldSaveEditedCSVAndTriggerDownload,
  shouldCloseCSVEditorWithoutSavingWhenClickingCancel,
  shouldVerifyCSVEditorDialogAccessibility,
  shouldOpenCSVEditorForUserMetadataReport,
  shouldDirectlyDownloadChatHistoryReportWithoutCSVEditor,
} from '@iblai/iblai-js/playwright';
import { shouldDisableOtherDownloadButtonsWhileGeneratingReport } from '@iblai/iblai-js/playwright';

const REPORT_CARDS = [
  {
    name: 'User Report',
    ariaLabel: 'User Report report card',
    description: 'Basic user information including login details',
    expectsCsvEditor: true,
  },
  {
    name: 'User Metadata Report',
    ariaLabel: 'User Metadata Report report card',
    description: 'User information including profile metadata like company',
    expectsCsvEditor: true,
  },
  {
    name: 'Chat History',
    ariaLabel: 'All Mentor Chat History report card',
    description: 'Get detailed mentor chat history for all participants.',
    expectsCsvEditor: false,
  },
];

test.describe('Journey 20: Analytics Reports', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // Admin gate: check if AI Analytics link is visible
    const analyticsLink = page.getByRole('link', { name: /ai analytics|analytics/i });
    const isAdmin = await analyticsLink.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isAdmin) {
      test.skip(true, 'Analytics reports require admin access — AI Analytics link not visible');
      return;
    }

    await analyticsLink.click();
    await page.waitForURL((url) => url.href.includes('/analytics'), { timeout: 30_000 });
  });

  test('admin goes to analytics page and navigates to the Data Reports tab', async ({ page }) => {
    await navigateToDataReports(page);
  });

  test('admin goes to Data Reports tab and verifies all report cards display with download buttons', async ({
    page,
  }) => {
    await shouldDisplayReportCards(page, REPORT_CARDS);
  });

  test.fixme('admin goes to Data Reports tab and opens the CSV editor by clicking download on User Report', async ({
    page,
  }) => {
    await shouldOpenCSVEditorDialog(page);
  });

  test('admin goes to CSV editor and verifies data displays in editable table format', async ({
    page,
  }) => {
    await shouldDisplayCSVInEditableTableFormat(page);
  });

  test('admin goes to CSV editor and edits a cell value', async ({ page }) => {
    await shouldAllowEditingCellValuesInCSVEditor(page);
  });

  test('admin goes to CSV editor and adds a new row by clicking the Add Row button', async ({
    page,
  }) => {
    await shouldAddNewRowWhenClickingAddRowButton(page);
  });

  test('admin goes to CSV editor and saves the edited CSV which triggers a file download', async ({
    page,
  }) => {
    await shouldSaveEditedCSVAndTriggerDownload(page);
  });

  test('admin goes to CSV editor and clicks Cancel to close without saving', async ({ page }) => {
    await shouldCloseCSVEditorWithoutSavingWhenClickingCancel(page);
  });

  test('admin goes to CSV editor and verifies it has proper ARIA labels and roles', async ({
    page,
  }) => {
    await shouldVerifyCSVEditorDialogAccessibility(page);
  });

  test.fixme('admin goes to Data Reports tab and opens the CSV editor for the User Metadata Report', async ({
    page,
  }) => {
    await shouldOpenCSVEditorForUserMetadataReport(page);
  });

  test('admin goes to Data Reports tab and downloads the Chat History report directly without CSV editor', async ({
    page,
  }) => {
    await shouldDirectlyDownloadChatHistoryReportWithoutCSVEditor(page);
  });

  test('admin goes to Data Reports tab and verifies other download buttons are disabled while generating', async ({
    page,
  }) => {
    await shouldDisableOtherDownloadButtonsWhileGeneratingReport(page);
  });
});
