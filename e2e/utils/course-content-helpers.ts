/**
 * Helpers for the course-content journeys (38–41).
 *
 * Two concerns live here:
 *  1. Getting a test from `/home` into a course's content pages, which takes
 *     three navigations and can legitimately dead-end (no enrolled courses on
 *     the tenant, or the course isn't accessible) — callers `test.skip()` on a
 *     `null` result rather than failing.
 *  2. Forcing the viewer's role. Admin-only chrome (Instructor / Configuration /
 *     Authoring tabs, Studio + Analytics sidebar rows) is gated on the
 *     department member-check endpoint, so stubbing that response is what lets
 *     one signed-in session assert both the admin and the learner view.
 */
import { expect, Page } from '@playwright/test';

import {
  getCourseContentTab,
  gotoTenantPage,
  waitForAppShell,
  waitForLoaderToDisappear,
} from './navigation';

/** Endpoint behind `useGetDepartmentMemberCheckQuery` (services/core.ts). */
const MEMBER_CHECK_GLOB = '**/api/core/departments/members/check/**';

export type ViewerRole = 'admin' | 'learner';

/**
 * Pin the member-check response so the course chrome renders for a known role.
 * Install before the first navigation of the test — the query fires as the
 * course layout mounts, and a late route handler misses it.
 */
export async function forceViewerRole(page: Page, role: ViewerRole): Promise<void> {
  const isAdmin = role === 'admin';
  await page.route(MEMBER_CHECK_GLOB, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        is_platform_admin: isAdmin,
        is_department_admin: isAdmin,
        is_member: true,
      }),
    });
  });
}

/** Both the home rail and the catalog render `DiscoverContentCard`. */
const CONTENT_CARD = '[data-testid="discover-content-card"]';

/**
 * Routes into a course, most reliable first.
 *
 * The home rail is preferred because it is fed by the learner's own enrolment
 * endpoints, whereas the catalog view goes through the search index — which on
 * some tenants returns nothing for an account that demonstrably has enrolments.
 * Falling back to the catalog keeps this working on tenants whose home rail is
 * configured to show something else (`lms_dashboard_courses_display`).
 */
const COURSE_ENTRY_POINTS = ['home', 'discover?content=courses&enrolled=true'] as const;

/**
 * Click into the first course reachable from the app shell, landing on either
 * its about page or straight in its content (the rail links to content
 * directly). Returns false when no route surfaces a course.
 */
export async function openFirstEnrolledCourse(page: Page): Promise<boolean> {
  const courseCard = page.locator(CONTENT_CARD).first();

  // Each entry point is tried twice: these lists are served by upstream APIs
  // that intermittently answer empty under concurrent load, and a single miss
  // would silently skip the journey rather than report anything.
  const attempts = COURSE_ENTRY_POINTS.flatMap((entry) => [entry, entry]);

  for (const entry of attempts) {
    await gotoTenantPage(page, entry, { timeout: 120_000 });
    await waitForAppShell(page);
    await waitForLoaderToDisappear(page).catch(() => undefined);
    if (!(await courseCard.isVisible({ timeout: 45_000 }).catch(() => false))) continue;

    await courseCard.click();
    // The rail goes straight to `/course-content/`; the catalog goes to the
    // `/courses/` about page.
    await page
      .waitForURL(/\/(courses|course-content)\//, { timeout: 120_000 })
      .catch(() => undefined);
    if (!/\/(courses|course-content)\//.test(page.url())) continue;

    await waitForLoaderToDisappear(page).catch(() => undefined);
    await waitForAppShell(page);
    return true;
  }
  return false;
}

/**
 * Navigate all the way into a course's content pages. Returns false when no
 * course is reachable, or when the course's eligibility never resolves into an
 * "Access Course" CTA.
 */
export async function openCourseContent(page: Page): Promise<boolean> {
  if (!(await openFirstEnrolledCourse(page))) return false;

  // The home rail lands in the content pages already.
  if (page.url().includes('/course-content/')) {
    await waitForAppShell(page);
    return true;
  }

  const accessCourseButton = page.getByRole('button', { name: 'Access Course' });
  // Eligibility resolves asynchronously; wait for the CTA to settle before
  // deciding the course is inaccessible.
  await accessCourseButton.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => null);
  if (!(await accessCourseButton.isVisible({ timeout: 10_000 }).catch(() => false))) return false;

  await accessCourseButton.click();
  await page.waitForURL(/\/course-content\//, { timeout: 120_000 });
  await waitForAppShell(page);
  return true;
}

/**
 * Switch to the Agent tab and wait for the mentor web component to mount.
 * Returns false when the course has no Agent tab (the tenant can disable it,
 * and course-content-mode courses hide it for learners).
 */
export async function openAgentTab(page: Page): Promise<boolean> {
  // Resolve through the shared helper: the tab row hides whatever doesn't fit
  // behind a 3-dot menu, so a plain link lookup reports "no Agent tab" for a
  // course that simply has a lot of tabs.
  const agentTab = await getCourseContentTab(page, 'Agent');
  if (agentTab === null) return false;

  await agentTab.click();
  await page.waitForURL(/\/agent(\?|$)/, { timeout: 60_000 }).catch(() => undefined);
  // `agent-ai` is a custom element that lazily creates its shadow-root iframe.
  await page
    .locator('agent-ai')
    .first()
    .waitFor({ state: 'attached', timeout: 60_000 })
    .catch(() => undefined);
  return true;
}

/**
 * The agent chat renders inside an iframe in the `agent-ai` custom element's
 * shadow root. Playwright's CSS engine pierces open shadow roots, so this
 * resolves without any manual shadow traversal.
 */
export function agentChatFrame(page: Page) {
  return page.frameLocator('agent-ai iframe');
}

/** Wait for the agent chat iframe to have rendered something. */
export async function waitForAgentChatReady(page: Page, timeout = 90_000): Promise<boolean> {
  const body = agentChatFrame(page).locator('body');
  return body
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
}

/** Open the mobile course-controls popover ("Agent display options"). */
export async function openMobileCourseControls(page: Page): Promise<boolean> {
  const trigger = page.getByRole('button', { name: 'Agent display options' });
  if (!(await trigger.isVisible({ timeout: 15_000 }).catch(() => false))) return false;
  await trigger.click();
  return true;
}

/**
 * Sidebar rows only an admin gets. They are gated two different ways, and the
 * split matters for what a test can assert:
 *
 *  • Studio is gated on the member check (`is_platform_admin ||
 *    is_department_admin`), so `forceViewerRole` alone controls it.
 *  • Analytics is gated on an RBAC permission (`#can_view_analytics`, or the
 *    watcher resource), which is loaded into the Redux store from the session —
 *    stubbing the member check does not move it.
 *
 * So the mocked-role journey (37) can only assert on `MEMBER_CHECK_ADMIN_SIDEBAR_ITEMS`,
 * while the real non-admin session (41) can assert the full list.
 */
export const MEMBER_CHECK_ADMIN_SIDEBAR_ITEMS = ['Studio'] as const;

/** Sidebar rows an admin gets and a real learner does not, across both gates. */
export const ADMIN_ONLY_SIDEBAR_ITEMS = ['Studio', 'Analytics'] as const;

/** Sidebar rows every signed-in user gets, admin or not. */
export const SHARED_SIDEBAR_ITEMS = [
  'Home',
  'Courses',
  'Programs',
  'Pathways',
  'Gradebook',
  'Credentials',
  'Skills',
] as const;

/** Course-content tabs only an admin gets. */
export const ADMIN_ONLY_COURSE_TABS = ['Instructor', 'Configuration', 'Authoring'] as const;

/** Course-content tabs every enrolled learner gets. */
export const SHARED_COURSE_TABS = ['Progress', 'Dates', 'Discussion'] as const;

/**
 * Assert a sidebar row is present/absent. The collapsed rail renders each row
 * as an icon button labelled by `aria-label`; the expanded rail renders the
 * same label as text, so the accessible-name lookup covers both.
 */
export async function expectSidebarItem(page: Page, name: string, present: boolean): Promise<void> {
  const item = page.getByRole('button', { name, exact: true }).first();
  if (present) {
    await expect(item).toBeVisible({ timeout: 30_000 });
  } else {
    await expect(item).toHaveCount(0, { timeout: 30_000 });
  }
}
