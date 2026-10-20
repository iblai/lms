import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { SAMPLE_LESSON_COMPLETION_COURSE_ID, STUDIO_DOMAIN_URL } from '../fixtures/test-data';
import { getCourseContentTab, gotoTenantPage, waitForAppShell } from '../utils/navigation';
import {
  deleteStudioUnit,
  duplicateLastStudioUnit,
  expandStudioSubsection,
  publishStudioUnit,
  renameStudioUnit,
  startEdxSession,
  studioCourseUrl,
  studioUnitLocator,
  trackEdxSsoToken,
} from '../utils/edx-studio';

/**
 * Journey 39: Agent Lesson Completion
 *
 * On a course that runs agent-based completion (`agent_content_mode` and
 * `enable_agent_based_completion` on the course, `enable_agent_based_unit_completion`
 * on the tenant) the edX unit no longer marks itself complete on view. The
 * learner asks the agent instead: the agent calls its completion tool, the
 * mentor relays `lesson.completed` to the page, and the course outline
 * refreshes so the unit's ring becomes a tick.
 *
 * The journey authors the unit it completes, so the completion it asserts is
 * new on every run: from the course's Administration → Authoring link it opens
 * Studio, duplicates the last unit of the first subsection, renames the copy
 * with a timestamp and publishes it, then returns to the Agent tab, opens the
 * new unit from the outline and has the agent complete it. The unit is deleted
 * from Studio again when the test ends.
 *
 * Needs `SAMPLE_LESSON_COMPLETION_COURSE_ID` and `STUDIO_DOMAIN_URL`; skips
 * when either is missing.
 */

type AuthoredUnit = { studio: Page; locator: string };

const test = base.extend<{ authoredUnits: AuthoredUnit[] }>({
  // Deletes whatever the test authored in Studio, including after a timeout.
  // Depends on `context` so the Studio tab is still open during teardown.
  authoredUnits: [
    async ({ context }, use) => {
      const units: AuthoredUnit[] = [];
      await use(units);
      for (const { studio, locator } of units) {
        if (!context.pages().includes(studio)) continue;
        await deleteStudioUnit(studio, locator).catch((error: unknown) => {
          logger.info(`Could not delete unit ${locator} from Studio: ${(error as Error).message}`);
        });
      }
    },
    { timeout: 180_000 },
  ],
});

const COMPLETION_PROMPT = 'mark this lesson as completed';
/** Reloads allowed for a freshly published unit to show up in the LMS outline. */
const OUTLINE_RELOAD_ATTEMPTS = 8;
const OUTLINE_RELOAD_WAIT_MS = 20_000;

/** "<done> of <total> units completed" from the outline summary. */
async function outlineCounts(outline: Locator): Promise<{ done: number; total: number }> {
  const text = (await outline.getByTestId('outline-summary').textContent()) ?? '';
  const match = /(\d+) of (\d+) units completed/.exec(text);
  expect(match, `outline summary "${text}" has no unit counts`).not.toBeNull();
  return { done: Number(match![1]), total: Number(match![2]) };
}

test.describe('Journey 39: Agent Lesson Completion', () => {
  // Two app loads, Studio authoring, and two agent round-trips.
  test.describe.configure({ timeout: 600_000 });

  test('learner has the agent complete a unit that was just authored in Studio', async ({
    page,
    context,
    authoredUnits,
  }) => {
    test.skip(
      !SAMPLE_LESSON_COMPLETION_COURSE_ID || !STUDIO_DOMAIN_URL,
      'SAMPLE_LESSON_COMPLETION_COURSE_ID and STUDIO_DOMAIN_URL are not configured',
    );

    const courseId = SAMPLE_LESSON_COMPLETION_COURSE_ID;
    const expectedStudioUrl = studioCourseUrl(STUDIO_DOMAIN_URL, courseId);
    const ssoToken = trackEdxSsoToken(page);

    const outline = page.getByTestId('course-outline');
    const tabs = page.getByTestId('course-content-tabs');
    // Playwright's CSS engine pierces the <agent-ai> shadow root, so the
    // mentor iframe inside it is addressable directly.
    const mentor = page.frameLocator('agent-ai iframe').first();
    const promptBox = mentor.getByRole('textbox').first();
    // Replaced by a stop control while the agent is answering.
    const sendButton = mentor.getByRole('button', { name: 'Send message' });
    const aiReplies = mentor.locator('.chat-ai-message-response');

    let before = { done: 0, total: 0 };
    let studio!: Page;
    let unit!: Locator;
    let unitLocator = '';
    const lessonName = `E2E Lesson ${Date.now()}`;
    const row = outline.getByTestId('outline-unit').filter({ hasText: lessonName });

    await test.step('CP-1: the course opens on its Agent tab with the outline and the Administration tab', async () => {
      await gotoTenantPage(page, `course-content/${courseId}/agent`, { timeout: 180_000 });
      await waitForAppShell(page, 180_000);
      await expect(page).toHaveURL(/\/course-content\/.+\/agent(\?|$)/);
      await expect(tabs.getByRole('link', { name: 'Agent' })).toBeVisible({ timeout: 60_000 });
      await expect(outline.getByTestId('outline-module').first()).toBeVisible({ timeout: 120_000 });
      before = await outlineCounts(outline);
      logger.info(`Outline before authoring: ${before.done} of ${before.total} units completed`);
    });

    await test.step('CP-2: Administration → Authoring opens Studio on the course outline', async () => {
      // Studio signs in through the edX LMS, and the browser has no LMS session
      // yet: the course iframe's SSO token logs in per request only.
      await startEdxSession(context, await ssoToken.current(), expectedStudioUrl);

      const administration = await getCourseContentTab(page, 'Administration');
      expect(administration, 'the Administration tab (staff only) is required').not.toBeNull();
      await administration!.click();
      const adminNav = page.getByTestId('course-admin-nav');
      await expect(adminNav).toBeVisible({ timeout: 60_000 });

      const authoring = adminNav.getByRole('link', { name: 'Authoring' });
      await expect(authoring).toHaveAttribute('href', expectedStudioUrl);
      await expect(authoring).toHaveAttribute('target', '_blank');
      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 60_000 }),
        authoring.click(),
      ]);
      studio = popup;
      // Studio bounces through the LMS OAuth2 handshake and comes back here;
      // without a session it would stop on the LMS sign-in page instead.
      await expect(studio).toHaveURL((url) => url.href.startsWith(expectedStudioUrl), {
        timeout: 120_000,
      });
      await expect(studio).toHaveTitle(/Course Outline/, { timeout: 60_000 });
    });

    await test.step('CP-3: expanding the subsection lists its units and Duplicate on the last one adds a copy', async () => {
      await expandStudioSubsection(studio);
      unit = await duplicateLastStudioUnit(studio);
      unitLocator = (await studioUnitLocator(unit)) ?? '';
      expect(unitLocator).toContain('type@vertical');
      authoredUnits.push({ studio, locator: unitLocator });
      await expect(unit.locator('.unit-status')).toContainText(
        'Unpublished units will not be released',
      );
    });

    await test.step('CP-4: the copy is renamed with a timestamp and the name is saved', async () => {
      await renameStudioUnit(unit, lessonName);
    });

    await test.step('CP-5: Publish releases the unit', async () => {
      await publishStudioUnit(studio, unit);
    });

    await test.step('CP-6: back on the Agent tab, a reload lists the new unit once the chat is ready', async () => {
      await page.bringToFront();
      const agentTab = await getCourseContentTab(page, 'Agent');
      expect(agentTab, 'the Agent tab is required').not.toBeNull();
      await agentTab!.click();
      await page.waitForURL(/\/agent(\?|$)/, { timeout: 60_000 });

      // A publish reaches the learner-facing outline only once the LMS has
      // rebuilt the course structure, which can trail Studio by a while, so
      // reload until the new unit is listed.
      for (let attempt = 1; attempt <= OUTLINE_RELOAD_ATTEMPTS; attempt += 1) {
        await page.reload({ timeout: 180_000 });
        await waitForAppShell(page, 180_000);
        await expect(outline.getByTestId('outline-module').first()).toBeVisible({
          timeout: 120_000,
        });
        const listed = await row
          .waitFor({ state: 'visible', timeout: OUTLINE_RELOAD_WAIT_MS })
          .then(() => true)
          .catch(() => false);
        if (listed) break;
        logger.info(
          `"${lessonName}" not in the outline yet (reload ${attempt}/${OUTLINE_RELOAD_ATTEMPTS})`,
        );
      }
      await expect(row, `"${lessonName}" never reached the course outline`).toBeVisible();

      // Ready means: the host's course-loading spinner is gone, the embed's own
      // spinner is gone, and the prompt box takes input.
      await expect(page.locator('agent-ai')).toBeAttached({ timeout: 180_000 });
      await expect(page.getByTestId('course-agent-chat-loading')).toBeHidden({ timeout: 180_000 });
      await expect(page.locator('agent-ai #loading-spinner')).toBeHidden({ timeout: 180_000 });
      await expect(promptBox).toBeVisible({ timeout: 180_000 });
      await expect(promptBox).toBeEnabled();

      await expect(row.getByTestId('completion-icon')).toHaveAttribute('data-state', 'empty');
      await expect(outline.getByTestId('outline-summary')).toContainText(
        `${before.done} of ${before.total + 1} units completed`,
      );
    });

    await test.step('CP-7: selecting the new unit switches to it and the agent acknowledges the switch', async () => {
      const repliesBefore = await aiReplies.count();
      await row.click();
      await page.waitForURL(
        (url) => decodeURIComponent(url.href).includes(`unit_id=${unitLocator}`),
        {
          timeout: 30_000,
        },
      );
      await expect(page.getByText(`Switched to "${lessonName}"`).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByTestId('course-unit-breadcrumb')).toContainText(lessonName);
      await expect(row).toHaveAttribute('aria-current', 'location');
      // The switch is announced into the chat and the agent answers it; the
      // send control comes back once that answer has finished streaming.
      await expect(aiReplies.nth(repliesBefore)).toBeVisible({ timeout: 120_000 });
      await expect(sendButton).toBeVisible({ timeout: 120_000 });
    });

    await test.step(`CP-8: "${COMPLETION_PROMPT}" has the agent think, use a tool, and confirm the completion`, async () => {
      // The mentor relays the completion to the page as a `lesson.completed`
      // postMessage; that frame is what refreshes the outline.
      await page.evaluate(() => {
        const received: unknown[] = [];
        (window as unknown as { __e2eLessonCompleted: unknown[] }).__e2eLessonCompleted = received;
        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message && typeof message === 'object' && message.type === 'lesson.completed') {
            received.push(message);
          }
        });
      });

      const repliesBefore = await aiReplies.count();
      await promptBox.fill(COMPLETION_PROMPT);
      await sendButton.click();

      const reply = aiReplies.nth(repliesBefore);
      await expect(reply).toBeVisible({ timeout: 120_000 });
      // The wording is the model's own ("Lesson X has been marked as completed",
      // "Lesson X marked complete", …); the tool call and the relay below are
      // the hard evidence.
      await expect(reply.getByTestId('ai-message-body')).toContainText(/complete/i, {
        timeout: 180_000,
      });
      await expect(reply.getByText(/^Used \d+ tools?$/)).toBeVisible();
      // The model does not always surface its reasoning, so the thought block is noted, not required.
      const thought = await reply
        .getByText(/^Thought/)
        .isVisible()
        .catch(() => false);
      logger.info(`Agent reply ${thought ? 'shows' : 'has no'} thought block`);

      await expect
        .poll(
          () =>
            page.evaluate(
              () => (window as unknown as { __e2eLessonCompleted: unknown[] }).__e2eLessonCompleted,
            ),
          { timeout: 60_000, message: 'Expected a lesson.completed message for the new unit' },
        )
        .toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              usage_id: unitLocator,
              completion: 1,
              display_name: lessonName,
            }),
          ]),
        );
    });

    await test.step('CP-9: the outline marks the unit complete', async () => {
      await expect(row.getByTestId('completion-icon')).toHaveAttribute('data-state', 'complete', {
        timeout: 60_000,
      });
      await expect(outline.getByTestId('outline-summary')).toContainText(
        `${before.done + 1} of ${before.total + 1} units completed`,
      );
      logger.info(`"${lessonName}" marked complete by the agent`);
    });
  });
});
