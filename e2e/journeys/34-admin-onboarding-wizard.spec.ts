import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage } from '../utils/navigation';

/**
 * Journey 34: Admin Onboarding Wizard
 *
 * Validates the tenant-admin first-run wizard at `/platform/<tenant>/onboarding`
 * (the SDK `OnboardingWizard` embedded by app/platform/[tenant]/onboarding/page.tsx).
 * Distinct from Journey 02, which covers the learner-facing `/start` screen.
 *
 *  1. The route renders the wizard's organization step
 *  2. Continue is gated on an organization name
 *  3. Naming the organization advances to the sector step
 *  4. Picking a sector advances to the invite step
 *  5. Progress is announced accessibly (progressbar + step count)
 *  6. The final step wraps up the setup and Complete finalizes onboarding
 */
test.describe('Journey 34: Admin Onboarding Wizard', () => {
  test.setTimeout(200000);

  /** Land on the wizard and wait for the first step to paint. */
  async function gotoWizard(page: import('@playwright/test').Page) {
    await gotoTenantPage(page, 'onboarding', { timeout: 120000 });
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 120000 });
  }

  const orgInput = (page: import('@playwright/test').Page) => page.getByLabel('Organization name');
  const continueButton = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: 'Continue' });

  test('Checkpoint 1: Onboarding route renders the organization step', async ({ page }) => {
    await gotoWizard(page);

    await expect(page.getByRole('heading', { name: /Welcome to/i })).toBeVisible({
      timeout: 60000,
    });
    await expect(orgInput(page)).toBeVisible();
    logger.info('Organization step rendered on /onboarding');
  });

  test('Checkpoint 2: Continue is disabled until an organization is named', async ({ page }) => {
    await gotoWizard(page);

    await expect(continueButton(page)).toBeDisabled();

    await orgInput(page).fill('Acme University');
    await expect(continueButton(page)).toBeEnabled();
    logger.info('Continue gating on organization name verified');
  });

  test('Checkpoint 3: Naming the organization advances to the sector step', async ({ page }) => {
    await gotoWizard(page);

    await orgInput(page).fill('Acme University');
    await continueButton(page).click();

    await expect(page.getByRole('radiogroup')).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('radio').first()).toBeVisible();
    logger.info('Sector step reached');
  });

  test('Checkpoint 4: Selecting a sector advances to the invite step', async ({ page }) => {
    await gotoWizard(page);

    await orgInput(page).fill('Acme University');
    await continueButton(page).click();

    const sector = page.getByRole('radio').first();
    await expect(sector).toBeVisible({ timeout: 60000 });
    await sector.click();
    await expect(sector).toHaveAttribute('aria-checked', 'true');

    await continueButton(page).click();

    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible({
      timeout: 60000,
    });
    logger.info('Invite step reached');
  });

  test('Checkpoint 5: Wizard progress is exposed to assistive tech', async ({ page }) => {
    await gotoWizard(page);

    const progress = page.getByRole('progressbar');
    await expect(progress).toBeVisible({ timeout: 60000 });
    await expect(progress).toHaveAttribute('aria-valuenow', '1');

    await orgInput(page).fill('Acme University');
    await continueButton(page).click();

    await expect(progress).toHaveAttribute('aria-valuenow', '2', { timeout: 60000 });
    logger.info('Progressbar advances with the wizard step');
  });

  test('Checkpoint 6: Final step wraps up the setup and completes onboarding', async ({ page }) => {
    await gotoWizard(page);

    await orgInput(page).fill('Acme University');
    await continueButton(page).click();

    const sector = page.getByRole('radio').first();
    await expect(sector).toBeVisible({ timeout: 60000 });
    await sector.click();
    await continueButton(page).click();

    // Leaving the invite step persists the answers before the final step opens.
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toBeVisible({
      timeout: 60000,
    });
    await continueButton(page).click();

    const finalStep = page.getByTestId('onboarding-completion-step');
    await expect(finalStep).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('heading', { name: "You're all set" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete' })).toBeVisible();

    // The agent belongs to the member flow's closing step, not to setup.
    await expect(finalStep.locator('agent-ai')).toHaveCount(0);

    await page.getByRole('button', { name: 'Complete' }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 60000 });
    logger.info('Final step completed onboarding and landed on /home');
  });
});
