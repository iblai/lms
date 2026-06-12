/**
 * Discover visibility / access rules.
 *
 * Two independent switches gate the whole Discover experience — the navbar menu
 * item, the navbar search bar, and the Discover page itself:
 *
 * 1. `hideDiscoverTab` — the deploy-level config flag
 *    (`NEXT_PUBLIC_HIDE_DISCOVER_TAB`). When true it hides Discover entirely and
 *    *supersedes* the tenant metadata switch.
 * 2. `enableDiscoverPage` — the tenant metadata switch
 *    (`metadata?.enable_discover_page`). `null`/`undefined`/`true` are treated as
 *    enabled (truthy); only an explicit `false` disables Discover.
 */
export function isDiscoverEnabled(params: {
  hideDiscoverTab: boolean;
  enableDiscoverPage: boolean | null | undefined;
}): boolean {
  // The config flag wins and needs no async resolution.
  if (params.hideDiscoverTab) return false;
  // Only an explicit `false` from tenant metadata disables Discover.
  return params.enableDiscoverPage !== false;
}
