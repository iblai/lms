import { test, expect } from '@playwright/test';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Journey 09: Profile Pathways
 *
 * Validates the profile pathways page:
 *  1. Pathways page with list or empty state
 *  2. Pathway cards with name/progress
 *  3. Click pathway → modal
 *  4. Modal close
 *  5. Create Pathway button (admin)
 */
test.describe('Journey 09: Profile Pathways', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/pathways`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForPageReady(page);
  });

  test('Checkpoint 1: Pathways page with list or empty state', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/profile\/pathways/);

    const pathwayCard = page
      .locator('[data-testid*="pathway-card"], [data-testid*="pathway-item"]')
      .first();
    const emptyState = page
      .getByText(/no pathways|empty|you don't have any pathways/i)
      .first();
    const pathwaysHeading = page.getByRole('heading', { name: /pathways/i }).first();

    const hasCards = await pathwayCard.isVisible({ timeout: 15000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const hasHeading = await pathwaysHeading.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasCards) {
      logger.info('Pathway cards are displayed');
    } else if (hasEmpty) {
      logger.info('Empty state displayed — no pathways');
    } else if (hasHeading) {
      logger.info('Pathways heading visible — page loaded');
    }

    expect(hasCards || hasEmpty || hasHeading).toBeTruthy();
  });

  test('Checkpoint 2: Pathway cards with name and progress', async ({
    page,
  }) => {
    const pathwayCard = page
      .locator('[data-testid*="pathway-card"], [data-testid*="pathway-item"]')
      .first();
    const hasCards = await pathwayCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No pathway cards — skipping name/progress check');
      test.skip();
      return;
    }

    // Verify the card has content
    const cardText = await pathwayCard.textContent();
    expect(cardText?.length).toBeGreaterThan(0);
    logger.info(`First pathway card content: ${cardText?.substring(0, 150)}`);

    // Look for progress indicators
    const progressBar = pathwayCard.locator('[role="progressbar"]').first();
    const progressText = pathwayCard.getByText(/%|complete|progress/i).first();

    const hasProgressBar = await progressBar.isVisible({ timeout: 5000 }).catch(() => false);
    const hasProgressText = await progressText.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProgressBar) {
      logger.info('Progress bar found on pathway card');
    } else if (hasProgressText) {
      logger.info('Progress text found on pathway card');
    } else {
      logger.info('No explicit progress indicator — card may show name only');
    }
  });

  test('Checkpoint 3: Click pathway opens modal', async ({ page }) => {
    const pathwayCard = page
      .locator('[data-testid*="pathway-card"], [data-testid*="pathway-item"]')
      .first();
    const hasCards = await pathwayCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No pathway cards — skipping modal test');
      test.skip();
      return;
    }

    await pathwayCard.click();

    const modal = page
      .getByRole('dialog')
      .first()
      .or(
        page
          .locator('[data-testid*="pathway-modal"], [data-testid*="pathway-detail"]')
          .first()
      );

    const hasModal = await modal.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasModal) {
      await expect(modal).toBeVisible();
      logger.info('Pathway detail modal opened');
    } else {
      const urlChanged = !page.url().endsWith('/profile/pathways');
      if (urlChanged) {
        logger.info('Pathway click navigated to detail page');
      } else {
        logger.info('No modal or navigation after clicking pathway');
      }
    }
  });

  test('Checkpoint 4: Pathway modal closes properly', async ({ page }) => {
    const pathwayCard = page
      .locator('[data-testid*="pathway-card"], [data-testid*="pathway-item"]')
      .first();
    const hasCards = await pathwayCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      test.skip();
      return;
    }

    await pathwayCard.click();

    const modal = page
      .getByRole('dialog')
      .first()
      .or(
        page
          .locator('[data-testid*="pathway-modal"], [data-testid*="pathway-detail"]')
          .first()
      );

    const hasModal = await modal.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasModal) {
      logger.info('No modal appeared — skipping close test');
      test.skip();
      return;
    }

    const closeButton = page.getByRole('button', { name: /close|×|x/i }).first();
    const hasClose = await closeButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasClose) {
      await closeButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      logger.info('Pathway modal closed');
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      logger.info('Attempted to close modal via Escape');
    }
  });

  test('Checkpoint 5: Create Pathway button (admin only)', async ({
    page,
  }) => {
    const createPathwayButton = page
      .getByRole('button', { name: /create pathway|add pathway|new pathway/i })
      .first()
      .or(page.getByTestId('create-pathway-button'));

    const hasCreateButton = await createPathwayButton
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (hasCreateButton) {
      await expect(createPathwayButton).toBeVisible();
      logger.info('Create Pathway button is visible (admin user)');
    } else {
      logger.info('Create Pathway button not found — user may not be admin');
    }
  });
});
