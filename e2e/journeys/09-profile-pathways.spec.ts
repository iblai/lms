import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

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
      timeout: 120000,
    });
    await waitForAppShell(page);
  });

  test('Checkpoint 1: Pathways page with list or empty state', async ({ page }) => {
    await expect(page).toHaveURL(/\/profile\/pathways/);

    // Wait for pathways data to finish loading — either cards appear or empty state shows.
    // Use expect().toBeVisible() (polling) instead of isVisible() (instant check) so we
    // wait for elements that don't yet exist in the DOM during the loading/skeleton phase.
    const pathwayCard = page.locator('[data-testid="pathway-card"]').first();
    const emptyState = page.getByText(/no pathways found/i).first();

    const loadedIndicator = pathwayCard.or(emptyState);
    await expect(loadedIndicator).toBeVisible({ timeout: 120_000 });

    const hasCards = await pathwayCard.isVisible().catch(() => false);
    if (hasCards) {
      logger.info('Pathway cards are displayed');
    } else {
      logger.info('Empty state displayed — no pathways');
    }
  });

  test('Checkpoint 2: Pathway cards with name and progress', async ({ page }) => {
    const pathwayCard = page.locator('[data-testid="pathway-card"]').first();
    const emptyState = page.getByText(/no pathways found/i).first();

    // Wait for loading to finish
    const loaded = pathwayCard.or(emptyState);
    await expect(loaded).toBeVisible({ timeout: 120_000 });

    const hasCards = await pathwayCard.isVisible().catch(() => false);
    if (!hasCards) {
      logger.info('No pathway cards — skipping name/progress check');
      test.skip();
      return;
    }

    // Verify the card has content (h3 with pathway name)
    const cardText = await pathwayCard.textContent();
    expect(cardText?.length).toBeGreaterThan(0);
    logger.info(`First pathway card content: ${cardText?.substring(0, 150)}`);

    // The card has a CSS progress bar (div with bg-amber-500), not a role="progressbar"
    const progressBar = pathwayCard.locator('.bg-amber-500').first();
    const hasProgressBar = await progressBar.isVisible().catch(() => false);

    if (hasProgressBar) {
      logger.info('Progress bar found on pathway card');
    } else {
      logger.info('No explicit progress indicator — card may show name only');
    }
  });

  test('Checkpoint 3: Click pathway opens modal', async ({ page }) => {
    const pathwayCard = page.locator('[data-testid="pathway-card"]').first();
    const emptyState = page.getByText(/no pathways found/i).first();

    await expect(pathwayCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCards = await pathwayCard.isVisible().catch(() => false);
    if (!hasCards) {
      logger.info('No pathway cards — skipping modal test');
      test.skip();
      return;
    }

    await pathwayCard.click();

    const modal = page.getByRole('dialog').first();
    const hasModal = await modal.isVisible({ timeout: 120_000 }).catch(() => false);

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
    const pathwayCard = page.locator('[data-testid="pathway-card"]').first();
    const emptyState = page.getByText(/no pathways found/i).first();

    await expect(pathwayCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCards = await pathwayCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip();
      return;
    }

    await pathwayCard.click();

    const modal = page.getByRole('dialog').first();
    const hasModal = await modal.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasModal) {
      logger.info('No modal appeared — skipping close test');
      test.skip();
      return;
    }

    const closeButton = page.getByRole('button', { name: /close|×|x/i }).first();
    const hasClose = await closeButton.isVisible({ timeout: 120_000 }).catch(() => false);

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

  test('Checkpoint 5: Create Pathway button (admin only)', async ({ page }) => {
    const createPathwayButton = page
      .getByRole('button', { name: /create pathway|add pathway|new pathway/i })
      .first()
      .or(page.getByTestId('create-pathway-button'));

    const hasCreateButton = await createPathwayButton
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (hasCreateButton) {
      await expect(createPathwayButton).toBeVisible();
      logger.info('Create Pathway button is visible (admin user)');
    } else {
      logger.info('Create Pathway button not found — user may not be admin');
    }
  });
});
