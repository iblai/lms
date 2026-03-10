import { test, expect, Download } from '@playwright/test';
import { SKILL_HOST } from '../../utils';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import {
  navigateToDataReports,
  shouldAddNewRowWhenClickingAddRowButton,
  shouldAllowEditingCellValuesInCSVEditor,
  shouldCloseCSVEditorWhenClickingCloseButton,
  shouldCloseCSVEditorWithoutSavingWhenClickingCancel,
  shouldDirectlyDownloadChatHistoryReportWithoutCSVEditor,
  shouldDisableOtherDownloadButtonsWhileGeneratingReport,
  shouldDisplayCSVInEditableTableFormat,
  shouldDisplayReportCards,
  shouldOpenCSVEditorDialog,
  shouldOpenCSVEditorForUserMetadataReport,
  shouldSaveEditedCSVAndTriggerDownload,
  shouldVerifyCSVEditorDialogAccessibility,
  shouldShowCombiningReportsDialog,
  shouldCancelCombiningReports,
  shouldHaveCombinedReportDataTestIds,
  shouldCombineRecommendationReports,
} from '../../shared';

const pageURL = SKILL_HOST;

// Report card labels used in the UI
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
    expectsCsvEditor: false, // Chat History downloads directly
  },
];

test.describe('Data Reports Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageURL, { waitUntil: 'networkidle', timeout: 120000 });
    await waitForPageReady(page);
    await page.waitForLoadState('networkidle');
    await page.waitForURL((url) => url.href.startsWith(SKILL_HOST + '/home'));
    await page.waitForLoadState('networkidle');
  });

  test.describe('Data Reports Page Navigation', () => {
    test('should navigate to Data Reports tab from Analytics', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });
      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await navigateToDataReports(page);
    });

    test('should display all report cards with download buttons', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldDisplayReportCards(page, REPORT_CARDS);
    });
  });

  test.describe('CSV Visualizer Dialog', () => {
    test('should open CSV editor dialog when clicking download on User Report', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);
      await shouldOpenCSVEditorDialog(page);
    });

    test('should display CSV data in editable table format', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldDisplayCSVInEditableTableFormat(page);
    });

    test('should allow editing cell values in CSV editor', async ({ page }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldAllowEditingCellValuesInCSVEditor(page);
    });

    test('should add new row when clicking Add Row button', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldAddNewRowWhenClickingAddRowButton(page);
    });

    test('should save edited CSV and trigger download', async ({ page }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      if (!(await analyticsButton.isVisible())) {
        test.skip();
        return;
      }

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldSaveEditedCSVAndTriggerDownload(page);
    });

    test('should close CSV editor without saving when clicking Cancel', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldCloseCSVEditorWithoutSavingWhenClickingCancel(page);
    });

    test('should close CSV editor when clicking Close button', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldCloseCSVEditorWhenClickingCloseButton(page);
    });
  });

  test.describe('CSV Editor Accessibility', () => {
    test('CSV editor should have proper ARIA labels and roles', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldVerifyCSVEditorDialogAccessibility(page);
    });
  });

  test.describe('User Metadata Report', () => {
    test('should open CSV editor for User Metadata Report', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldOpenCSVEditorForUserMetadataReport(page);
    });
  });

  test.describe('Chat History Report', () => {
    test('should directly download Chat History report without CSV editor', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldDirectlyDownloadChatHistoryReportWithoutCSVEditor(page);
    });
  });

  test.describe('Report Download Loading States', () => {
    test('should disable other download buttons while generating report', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldDisableOtherDownloadButtonsWhileGeneratingReport(page);
    });
  });

  test.describe('Combined Recommendation Reports', () => {
    test('should have data-testid on recommendation report cards when feature enabled', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldHaveCombinedReportDataTestIds(page);
    });

    test('should show combining dialog when clicking recommendation report', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldShowCombiningReportsDialog(page);
    });

    test('should be able to cancel combining reports', async ({ page }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldCancelCombiningReports(page);
    });

    test('should combine multiple reports into single CSV editor', async ({
      page,
    }) => {
      const analyticsButton = page.getByRole('link', { name: 'AI Analytics' });

      await expect(analyticsButton).toBeVisible();

      await analyticsButton.click();
      await waitForPageReady(page);

      await shouldCombineRecommendationReports(page);
    });
  });
});
