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
