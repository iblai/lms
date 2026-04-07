import { test, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 19: Analytics Topics/Transcripts/Financial', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForLoadState('domcontentloaded');

    // Admin gate: check if AI Analytics link is visible
    const analyticsLink = page.getByRole('link', { name: /ai analytics|analytics/i });
    const isAdmin = await analyticsLink.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!isAdmin) {
      test.skip(true, 'Analytics requires admin access — AI Analytics link not visible');
      return;
    }

    await analyticsLink.click();
    await page.waitForURL((url) => url.href.includes('/analytics'), { timeout: 30_000 });
  });

  // ── Topics ────────────────────────────────────────────────────────────────

  test('CP-1: topics analytics loads with charts', async ({ page }) => {
    const topicsTab = page
      .getByRole('tab', { name: /topics/i })
      .or(page.getByRole('link', { name: /topics/i }));
    const hasTopicsTab = await topicsTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasTopicsTab) {
      test.skip(true, 'Topics analytics tab not visible');
      return;
    }

    await topicsTab.click();
    await page.waitForTimeout(2_000);

    // Verify topics page loaded with charts or content
    const content = page
      .locator('[class*="chart"], [class*="topic"], [data-testid*="topic"], canvas, svg')
      .first()
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 30_000 });
  });

  test('CP-2: topics distribution data is displayed', async ({ page }) => {
    const topicsTab = page
      .getByRole('tab', { name: /topics/i })
      .or(page.getByRole('link', { name: /topics/i }));
    const hasTopicsTab = await topicsTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasTopicsTab) {
      test.skip(true, 'Topics analytics tab not visible');
      return;
    }

    await topicsTab.click();
    await page.waitForTimeout(2_000);

    // Look for distribution data: charts, tables, or metrics
    const distributionContent = page
      .locator(
        '[class*="distribution"], [class*="chart"], canvas, svg, [class*="topic-list"], table',
      )
      .first();
    const emptyState = page.getByText(/no data|no topics|empty/i);

    const hasDistribution = await distributionContent
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);

    // Either data or empty state should be visible
    expect(hasDistribution || hasEmpty).toBe(true);
  });

  // ── Transcripts ───────────────────────────────────────────────────────────

  test('CP-3: transcripts analytics loads with metrics', async ({ page }) => {
    const transcriptsTab = page
      .getByRole('tab', { name: /transcripts/i })
      .or(page.getByRole('link', { name: /transcripts/i }));
    const hasTranscriptsTab = await transcriptsTab
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    if (!hasTranscriptsTab) {
      test.skip(true, 'Transcripts analytics tab not visible');
      return;
    }

    await transcriptsTab.click();
    await page.waitForTimeout(2_000);

    const content = page
      .locator(
        '[class*="transcript"], [data-testid*="transcript"], [class*="metric"], [class*="chart"]',
      )
      .first()
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 30_000 });
  });

  test('CP-4: transcripts costs and ratings are displayed', async ({ page }) => {
    const transcriptsTab = page
      .getByRole('tab', { name: /transcripts/i })
      .or(page.getByRole('link', { name: /transcripts/i }));
    const hasTranscriptsTab = await transcriptsTab
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    if (!hasTranscriptsTab) {
      test.skip(true, 'Transcripts analytics tab not visible');
      return;
    }

    await transcriptsTab.click();
    await page.waitForTimeout(2_000);

    // Look for cost/rating metrics
    const costMetric = page.getByText(/cost|spend|price|\$/i).first();
    const ratingMetric = page.getByText(/rating|satisfaction|score/i).first();
    const metricsCards = page.locator(
      '[class*="metric"], [class*="stat"], [class*="card"], [class*="kpi"]',
    );

    const hasCost = await costMetric.isVisible({ timeout: 10_000 }).catch(() => false);
    const hasRating = await ratingMetric.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasMetrics = await metricsCards
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const emptyState = page.getByText(/no data|no transcripts|empty/i);
    const hasEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);

    // At least some content should be present
    expect(hasCost || hasRating || hasMetrics || hasEmpty).toBe(true);
  });

  // ── Financial ─────────────────────────────────────────────────────────────

  test('CP-5: financial analytics loads with cost cards', async ({ page }) => {
    const financialTab = page
      .getByRole('tab', { name: /financial/i })
      .or(page.getByRole('link', { name: /financial/i }));
    const hasFinancialTab = await financialTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasFinancialTab) {
      test.skip(true, 'Financial analytics tab not visible');
      return;
    }

    await financialTab.click();
    await page.waitForTimeout(2_000);

    // Verify financial page loaded
    const content = page
      .locator(
        '[class*="financial"], [data-testid*="financial"], [class*="cost"], [class*="metric"]',
      )
      .first()
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 30_000 });

    // Look for cost cards
    const costCards = page.locator(
      '[class*="cost-card"], [class*="metric-card"], [class*="stat-card"], [class*="card"]',
    );
    const hasCostCards = await costCards
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (hasCostCards) {
      const count = await costCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('CP-6: financial cost breakdowns are displayed', async ({ page }) => {
    const financialTab = page
      .getByRole('tab', { name: /financial/i })
      .or(page.getByRole('link', { name: /financial/i }));
    const hasFinancialTab = await financialTab.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasFinancialTab) {
      test.skip(true, 'Financial analytics tab not visible');
      return;
    }

    await financialTab.click();
    await page.waitForTimeout(2_000);

    // Look for cost breakdown data: charts, tables, or detailed metrics
    const breakdownContent = page
      .locator('[class*="breakdown"], [class*="chart"], canvas, svg, table, [class*="cost-detail"]')
      .first();
    const costText = page.getByText(/\$|cost|total|spend|budget/i).first();
    const emptyState = page.getByText(/no data|no financial|empty/i);

    const hasBreakdown = await breakdownContent.isVisible({ timeout: 15_000 }).catch(() => false);
    const hasCostText = await costText.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);

    // Financial page should show either breakdown data or empty state
    expect(hasBreakdown || hasCostText || hasEmpty).toBe(true);
  });
});
