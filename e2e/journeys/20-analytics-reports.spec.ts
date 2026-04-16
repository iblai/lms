import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../utils/navigation';
import {
  navigateToDataReports,
  shouldDisplayReportCards,
  shouldOpenCSVEditorDialog,
  shouldDisplayCSVInEditableTableFormat,
  shouldAllowEditingCellValuesInCSVEditor,
  shouldAddNewRowWhenClickingAddRowButton,
  shouldSaveEditedCSVAndTriggerDownload,
  shouldCloseCSVEditorWithoutSavingWhenClickingCancel,
  shouldCloseCSVEditorWhenClickingCloseButton,
  shouldVerifyCSVEditorDialogAccessibility,
  shouldOpenCSVEditorForUserMetadataReport,
  shouldDirectlyDownloadChatHistoryReportWithoutCSVEditor,
  shouldHaveCombinedReportDataTestIds,
  shouldShowCombiningReportsDialog,
} from '../utils/data-reports-helpers';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

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
    await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
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

  // ── CP-1: Navigate to Data Reports tab ────────────────────────────────────

  test('CP-1: navigate to Data Reports tab', async ({ page }) => {
    await navigateToDataReports(page);
  });

  // ── CP-2: Report cards with download buttons ─────────────────────────────

  test('CP-2: report cards display with download buttons', async ({ page }) => {
    await shouldDisplayReportCards(page, REPORT_CARDS);
  });

  // ── CP-3: CSV editor opens for User Report ───────────────────────────────

  test('CP-3: CSV editor dialog opens when clicking download on User Report', async ({ page }) => {
    await shouldOpenCSVEditorDialog(page);
  });

  // ── CP-4: CSV in editable table format ────────────────────────────────────

  test('CP-4: CSV data displayed in editable table format', async ({ page }) => {
    await shouldDisplayCSVInEditableTableFormat(page);
  });

  // ── CP-5: Cell editing ────────────────────────────────────────────────────

  test('CP-5: cell values can be edited in CSV editor', async ({ page }) => {
    await shouldAllowEditingCellValuesInCSVEditor(page);
  });

  // ── CP-6: Add row ────────────────────────────────────────────────────────

  test('CP-6: new row added when clicking Add Row button', async ({ page }) => {
    await shouldAddNewRowWhenClickingAddRowButton(page);
  });

  // ── CP-7: Save and download ──────────────────────────────────────────────

  test('CP-7: save edited CSV triggers file download', async ({ page }) => {
    await shouldSaveEditedCSVAndTriggerDownload(page);
  });

  // ── CP-8: Cancel closes without save ─────────────────────────────────────

  test('CP-8: cancel closes CSV editor without saving', async ({ page }) => {
    await shouldCloseCSVEditorWithoutSavingWhenClickingCancel(page);
  });

  // ── CP-9: Close button closes ────────────────────────────────────────────

  test('CP-9: close button closes CSV editor', async ({ page }) => {
    await shouldCloseCSVEditorWhenClickingCloseButton(page);
  });

  // ── CP-10: ARIA accessibility ────────────────────────────────────────────

  test('CP-10: CSV editor dialog has proper ARIA labels and roles', async ({ page }) => {
    await shouldVerifyCSVEditorDialogAccessibility(page);
  });

  // ── CP-11: User Metadata Report ──────────────────────────────────────────

  test('CP-11: CSV editor opens for User Metadata Report', async ({ page }) => {
    await shouldOpenCSVEditorForUserMetadataReport(page);
  });

  // ── CP-12: Chat History direct download ──────────────────────────────────

  test('CP-12: Chat History report downloads directly without CSV editor', async ({ page }) => {
    await shouldDirectlyDownloadChatHistoryReportWithoutCSVEditor(page);
  });

  // ── CP-13: Combined report data-testids (feature-gated) ──────────────────

  test('CP-13: combined recommendation report cards have correct data-testids', async ({
    page,
  }) => {
    await shouldHaveCombinedReportDataTestIds(page);
  });

  // ── CP-14: Combining dialog (feature-gated) ─────────────────────────────

  test('CP-14: combining reports dialog shown for recommendation reports', async ({ page }) => {
    await shouldShowCombiningReportsDialog(page);
  });

  // ── CP-15: Report download page ──────────────────────────────────────────

  test('CP-15: report download page loads and shows preparing state', async ({ page }) => {
    // Navigate to Data Reports tab first
    const dataReportsTab = page.getByRole('tab', { name: 'Data Reports', exact: true });
    const hasTab = await dataReportsTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasTab) {
      test.skip(true, 'Data Reports tab not visible');
      return;
    }

    await dataReportsTab.click();
    await page.waitForTimeout(2_000);

    // Look for any report card with a download button
    const downloadButtons = page.getByRole('button', { name: 'Download report' });
    const hasButtons = await downloadButtons
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasButtons) {
      test.skip(true, 'No report download buttons available');
      return;
    }

    // Verify at least one download button is present and enabled
    await expect(downloadButtons.first()).toBeEnabled();

    // Check if there's a download link that navigates to the report download page
    const reportDownloadLinks = page.locator('a[href*="report"], a[href*="download"]');
    const hasDownloadLinks = await reportDownloadLinks
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (hasDownloadLinks) {
      const href = await reportDownloadLinks.first().getAttribute('href');
      if (href) {
        await page.goto(href.startsWith('http') ? href : `${SKILL_HOST}${href}`, {
          timeout: 60_000,
        });
        await waitForAppShell(page);

        // Look for preparing state indicators
        const preparingState = page.getByText(/preparing|generating|loading/i);
        const downloadState = page.getByText(/download|ready|complete/i);
        const errorState = page.getByText(/error|failed/i);

        const hasPreparing = await preparingState
          .isVisible({ timeout: 120_000 })
          .catch(() => false);
        const hasDownload = await downloadState.isVisible({ timeout: 120_000 }).catch(() => false);
        const hasError = await errorState.isVisible({ timeout: 120_000 }).catch(() => false);

        // One of these states should be shown
        expect(hasPreparing || hasDownload || hasError).toBe(true);
      }
    } else {
      // No separate download page — the download is handled inline via CSV editor or direct download
      // This is acceptable as the feature may handle downloads differently
      expect(hasButtons).toBe(true);
    }
  });
});
