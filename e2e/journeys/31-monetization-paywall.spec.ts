import { test, expect } from '@playwright/test';
import { waitForAppShell, navigateToAccountComponent } from '../utils/navigation';
import {
  locatePaywallConfig,
  paywallSearchInput,
  addCustomItemButton,
  expectWizardSteps,
  fillCustomItem,
} from '../utils/monetization-helpers';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 31: Monetization — Paywall Config Wizard', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('admin opens the monetization section and sees the new Paywall Config region', async ({
    page,
  }) => {
    const dialog = await navigateToAccountComponent(page, 'Monetization', true);
    const region = await locatePaywallConfig(dialog);
    if (!region) test.skip(true, 'Stripe not connected — paywall config is hidden in this env');
    await expect(paywallSearchInput(region!)).toBeVisible({ timeout: 10_000 });
    await expect(addCustomItemButton(region!)).toBeVisible();
  });

  test('the items list shows the new search dropdown and an empty / configured state', async ({
    page,
  }) => {
    const dialog = await navigateToAccountComponent(page, 'Monetization', true);
    const region = await locatePaywallConfig(dialog);
    if (!region) test.skip(true, 'Stripe not connected');
    const empty = region!.getByText(/no items configured yet/i);
    const cards = region!.locator('[class*="border"]').filter({ hasText: /Active|Disabled/i });
    const emptyVisible = await empty.isVisible({ timeout: 5_000 }).catch(() => false);
    const cardsVisible = (await cards.count()) > 0;
    expect(emptyVisible || cardsVisible).toBe(true);
  });

  test('clicking + Add custom item opens the wizard with three steps', async ({ page }) => {
    const dialog = await navigateToAccountComponent(page, 'Monetization', true);
    const region = await locatePaywallConfig(dialog);
    if (!region) test.skip(true, 'Stripe not connected');

    await addCustomItemButton(region!).click();
    await expect(dialog.getByRole('button', { name: /^Back$/ })).toBeVisible({ timeout: 5_000 });
    await expectWizardSteps(dialog, ['Item Details', 'Paywall', 'Pricing']);
  });

  test('typing into the custom item form shows live slug previews and gates the Create button', async ({
    page,
  }) => {
    const dialog = await navigateToAccountComponent(page, 'Monetization', true);
    const region = await locatePaywallConfig(dialog);
    if (!region) test.skip(true, 'Stripe not connected');

    await addCustomItemButton(region!).click();
    const createBtn = dialog.getByRole('button', { name: /Create & Continue/i });
    await expect(createBtn).toBeDisabled();

    await fillCustomItem(dialog, { type: 'My Tool', name: 'Advanced AI Course' });
    await expect(dialog.getByText('Slug: my-tool')).toBeVisible();
    await expect(dialog.getByText('ID: advanced-ai-course')).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('search dropdown is reachable and surfaces results or a no-match message', async ({
    page,
  }) => {
    const dialog = await navigateToAccountComponent(page, 'Monetization', true);
    const region = await locatePaywallConfig(dialog);
    if (!region) test.skip(true, 'Stripe not connected');

    const search = paywallSearchInput(region!);
    await search.click();
    await search.fill('a');
    const noItems = dialog.getByText('No items found');
    const searching = dialog.getByText('Searching...');
    const result = dialog
      .locator('button:has-text("Course"), button:has-text("Program"), button:has-text("Agent")')
      .first();
    await expect(noItems.or(searching).or(result)).toBeVisible({ timeout: 10_000 });
  });
});
