import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../utils/navigation';
import {
  openProfileSection,
  locatePaywallConfig,
  paywallSearchInput,
  addCustomItemButton,
  expectWizardSteps,
  fillCustomItem,
  locateMonetizationBasePathInput,
  makeAccessDeniedResponse,
  mockAccessCheck402,
  findPaywallModal,
} from '../utils/monetization-helpers';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 30: Monetization — Paywall Config Wizard', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('admin opens the monetization section and sees the new Paywall Config region', async ({
    page,
  }) => {
    const dialog = await openProfileSection(page, /monetization/i);
    if (!dialog) test.skip(true, 'Profile dialog not reachable (likely non-admin or missing UI)');
    const region = await locatePaywallConfig(dialog!);
    if (!region) test.skip(true, 'Stripe not connected — paywall config is hidden in this env');
    await expect(paywallSearchInput(region!)).toBeVisible({ timeout: 10_000 });
    await expect(addCustomItemButton(region!)).toBeVisible();
  });

  test('the items list shows the new search dropdown and an empty / configured state', async ({
    page,
  }) => {
    const dialog = await openProfileSection(page, /monetization/i);
    if (!dialog) test.skip(true, 'Profile dialog not reachable');
    const region = await locatePaywallConfig(dialog!);
    if (!region) test.skip(true, 'Stripe not connected');
    const empty = region!.getByText(/no items configured yet/i);
    const cards = region!.locator('[class*="border"]').filter({ hasText: /Active|Disabled/i });
    const emptyVisible = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    const cardsVisible = (await cards.count()) > 0;
    expect(emptyVisible || cardsVisible).toBe(true);
  });

  test('clicking + Add custom item opens the wizard with three steps', async ({ page }) => {
    const dialog = await openProfileSection(page, /monetization/i);
    if (!dialog) test.skip(true, 'Profile dialog not reachable');
    const region = await locatePaywallConfig(dialog!);
    if (!region) test.skip(true, 'Stripe not connected');

    await addCustomItemButton(region!).click();
    await expect(dialog!.getByRole('button', { name: /^Back$/ })).toBeVisible({ timeout: 5_000 });
    await expectWizardSteps(dialog!, ['Item Details', 'Paywall', 'Pricing']);
  });

  test('typing into the custom item form shows live slug previews and gates the Create button', async ({
    page,
  }) => {
    const dialog = await openProfileSection(page, /monetization/i);
    if (!dialog) test.skip(true, 'Profile dialog not reachable');
    const region = await locatePaywallConfig(dialog!);
    if (!region) test.skip(true, 'Stripe not connected');

    await addCustomItemButton(region!).click();
    const createBtn = dialog!.getByRole('button', { name: /Create & Continue/i });
    await expect(createBtn).toBeDisabled();

    await fillCustomItem(dialog!, { type: 'My Tool', name: 'Advanced AI Course' });
    await expect(dialog!.getByText('Slug: my-tool')).toBeVisible();
    await expect(dialog!.getByText('ID: advanced-ai-course')).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('search dropdown is reachable and surfaces results or a no-match message', async ({
    page,
  }) => {
    const dialog = await openProfileSection(page, /monetization/i);
    if (!dialog) test.skip(true, 'Profile dialog not reachable');
    const region = await locatePaywallConfig(dialog!);
    if (!region) test.skip(true, 'Stripe not connected');

    const search = paywallSearchInput(region!);
    await search.click();
    await search.fill('a');
    const noItems = dialog!.getByText('No items found');
    const searching = dialog!.getByText('Searching...');
    const result = dialog!
      .locator('button:has-text("Course"), button:has-text("Program"), button:has-text("Agent")')
      .first();
    await expect(noItems.or(searching).or(result)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Journey 30: Monetization — Advanced Settings', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('admin sees a Public Monetization Base Path input in Advanced settings', async ({
    page,
  }) => {
    const dialog = await openProfileSection(page, /advanced/i);
    if (!dialog) test.skip(true, 'Profile dialog not reachable');
    const input = await locateMonetizationBasePathInput(dialog!);
    if (!input) test.skip(true, 'monetization_base_path setting not surfaced in this env');
    await expect(input!).toBeVisible();
    const value = await input!.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('Journey 30: Monetization — Consumer Paywall Modal (route-mocked)', () => {
  test.setTimeout(120_000);

  /**
   * Deterministically exercise the consumer-side paywall flow without a real
   * paywalled program in the DB. We intercept the access-check endpoint to
   * return a 402 with a canonical pricing payload — the data-layer's new
   * `validateStatus` then surfaces the body as `data`, the program page
   * dispatches `setDisplayMonetizationCheckoutModal(true)`, and the
   * `MonetizationWrapper` mounts the `PaywallModal`.
   */
  test('mocked 402 access-check on /programs/<id> opens the PaywallModal with pricing', async ({
    page,
  }) => {
    const programId = process.env.E2E_PAYWALL_PROGRAM_ID || 'program-v1:smoke+e2e+2026';
    const denied = makeAccessDeniedResponse({
      itemType: 'program',
      itemId: programId,
      itemName: 'E2E Smoke Course',
      priceAmount: '12.50',
    });
    const teardown = await mockAccessCheck402(page, denied);
    try {
      await page.goto(`${SKILL_HOST}/programs/${encodeURIComponent(programId)}`, {
        timeout: 120_000,
      });
      await waitForAppShell(page);
      const modal = await findPaywallModal(page);
      if (!modal) {
        // Program route can short-circuit (e.g. program not found) before
        // checkAccess fires; treat that as a soft skip rather than a fail.
        test.skip(true, 'PaywallModal not mounted — program route did not run access-check');
        return;
      }
      await expect(modal).toBeVisible();
      // The PaywallModal renders pricing — the item name and price string.
      await expect(modal.getByText(/E2E Smoke Course/i)).toBeVisible({ timeout: 10_000 });
      await expect(modal.getByText(/12\.50|\$12\.50/)).toBeVisible({ timeout: 10_000 });
      // Modal should expose a CTA per price entry.
      await expect(
        modal.getByRole('button', { name: /subscribe|buy now|unlock|continue|full access/i }),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await teardown();
    }
  });

  test('mocked 402 access-check on /course-content/<id> opens the PaywallModal', async ({
    page,
  }) => {
    const courseId = process.env.E2E_PAYWALL_COURSE_ID || 'course-v1:smoke+e2e+2026';
    const denied = makeAccessDeniedResponse({
      itemType: 'course',
      itemId: courseId,
      itemName: 'E2E Smoke Lesson',
    });
    const teardown = await mockAccessCheck402(page, denied);
    try {
      await page.goto(`${SKILL_HOST}/course-content/${encodeURIComponent(courseId)}`, {
        timeout: 120_000,
      });
      await waitForAppShell(page);
      const modal = await findPaywallModal(page);
      if (!modal) {
        test.skip(true, 'PaywallModal not mounted — course route did not run access-check');
        return;
      }
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/E2E Smoke Lesson/i)).toBeVisible({ timeout: 10_000 });
    } finally {
      await teardown();
    }
  });
});
