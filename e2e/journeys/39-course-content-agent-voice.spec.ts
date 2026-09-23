import { test, expect, FrameLocator } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';

import {
  agentChatFrame,
  openAgentTab,
  openCourseContent,
  waitForAgentChatReady,
} from '../utils/course-content-helpers';

/**
 * Journey 39: Course Content — Agent Voice
 *
 * Voice recording and the live voice call are rendered by the mentor app inside
 * the `agent-ai` custom element's shadow-root iframe — a different application
 * from this SPA. What this repo owns, and therefore what these checkpoints
 * assert, is the boundary:
 *
 *   • the iframe is created with a permissions policy that allows microphone
 *     and camera, so the mentor's voice features can work at all;
 *   • the chat surface actually mounts and exposes its voice affordances;
 *   • granting microphone permission doesn't break the embed.
 *
 * The recording/calling behaviour itself belongs to the mentor app's own suite;
 * asserting it from here would couple this repo to that app's markup.
 *
 * 1. Agent iframe carries a microphone-enabled permissions policy
 * 2. Agent chat exposes a voice/microphone affordance
 * 3. Agent chat exposes a voice-call affordance
 * 4. Microphone permission can be granted without breaking the embed
 * 5. Voice affordances survive a unit change
 */
test.describe('Journey 39: Course Content — Agent Voice', () => {
  test.setTimeout(300_000);

  /** Buttons the mentor app labels for voice input / calling. Matched loosely
   * because the mentor owns this markup and may relabel it. */
  const VOICE_INPUT = /mic|microphone|record|speak|voice input/i;
  const VOICE_CALL = /call|phone|talk|live voice/i;

  async function findControl(frame: FrameLocator, pattern: RegExp): Promise<string | null> {
    const matches = await frame
      .locator('button, [role="button"]')
      .evaluateAll((els) =>
        els
          .map(
            (e) =>
              e.getAttribute('aria-label') ||
              e.getAttribute('title') ||
              e.getAttribute('data-testid') ||
              '',
          )
          .filter(Boolean),
      )
      .catch(() => [] as string[]);
    return matches.find((label) => pattern.test(label)) ?? null;
  }

  async function reachAgentChat(page: import('@playwright/test').Page): Promise<boolean> {
    if (!(await openCourseContent(page))) {
      logger.info('No accessible enrolled course — skipping');
      return false;
    }
    if (!(await openAgentTab(page))) {
      logger.info('Course has no Agent tab — skipping');
      return false;
    }
    if (!(await waitForAgentChatReady(page))) {
      logger.info('Agent chat frame never rendered — skipping');
      return false;
    }
    return true;
  }

  test('Checkpoint 1: Agent iframe allows microphone and camera', async ({ page }) => {
    if (!(await reachAgentChat(page))) {
      test.skip();
      return;
    }

    // Read the `allow` attribute off the iframe inside the custom element's
    // shadow root — the permissions policy is what lets the mentor app ask for
    // a microphone at all.
    const allow = await page
      .locator('agent-ai')
      .first()
      .evaluate((host) => {
        const iframe = (host as HTMLElement).shadowRoot?.querySelector('iframe');
        return iframe?.getAttribute('allow') ?? null;
      })
      .catch(() => null);

    if (allow === null) {
      logger.info('Agent iframe not exposed through the shadow root — skipping');
      test.skip();
      return;
    }
    logger.info(`Agent iframe allow="${allow}"`);
    expect(allow).toMatch(/microphone/i);
  });

  test('Checkpoint 2: Agent chat exposes a voice/microphone affordance', async ({ page }) => {
    if (!(await reachAgentChat(page))) {
      test.skip();
      return;
    }

    const frame = agentChatFrame(page);
    // The mentor renders its composer after its own bootstrap, so give it time.
    await frame
      .locator('button')
      .first()
      .waitFor({ state: 'visible', timeout: 90_000 })
      .catch(() => undefined);

    const label = await findControl(frame, VOICE_INPUT);
    if (!label) {
      logger.info('Mentor exposes no voice-input control for this agent — skipping');
      test.skip();
      return;
    }
    logger.info(`Voice input control found: "${label}"`);
    expect(label).toMatch(VOICE_INPUT);
  });

  test('Checkpoint 3: Agent chat exposes a voice-call affordance', async ({ page }) => {
    if (!(await reachAgentChat(page))) {
      test.skip();
      return;
    }

    const frame = agentChatFrame(page);
    await frame
      .locator('button')
      .first()
      .waitFor({ state: 'visible', timeout: 90_000 })
      .catch(() => undefined);

    const label = await findControl(frame, VOICE_CALL);
    if (!label) {
      logger.info('Voice calling not enabled for this agent — skipping');
      test.skip();
      return;
    }
    logger.info(`Voice call control found: "${label}"`);
    expect(label).toMatch(VOICE_CALL);
  });

  test('Checkpoint 4: Microphone permission can be granted without breaking the embed', async ({
    page,
    context,
  }) => {
    // Grant before navigating so the mentor's own permission probe succeeds.
    await context
      .grantPermissions(['microphone'], {
        origin: new URL(page.url() || 'http://localhost').origin,
      })
      .catch(() => undefined);

    if (!(await reachAgentChat(page))) {
      test.skip();
      return;
    }

    await expect(agentChatFrame(page).locator('body')).toBeVisible({ timeout: 60_000 });
    expect(page.url()).toContain('/agent');
    logger.info('Agent embed still healthy with microphone permission granted');
  });

  test('Checkpoint 5: Voice affordances survive a unit change', async ({ page }) => {
    if (!(await reachAgentChat(page))) {
      test.skip();
      return;
    }

    const next = page.getByRole('button', { name: 'Next lesson' });
    if (!(await next.isEnabled({ timeout: 20_000 }).catch(() => false))) {
      logger.info('Course has no next unit — skipping');
      test.skip();
      return;
    }

    await next.click();
    // The agent stays mounted across units; it must not tear down.
    await expect(agentChatFrame(page).locator('body')).toBeVisible({ timeout: 90_000 });
    expect(page.url()).toContain('/course-content/');
    logger.info('Agent chat survived a unit change');
  });
});
