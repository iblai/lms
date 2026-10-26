export enum SERVICES {
  /**
   * The Open edX LMS through DM's `/v1/lms/{edx_path}` proxy, with the DM
   * token (DM mints the edX JWT server-side). The proxy admits stock edX paths
   * only: the `/api/ibl/...` family is refused, and the course a path names
   * must belong to the token's platform.
   */
  LMS = 'LMS',
  AXD = 'AXD',
  DM = 'DM',
  /** Open edX Studio through DM's `/v1/studio/{edx_path}` proxy, like `LMS`. */
  STUDIO = 'STUDIO',
  /**
   * The LMS host itself, with the edX JWT. Only for the `/api/ibl/...` paths
   * DM has no replacement for yet.
   */
  LMS_DIRECT = 'LMS_DIRECT',
  /** The Studio host with the edX JWT; see `LMS_DIRECT`. */
  STUDIO_DIRECT = 'STUDIO_DIRECT',
}

/**
 * How long catalog-ish caches (search results, enrollments,
 * recommendations) outlive their last subscriber, in seconds. Long enough
 * that navigating away from Home/Discover and back renders instantly from
 * cache instead of refetching behind a loader.
 */
export const CATALOG_CACHE_SECONDS = 600;

/**
 * How long a course's `course_metadata` payload outlives its last
 * subscriber, in seconds. The payload is effectively static (title, dates,
 * artwork), every lazy trigger drops its subscription as soon as the next
 * one fires, and the same course is looked up from several places (course
 * page, navbar title, enrolled-card artwork), so the RTK Query 60s default
 * meant the same course was refetched over and over.
 */
export const COURSE_METADATA_CACHE_SECONDS = 1800;

export const NON_AUTH_PAGES = {
  START: '/start',
};
