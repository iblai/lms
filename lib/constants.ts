export enum SERVICES {
  LMS = 'LMS',
  AXD = 'AXD',
  DM = 'DM',
  STUDIO = 'STUDIO',
}

/**
 * How long catalog-ish caches (search results, enrollments,
 * recommendations) outlive their last subscriber, in seconds. Long enough
 * that navigating away from Home/Discover and back renders instantly from
 * cache instead of refetching behind a loader.
 */
export const CATALOG_CACHE_SECONDS = 600;

export const NON_AUTH_PAGES = {
  START: '/start',
};
