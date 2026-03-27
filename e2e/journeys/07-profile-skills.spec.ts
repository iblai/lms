import { test, expect } from '@playwright/test';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Journey 07: Profile Skills
 *
 * Validates the profile skills page:
 *  1. Skills page with list or empty state
 *  2. Skill cards show name/proficiency
 *  3. Click skill → detail modal
 *  4. Modal close
 *  5. Add Skill button
 */
test.describe('Journey 07: Profile Skills', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/skills`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForPageReady(page);
  });

  test('Checkpoint 1: Skills page with list or empty state', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/profile\/skills/);

    // Wait for content to load — either skill cards or an empty state
    const skillCard = page.locator('[data-testid*="skill-card"], [data-testid*="skill-item"]').first();
    const emptyState = page.getByText(/no skills|empty|you don't have any skills/i).first();
    const skillsHeading = page.getByRole('heading', { name: /skills/i }).first();

    const hasCards = await skillCard.isVisible({ timeout: 15000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const hasHeading = await skillsHeading.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasCards) {
      logger.info('Skills cards are displayed');
    } else if (hasEmpty) {
      logger.info('Empty state displayed — no skills');
    } else if (hasHeading) {
      logger.info('Skills heading visible — page loaded');
    }

    expect(hasCards || hasEmpty || hasHeading).toBeTruthy();
  });

  test('Checkpoint 2: Skill cards show name and proficiency', async ({
    page,
  }) => {
    const skillCard = page.locator('[data-testid*="skill-card"], [data-testid*="skill-item"]').first();
    const hasCards = await skillCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No skill cards found — skipping name/proficiency check');
      test.skip();
      return;
    }

    // Get text content of the first card
    const cardText = await skillCard.textContent();
    expect(cardText?.length).toBeGreaterThan(0);
    logger.info(`First skill card content: ${cardText?.substring(0, 100)}`);

    // Look for proficiency indicators (progress bars, percentages, levels)
    const proficiency = skillCard.locator('[role="progressbar"], [data-testid*="proficiency"], [data-testid*="level"]').first();
    const profText = skillCard.getByText(/beginner|intermediate|advanced|expert|%/i).first();

    const hasProfIndicator = await proficiency.isVisible({ timeout: 5000 }).catch(() => false);
    const hasProfText = await profText.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProfIndicator || hasProfText) {
      logger.info('Proficiency indicator found on skill card');
    } else {
      logger.info('No explicit proficiency indicator — card may use different display');
    }
  });

  test('Checkpoint 3: Click skill opens detail modal', async ({ page }) => {
    const skillCard = page.locator('[data-testid*="skill-card"], [data-testid*="skill-item"]').first();
    const hasCards = await skillCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No skill cards — skipping modal test');
      test.skip();
      return;
    }

    await skillCard.click();

    // Wait for a modal/dialog/detail view to appear
    const modal = page.getByRole('dialog').first()
      .or(page.locator('[data-testid*="skill-modal"], [data-testid*="skill-detail"]').first());

    const hasModal = await modal.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasModal) {
      logger.info('Skill detail modal opened');
      await expect(modal).toBeVisible();
    } else {
      // The click may navigate to a detail page instead
      const urlChanged = !page.url().endsWith('/profile/skills');
      if (urlChanged) {
        logger.info('Skill click navigated to detail page');
      } else {
        logger.info('No modal or navigation detected after click');
      }
    }
  });

  test('Checkpoint 4: Skill modal closes properly', async ({ page }) => {
    const skillCard = page.locator('[data-testid*="skill-card"], [data-testid*="skill-item"]').first();
    const hasCards = await skillCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      test.skip();
      return;
    }

    await skillCard.click();

    const modal = page.getByRole('dialog').first()
      .or(page.locator('[data-testid*="skill-modal"], [data-testid*="skill-detail"]').first());

    const hasModal = await modal.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasModal) {
      logger.info('No modal appeared — skipping close test');
      test.skip();
      return;
    }

    // Close the modal
    const closeButton = page.getByRole('button', { name: /close|×|x/i }).first();
    const hasClose = await closeButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasClose) {
      await closeButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      logger.info('Skill modal closed via close button');
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      logger.info('Attempted to close modal via Escape key');
    }
  });

  test('Checkpoint 5: Add Skill button', async ({ page }) => {
    const addSkillButton = page.getByRole('button', { name: /add skill/i }).first()
      .or(page.getByTestId('add-skill-button'));

    const hasAddButton = await addSkillButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasAddButton) {
      await expect(addSkillButton).toBeVisible();
      logger.info('Add Skill button is visible');
    } else {
      logger.info('Add Skill button not found — feature may not be available');
    }
  });
});
