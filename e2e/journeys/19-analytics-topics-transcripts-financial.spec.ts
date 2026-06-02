import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

test.describe('Journey 19: Analytics Topics/Transcripts/Financial', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // Admin gate: check if AI Analytics link is visible
    const analyticsLink = page.getByRole('link', { name: /ai analytics|analytics/i });
    const isAdmin = await analyticsLink.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isAdmin) {
      test.skip(true, 'Analytics requires admin access — AI Analytics link not visible');
      return;
    }

    logger.info('Navigating to Analytics');
    await analyticsLink.click();
    await page.waitForURL((url) => url.href.includes('/analytics'), { timeout: 30_000 });
  });

  // ── Topics ────────────────────────────────────────────────────────────────

  test('CP-1: topics page loads with stat cards', async ({ page }) => {
    logger.info('CP-1: navigating to Topics tab');
    const topicsTab = page.getByRole('tab', { name: 'Topics', exact: true });
    const hasTopicsTab = await topicsTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasTopicsTab) {
      test.skip(true, 'Topics analytics tab not visible');
      return;
    }

    await topicsTab.click();
    await expect(topicsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    logger.info('CP-1: checking Topics, Conversations, Messages stat cards');
    // Stat cards use aria-label "${title} mini card" (loaded) or "${title} mini card loading".
    // Use starts-with selector to match any state.
    const statCardPrefixes = ['Topics mini card', 'Conversations mini card', 'Messages mini card'];
    const cardVisibility: boolean[] = [];

    for (const prefix of statCardPrefixes) {
      const card = page.locator(`[aria-label^="${prefix}"]`);
      const isVisible = await card
        .first()
        .isVisible({ timeout: 120_000 })
        .catch(() => false);
      cardVisibility.push(isVisible);
    }

    const noData = page.getByText('No data available');
    const hasNoData = await noData.isVisible({ timeout: 120_000 }).catch(() => false);

    logger.info(
      `CP-1: topics=${cardVisibility[0]} conversations=${cardVisibility[1]} messages=${cardVisibility[2]} noData=${hasNoData}`,
    );

    // Stat cards should be visible, or the empty state is shown
    for (let i = 0; i < statCardPrefixes.length; i++) {
      expect(cardVisibility[i] || hasNoData).toBe(true);
    }
  });

  test('CP-2: topics charts are visible', async ({ page }) => {
    logger.info('CP-2: navigating to Topics tab');
    const topicsTab = page.getByRole('tab', { name: 'Topics', exact: true });
    const hasTopicsTab = await topicsTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasTopicsTab) {
      test.skip(true, 'Topics analytics tab not visible');
      return;
    }

    await topicsTab.click();
    await expect(topicsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    logger.info('CP-2: checking Conversations and Topics Details chart cards');
    const conversationsChart = page.getByLabel('Conversations chart card');
    const topicsDetailsChart = page.getByLabel('Topics Details chart card');

    const hasConversationsChart = await conversationsChart
      .isVisible({ timeout: 120_000 })
      .catch(() => false);
    const hasTopicsDetailsChart = await topicsDetailsChart
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    const noData = page.getByText('No data available');
    const hasNoData = await noData.isVisible({ timeout: 120_000 }).catch(() => false);

    logger.info(
      `CP-2: conversationsChart=${hasConversationsChart} topicsDetailsChart=${hasTopicsDetailsChart} noData=${hasNoData}`,
    );

    // Charts should be visible, or the empty state is shown
    expect(hasConversationsChart || hasNoData).toBe(true);
    expect(hasTopicsDetailsChart || hasNoData).toBe(true);
  });

  // ── Transcripts ───────────────────────────────────────────────────────────

  test('CP-3: transcripts page loads with stat cards', async ({ page }) => {
    logger.info('CP-3: navigating to Transcripts tab');
    const transcriptsTab = page.getByRole('tab', { name: 'Transcripts', exact: true });
    const hasTranscriptsTab = await transcriptsTab
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasTranscriptsTab) {
      test.skip(true, 'Transcripts analytics tab not visible');
      return;
    }

    await transcriptsTab.click();
    await expect(transcriptsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    logger.info('CP-3: checking transcript stat cards');
    const statCardPrefixes = [
      'Average number of messages per conversation mini card',
      'Average cost per conversation mini card',
      'Average rating mini card',
    ];

    for (const prefix of statCardPrefixes) {
      const card = page.locator(`[aria-label^="${prefix}"]`);
      const isVisible = await card
        .first()
        .isVisible({ timeout: 120_000 })
        .catch(() => false);
      expect(isVisible, `Stat card "${prefix}" should be visible`).toBe(true);
      logger.info(`Stat card "${prefix}" is visible`);
    }
  });

  test('CP-4: transcripts list or empty state is visible', async ({ page }) => {
    logger.info('CP-4: navigating to Transcripts tab');
    const transcriptsTab = page.getByRole('tab', { name: 'Transcripts', exact: true });
    const hasTranscriptsTab = await transcriptsTab
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (!hasTranscriptsTab) {
      test.skip(true, 'Transcripts analytics tab not visible');
      return;
    }

    await transcriptsTab.click();
    await expect(transcriptsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    logger.info('CP-4: checking for transcript content, pagination, or empty state');

    // After loading completes, one of these will appear:
    // - "Page X of Y • Z total records" (has results)
    // - "No transcripts found matching your filters." (empty with filters)
    // - "No transcripts available." (empty without filters)
    //
    // Use .or() so expect().toBeVisible() polls until ANY of them appears in the DOM.
    const loadedIndicator = page
      .getByText(/Page \d+ of \d+/)
      .or(page.getByText('No transcripts found matching your filters.'))
      .or(page.getByText('No transcripts available.'));

    await expect(loadedIndicator.first()).toBeVisible({ timeout: 120_000 });
    logger.info('CP-4: transcripts loaded — pagination info or empty state is visible');
  });

  // ── Costs (Financial) ─────────────────────────────────────────────────────

  test('CP-5: costs page loads with stat cards', async ({ page }) => {
    logger.info('CP-5: navigating to Costs tab');
    const costsTab = page.getByRole('tab', { name: 'Costs', exact: true });
    const hasCostsTab = await costsTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCostsTab) {
      test.skip(true, 'Costs analytics tab not visible');
      return;
    }

    await costsTab.click();
    await expect(costsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    logger.info('CP-5: checking Weekly Costs, Monthly Costs, Total Costs stat cards');
    const statCardPrefixes = [
      'Weekly Costs mini card',
      'Monthly Costs mini card',
      'Total Costs mini card',
    ];
    const cardVisibility: boolean[] = [];

    for (const prefix of statCardPrefixes) {
      const card = page.locator(`[aria-label^="${prefix}"]`);
      const isVisible = await card
        .first()
        .isVisible({ timeout: 120_000 })
        .catch(() => false);
      cardVisibility.push(isVisible);
    }

    const noData = page.getByText('No data available');
    const hasNoData = await noData.isVisible({ timeout: 120_000 }).catch(() => false);

    logger.info(
      `CP-5: weekly=${cardVisibility[0]} monthly=${cardVisibility[1]} total=${cardVisibility[2]} noData=${hasNoData}`,
    );

    for (let i = 0; i < statCardPrefixes.length; i++) {
      expect(cardVisibility[i] || hasNoData).toBe(true);
    }
  });

  test('CP-6: costs charts are visible', async ({ page }) => {
    logger.info('CP-6: navigating to Costs tab');
    const costsTab = page.getByRole('tab', { name: 'Costs', exact: true });
    const hasCostsTab = await costsTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCostsTab) {
      test.skip(true, 'Costs analytics tab not visible');
      return;
    }

    await costsTab.click();
    await expect(costsTab).toHaveAttribute('data-state', 'active', { timeout: 30_000 });

    logger.info('CP-6: checking Cost per Day, Cost by Provider, Cost by LLM chart cards');
    const costPerDayChart = page.getByLabel('Cost per Day chart card');
    const costByProviderChart = page.getByLabel('Cost by Provider chart card');
    const costByLLMChart = page.getByLabel('Cost by LLM chart card');

    const hasCostPerDay = await costPerDayChart.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasCostByProvider = await costByProviderChart
      .isVisible({ timeout: 120_000 })
      .catch(() => false);
    const hasCostByLLM = await costByLLMChart.isVisible({ timeout: 120_000 }).catch(() => false);

    const noData = page.getByText('No data available');
    const hasNoData = await noData.isVisible({ timeout: 120_000 }).catch(() => false);

    logger.info(
      `CP-6: costPerDay=${hasCostPerDay} costByProvider=${hasCostByProvider} costByLLM=${hasCostByLLM} noData=${hasNoData}`,
    );

    expect(hasCostPerDay || hasNoData).toBe(true);
    expect(hasCostByProvider || hasNoData).toBe(true);
    expect(hasCostByLLM || hasNoData).toBe(true);
  });
});
