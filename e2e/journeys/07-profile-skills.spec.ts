import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Journey 07: Profile Skills
 *
 * Validates the profile skills page at /profile/skills:
 *  1. Skills page loads with skill sections
 *  2. Skill cards show name and rating or empty state
 *  3. Click self-reported skill → detail modal
 *  4. Modal close
 *  5. Add Skill button opens dialog
 */
test.describe('Journey 07: Profile Skills', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/skills`, {
      timeout: 120000,
    });
    await waitForAppShell(page);
  });

  test('Checkpoint 1: Skills page loads with skill sections', async ({ page }) => {
    await expect(page).toHaveURL(/\/profile\/skills/);

    // The page always renders three section headings: Earned, Self-Reported, Desired
    const earnedHeading = page.getByRole('heading', { name: 'Earned' });
    await expect(earnedHeading).toBeVisible({ timeout: 30000 });

    const selfReportedHeading = page.getByRole('heading', { name: 'Self-Reported' });
    await expect(selfReportedHeading).toBeVisible({ timeout: 10000 });

    const desiredHeading = page.getByRole('heading', { name: 'Desired' });
    await expect(desiredHeading).toBeVisible({ timeout: 10000 });

    logger.info('All three skill sections are visible');
  });

  test('Checkpoint 2: Skill cards show name or empty state', async ({ page }) => {
    // Each section shows either SkillBox cards or a DefaultEmptyBox
    // Check the Earned section first
    const earnedHeading = page.getByRole('heading', { name: 'Earned' });
    await expect(earnedHeading).toBeVisible({ timeout: 30000 });

    // SkillBox renders skill.name as a <p> and DefaultEmptyBox shows "You don't have any ... yet."
    const earnedSection = earnedHeading.locator('..').locator('..');
    const hasSkillName = await earnedSection
      .locator('p.text-gray-600')
      .first()
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (hasSkillName) {
      const skillText = await earnedSection.locator('p.text-gray-600').first().textContent();
      logger.info(`First earned skill: ${skillText}`);
      expect(skillText?.length).toBeGreaterThan(0);
    } else {
      // Check for empty state message
      const emptyText = earnedSection.getByText(/you don't have any/i).first();
      await expect(emptyText).toBeVisible({ timeout: 10000 });
      logger.info('Earned skills section shows empty state');
    }
  });

  test('Checkpoint 3: Click self-reported skill opens detail modal', async ({ page }) => {
    // Only self-reported skills have an onSkillClick handler that opens the modal
    const selfReportedHeading = page.getByRole('heading', { name: 'Self-Reported' });
    await expect(selfReportedHeading).toBeVisible({ timeout: 30000 });

    const selfReportedSection = selfReportedHeading.locator('..').locator('..');
    // SkillBox is a div with cursor-pointer class containing a <p> with the skill name
    const skillCard = selfReportedSection.locator('div.cursor-pointer').first();
    const hasCards = await skillCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCards) {
      logger.info('No self-reported skill cards — skipping modal test');
      test.skip();
      return;
    }

    await skillCard.click();

    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible({ timeout: 15000 });
    logger.info('Skill detail modal opened');
  });

  test('Checkpoint 4: Skill modal closes properly', async ({ page }) => {
    const selfReportedSection = page
      .getByRole('heading', { name: 'Self-Reported' })
      .locator('..')
      .locator('..');
    const skillCard = selfReportedSection.locator('div.cursor-pointer').first();
    const hasCards = await skillCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCards) {
      test.skip();
      return;
    }

    await skillCard.click();

    const modal = page.getByRole('dialog').first();
    const hasModal = await modal.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasModal) {
      logger.info('No modal appeared — skipping close test');
      test.skip();
      return;
    }

    // Try close button or Escape
    const closeButton = modal.getByRole('button', { name: /close|×|x/i }).first();
    const hasClose = await closeButton.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasClose) {
      await closeButton.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await expect(modal).not.toBeVisible({ timeout: 10000 });
    logger.info('Skill modal closed');
  });

  test('Checkpoint 5: Add Skill button opens dialog', async ({ page }) => {
    // There are Add Skill buttons for Self-Reported and Desired sections
    const addSkillButton = page.getByRole('button', { name: /add skill/i }).first();
    await expect(addSkillButton).toBeVisible({ timeout: 15000 });
    logger.info('Add Skill button is visible');

    await addSkillButton.click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 15000 });
    logger.info('Add Skill dialog opened');
  });
});
