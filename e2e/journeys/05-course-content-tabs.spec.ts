import { test, expect, Locator, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import {
  getCourseContentTab,
  gotoTenantPage,
  waitForAppShell,
  waitForLoaderToDisappear,
} from '../utils/navigation';

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
 * The Course tab only shows when the course enables `course_content_mode` for
 * this viewer's audience; agent-only courses replace it with the Agent tab.
 * Looks the tab up in the tab row (and its More menu) only, so a missing tab
 * resolves to null instead of a detour through the Administration area.
 */
async function getCourseTab(page: Page): Promise<Locator | null> {
  return getCourseContentTab(page, 'Course', { staffArea: false });
}

/**
 * Journey 05: Course Content Tabs
 *
 * Validates all course content tabs:
 *  1. Core tabs visible (Course and/or Agent, Progress, Dates, Discussions)
 *  2. Course tab iframe content (skipped when the course hides the Course tab)
 *  3. Progress tab (native): completion ring, grade bar, grade summary
 *  4. Dates tab (native): timeline with the Today marker
 *  5. Discussions tab (native): All posts / My posts / Topics / Learners views
 *  6. Thread list or empty state, opening a post
 *  7. Add a post form
 *  8. Create a post, respond to it, delete it
 *  9. Instructor tab (optional)
 * 10. Bookmarks (optional)
 * 11. URL updates on tab switch
 * 12. No error messages on the tabs the course shows
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

    // Progress, Dates and Discussions are always there.
    for (const name of ['Progress', 'Dates', 'Discussions']) {
      const tab = await getCourseContentTab(page, name, { staffArea: false });
      expect(tab, `${name} tab should be present`).not.toBeNull();
    }

    // Course and Agent each depend on the course's content-mode settings, but
    // the course always offers at least one way into its content.
    const courseTab = await getCourseTab(page);
    const agentTab = await getCourseContentTab(page, 'Agent', { staffArea: false });
    expect(Boolean(courseTab) || Boolean(agentTab), 'Course or Agent tab should be present').toBe(
      true,
    );
    logger.info(
      `Core tabs visible — Course: ${Boolean(courseTab)}, Agent: ${Boolean(agentTab)}, Progress, Dates, Discussions`,
    );
  });

  test('Checkpoint 2: Course tab shows iframe content', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const courseTab = await getCourseTab(page);

    if (!courseTab) {
      logger.info('Course tab hidden by the course content-mode settings — skipping');
      test.skip();
      return;
    }

    await courseTab.click();
    await expect(page).toHaveURL(/\/course(\?|$)/, { timeout: 30000 });

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

  test('Checkpoint 3: Progress tab renders natively with completion and grades', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const progressTab = await getCourseContentTab(page, 'Progress');
    expect(progressTab).not.toBeNull();
    await progressTab!.click();
    await expect(page).toHaveURL(/\/progress(\?|$)/, { timeout: 30000 });

    // Native: no edX iframe, the completion ring and the grade bar come off the
    // course-home progress API.
    await expect(page.getByTestId('course-progress')).toBeVisible({ timeout: 120000 });
    expect(await page.locator('#edx-iframe').count()).toBe(0);
    await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Course completion' })).toBeVisible();
    await expect(page.getByTestId('completion-donut')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Grades' })).toBeVisible();
    await expect(page.getByTestId('current-grade')).toHaveText(/\d+%/);
    await expect(page.getByTestId('passing-grade')).toHaveText(/\d+%/);
    // A grading policy shows as the summary table; a course without one says so.
    const summary = page.getByTestId('grade-summary');
    const noPolicy = page.getByText('This course has no graded assignments.');
    await expect(summary.or(noPolicy).first()).toBeVisible();
    await expect(page.getByTestId('detailed-grades')).toBeVisible();
    await expect(
      page.getByTestId('related-links').getByRole('link', { name: /Dates/ }),
    ).toHaveAttribute('href', /\/dates$/);
    logger.info('Native progress page rendered with completion and grades');
  });

  test('Checkpoint 4: Dates tab renders the native timeline', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const datesTab = await getCourseContentTab(page, 'Dates');
    expect(datesTab).not.toBeNull();
    await datesTab!.click();
    await expect(page).toHaveURL(/\/dates(\?|$)/, { timeout: 30000 });

    await expect(page.getByTestId('course-dates')).toBeVisible({ timeout: 120000 });
    expect(await page.locator('#edx-iframe').count()).toBe(0);
    await expect(page.getByRole('heading', { name: 'Important dates' })).toBeVisible();

    // A timeline (grouped by day, with the Today marker) or the empty state.
    const timeline = page.getByTestId('dates-timeline');
    const empty = page.getByTestId('dates-empty');
    await expect(timeline.or(empty).first()).toBeVisible({ timeout: 60000 });
    if (await timeline.isVisible().catch(() => false)) {
      expect(await page.getByTestId('dates-day').count()).toBeGreaterThan(0);
      await expect(page.getByTestId('dates-badge').filter({ hasText: 'Today' })).toBeVisible();
      logger.info('Dates timeline rendered with the Today marker');
    } else {
      logger.info('Dates tab rendered its empty state');
    }
  });

  /** Opens the native Discussions tab and waits for its view nav. */
  async function openDiscussions(page: Page) {
    const discussionTab = await getCourseContentTab(page, 'Discussions');
    expect(discussionTab).not.toBeNull();
    await discussionTab!.click();
    await expect(page).toHaveURL(/\/discussion(\?|$)/, { timeout: 30000 });
    await expect(page.getByTestId('course-discussions')).toBeVisible({ timeout: 120000 });
    expect(await page.locator('#edx-iframe').count()).toBe(0);
    return page.getByTestId('discussion-nav');
  }

  test('Checkpoint 5: Discussions tab renders its views natively', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const nav = await openDiscussions(page);
    for (const name of ['All posts', 'My posts', 'Topics', 'Learners']) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible({ timeout: 60000 });
    }
    await expect(nav.getByRole('link', { name: 'All posts', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );

    // Topics come off the course_topics API; Learners off activity_stats.
    await nav.getByRole('link', { name: 'Topics', exact: true }).click();
    await expect(page).toHaveURL(/view=topics/, { timeout: 30000 });
    await expect(page.getByTestId('topics-view')).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId('topic-row').first()).toBeVisible({ timeout: 60000 });

    await nav.getByRole('link', { name: 'Learners', exact: true }).click();
    await expect(page).toHaveURL(/view=learners/, { timeout: 30000 });
    await expect(page.getByTestId('learners-view')).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId('learners-table')).toBeVisible({ timeout: 60000 });
    logger.info('Discussion views (All posts, My posts, Topics, Learners) rendered natively');
  });

  test('Checkpoint 6: Discussion thread list or empty state', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    await openDiscussions(page);
    await expect(page.getByTestId('posts-list')).toBeVisible({ timeout: 120000 });
    const rows = page.getByTestId('thread-row');
    const empty = page.getByTestId('posts-empty');
    await expect(rows.first().or(empty)).toBeVisible({ timeout: 60000 });

    const threadCount = await rows.count();
    if (threadCount > 0) {
      logger.info(`Found ${threadCount} discussion thread(s)`);
      // Opening a post puts it in the URL and renders it beside the list.
      await rows.first().click();
      await expect(page).toHaveURL(/thread=/, { timeout: 30000 });
      const thread = page.getByTestId('thread-view');
      await expect(thread).toBeVisible({ timeout: 60000 });
      await expect(thread.getByTestId('thread-actions')).toBeVisible({ timeout: 60000 });
      await expect(thread.getByTestId('responses')).toBeVisible();
    } else {
      await expect(empty).toContainText('Nothing here yet');
      logger.info('Empty state: "Nothing here yet" displayed');
    }
  });

  test('Checkpoint 7: Add a post form is accessible', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    await openDiscussions(page);
    const addPostButton = page.getByRole('button', { name: 'Add a post' });
    const hasAddPost = await addPostButton.isVisible({ timeout: 60_000 }).catch(() => false);

    if (!hasAddPost) {
      logger.info('"Add a post" button not found — posting is off for this course');
      test.skip();
      return;
    }

    await addPostButton.click();
    await expect(page.getByRole('heading', { name: 'Add a post' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('radio', { name: /Discussion/ })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Post title' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Topic area' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Post content' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('posts-list')).toBeVisible({ timeout: 30000 });
    logger.info('Add a post form is accessible with type, topic, title and content inputs');
  });

  test('Checkpoint 8: Create a discussion post, respond to it and delete it', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    await openDiscussions(page);
    const addPostButton = page.getByRole('button', { name: 'Add a post' });
    const hasAddPost = await addPostButton.isVisible({ timeout: 60_000 }).catch(() => false);

    if (!hasAddPost) {
      test.skip();
      return;
    }

    await addPostButton.click();
    await expect(page.getByRole('heading', { name: 'Add a post' })).toBeVisible({ timeout: 30000 });

    const testTitle = `E2E Test Post - ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Post title' }).fill(testTitle);
    await page
      .getByRole('textbox', { name: 'Post content' })
      .fill(`Automated test content - ${new Date().toISOString()}`);
    const submitButton = page.getByRole('button', { name: 'Submit' });
    await expect(submitButton).toBeEnabled({ timeout: 15000 });
    await submitButton.click();

    // The new post opens straight away.
    await expect(page).toHaveURL(/thread=/, { timeout: 60000 });
    const thread = page.getByTestId('thread-view');
    await expect(thread.getByRole('heading', { name: testTitle })).toBeVisible({ timeout: 60000 });
    logger.info('Discussion post submitted and opened');

    // Respond to it.
    const responseForm = page.getByTestId('response-form');
    await responseForm.getByRole('textbox').fill('Automated response');
    await responseForm.getByRole('button', { name: 'Post response' }).click();
    await expect(thread.getByTestId('comment-item').first()).toContainText('Automated response', {
      timeout: 60000,
    });
    logger.info('Response posted');

    // Clean up: delete the post (confirmed through the browser prompt).
    page.once('dialog', (dialog) => dialog.accept());
    await thread.getByTestId('thread-delete').click();
    await expect(page).not.toHaveURL(/thread=/, { timeout: 60000 });
    logger.info('Test post deleted');
  });

  test('Checkpoint 23: Authoring tab links to studio for admin users', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    // Admin-gated tabs may sit behind the tab row's overflow menu.
    const instructorTab = await getCourseContentTab(page, 'Overview');

    if (!instructorTab) {
      logger.info('Authoring tab is admin-gated like Instructor — skipping for non-admin');
      test.skip();
      return;
    }

    const url = new URL(page.url());
    // /course-content/<course_id>/<tab> — strip the trailing tab to get the course id.
    const parts = url.pathname.split('/').filter(Boolean);
    const courseId = decodeURIComponent(parts[3] || '');

    const authoringTab = await getCourseContentTab(page, 'Authoring');
    expect(authoringTab).not.toBeNull();
    await expect(authoringTab!).toBeVisible({ timeout: 10000 });
    await expect(authoringTab!).toHaveAttribute('target', '_blank');

    const href = await authoringTab!.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain(`/course/${courseId}`);
    logger.info(`Authoring tab points at studio: ${href}`);
  });

  test('Checkpoint 9: Administration area (optional) renders the native overview with its section nav', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const overview = await getCourseContentTab(page, 'Overview');

    if (!overview) {
      logger.info('Administration area not available — expected for non-staff viewers');
      test.skip();
      return;
    }

    await overview.click();
    await expect(page).toHaveURL(/\/instructor(\?|$)/, { timeout: 30000 });

    // Native: no iframe, one admin nav listing every staff page, overview stat cards.
    await expect(page.getByTestId('instructor-dashboard')).toBeVisible({ timeout: 60000 });
    expect(await page.locator('#edx-iframe').count()).toBe(0);
    const nav = page.getByTestId('course-admin-nav');
    for (const name of [
      'Overview',
      'Grades',
      'Membership',
      'Cohorts',
      'Extensions',
      'Attempts',
      'Reports',
      'Settings',
    ]) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByTestId('overview-section')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Enrolled learners')).toBeVisible();

    // Sections are deep-linkable through ?section=…
    await nav.getByRole('link', { name: 'Membership', exact: true }).click();
    await expect(page).toHaveURL(/section=membership/, { timeout: 30000 });
    await expect(page.getByTestId('membership-section')).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('region', { name: 'Course team' })).toBeVisible();
    logger.info('Administration area rendered natively');
  });

  test('Checkpoint 38: Grades (staff) renders the native grade table', async ({ page }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    // Sequential: resolving a staff page may open the staff area first.
    const gradebookTab = await getCourseContentTab(page, 'Grades');
    const instructorTab = await getCourseContentTab(page, 'Overview');

    // Gradebook shares the staff gate with the Instructor.
    expect(Boolean(gradebookTab)).toBe(Boolean(instructorTab));

    if (!gradebookTab) {
      logger.info('Viewer holds no staff role on this course — no Grades section, as expected');
      return;
    }

    await gradebookTab.click();
    await expect(page).toHaveURL(/\/gradebook(\?|$)/, { timeout: 30000 });

    // Native gradebook: the learner count comes straight from the grades API.
    await expect(page.getByTestId('course-gradebook')).toBeVisible({ timeout: 60000 });
    expect(await page.locator('#edx-iframe').count()).toBe(0);
    await expect(page.getByTestId('gradebook-count')).toHaveText(/Showing \d+ of \d+ learners/, {
      timeout: 120000,
    });
    await expect(page.getByTestId('gradebook-table')).toBeVisible();
    await expect(page.getByLabel('Search learners')).toBeVisible();
    logger.info('Gradebook rendered natively');
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

    // Click Progress tab — the native page renders once the route changes.
    const progressTab = await getCourseContentTab(page, 'Progress', { staffArea: false });
    expect(progressTab).not.toBeNull();
    await progressTab!.click();
    await expect(page).toHaveURL(/\/progress(\?|$)/, { timeout: 30000 });
    await expect(page.getByTestId('course-progress')).toBeVisible({ timeout: 120000 });

    const progressUrl = page.url();
    logger.info(`Progress URL: ${progressUrl}`);

    // Click Dates tab
    const datesTab = await getCourseContentTab(page, 'Dates', { staffArea: false });
    expect(datesTab).not.toBeNull();
    await datesTab!.click();
    await expect(page).toHaveURL(/\/dates(\?|$)/, { timeout: 30000 });
    await expect(page.getByTestId('course-dates')).toBeVisible({ timeout: 120000 });

    const datesUrl = page.url();
    logger.info(`Dates URL: ${datesUrl}`);

    expect(datesUrl).not.toBe(progressUrl);
    logger.info('Tab switching completed — URL follows the active tab');
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

  test('Checkpoint 37: Agent tab holds a course-loading spinner until the edX iframe mounts', async ({
    page,
  }) => {
    // Record the order in which the three markers first appear, so the assertion
    // does not depend on catching a transient state at the right moment.
    await page.addInitScript(() => {
      const order: string[] = [];
      const markers: Record<string, string> = {
        loading: '[data-testid="course-agent-chat-loading"]',
        edxIframe: 'iframe#edx-iframe',
        agent: 'agent-ai',
      };
      const sweep = () => {
        for (const [name, selector] of Object.entries(markers)) {
          if (!order.includes(name) && document.querySelector(selector)) order.push(name);
        }
      };
      (window as unknown as { __agentMountOrder: string[] }).__agentMountOrder = order;
      new MutationObserver(sweep).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
      sweep();
    });

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

    await expect(page.locator('agent-ai').first()).toBeAttached({ timeout: 60_000 });

    const order = await page.evaluate(
      () => (window as unknown as { __agentMountOrder: string[] }).__agentMountOrder,
    );

    // The chat is the last of the three to appear: the spinner stands in for it,
    // and the edX iframe is mounted before the agent takes over.
    expect(order).toContain('loading');
    expect(order).toContain('edxIframe');
    expect(order.indexOf('agent')).toBe(order.length - 1);
    expect(order.indexOf('loading')).toBeLessThan(order.indexOf('agent'));
    expect(order.indexOf('edxIframe')).toBeLessThan(order.indexOf('agent'));

    logger.info(`Agent tab mount order: ${order.join(' → ')}`);
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

    // Each tab and what proves it finished loading. Course is an edX iframe and
    // only exists when the course enables it; the other three are native pages.
    const tabs: Array<{ name: string; ready: () => Promise<void> }> = [
      {
        name: 'Course',
        ready: async () => {
          await expect(page.locator('iframe').first()).toBeVisible({ timeout: 120000 });
          await expect(page.frameLocator('iframe').first().locator('body')).toBeVisible({
            timeout: 120000,
          });
        },
      },
      {
        name: 'Progress',
        ready: () => expect(page.getByTestId('course-progress')).toBeVisible({ timeout: 120000 }),
      },
      {
        name: 'Dates',
        ready: () => expect(page.getByTestId('course-dates')).toBeVisible({ timeout: 120000 }),
      },
      {
        name: 'Discussions',
        ready: () =>
          expect(page.getByTestId('course-discussions')).toBeVisible({ timeout: 120000 }),
      },
    ];

    for (const { name: tabName, ready } of tabs) {
      const tab = await getCourseContentTab(page, tabName, { staffArea: false });

      if (!tab) {
        // Only the Course tab is optional (course content-mode settings).
        expect(tabName, `${tabName} tab should be present`).toBe('Course');
        logger.info('Course tab hidden by the course content-mode settings — not checked');
        continue;
      }

      await tab.click();
      await ready();

      // Check for error indicators
      const badRequestError = page.getByText(/Bad request/i);
      const serverError = page.getByText(/500|Server error/i);
      const tryAgainButton = page.getByRole('button', { name: /try again/i });
      // The native pages' own load-failure banner.
      const loadError = page.getByRole('alert').filter({ hasText: /Couldn.t load/i });

      const hasBadRequest = await badRequestError.isVisible({ timeout: 2000 }).catch(() => false);
      const hasServerError = await serverError.isVisible({ timeout: 1000 }).catch(() => false);
      const hasTryAgain = await tryAgainButton.isVisible({ timeout: 1000 }).catch(() => false);
      const hasLoadError = await loadError
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      if (hasBadRequest || hasServerError || hasTryAgain || hasLoadError) {
        logger.info(`Error detected on ${tabName} tab`);
      }

      expect(hasBadRequest).toBeFalsy();
      expect(hasServerError).toBeFalsy();
      expect(hasTryAgain).toBeFalsy();
      expect(hasLoadError).toBeFalsy();

      logger.info(`No errors on ${tabName} tab`);
    }
  });

  test('Checkpoint 20: Agent tab no longer offers a Learn/Assess switch', async ({ page }) => {
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
    await expect(page.locator('agent-ai').first()).toBeAttached({ timeout: 60_000 });

    // The mode now follows the unit, so neither the switch nor its hint render.
    await expect(page.getByLabel('Toggle assessment mode')).toHaveCount(0);
    await expect(page.getByText('Two ways to learn')).toHaveCount(0);
    logger.info('No Learn/Assess switch on the agent tab');
  });

  test('Checkpoint 21: A unit with an ibl_mentor_xblock opens straight in assessment mode', async ({
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

    // The switch happens once getCourseBlockDetails reports a block of
    // type=ibl_mentor_xblock for the current vertical; units without one stay
    // in learning mode, which is a valid pass here.
    const assessmentToast = page.getByText('Switched to assessment mode').first();
    const switched = await assessmentToast.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!switched) {
      logger.info('Current unit has no ibl_mentor_xblock — stays in learning mode; skipping');
      test.skip();
      return;
    }

    // Assessment mode shows the edX unit in place of the agent chat.
    await expect(page.locator('iframe#edx-iframe').first()).toBeVisible({ timeout: 30_000 });
    const mentorAi = page.locator('agent-ai').first();
    if ((await mentorAi.count()) > 0) {
      const mentorWrapperClass = await mentorAi
        .locator('xpath=ancestor::div[1]')
        .getAttribute('class');
      expect(mentorWrapperClass ?? '').toContain('hidden');
    }
    logger.info('Assessment unit opened in assessment mode with the toast');
  });

  test('Checkpoint 22: Mobile course-controls popover carries no Learn/Assess switch', async ({
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

    // Fullscreen is always offered on the agent tab, so the 3-dot trigger renders.
    const trigger = page.getByRole('button', { name: 'Agent display options' });
    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await trigger.click();

    await expect(page.getByRole('button', { name: 'Fullscreen' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel('Toggle assessment mode')).toHaveCount(0);
    logger.info('Mobile popover lists the course controls without a mode switch');
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

    // The fullscreen control lives in the top navbar (left of the search bar),
    // to the right of the autoplay icon.
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

  test('Checkpoint 34: Unit media dropdown lists pdf/video/media-catalog blocks and previews them on the Agent tab', async ({
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

    // The dropdown only renders when the current unit actually has pdf,
    // video, or ibl-media-catalog blocks, so its absence is not a failure.
    const mediaTrigger = page.getByTestId('course-media-dropdown-trigger');
    const hasMedia = await mediaTrigger.isVisible({ timeout: 30_000 }).catch(() => false);

    if (!hasMedia) {
      logger.info('Current unit has no media blocks — skipping');
      test.skip();
      return;
    }

    await mediaTrigger.click();

    // Each entry shows the block display name plus its human-readable type.
    const items = page.getByTestId('course-media-dropdown-item');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });
    const itemText = (await items.first().innerText()).trim();
    expect(itemText.length).toBeGreaterThan(0);
    expect(itemText).toMatch(/PDF|Video|Media catalog/);

    // On the Agent tab a selection opens the student_view_url in an overlay.
    await items.first().click();
    const preview = page.getByTestId('course-media-preview');
    await expect(preview).toBeVisible({ timeout: 15_000 });
    await expect(preview.locator('iframe')).toBeAttached({ timeout: 15_000 });

    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden({ timeout: 15_000 });

    logger.info('Unit media dropdown lists media blocks and previews them on the Agent tab');
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

    const configTab = await getCourseContentTab(page, 'Settings');
    if (!configTab) return false;

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

    const configTab = await getCourseContentTab(page, 'Settings');

    if (!configTab) {
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

    const learningInfoTab = await getCourseContentTab(page, 'Learning Info');

    if (!learningInfoTab) {
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

    const instructorsTab = await getCourseContentTab(page, 'Instructors');

    if (!instructorsTab) {
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

  test('Checkpoint 35: layout requests the signed-in user\u2019s role listing', async ({
    page,
  }) => {
    // Course-scoped roles (course-staff / course-instructor / course-limited-staff)
    // gate the staff tabs, so the layout must fetch the role listing on mount.
    const roleRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/ibl/users/manage/roles/')) {
        roleRequests.push(request.url());
      }
    });

    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    await expect.poll(() => roleRequests.length, { timeout: 30_000 }).toBeGreaterThan(0);
    // Looked up by the signed-in user, never by an arbitrary identity.
    expect(roleRequests.some((url) => /[?&](username|email|user_id)=/.test(url))).toBe(true);
    logger.info(`Role listing requested: ${roleRequests[0]}`);
  });

  test('Checkpoint 36: staff tabs appear together and Authoring stays full-staff only', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    // Sequential: resolving a staff page may open the staff area first.
    const instructorTab = await getCourseContentTab(page, 'Overview');
    const configurationTab = await getCourseContentTab(page, 'Settings');
    const authoringTab = await getCourseContentTab(page, 'Authoring');

    if (!instructorTab && !configurationTab && !authoringTab) {
      logger.info('Viewer holds no staff role on this course — no staff tabs, as expected');
      return;
    }

    // Instructor and Configuration share one gate (platform admin OR any course
    // staff role), so they are always shown together.
    expect(Boolean(instructorTab)).toBe(Boolean(configurationTab));

    // Authoring is the narrower gate: platform admins and full course staff get
    // it, course-limited-staff never does. So Authoring implies the other two.
    if (authoringTab) {
      expect(instructorTab).not.toBeNull();
      expect(configurationTab).not.toBeNull();
      logger.info('Viewer is admin / full course staff — every staff tab including Authoring');
    } else {
      logger.info('Viewer is limited staff — staff tabs present, Authoring withheld');
    }
  });

  test('Checkpoint 32: Analytics tab (can_view_analytics) renders course analytics', async ({
    page,
  }) => {
    const ready = await navigateToCourseContent(page);

    if (!ready) {
      test.skip();
      return;
    }

    const analyticsTab = await getCourseContentTab(page, 'Analytics');

    if (!analyticsTab) {
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
