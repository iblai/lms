import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoTenantPage, waitForAppShell } from '../utils/navigation';
import { readTourOutcome } from '../utils/product-tour';

/**
 * Journey 38: Product Tour
 *
 * First-visit react-joyride tour over the app chrome: the profile menu, the
 * search box, the sidebar's Discover row and, for admins and watchers, the
 * account / management tools in the sidebar footer. The auth setup marks the
 * tour as seen for the test user, so each checkpoint replays it with `?tour=1`.
 */

const tooltip = (page: Page) => page.getByTestId('product-tour-tooltip');
const progress = (page: Page) => page.getByTestId('product-tour-progress');

async function openTour(page: Page): Promise<Locator> {
  await gotoTenantPage(page, 'home?tour=1', { timeout: 120_000 });
  await waitForAppShell(page);
  const tip = tooltip(page);
  await expect(tip).toBeVisible({ timeout: 30_000 });
  return tip;
}

async function stepCount(page: Page): Promise<number> {
  const text = (await progress(page).textContent()) ?? '';
  const total = Number(/of (\d+)/.exec(text)?.[1]);
  expect(total).toBeGreaterThan(0);
  return total;
}

async function goToLastStep(page: Page): Promise<void> {
  const total = await stepCount(page);
  for (let step = 1; step < total; step += 1) {
    await tooltip(page).getByRole('button', { name: 'Next' }).click();
    await expect(progress(page)).toHaveText(`${step + 1} of ${total}`);
  }
}

test.describe('Journey 38: Product Tour', () => {
  test.setTimeout(200000);

  test('CP-1: user opens the app with ?tour=1 and the tour starts on the profile menu', async ({
    page,
  }) => {
    const tip = await openTour(page);
    await expect(tip).toHaveAttribute('data-step-id', 'profile');
    await expect(tip).toContainText('Your profile');
    await expect(progress(page)).toHaveText(/^1 of \d+$/);
    await expect(tip.getByRole('button', { name: 'Back' })).toHaveCount(0);
    await expect(tip.getByRole('button', { name: 'Skip tour' })).toBeVisible();
    await expect(tip.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  test('CP-2: user clicks Next and the tour moves to the search box, then the Discover row', async ({
    page,
  }) => {
    const tip = await openTour(page);

    await tip.getByRole('button', { name: 'Next' }).click();
    await expect(tip).toHaveAttribute('data-step-id', 'search');
    await expect(tip).toContainText('Search');
    await expect(progress(page)).toHaveText(/^2 of \d+$/);

    await tip.getByRole('button', { name: 'Next' }).click();
    await expect(tip).toHaveAttribute('data-step-id', 'discover');
    await expect(tip).toContainText('Discover');
    await expect(progress(page)).toHaveText(/^3 of \d+$/);
  });

  test('CP-3: user clicks Back and returns to the previous step', async ({ page }) => {
    const tip = await openTour(page);
    await tip.getByRole('button', { name: 'Next' }).click();
    await expect(tip).toHaveAttribute('data-step-id', 'search');

    await tip.getByRole('button', { name: 'Back' }).click();
    await expect(tip).toHaveAttribute('data-step-id', 'profile');
    await expect(progress(page)).toHaveText(/^1 of \d+$/);
  });

  test('CP-4: admin/watcher reaches the account tools step last (skips for a learner)', async ({
    page,
  }) => {
    const tip = await openTour(page);

    // The admin cluster (Management, …) sits in the sidebar footer and only
    // renders for admins and watchers; a learner has no account step.
    const management = page
      .getByRole('complementary')
      .first()
      .getByRole('button', { name: 'Management' });
    if (!(await management.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await goToLastStep(page);
    await expect(tip).toHaveAttribute('data-step-id', 'account');
    await expect(tip).toContainText(/Manage your organization|Management/);
    await expect(tip.getByRole('button', { name: 'Done' })).toBeVisible();
    await expect(tip.getByRole('button', { name: 'Skip tour' })).toHaveCount(0);
  });

  test('CP-5: user finishes the tour and it stays dismissed on the next visit', async ({
    page,
  }) => {
    const tip = await openTour(page);
    await goToLastStep(page);

    await tip.getByRole('button', { name: 'Done' }).click();
    await expect(tip).toHaveCount(0);
    expect(await readTourOutcome(page)).toBe('finished');

    // Without ?tour=1 the finished tour must not come back.
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);
    await page.waitForTimeout(4_000); // past the tour's start grace period
    await expect(tooltip(page)).toHaveCount(0);
  });

  test('CP-6: user closes the tour with the X and it is recorded as skipped', async ({ page }) => {
    const tip = await openTour(page);

    await tip.getByRole('button', { name: 'Close tour' }).click();
    await expect(tip).toHaveCount(0);
    expect(await readTourOutcome(page)).toBe('skipped');
  });
});
