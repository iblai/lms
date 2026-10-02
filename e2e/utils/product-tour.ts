/**
 * Product tour helpers (components/product-tour).
 *
 * The first-visit tour starts on its own, once per user, and its overlay
 * blocks the rest of the page. The auth setup therefore marks it as seen in
 * the saved storage state; Journey 38 replays it explicitly with `?tour=1`.
 */
import { expect, type Page } from '@playwright/test';

/** Mirrors `productTourStorageKey` in components/product-tour/use-tour-completion.ts. */
export const PRODUCT_TOUR_VERSION = 1;

export function productTourStorageKey(username: string): string {
  return `skills:product-tour:v${PRODUCT_TOUR_VERSION}:${username}`;
}

/** The logged-in username (`userData.user_nicename`) from the app origin's localStorage. */
async function readUsername(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('userData');
    return raw ? (JSON.parse(raw)?.user_nicename ?? null) : null;
  });
}

/** The stored outcome ('finished' | 'skipped') for the logged-in user, or null. */
export async function readTourOutcome(page: Page): Promise<string | null> {
  const username = await readUsername(page);
  if (!username) return null;
  return page.evaluate((key) => window.localStorage.getItem(key), productTourStorageKey(username));
}

/**
 * Mark the tour as seen for the logged-in user. Call it on a page that is on
 * the app origin, before the auth setup saves its storage state.
 */
export async function markProductTourSeen(page: Page): Promise<void> {
  await page.waitForFunction(() => !!window.localStorage.getItem('userData'), null, {
    timeout: 30_000,
  });
  const username = await readUsername(page);
  expect(username, 'userData is missing from localStorage after login').toBeTruthy();
  await page.evaluate(
    (key) => window.localStorage.setItem(key, 'finished'),
    productTourStorageKey(username as string),
  );
}
