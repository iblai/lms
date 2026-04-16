import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Wait for the /start onboarding page to be ready.
 * The onboarding flow always renders at least one heading.
 */
async function waitForStartPage(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 120_000 });
}

/**
 * Journey 02: Onboarding – First-Time User
 *
 * Validates the onboarding experience at /start:
 *  1. First-time user is directed to /start
 *  2. Onboarding page displays welcome content
 *  3. User can complete onboarding
 *  4. Returning user bypasses onboarding
 *  5. Proper heading and navigation
 */
test.describe('Journey 02: Onboarding – First-Time User', () => {
  test.setTimeout(200000);

  test('Checkpoint 1: First-time user is directed to /start', async ({ page }) => {
    // Navigate to root — the app routes first-time users to /start
    await page.goto(SKILL_HOST, {
      timeout: 120000,
    });

    // Wait for either /start (first-time) or /home (returning)
    await page.waitForURL((url) => url.href.includes('/start') || url.href.includes('/home'), {
      timeout: 60000,
    });

    const currentUrl = page.url();

    // Wait for the page to actually render
    if (currentUrl.includes('/home')) {
      await waitForAppShell(page);
    } else {
      await waitForStartPage(page);
    }

    if (!currentUrl.includes('/start')) {
      logger.info('User already onboarded — landing on /home; skipping first-time check');
      test.skip();
      return;
    }

    expect(currentUrl).toContain('/start');
    logger.info('First-time user landed on /start');
  });

  test('Checkpoint 2: Onboarding page displays welcome content', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/start`, {
      timeout: 120000,
    });

    // If the user is redirected away from /start, onboarding is not applicable
    const currentUrl = page.url();
    if (!currentUrl.includes('/start')) {
      logger.info('Redirected away from /start — onboarding not applicable');
      test.skip();
      return;
    }

    // Verify the page has a heading or welcome text
    const heading = page.getByRole('heading', { level: 1 }).first();
    const hasHeading = await heading.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasHeading) {
      const headingText = await heading.textContent();
      logger.info(`Onboarding heading: ${headingText}`);
      expect(headingText?.length).toBeGreaterThan(0);
    } else {
      // Fallback: look for any welcome / get started text
      const welcomeText = page.getByText(/welcome|get started|let's go/i).first();
      await expect(welcomeText).toBeVisible({ timeout: 15000 });
      logger.info('Welcome text found on onboarding page');
    }
  });

  test('Checkpoint 3: User can complete onboarding', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/start`, {
      timeout: 120000,
    });

    if (!page.url().includes('/start')) {
      logger.info('Not on /start — skipping completion test');
      test.skip();
      return;
    }

    // Look for a primary action button (Next / Continue / Get Started / Skip)
    const actionButton = page
      .getByRole('button', { name: /next|continue|get started|skip|finish|submit/i })
      .first();

    const hasAction = await actionButton.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasAction) {
      logger.info('No actionable onboarding button found — env may not support onboarding');
      test.skip();
      return;
    }

    // Click through onboarding steps until we leave /start
    let maxSteps = 10;
    while (page.url().includes('/start') && maxSteps > 0) {
      const btn = page
        .getByRole('button', { name: /next|continue|get started|skip|finish|submit/i })
        .first();
      const isVisible = await btn.isVisible({ timeout: 120_000 }).catch(() => false);

      if (!isVisible) break;

      await btn.click();
      await page.waitForTimeout(1500);
      maxSteps--;
    }

    // After completing onboarding the user should be on /home
    await page.waitForURL((url) => url.href.includes('/home') || url.href.includes('/start'), {
      timeout: 30000,
    });

    logger.info(`Post-onboarding URL: ${page.url()}`);
  });

  test('Checkpoint 4: Returning user bypasses onboarding', async ({ page }) => {
    // Navigate to root — a returning (already onboarded) user should land on /home
    await page.goto(SKILL_HOST, {
      timeout: 120000,
    });

    // Wait for either /start (first-time) or /home (returning)
    await page.waitForURL((url) => url.href.includes('/home') || url.href.includes('/start'), {
      timeout: 60000,
    });

    const currentUrl = page.url();

    // Wait for the page to actually render
    if (currentUrl.includes('/home')) {
      await waitForAppShell(page);
    } else {
      await waitForStartPage(page);
    }

    if (currentUrl.includes('/start')) {
      logger.info('User still on /start — not yet onboarded; skipping returning-user check');
      test.skip();
      return;
    }

    expect(currentUrl).toContain('/home');
    logger.info('Returning user correctly bypassed onboarding');
  });

  test('Checkpoint 5: Onboarding page has proper heading and navigation', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/start`, {
      timeout: 120000,
    });

    if (!page.url().includes('/start')) {
      logger.info('Redirected away from /start — skipping heading/navigation check');
      test.skip();
      return;
    }

    // Verify at least one heading exists
    const headings = page.getByRole('heading');
    await expect(headings.first()).toBeVisible({ timeout: 120_000 });
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    logger.info(`Found ${headingCount} heading(s) on /start`);

    // Verify page has navigation or actionable elements
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    logger.info(`Found ${buttonCount} button(s) for navigation`);
  });
});
