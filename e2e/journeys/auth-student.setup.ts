import { test as setup } from '@playwright/test';

import { browserLabel, signIn, storageStatePath } from '../utils/auth-flow';

/**
 * Non-admin (student) session for Journey 41.
 *
 * Deliberately its own setup project rather than a second test inside
 * `auth.setup.ts`: Playwright skips every project that depends on a failed
 * setup, so a student account that is missing, expired, or provisioned only on
 * another environment would otherwise take the whole admin suite down with it.
 * Here the blast radius is the student project alone.
 *
 * Skipped outright when no credentials are configured, which keeps single-account
 * setups green.
 */
setup('authenticate non-admin', async ({ page }, testInfo) => {
  const username = process.env.PLAYWRIGHT_NONADMIN_USERNAME || '';
  const password = process.env.PLAYWRIGHT_NONADMIN_PASSWORD || '';
  setup.skip(!username || !password, 'PLAYWRIGHT_NONADMIN_* credentials not configured');

  await signIn(page, username, password);
  await page
    .context()
    .storageState({ path: storageStatePath(browserLabel(testInfo.project.name), '-student') });
});
