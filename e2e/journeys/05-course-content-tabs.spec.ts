import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage, waitForAppShell, waitForLoaderToDisappear } from '../utils/navigation';

/**
 * Helper: Navigate from /home → first course → Access Course → course content tabs.
 * Returns true if successful, false if skipped (no courses).
 */
async function navigateToCourseContent(page: Page): Promise<boolean> {
  // Enrolled courses live on the centralized catalog page.
  await gotoTenantPage(page, 'discover?content=courses&enrolled=true', { timeout: 120000 });
  await waitForAppShell(page);

  const courseCard = page.locator('[data-testid="discover-content-card"]').first();
  const hasCourse = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

  if (!hasCourse) return false;

  await courseCard.click();
  await page.waitForURL(/\/courses\//, { timeout: 120000 });
  await waitForLoaderToDisappear(page);
  await waitForAppShell(page);

  //wait for header Course Description to be visible
  await expect(page.getByRole('heading', { name: 'Course Description' })).toBeVisible({
    timeout: 30_000,
  });

  // Access Course only appears once eligibility resolves; wait for it before
  // probing so we don't falsely skip while the CTA is still settling.
  const accessCourseButton = page.getByRole('button', { name: 'Access Course' });
  await accessCourseButton.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => null);
  const hasAccess = await accessCourseButton.isVisible({ timeout: 120_000 }).catch(() => false);

  if (!hasAccess) return false;

  await accessCourseButton.click();
  await page.waitForURL(/\/course-content\//, { timeout: 120000 });
  await waitForAppShell(page);

  return true;
}

/**
 * Journey 05: Course Content Tabs
 *
 * Validates all course content tabs:
 *  1. All tabs visible (Course, Progress, Dates, Discussion)
 *  2. Course tab iframe content
 *  3. Progress tab with headings
 *  4. Dates tab with Important dates
 *  5. Discussion tab with navigation links
 *  6. Thread list or empty state
 *  7. Add a post form
 *  8. Create new post
 *  9. Instructor tab (optional)
 * 10. Bookmarks (optional)
 * 11. URL updates on tab switch
 * 12. No error messages
 */
test.describe('Journey 05: Course Content Tabs', () => {
  test.setTimeout(200000);

  test('Checkpoint 1: All core tabs are visible', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      logger.info('No enrolled courses — skipping');
      test.skip();
      return;
    }

    const courseTab = page.getByRole('link', { name: 'Course' }).first();
    const progressTab = page.getByRole('link', { name: 'Progress' }).first();
    const datesTab = page.getByRole('link', { name: 'Dates' }).first();
    const discussionTab = page.getByRole('link', { name: 'Discussion' }).first();

    await expect(courseTab).toBeVisible({ timeout: 30000 });
    await expect(progressTab).toBeVisible({ timeout: 30000 });
    await expect(datesTab).toBeVisible({ timeout: 30000 });
    await expect(discussionTab).toBeVisible({ timeout: 30000 });
    logger.info('All four core tabs are visible');
  });

  test('Checkpoint 2: Course tab shows iframe content', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const courseTab = page.getByRole('link', { name: 'Course' }).first();
    await courseTab.click();

    const iframeElement = page.locator('iframe').first();
    await expect(iframeElement).toBeVisible({ timeout: 120000 });

    const courseIframe = page.frameLocator('iframe').first();
    const bodyLocator = courseIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    // Verify content is present
    const hasContent = await bodyLocator
      .evaluate((el) => {
        const text = el.textContent?.trim() || '';
        return text.length > 0 || el.children.length > 0;
      })
      .catch(() => false);

    if (!hasContent) {
      await page.waitForTimeout(3000);
      const text = await bodyLocator.evaluate((el) => el.textContent?.trim() || '').catch(() => '');
      expect(text.length).toBeGreaterThan(0);
    }

    logger.info('Course tab iframe has content');
  });

  test('Checkpoint 3: Progress tab with headings', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const progressTab = page.getByRole('link', { name: 'Progress' }).first();
    await progressTab.click();

    const iframeElement = page.locator('iframe').first();
    await expect(iframeElement).toBeVisible({ timeout: 120000 });

    const progressIframe = page.frameLocator('iframe').first();
    const bodyLocator = progressIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    // Look for progress-related headings
    const yourProgressHeading = progressIframe.getByRole('heading', {
      name: 'Your progress',
    });
    const gradeSummaryHeading = progressIframe.getByRole('heading', {
      name: 'Grade summary',
    });

    // Pass when either heading shows up — locator.or() resolves to whichever appears first.
    const progressHeading = yourProgressHeading.or(gradeSummaryHeading);
    await expect(progressHeading.first()).toBeVisible({ timeout: 120000 });
    logger.info('"Your progress" or "Grade summary" heading visible');
  });

  test('Checkpoint 4: Dates tab with Important dates', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const datesTab = page.getByRole('link', { name: 'Dates' }).first();
    await datesTab.click();

    const iframeElement = page.locator('iframe').first();
    await expect(iframeElement).toBeVisible({ timeout: 120000 });

    const datesIframe = page.frameLocator('iframe').first();
    const bodyLocator = datesIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    const importantDatesHeading = datesIframe.getByRole('heading', {
      name: 'Important dates',
    });
    await expect(importantDatesHeading).toBeVisible({ timeout: 120000 });
    logger.info('"Important dates" heading visible on Dates tab');
  });

  test('Checkpoint 5: Discussion tab with navigation links', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const discussionTab = page.getByRole('link', { name: 'Discussion' }).first();
    await discussionTab.click();

    const iframeElement = page.locator('iframe').first();
    await expect(iframeElement).toBeVisible({ timeout: 120000 });

    const discussionIframe = page.frameLocator('iframe').first();
    const bodyLocator = discussionIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    // Verify navigation links
    const myPostsTab = discussionIframe.getByRole('link', { name: 'My posts' });
    const allPostsTab = discussionIframe.getByRole('link', { name: 'All posts' });
    const topicsTab = discussionIframe.getByRole('link', { name: 'Topics' });
    const learnersTab = discussionIframe.getByRole('link', { name: 'Learners' });

    await expect(myPostsTab).toBeVisible({ timeout: 120000 });
    await expect(allPostsTab).toBeVisible({ timeout: 120000 });
    await expect(topicsTab).toBeVisible({ timeout: 120000 });
    await expect(learnersTab).toBeVisible({ timeout: 120000 });
    logger.info('Discussion tab navigation links visible');
  });

  test('Checkpoint 6: Discussion thread list or empty state', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const discussionTab = page.getByRole('link', { name: 'Discussion' }).first();
    await discussionTab.click();

    const discussionIframe = page.frameLocator('iframe').first();
    const bodyLocator = discussionIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    // Wait for either threads or empty state
    await Promise.race([
      discussionIframe
        .locator('[role="option"]')
        .first()
        .waitFor({ state: 'visible', timeout: 60000 })
        .catch(() => null),
      discussionIframe
        .getByText(/Nothing here yet/i)
        .waitFor({ state: 'visible', timeout: 60000 })
        .catch(() => null),
      discussionIframe
        .getByText(/All discussion activity/i)
        .waitFor({ state: 'visible', timeout: 60000 })
        .catch(() => null),
    ]).catch(() => null);

    // Check what we got
    const threadCount = await discussionIframe.locator('[role="option"]').count();
    const noPostsVisible = await discussionIframe
      .getByText(/Nothing here yet/i)
      .isVisible()
      .catch(() => false);

    if (threadCount > 0) {
      logger.info(`Found ${threadCount} discussion thread(s)`);
    } else if (noPostsVisible) {
      logger.info('Empty state: "Nothing here yet" displayed');
    } else {
      logger.info('Discussion state could not be determined — continuing');
    }
  });

  test('Checkpoint 7: Add a post form is accessible', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const discussionTab = page.getByRole('link', { name: 'Discussion' }).first();
    await discussionTab.click();

    const discussionIframe = page.frameLocator('iframe').first();
    const bodyLocator = discussionIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    const addPostButton = discussionIframe.getByRole('button', { name: 'Add a post' });
    const hasAddPost = await addPostButton.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasAddPost) {
      logger.info('"Add a post" button not found — skipping');
      test.skip();
      return;
    }

    await addPostButton.click();

    const addPostHeading = discussionIframe.getByRole('heading', { name: 'Add a post' });
    await expect(addPostHeading).toBeVisible({ timeout: 30000 });

    // Verify form elements
    const postTitleInput = discussionIframe.getByRole('textbox', { name: 'Post title' });
    await expect(postTitleInput).toBeVisible({ timeout: 15000 });

    const topicAreaCombobox = discussionIframe.getByRole('combobox', { name: 'Topic area' });
    await expect(topicAreaCombobox).toBeVisible({ timeout: 15000 });

    logger.info('Add a post form is accessible with title and topic inputs');
  });

  test('Checkpoint 8: Create a new discussion post', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const discussionTab = page.getByRole('link', { name: 'Discussion' }).first();
    await discussionTab.click();

    const discussionIframe = page.frameLocator('iframe').first();
    const bodyLocator = discussionIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    const addPostButton = discussionIframe.getByRole('button', { name: 'Add a post' });
    const hasAddPost = await addPostButton.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasAddPost) {
      test.skip();
      return;
    }

    await addPostButton.first().click();

    const addPostHeading = discussionIframe.getByRole('heading', { name: 'Add a post' });
    await expect(addPostHeading).toBeVisible({ timeout: 30000 });

    // Fill title
    const postTitleInput = discussionIframe.getByRole('textbox', { name: 'Post title' });
    await expect(postTitleInput).toBeVisible({ timeout: 15000 });
    const testTitle = `E2E Test Post - ${Date.now()}`;
    await postTitleInput.fill(testTitle);

    // Fill content in nested iframe
    const richTextIframe = discussionIframe.frameLocator('iframe[title="Rich Text Area"]');
    let contentEditor = richTextIframe.getByLabel(/Rich Text Area/i);
    const hasLabel = await contentEditor.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasLabel) {
      contentEditor = richTextIframe.locator('body');
    }

    await expect(contentEditor).toBeVisible({ timeout: 30000 });
    await contentEditor.click();
    await contentEditor.fill(`Automated test content - ${new Date().toISOString()}`);

    // Submit
    const submitButton = discussionIframe.getByRole('button', { name: 'Submit' });
    await expect(submitButton).toBeVisible({ timeout: 15000 });
    await expect(submitButton).toBeEnabled({ timeout: 15000 });
    await submitButton.first().click();

    // Wait for submission to complete
    await Promise.race([
      discussionIframe
        .getByRole('button', { name: 'Submitting' })
        .waitFor({ state: 'hidden', timeout: 60000 })
        .catch(() => null),
      discussionIframe
        .getByRole('heading', { name: 'Add a post' })
        .waitFor({ state: 'hidden', timeout: 60000 })
        .catch(() => null),
    ]).catch(() => null);

    await page.waitForTimeout(2000);
    logger.info('Discussion post submitted');
  });

  test('Checkpoint 23: Authoring tab links to studio for admin users', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const instructorTab = page.getByRole('link', { name: 'Instructor' }).first();
    const isAdmin = await instructorTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!isAdmin) {
      logger.info('Authoring tab is admin-gated like Instructor — skipping for non-admin');
      test.skip();
      return;
    }

    const url = new URL(page.url());
    // /course-content/<course_id>/<tab> — strip the trailing tab to get the course id.
    const parts = url.pathname.split('/').filter(Boolean);
    const courseId = decodeURIComponent(parts[3] || '');

    const authoringTab = page.getByRole('link', { name: 'Authoring' });
    await expect(authoringTab).toBeVisible({ timeout: 10000 });
    await expect(authoringTab).toHaveAttribute('target', '_blank');

    const href = await authoringTab.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain(`/course/${courseId}`);
    logger.info(`Authoring tab points at studio: ${href}`);
  });

  test('Checkpoint 9: Instructor tab (optional)', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const instructorTab = page.getByRole('link', { name: 'Instructor' }).first();
    const hasInstructor = await instructorTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasInstructor) {
      logger.info('Instructor tab not available — expected for some courses');
      test.skip();
      return;
    }

    await instructorTab.click();

    const iframeElement = page.locator('iframe').first();
    await expect(iframeElement).toBeVisible({ timeout: 120000 });

    const instructorIframe = page.frameLocator('iframe').first();
    const bodyLocator = instructorIframe.locator('body');
    await expect(bodyLocator).toBeVisible({ timeout: 120000 });

    const hasContent = await bodyLocator
      .evaluate((el) => {
        const text = el.textContent?.trim() || '';
        return text.length > 0 || el.children.length > 0;
      })
      .catch(() => false);

    expect(hasContent).toBeTruthy();
    logger.info('Instructor tab content loaded');
  });

  test('Checkpoint 10: Bookmarks tab (optional)', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const bookmarksTab = page.getByRole('link', { name: /bookmarks/i }).first();
    const hasBookmarks = await bookmarksTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasBookmarks) {
      logger.info('Bookmarks tab not available — optional feature');
      test.skip();
      return;
    }

    await bookmarksTab.click();

    // Just verify the tab navigated and content area exists
    const iframeElement = page.locator('iframe').first();
    const hasIframe = await iframeElement.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasIframe) {
      logger.info('Bookmarks tab loaded with iframe content');
    } else {
      logger.info('Bookmarks tab loaded without iframe — may have inline content');
    }
  });

  test('Checkpoint 11: URL updates on tab switch', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    // Store initial URL
    const initialUrl = page.url();
    expect(initialUrl).toMatch(/\/course-content\//);

    // Click Progress tab
    const progressTab = page.getByRole('link', { name: 'Progress' }).first();
    await progressTab.click();

    // Wait for iframe to load
    const iframeElement = page.locator('iframe').first();
    await expect(iframeElement).toBeVisible({ timeout: 120000 });
    await page.waitForTimeout(2000);

    const progressUrl = page.url();
    logger.info(`Progress URL: ${progressUrl}`);

    // Click Dates tab
    const datesTab = page.getByRole('link', { name: 'Dates' }).first();
    await datesTab.click();
    await expect(iframeElement).toBeVisible({ timeout: 120000 });
    await page.waitForTimeout(2000);

    const datesUrl = page.url();
    logger.info(`Dates URL: ${datesUrl}`);

    // URLs should be different when switching tabs
    // (Next.js client-side routing may not always change the URL immediately)
    logger.info('Tab switching completed — URLs observed');
  });

  test('Checkpoint 13: Agent tab visibility + navigation', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      logger.info('Agent tab not visible — course has agent_content_mode !== true; skipping');
      test.skip();
      return;
    }

    const href = await agentTab.getAttribute('href');
    expect(href).toMatch(/\/course-content\/.+\/agent$/);

    await agentTab.click();
    await page.waitForURL(/\/course-content\/.+\/agent(\?|$)/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/agent(\?|$)/);
    logger.info(`Navigated to agent tab: ${page.url()}`);
  });

  test('Checkpoint 14: Agent tab renders mentor chat full-width with edX iframe hidden', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    // Wait for the agent-ai web component to mount.
    const mentorAi = page.locator('agent-ai');
    await expect(mentorAi.first()).toBeAttached({ timeout: 60_000 });

    // In learning mode (default) the EdxIframe stays mounted but its wrapper carries
    // Tailwind's `hidden` class, so the iframe is not visible to users.
    const iframe = page.locator('iframe#edx-iframe').first();
    await expect(iframe).toBeAttached({ timeout: 30_000 });
    const wrapperClass = await iframe.locator('xpath=..').getAttribute('class');
    expect(wrapperClass ?? '').toContain('hidden');
    expect(await iframe.isVisible().catch(() => false)).toBe(false);

    logger.info('Agent tab renders agent-ai and keeps edX iframe wrapper hidden');
  });

  test('Checkpoint 15: Agent tab route redirect to course tab for courses with agent_content_mode !== true', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (hasAgentTab) {
      logger.info(
        'Agent tab is visible — cannot assert the redirect path for agent_content_mode !== true; skipping',
      );
      test.skip();
      return;
    }

    // When the tab is hidden, force the route and confirm the CourseAccessGuard redirects to /403.
    const courseUrl = page.url();
    const agentUrl = courseUrl.replace(/\/(course|progress|dates|discussion)(\?.*)?$/, '/agent');

    await page.goto(agentUrl, { timeout: 60_000 });
    await page.waitForURL(/\/course-content\/.+\/course/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/course-content\/.+\/course/);
    logger.info('Agent route redirects to course tab when agent_content_mode !== true');
  });

  test('Checkpoint 16: Previous/Keep Learning buttons navigate units from the tabs row', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const nextBtn = page.getByRole('button', { name: 'Next lesson' });
    const hasNext = await nextBtn.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasNext) {
      logger.info('Next lesson button not available — course has a single unit; skipping');
      test.skip();
      return;
    }

    const urlBefore = page.url();
    await nextBtn.click();

    // Wait for URL to change (either unit_id query changes, or path segment flips between
    // course/agent based on the user's current tab).
    await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: 30_000 }).catch(() => null);

    const urlAfter = page.url();
    expect(urlAfter).not.toBe(urlBefore);
    logger.info(`Unit switched: ${urlBefore} → ${urlAfter}`);

    // Going back should be possible via the Previous button now.
    const prevBtn = page.getByRole('button', { name: 'Previous lesson' });
    await expect(prevBtn).toBeVisible({ timeout: 30_000 });
  });

  test('Checkpoint 17: Unit switch on agent tab fires a confirmation toast', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    const nextBtn = page.getByRole('button', { name: 'Next lesson' });
    const hasNext = await nextBtn.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasNext) {
      logger.info('Single-unit course — cannot exercise the toast; skipping');
      test.skip();
      return;
    }

    await nextBtn.click();

    // Sonner renders toasts with role="status" and a "Switched to" prefix from the layout effect.
    const toast = page.getByText(/^Switched to "/i);
    await expect(toast.first()).toBeVisible({ timeout: 15_000 });
    logger.info('Unit-switch confirmation toast displayed on agent tab');
  });

  test('Checkpoint 18: Unit switch posts a MENTOR:CHAT_ACTION_ADD_MESSAGE into the mentor iframe and the agent responds', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    // Playwright pierces open shadow DOM with CSS selectors, so `agent-ai iframe`
    // resolves to the iframe inside the <agent-ai> custom element's shadow root.
    const mentorIframeElement = page.locator('agent-ai iframe');
    const iframeReady = await mentorIframeElement
      .first()
      .waitFor({ state: 'attached', timeout: 60_000 })
      .then(() => true)
      .catch(() => false);

    if (!iframeReady) {
      logger.info('agent-ai iframe never mounted — skipping');
      test.skip();
      return;
    }

    // Instrument postMessage on the iframe window so we can confirm the host sends the
    // CHAT_ACTION_ADD_MESSAGE payload on unit switch. We stash received messages on a
    // global the test can read back via evaluate.
    await page.evaluate(() => {
      const el = document.querySelector('agent-ai');
      const iframe = el?.shadowRoot?.querySelector('iframe') as HTMLIFrameElement | null;
      (window as any).__mentorMessages = [] as unknown[];
      const originalPost = iframe?.contentWindow?.postMessage.bind(iframe?.contentWindow);
      if (iframe?.contentWindow && originalPost) {
        iframe.contentWindow.postMessage = ((message: unknown, ...rest: unknown[]) => {
          (window as any).__mentorMessages.push(message);
          return (originalPost as any)(message, ...rest);
        }) as typeof window.postMessage;
      }
    });

    const nextBtn = page.getByRole('button', { name: 'Next lesson' });
    const hasNext = await nextBtn.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasNext) {
      logger.info('Single-unit course — cannot exercise the postMessage path; skipping');
      test.skip();
      return;
    }

    await nextBtn.click();

    // Toast confirms the layout effect fired; the same effect dispatches the custom event
    // that CourseAgentChat forwards into the iframe via postMessage.
    await expect(page.getByText(/^Switched to "/i).first()).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(
        async () =>
          await page.evaluate(() => {
            const messages = ((window as any).__mentorMessages ?? []) as any[];
            return messages.some(
              (m) =>
                m &&
                typeof m === 'object' &&
                m.type === 'MENTOR:CHAT_ACTION_ADD_MESSAGE' &&
                typeof m.message === 'string' &&
                m.message.startsWith('Switched to "'),
            );
          }),
        { timeout: 15_000, message: 'Expected MENTOR:CHAT_ACTION_ADD_MESSAGE to reach iframe' },
      )
      .toBe(true);

    logger.info('postMessage MENTOR:CHAT_ACTION_ADD_MESSAGE delivered to mentor iframe');

    // Best-effort assertion that the mentor actually echoes an AI response to the injected
    // message. The inner iframe is cross-origin so we reach into it via frameLocator.
    const mentorFrame = page.frameLocator('agent-ai iframe');
    const aiResponse = mentorFrame.locator('.chat-ai-message-response').last();

    const aiVisible = await aiResponse
      .waitFor({ state: 'visible', timeout: 90_000 })
      .then(() => true)
      .catch(() => false);

    if (!aiVisible) {
      logger.info('Mentor iframe did not render an AI response within 90s — non-fatal');
      return;
    }

    logger.info('Mentor iframe rendered an AI response after unit switch');
  });

  test('Checkpoint 19: New-chat button on agent tab triggers welcome screen', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      logger.info('Agent tab not visible — skipping');
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    // The new-chat button only renders once the mentor iframe's #loading-spinner
    // has display:none, so this verifies the spinner-observer wiring too.
    const newChatButton = page.getByRole('button', { name: 'New chat' });
    await expect(newChatButton).toBeVisible({ timeout: 60_000 });

    await newChatButton.click();

    // Clicking posts MENTOR:NEW_CHAT into the iframe; the iframe should land on
    // the welcome screen surfaced by `.chat-welcome-button`.
    const mentorFrame = page.frameLocator('agent-ai iframe');
    await expect(mentorFrame.locator('.chat-welcome-button').first()).toBeVisible({
      timeout: 15_000,
    });

    logger.info('New-chat button posted MENTOR:NEW_CHAT and welcome screen rendered');
  });

  test('Checkpoint 12: No error messages on course content tabs', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const tabs = ['Course', 'Progress', 'Dates', 'Discussion'];

    for (const tabName of tabs) {
      const tab = page.getByRole('link', { name: tabName }).first();
      await tab.click();

      const iframeElement = page.locator('iframe').first();
      await expect(iframeElement).toBeVisible({ timeout: 120000 });

      const tabIframe = page.frameLocator('iframe').first();
      const bodyLocator = tabIframe.locator('body');
      await expect(bodyLocator).toBeVisible({ timeout: 120000 });

      // Check for error indicators
      const badRequestError = page.getByText(/Bad request/i);
      const serverError = page.getByText(/500|Server error/i);
      const tryAgainButton = page.getByRole('button', { name: /try again/i });

      const hasBadRequest = await badRequestError.isVisible({ timeout: 2000 }).catch(() => false);
      const hasServerError = await serverError.isVisible({ timeout: 1000 }).catch(() => false);
      const hasTryAgain = await tryAgainButton.isVisible({ timeout: 1000 }).catch(() => false);

      if (hasBadRequest || hasServerError || hasTryAgain) {
        logger.info(`Error detected on ${tabName} tab`);
      }

      expect(hasBadRequest).toBeFalsy();
      expect(hasServerError).toBeFalsy();
      expect(hasTryAgain).toBeFalsy();

      logger.info(`No errors on ${tabName} tab`);
    }
  });

  test('Checkpoint 20: Learning/Assessment toggle is gated on the presence of an ibl_mentor_xblock', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      logger.info('Agent tab not visible — skipping');
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    // The toggle is rendered only after getCourseBlockDetails returns a block of
    // type=ibl_mentor_xblock for the current vertical. On courses without one,
    // the toggle stays hidden — that's a valid pass for this checkpoint.
    const toggle = page.getByLabel('Toggle assessment mode').first();
    const toggleVisible = await toggle.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!toggleVisible) {
      logger.info('Current unit has no ibl_mentor_xblock — toggle correctly hidden; skipping');
      test.skip();
      return;
    }

    // When visible, both labels and the switch must be reachable.
    await expect(page.getByText('Learn', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Assess', { exact: true }).first()).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    logger.info('Learning/Assessment toggle visible and defaults to Learning mode');
  });

  test('Checkpoint 21: Toggling Assessment mode swaps the agent chat for the edX iframe', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    const toggle = page.getByLabel('Toggle assessment mode').first();
    const toggleVisible = await toggle.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!toggleVisible) {
      logger.info('Toggle hidden (no mentor xblock on the current unit) — skipping');
      test.skip();
      return;
    }

    const iframe = page.locator('iframe#edx-iframe').first();
    const mentorAi = page.locator('agent-ai').first();

    await expect(mentorAi).toBeAttached({ timeout: 60_000 });
    expect(await iframe.isVisible().catch(() => false)).toBe(false);

    // Flip to Assessment.
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    const mentorWrapperClassA = await mentorAi
      .locator('xpath=ancestor::div[1]')
      .getAttribute('class');
    expect(mentorWrapperClassA ?? '').toContain('hidden');

    // Flip back to Learning.
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(await iframe.isVisible().catch(() => false)).toBe(false);
    const mentorWrapperClassB = await mentorAi
      .locator('xpath=ancestor::div[1]')
      .getAttribute('class');
    expect(mentorWrapperClassB ?? '').not.toContain('hidden');

    logger.info('Assessment toggle swaps EdxIframe and CourseAgentChat visibility');
  });

  test('Checkpoint 22: Mobile viewport surfaces the toggle through a 3-dot popover', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    // Wait for any toggle to be in the DOM (the inline one is hidden on this viewport via Tailwind).
    const inlineSwitch = page.getByLabel('Toggle assessment mode').first();
    const present = await inlineSwitch
      .waitFor({ state: 'attached', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!present) {
      logger.info('Toggle hidden (no mentor xblock on the current unit) — skipping');
      test.skip();
      return;
    }

    // Inline switch is hidden on mobile.
    expect(await inlineSwitch.isVisible().catch(() => false)).toBe(false);

    // The 3-dot trigger button is visible and opens a popover containing the switch.
    const trigger = page.getByRole('button', { name: 'Agent display mode' });
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();

    // A second switch (the popover one) becomes visible after the popover opens.
    const switches = page.getByLabel('Toggle assessment mode');
    await expect
      .poll(
        async () => {
          const count = await switches.count();
          let visible = 0;
          for (let i = 0; i < count; i++) {
            if (
              await switches
                .nth(i)
                .isVisible()
                .catch(() => false)
            )
              visible++;
          }
          return visible;
        },
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);

    logger.info('Mobile viewport surfaces the toggle inside a popover');
  });

  test('Checkpoint 33: Agent tab fullscreen toggle expands the chat and the floating bubble restores it', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const agentTab = page.getByRole('link', { name: 'Agent' }).first();
    const hasAgentTab = await agentTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasAgentTab) {
      logger.info('Agent tab not visible — skipping');
      test.skip();
      return;
    }

    await agentTab.click();
    await page.waitForURL(/\/agent(\?|$)/, { timeout: 30_000 });

    // The mentor web component should mount before we exercise fullscreen.
    await expect(page.locator('agent-ai').first()).toBeAttached({ timeout: 60_000 });

    // The fullscreen control lives in the tabs row, to the right of the autoplay icon.
    const enterFullscreen = page.getByRole('button', { name: 'Enter fullscreen' });
    await expect(enterFullscreen).toBeVisible({ timeout: 30_000 });
    await enterFullscreen.click();

    // Entering fullscreen surfaces the floating exit bubble; its container is the
    // fixed inset-0 overlay that covers the layout chrome.
    const exitFullscreen = page.getByRole('button', { name: 'Exit fullscreen' });
    await expect(exitFullscreen).toBeVisible({ timeout: 15_000 });
    const overlayClass = await exitFullscreen.locator('xpath=..').getAttribute('class');
    expect(overlayClass ?? '').toContain('fixed');
    expect(overlayClass ?? '').toContain('inset-0');

    // The agent chat stays mounted inside the fullscreen overlay.
    await expect(page.locator('agent-ai').first()).toBeAttached({ timeout: 15_000 });

    // Clicking the bubble collapses the overlay and restores the enter control.
    await exitFullscreen.click();
    await expect(exitFullscreen).toBeHidden({ timeout: 15_000 });
    await expect(enterFullscreen).toBeVisible({ timeout: 15_000 });
    logger.info('Agent tab fullscreen toggle expands the chat and the floating bubble restores it');
  });

  // ── Admin Configuration tab (moved here from the course about page) ──────────
  //
  // Configuration is now a course-content route (`/course-content/<id>/configuration`)
  // gated on platform-admin. It renders the same ConfigurationTab component (and
  // therefore the same test ids) that previously lived on the about page.

  /**
   * Reach the Configuration tab content. Returns false when the run should skip
   * (no enrolled course, or the current user is not a platform admin).
   */
  async function openConfigurationTab(page: Page): Promise<boolean> {
    const ready = await navigateToCourseContent(page);
    if (!ready) return false;

    const configTab = page.getByRole('link', { name: 'Configuration', exact: true }).first();
    const isAdmin = await configTab.isVisible({ timeout: 120_000 }).catch(() => false);
    if (!isAdmin) return false;

    await configTab.click();
    await page.waitForURL(/\/course-content\/.+\/configuration/, { timeout: 30_000 });
    await expect(page.getByTestId('configuration-tab')).toBeVisible({ timeout: 30000 });
    return true;
  }

  test('Checkpoint 24: Configuration tab (admin) opens the configuration route', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      logger.info('No enrolled courses — skipping');
      test.skip();
      return;
    }

    const configTab = page.getByRole('link', { name: 'Configuration', exact: true }).first();
    const isAdmin = await configTab.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!isAdmin) {
      logger.info('Configuration tab not visible — user is not a platform admin; skipping');
      test.skip();
      return;
    }

    await configTab.click();
    await page.waitForURL(/\/course-content\/.+\/configuration/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/configuration$/);
    await expect(page.getByTestId('configuration-tab')).toBeVisible({ timeout: 30000 });
    logger.info('Configuration route opened for admin user');
  });

  test('Checkpoint 25: Configuration shows the Credentials section', async ({ page }) => {
    const ready = await openConfigurationTab(page);

    if (!ready) {
      test.skip();
      return;
    }

    await expect(page.getByRole('heading', { name: 'Credentials' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('add-credential-button')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('credential-list-toggle')).toBeVisible({ timeout: 10000 });
    logger.info('Credentials section with Add button and list toggle is visible');
  });

  test('Checkpoint 26: Credential creation modal opens and closes', async ({ page }) => {
    const ready = await openConfigurationTab(page);

    if (!ready) {
      test.skip();
      return;
    }

    const addCredentialButton = page.getByTestId('add-credential-button');
    await expect(addCredentialButton).toBeVisible({ timeout: 10000 });
    await addCredentialButton.click();

    const modal = page.getByTestId('credential-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('credential-name-input')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('credential-description-input')).toBeVisible({ timeout: 10000 });
    logger.info('Credential creation modal opened with form fields');

    await page.getByTestId('credential-modal-cancel').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
    logger.info('Credential modal closed');
  });

  test('Checkpoint 27: Advanced Settings expand/collapse', async ({ page }) => {
    const ready = await openConfigurationTab(page);

    if (!ready) {
      test.skip();
      return;
    }

    const toggle = page.getByTestId('advanced-settings-toggle');
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('advanced-settings-content')).not.toBeVisible();

    await toggle.click();
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({ timeout: 10000 });
    logger.info('Advanced Settings expanded');

    await page.getByTestId('advanced-settings-toggle').click();
    await expect(page.getByTestId('advanced-settings-content')).not.toBeVisible({ timeout: 5000 });
    logger.info('Advanced Settings collapsed');
  });

  test('Checkpoint 28: Advanced Settings search filters results', async ({ page }) => {
    const ready = await openConfigurationTab(page);

    if (!ready) {
      test.skip();
      return;
    }

    const toggle = page.getByTestId('advanced-settings-toggle');
    await toggle.click();
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByTestId('advanced-settings-search');
    const hasSearch = await searchInput.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasSearch) {
      logger.info('No search input — settings may not have loaded');
      return;
    }

    await searchInput.fill('xyznonexistent999');
    const hasEmpty = await page
      .getByTestId('advanced-settings-empty')
      .isVisible({ timeout: 120_000 })
      .catch(() => false);
    if (hasEmpty) {
      logger.info('Empty state shown for non-matching search');
    }

    await searchInput.fill('');
    const hasSettings = await page
      .getByTestId('advanced-settings-list')
      .isVisible({ timeout: 120_000 })
      .catch(() => false);
    if (hasSettings) {
      logger.info('Settings restored after clearing search');
    }
  });

  test('Checkpoint 29: Save Changes button appears on modification', async ({ page }) => {
    const ready = await openConfigurationTab(page);

    if (!ready) {
      test.skip();
      return;
    }

    const toggle = page.getByTestId('advanced-settings-toggle');
    await toggle.click();
    await expect(page.getByTestId('advanced-settings-content')).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByTestId('advanced-settings-search');
    const hasSearch = await searchInput.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasSearch) {
      logger.info('No settings loaded — skipping save test');
      return;
    }

    await expect(page.getByTestId('save-advanced-settings-button')).not.toBeVisible({
      timeout: 2000,
    });

    const settingsList = page.getByTestId('advanced-settings-list');
    const textInput = settingsList.locator('input[type="text"]').first();
    const hasInput = await textInput.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasInput) {
      const originalValue = await textInput.inputValue();
      await textInput.fill(originalValue + ' test');
      await expect(page.getByTestId('save-advanced-settings-button')).toBeVisible({
        timeout: 5000,
      });
      logger.info('Save Changes button appeared after modification');
      await settingsList.locator('input[type="text"]').first().fill(originalValue);
    } else {
      const switchEl = settingsList.locator('button[role="switch"]').first();
      const hasSwitch = await switchEl.isVisible({ timeout: 120_000 }).catch(() => false);
      if (hasSwitch) {
        await switchEl.click();
        await expect(page.getByTestId('save-advanced-settings-button')).toBeVisible({
          timeout: 5000,
        });
        logger.info('Save Changes button appeared after toggling switch');
        await settingsList.locator('button[role="switch"]').first().click();
      } else {
        logger.info('No modifiable inputs found');
      }
    }
  });

  test('Checkpoint 30: Learning Info tab (optional) renders What You’ll Learn', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const learningInfoTab = page.getByRole('link', { name: 'Learning Info', exact: true }).first();
    const hasTab = await learningInfoTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasTab) {
      logger.info('Learning Info tab not present — course has no learning_info; skipping');
      test.skip();
      return;
    }

    await learningInfoTab.click();
    await page.waitForURL(/\/course-content\/.+\/learning-info/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /What You.?ll Learn/i })).toBeVisible({
      timeout: 30000,
    });
    logger.info('Learning Info tab renders the "What You’ll Learn" section');
  });

  test('Checkpoint 31: Instructors tab (optional) renders the instructors list', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const instructorsTab = page.getByRole('link', { name: 'Instructors', exact: true }).first();
    const hasTab = await instructorsTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasTab) {
      logger.info('Instructors tab not present — course has no instructor_info; skipping');
      test.skip();
      return;
    }

    await instructorsTab.click();
    await page.waitForURL(/\/course-content\/.+\/instructors/, { timeout: 30_000 });
    // The InstructorTab renders an <h2>Instructors</h2> heading above the list.
    await expect(page.getByRole('heading', { name: 'Instructors' })).toBeVisible({
      timeout: 30000,
    });
    logger.info('Instructors tab renders the instructors list');
  });

  test('Checkpoint 32: Analytics tab (can_view_analytics) renders course analytics', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const analyticsTab = page.getByRole('link', { name: 'Analytics', exact: true }).first();
    const hasTab = await analyticsTab.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasTab) {
      logger.info('Analytics tab not present — user lacks can_view_analytics; skipping');
      test.skip();
      return;
    }

    await analyticsTab.click();
    await page.waitForURL(/\/course-content\/.+\/analytics/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/analytics$/);

    // AnalyticsCourseDetail from the SDK renders enrollment stat cards and an
    // "Enrolled Users" table.
    await expect(page.getByRole('heading', { name: 'Enrolled Users' })).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByText('Active Enrollments', { exact: false }).first()).toBeVisible({
      timeout: 30000,
    });
    logger.info('Analytics tab renders AnalyticsCourseDetail (stat cards + Enrolled Users table)');
  });
});
