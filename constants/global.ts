export const QUERY_PARAMS = {
  APP: 'app',
  REDIRECT_TO: 'redirect-to',
  TENANT: 'tenant',
};

export const NON_AUTH_PAGES = ['/sso-login', '/sso-login-complete', '/version', '/'];

/**
 * Returns true when the pathname is one of the non-authenticated pages
 * (sso-login, version, root) OR a tenant-prefixed onboarding/start page
 * such as `/platform/main/start`.
 */
export const isNonAuthPathname = (pathname: string): boolean => {
  if (NON_AUTH_PAGES.includes(pathname)) return true;
  // /platform/{tenant}/start
  if (/^\/platform\/[^/]+\/start\/?$/.test(pathname)) return true;
  return false;
};

export const MONETIZATION_CLOSE_PAYLOAD = {
  redirect_402: 'redirect_402',
};

/**
 * DOM id of the navbar slot the course-content layout portals its
 * course controls (autoplay, media dropdown, fullscreen, Learn/Assess)
 * into. Rendered (empty) by the NavBar on every page; filled only while
 * a course-content layout is mounted.
 */
export const NAVBAR_COURSE_CONTROLS_ID = 'navbar-course-controls';

/**
 * Query param the onboarding route reads to decide which flow it runs, and the
 * value that selects the member (user onboarding) one — e.g.
 * `/platform/<tenant>/onboarding?flow=user`.
 *
 * The switch that sets it lives in the navbar while the flow itself is rendered
 * by the page, so the URL — not component state — is what keeps the two in
 * sync (and makes a chosen flow reloadable and shareable). Only admins are
 * offered the switch; members get the member flow regardless of the param.
 * With no param, `resolveOnboardingFlow` decides — see lib/onboarding-flow.ts.
 */
export const ONBOARDING_FLOW_PARAM = 'flow';
export const ONBOARDING_USER_FLOW = 'user';
export const ONBOARDING_ADMIN_FLOW = 'admin';

/**
 * DOM id of the navbar slot the onboarding page portals the current step's
 * heading into (icon + title + subtitle), so the step itself keeps all of its
 * room for the form or the agent. Rendered (empty, and therefore zero-width)
 * by the NavBar on every page.
 */
export const NAVBAR_ONBOARDING_HEADER_ID = 'navbar-onboarding-header';
