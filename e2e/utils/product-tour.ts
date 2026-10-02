/**
 * Product tour helpers (components/product-tour).
 *
 * The first-visit tour starts on its own, once per user, and its overlay
 * blocks the rest of the page. Whether it was seen lives on the user's
 * metadata (`public_metadata["skills-product-tour"]`, written through the
 * user-metadata endpoint), so the auth setup marks it there; Journey 38
 * replays the tour explicitly with `?tour=1`.
 */
import { expect, type Page, type Response } from '@playwright/test';

/** Mirrors `productTourMetadataKey()` in components/product-tour/use-tour-completion.ts. */
export const PRODUCT_TOUR_METADATA_KEY = 'skills-product-tour';

const USER_METADATA_PATH = '/api/ibl/users/manage/metadata/';

export const isUserMetadataResponse = (response: Response, method: 'GET' | 'POST'): boolean =>
  response.url().includes(USER_METADATA_PATH) && response.request().method() === method;

export type CapturedUserMetadata = {
  /** Full URL of the app's own metadata request, `?username=` included. */
  url: string;
  authorization: string;
  body: Record<string, any>;
};

/**
 * Remember the app's own user-metadata GET (URL, auth header, payload). It
 * carries everything a direct call to the same endpoint needs, so the tests
 * need no LMS host or token configuration of their own. Attach before the
 * first navigation.
 */
export function trackUserMetadata(page: Page) {
  let latest: CapturedUserMetadata | null = null;

  const capture = async (response: Response): Promise<CapturedUserMetadata | null> => {
    if (!isUserMetadataResponse(response, 'GET') || !response.ok()) return null;
    const headers = await response.request().allHeaders();
    latest = {
      url: response.url(),
      authorization: headers['authorization'] ?? '',
      body: await response.json().catch(() => ({})),
    };
    return latest;
  };

  page.on('response', (response) => {
    void capture(response).catch(() => undefined);
  });

  return {
    /** The latest capture, or the next successful GET when none has happened yet. */
    async current(timeout = 60_000): Promise<CapturedUserMetadata> {
      if (latest) return latest;
      const response = await page.waitForResponse(
        (candidate) => isUserMetadataResponse(candidate, 'GET') && candidate.ok(),
        { timeout },
      );
      return (await capture(response)) ?? (latest as CapturedUserMetadata);
    },
  };
}

/** The tour record on the user's metadata, from a captured GET, or null. */
export function readTourRecord(metadata: CapturedUserMetadata): Record<string, any> | null {
  return metadata.body?.public_metadata?.[PRODUCT_TOUR_METADATA_KEY] ?? null;
}

/**
 * Mark the tour as seen on the user's metadata through the endpoint the app
 * itself uses. No-op when it is already marked.
 */
export async function markProductTourSeen(
  page: Page,
  tracker: ReturnType<typeof trackUserMetadata>,
): Promise<void> {
  const metadata = await tracker.current();
  if (readTourRecord(metadata)) return;

  const username = metadata.body?.username ?? new URL(metadata.url).searchParams.get('username');
  expect(username, 'username missing from the user metadata').toBeTruthy();

  const response = await page.request.post(metadata.url, {
    headers: { authorization: metadata.authorization, 'content-type': 'application/json' },
    data: {
      username,
      public_metadata: {
        ...(metadata.body?.public_metadata ?? {}),
        [PRODUCT_TOUR_METADATA_KEY]: {
          status: 'skipped',
          version: 1,
          completed_at: new Date().toISOString(),
          // Extra field, ignored by the app; tells a seeded record from a real one.
          source: 'e2e-auth-setup',
        },
      },
    },
  });
  expect(response.ok(), `marking the tour as seen failed: ${response.status()}`).toBeTruthy();
}

/**
 * Run `action` (clicking Done or the X) and return the tour record the app
 * sent to the user-metadata endpoint, once that request has succeeded.
 */
export async function saveTourOutcome(
  page: Page,
  action: () => Promise<void>,
): Promise<Record<string, any> | null> {
  const saved = page.waitForResponse((response) => isUserMetadataResponse(response, 'POST'), {
    timeout: 30_000,
  });
  await action();
  const response = await saved;
  expect(response.ok(), `saving the tour outcome failed: ${response.status()}`).toBeTruthy();
  return response.request().postDataJSON()?.public_metadata?.[PRODUCT_TOUR_METADATA_KEY] ?? null;
}
