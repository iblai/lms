/**
 * Shared monetization E2E helpers.
 *
 * Selectors are derived from the real `@iblai/web-containers` DOM so the
 * journey assertions match what the user sees in the browser. The same file
 * is mirrored byte-for-byte in mentorai's e2e/utils/ so the journey specs in
 * either consumer can run against identical helpers.
 */
import { Page, Locator, expect } from '@playwright/test';

// Both Page and Locator expose the by*-style queries we use here, so this
// lets helpers accept either without resorting to `any`.
type Scope = Pick<Locator, 'getByPlaceholder' | 'getByTitle' | 'getByRole' | 'getByText'>;

// ── Profile dropdown / modal navigation ─────────────────────────────────────

/**
 * Open the navbar avatar dropdown. The trigger is rendered by
 * web-containers' UserProfileDropdown with `aria-label="More options"`.
 */
export async function openProfileDropdown(page: Page): Promise<boolean> {
  const trigger = page.getByRole('button', { name: 'More options' }).first();
  if (!(await trigger.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  await trigger.click();
  return true;
}

/**
 * From an open dropdown, click the menuitem labelled `name` (regex-friendly).
 * Returns false if the item isn't visible — e.g. on skillsai the "Account"
 * entry is suppressed via `showAccountTab={false}`.
 */
export async function clickDropdownItem(page: Page, name: RegExp | string): Promise<boolean> {
  const item = page.getByRole('menuitem', { name }).first();
  if (!(await item.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  await item.click();
  return true;
}

/**
 * Resolve the profile dialog (announced sr-only as "User Profile" by
 * web-containers' UserProfileModal). Returns null if the modal is closed.
 */
export async function getProfileDialog(page: Page): Promise<Locator | null> {
  const dialog = page.getByRole('dialog', { name: /user profile/i }).first();
  if (!(await dialog.isVisible({ timeout: 5_000 }).catch(() => false))) return null;
  return dialog;
}

/**
 * Switch the open profile dialog to a sidebar section. The sections are
 * `<button>` elements (not `role=tab`) emitted by the Account/Profile shell.
 */
export async function switchProfileSection(
  dialog: Locator,
  label: RegExp | string,
): Promise<boolean> {
  const btn = dialog.getByRole('button', { name: label }).first();
  if (!(await btn.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  await btn.click();
  return true;
}

/**
 * One-shot helper: dropdown → Profile/Account menuitem → optionally switch to
 * a named section inside the dialog. Returns the dialog locator, or null when
 * any step short-circuits (so a single `test.skip` covers all environments).
 */
export async function openProfileSection(
  page: Page,
  section: RegExp | string,
): Promise<Locator | null> {
  if (!(await openProfileDropdown(page))) return null;
  // skillsai exposes "Profile" only; mentorai may also expose "Account".
  const opened =
    (await clickDropdownItem(page, /^Account$/)) ||
    (await clickDropdownItem(page, /^Profile$/)) ||
    (await clickDropdownItem(page, /profile|account|settings/i));
  if (!opened) return null;
  const dialog = await getProfileDialog(page);
  if (!dialog) return null;
  await switchProfileSection(dialog, section);
  return dialog;
}

// ── Paywall Config wizard (inside Monetization section) ─────────────────────

/**
 * Locate the Paywall Config region. Returns null when Stripe isn't connected
 * (the section is replaced with a "Connect Stripe first" placeholder).
 */
export async function locatePaywallConfig(dialog: Locator): Promise<Locator | null> {
  const configureHeader = dialog.getByText(/configure item for sale/i).first();
  if (!(await configureHeader.isVisible({ timeout: 5_000 }).catch(() => false))) {
    return null;
  }
  // Walk up to the surrounding Card so callers can scope further locators.
  return configureHeader.locator('xpath=ancestor::*[1]');
}

export function paywallSearchInput(scope: Scope): Locator {
  return scope.getByPlaceholder('Search items');
}

export function addCustomItemButton(scope: Scope): Locator {
  return scope.getByTitle('Add custom item');
}

export async function expectWizardSteps(
  scope: Locator,
  steps: ReadonlyArray<string>,
): Promise<void> {
  for (const label of steps) {
    await expect(scope.getByText(label).first()).toBeVisible({ timeout: 5_000 });
  }
}

export async function fillCustomItem(
  scope: Scope,
  args: { type: string; name: string; description?: string },
): Promise<void> {
  await scope.getByPlaceholder(/e\.g\. tool, resource/i).fill(args.type);
  await scope.getByPlaceholder(/e\.g\. Advanced AI Course/i).fill(args.name);
  if (args.description !== undefined) {
    await scope.getByPlaceholder('Describe this item...').fill(args.description);
  }
}

// ── Advanced tab ────────────────────────────────────────────────────────────

export async function locateMonetizationBasePathInput(scope: Scope): Promise<Locator | null> {
  const label = scope.getByText(/public monetization base path/i).first();
  if (!(await label.isVisible({ timeout: 5_000 }).catch(() => false))) return null;
  return label.locator('xpath=ancestor::*[1]//input').first();
}

// ── Consumer-side PaywallModal + access-check route mocking ────────────────

/**
 * Build a canonical 402 AccessCheckResponse for a `program` / `course` / `mentor`
 * item, with a single one-time price. Shape matches what the data-layer slice
 * now surfaces directly because of `validateStatus` accepting 402.
 */
export function makeAccessDeniedResponse(args: {
  itemType: 'program' | 'course' | 'mentor';
  itemId: string;
  itemName?: string;
  priceAmount?: string;
  currency?: string;
}) {
  return {
    has_access: false,
    item_type: args.itemType,
    item_id: args.itemId,
    reason: 'no_subscription',
    requires_payment: true,
    pricing_available: true,
    pricing: {
      item_name: args.itemName ?? 'Premium Item',
      item_id: args.itemId,
      item_type: args.itemType,
      description: '',
      is_paywalled: true,
      allow_free_tier: false,
      trial_period_days: 0,
      prices: [
        {
          id: 'price-test',
          name: 'Full Access',
          description: null,
          amount: args.priceAmount ?? '10.00',
          currency: args.currency ?? 'usd',
          interval: 'one_time',
          features: ['Test feature'],
          remark: '',
          sort_order: 0,
        },
      ],
    },
    subscription: null,
  };
}

/**
 * Mock every monetization access-check call to return a 402 with the supplied
 * response body. The data-layer's `validateStatus` change means the body flows
 * through as `data` and the consumer's MonetizationWrapper mounts the modal.
 *
 * Returns a teardown function that removes the route.
 */
export async function mockAccessCheck402(
  page: Page,
  body: ReturnType<typeof makeAccessDeniedResponse>,
): Promise<() => Promise<void>> {
  // Covers both scoped (`/api/billing/platforms/<key>/items/.../access-check/`)
  // and unscoped (`/api/billing/access-check/<type>/<id>/`) endpoints.
  const pattern =
    /\/api\/billing\/(platforms\/[^/]+\/items\/[^/]+\/[^/]+\/access-check\/?|access-check\/[^/]+\/[^/]+\/?)/;
  await page.route(pattern, async (route) => {
    await route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  return async () => {
    await page.unroute(pattern);
  };
}

/**
 * Find the consumer-side PaywallModal. The modal renders a dialog with the
 * pricing item name and at least one price button (Subscribe / Buy / Unlock).
 */
export async function findPaywallModal(page: Page): Promise<Locator | null> {
  const modal = page
    .getByRole('dialog')
    .filter({ hasText: /full access|subscribe|buy now|unlock|monthly|one[- ]time/i })
    .first();
  if (!(await modal.isVisible({ timeout: 10_000 }).catch(() => false))) return null;
  return modal;
}
