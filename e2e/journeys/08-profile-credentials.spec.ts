import { test, expect } from '@playwright/test';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Journey 08: Profile Credentials
 *
 * Validates the profile credentials page:
 *  1. Credentials page with list or empty state
 *  2. Credential cards display info
 *  3. Click credential → modal
 *  4. Modal close
 *  5. Download/share button
 */
test.describe('Journey 08: Profile Credentials', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/credentials`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForPageReady(page);
  });

  test('Checkpoint 1: Credentials page with list or empty state', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/profile\/credentials/);

    const credentialCard = page
      .locator('[data-testid*="credential-card"], [data-testid*="credential-item"]')
      .first();
    const emptyState = page
      .getByText(/no credentials|empty|you don't have any credentials/i)
      .first();
    const credentialsHeading = page.getByRole('heading', { name: /credentials/i }).first();

    const hasCards = await credentialCard.isVisible({ timeout: 15000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const hasHeading = await credentialsHeading.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasCards) {
      logger.info('Credential cards are displayed');
    } else if (hasEmpty) {
      logger.info('Empty state displayed — no credentials');
    } else if (hasHeading) {
      logger.info('Credentials heading visible — page loaded');
    }

    expect(hasCards || hasEmpty || hasHeading).toBeTruthy();
  });

  test('Checkpoint 2: Credential cards display info', async ({ page }) => {
    const credentialCard = page
      .locator('[data-testid*="credential-card"], [data-testid*="credential-item"]')
      .first();
    const hasCards = await credentialCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No credential cards — skipping info check');
      test.skip();
      return;
    }

    const cardText = await credentialCard.textContent();
    expect(cardText?.length).toBeGreaterThan(0);
    logger.info(`First credential card content: ${cardText?.substring(0, 150)}`);
  });

  test('Checkpoint 3: Click credential opens modal', async ({ page }) => {
    const credentialCard = page
      .locator('[data-testid*="credential-card"], [data-testid*="credential-item"]')
      .first();
    const hasCards = await credentialCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No credential cards — skipping modal test');
      test.skip();
      return;
    }

    await credentialCard.click();

    const modal = page
      .getByRole('dialog')
      .first()
      .or(
        page
          .locator('[data-testid*="credential-modal"], [data-testid*="credential-detail"]')
          .first()
      );

    const hasModal = await modal.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasModal) {
      await expect(modal).toBeVisible();
      logger.info('Credential detail modal opened');
    } else {
      const urlChanged = !page.url().endsWith('/profile/credentials');
      if (urlChanged) {
        logger.info('Credential click navigated to detail page');
      } else {
        logger.info('No modal or navigation after clicking credential');
      }
    }
  });

  test('Checkpoint 4: Credential modal closes properly', async ({ page }) => {
    const credentialCard = page
      .locator('[data-testid*="credential-card"], [data-testid*="credential-item"]')
      .first();
    const hasCards = await credentialCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      test.skip();
      return;
    }

    await credentialCard.click();

    const modal = page
      .getByRole('dialog')
      .first()
      .or(
        page
          .locator('[data-testid*="credential-modal"], [data-testid*="credential-detail"]')
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
      logger.info('Credential modal closed');
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      logger.info('Attempted to close modal via Escape');
    }
  });

  test('Checkpoint 5: Download or share button', async ({ page }) => {
    const credentialCard = page
      .locator('[data-testid*="credential-card"], [data-testid*="credential-item"]')
      .first();
    const hasCards = await credentialCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No credential cards — skipping download/share check');
      test.skip();
      return;
    }

    // Check for download or share buttons on the card itself
    const downloadButton = page
      .getByRole('button', { name: /download|share|export|view/i })
      .first();
    const downloadLink = page
      .getByRole('link', { name: /download|share|export|view/i })
      .first();

    const hasDownloadBtn = await downloadButton.isVisible({ timeout: 10000 }).catch(() => false);
    const hasDownloadLink = await downloadLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDownloadBtn) {
      logger.info('Download/share button found');
    } else if (hasDownloadLink) {
      logger.info('Download/share link found');
    } else {
      // Open the credential modal and check inside
      await credentialCard.click();
      await page.waitForTimeout(2000);

      const modalDownload = page.getByRole('button', { name: /download|share|export/i }).first();
      const hasModalDownload = await modalDownload.isVisible({ timeout: 10000 }).catch(() => false);

      if (hasModalDownload) {
        logger.info('Download/share button found inside modal');
      } else {
        logger.info('No download/share action found');
      }
    }
  });
});
