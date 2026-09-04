import { test as setup } from '@playwright/test';

import { browserLabel, signIn, storageStatePath } from '../utils/auth-flow';

/**
 * Admin session used by every journey except 41. The non-admin session lives in
 * `auth-student.setup.ts` under its own project so that a missing or rejected
 * student account can't block the admin suite.
 */
setup('authenticate', async ({ page }, testInfo) => {
  await signIn(page, process.env.PLAYWRIGHT_USERNAME || '', process.env.PLAYWRIGHT_PASSWORD || '');
  await page
    .context()
    .storageState({ path: storageStatePath(browserLabel(testInfo.project.name)) });
});
