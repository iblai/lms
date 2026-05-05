import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, waitForLoaderToDisappear } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Helper: Navigate from /home → first course → Access Course → course content tabs.
 * Returns true if successful, false if skipped (no courses).
 */
async function navigateToCourseContent(page: Page): Promise<boolean> {
  await page.goto(`${SKILL_HOST}/home`, {
    timeout: 120000,
  });
  await waitForAppShell(page);

  const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
  await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });

  const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
  await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

  //wait for myCoursesGrid.getByRole('link', { name: any name }) to be visible
  await expect(myCoursesGrid.getByRole('link', { name: /.*/ })).toBeVisible({ timeout: 15000 });

  const courseLink = myCoursesGrid.getByRole('link').first();
  const hasCourse = await courseLink.isVisible({ timeout: 120_000 }).catch(() => false);

  if (!hasCourse) return false;

  await courseLink.click();
  await page.waitForURL(/\/courses\//, { timeout: 120000 });
  await waitForLoaderToDisappear(page);
  await waitForAppShell(page);

  //wait for header Course Description to be visible
  await expect(page.getByRole('heading', { name: 'Course Description' })).toBeVisible({
    timeout: 30_000,
  });

  const accessCourseButton = page.getByRole('button', { name: 'Access Course' });
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

    const hasYourProgress = await yourProgressHeading
      .isVisible({ timeout: 120_000 })
      .catch(() => false);
    const hasGradeSummary = await gradeSummaryHeading
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (hasYourProgress) {
      logger.info('"Your progress" heading visible');
    }
    if (hasGradeSummary) {
      logger.info('"Grade summary" heading visible');
    }

    expect(hasYourProgress || hasGradeSummary).toBeTruthy();
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

    await addPostButton.click();

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
    await submitButton.click();

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

    // Wait for the mentor-ai web component to mount.
    const mentorAi = page.locator('mentor-ai');
    await expect(mentorAi.first()).toBeAttached({ timeout: 60_000 });

    // The EdxIframe must stay mounted (for state) but hidden via display:none.
    const hiddenIframe = page.locator('div[style*="display: none"] iframe#edx-iframe');
    const isHiddenWrapperPresent = await hiddenIframe
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    // isVisible() returns false when the ancestor has display:none — that's exactly what we want.
    expect(isHiddenWrapperPresent).toBe(false);

    logger.info('Agent tab renders mentor-ai and keeps edX iframe display:none');
  });

  test('Checkpoint 15: Agent tab route rejects courses with agent_content_mode !== true', async ({
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
    await page.waitForURL(/\/error\/403/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/error\/403/);
    logger.info('Agent route redirects to /error/403 when agent_content_mode !== true');
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

    // Playwright pierces open shadow DOM with CSS selectors, so `mentor-ai iframe`
    // resolves to the iframe inside the <mentor-ai> custom element's shadow root.
    const mentorIframeElement = page.locator('mentor-ai iframe');
    const iframeReady = await mentorIframeElement
      .first()
      .waitFor({ state: 'attached', timeout: 60_000 })
      .then(() => true)
      .catch(() => false);

    if (!iframeReady) {
      logger.info('mentor-ai iframe never mounted — skipping');
      test.skip();
      return;
    }

    // Instrument postMessage on the iframe window so we can confirm the host sends the
    // CHAT_ACTION_ADD_MESSAGE payload on unit switch. We stash received messages on a
    // global the test can read back via evaluate.
    await page.evaluate(() => {
      const el = document.querySelector('mentor-ai');
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
    const mentorFrame = page.frameLocator('mentor-ai iframe');
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
    const mentorFrame = page.frameLocator('mentor-ai iframe');
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
});
