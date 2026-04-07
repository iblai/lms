import { test, expect, ConsoleMessage } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Journey 27: UI Render Console Errors
 * Converted from ui-render-console-errors.common.spec.ts (previously commented out).
 * Ensures key pages render without unexpected console errors.
 */

const IGNORED_ERRORS: Array<string | RegExp> = [
  'There was an error setting cookie `_pk_testcookie_domain`',
  "Can't write cookie on domain",
  'downloadable font: download failed',
  'Download the React DevTools',
  "instances of 'styled-components'",
  'Layout was forced before the page was fully loaded',
  'does not have a proper "SameSite" attribute value',
  'matomo.js',
  /Failed to load resource/,
  /Intercom Messenger error/,
];

function isIgnoredError(message: string): boolean {
  for (const error of IGNORED_ERRORS) {
    if (error instanceof RegExp) {
      if (error.test(message)) return true;
    } else {
      if (message.includes(error)) return true;
    }
  }
  return false;
}

test.describe('Journey 27: UI Render Console Errors', () => {
  test.setTimeout(200000);

  test('CP-1: /home has no unexpected console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' && !isIgnoredError(msg.text())) {
        consoleErrors.push(`${msg.location().url}: ${msg.text()}`);
      }
    });

    await page.goto(`${SKILL_HOST}/home`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    // Wait for the app to fully render (Next.js App Router uses body directly, no #root)
    await page.waitForLoadState('domcontentloaded');

    // Verify body has children (app rendered)
    const hasChildren = await page.evaluate(() => {
      return document.body && document.body.hasChildNodes();
    });
    expect(hasChildren).toBeTruthy();

    // Allow dynamic content to load
    await page.waitForTimeout(5000);

    if (consoleErrors.length > 0) {
      console.error(`Console errors on /home:\n${consoleErrors.join('\n')}`);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  test('CP-2: /discover has no unexpected console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' && !isIgnoredError(msg.text())) {
        consoleErrors.push(`${msg.location().url}: ${msg.text()}`);
      }
    });

    await page.goto(`${SKILL_HOST}/discover`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await page.waitForLoadState('domcontentloaded');

    const hasChildren = await page.evaluate(() => {
      return document.body && document.body.hasChildNodes();
    });
    expect(hasChildren).toBeTruthy();

    await page.waitForTimeout(5000);

    if (consoleErrors.length > 0) {
      console.error(`Console errors on /discover:\n${consoleErrors.join('\n')}`);
    }
    expect(consoleErrors).toHaveLength(0);
  });

  test('CP-3: /profile has no unexpected console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' && !isIgnoredError(msg.text())) {
        consoleErrors.push(`${msg.location().url}: ${msg.text()}`);
      }
    });

    await page.goto(`${SKILL_HOST}/profile`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await page.waitForLoadState('domcontentloaded');

    const hasChildren = await page.evaluate(() => {
      return document.body && document.body.hasChildNodes();
    });
    expect(hasChildren).toBeTruthy();

    await page.waitForTimeout(5000);

    if (consoleErrors.length > 0) {
      console.error(`Console errors on /profile:\n${consoleErrors.join('\n')}`);
    }
    expect(consoleErrors).toHaveLength(0);
  });
});
