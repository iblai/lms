import type { CourseEdxData } from '@/types/courses';

export type ContentModeAudience = 'learners' | 'watchers' | 'admins';

/** RBAC resource that grants the `watchers` audience. */
export const WATCHER_RBAC_RESOURCE = '/watchedgroups/#list';

/**
 * The viewer's role flags, used to decide whether a content-mode audience grants access.
 */
export interface ContentModeViewer {
  isAdmin: boolean;
  /** Whether the viewer has the watcher RBAC permission (`/watchedgroups/#list`). */
  isWatcher: boolean;
}

/**
 * Resolve an audience list, treating an empty/undefined list as `['learners']` (the default).
 */
export function resolveContentModeAudience(
  audience: ContentModeAudience[] | undefined | null,
): ContentModeAudience[] {
  return audience && audience.length > 0 ? audience : ['learners'];
}

/**
 * Whether the current viewer's role is allowed to see content gated by the given audience.
 * - `learners` in the audience => visible to everyone (the default behaviour).
 * - `admins` in the audience => visible to platform admins.
 * - `watchers` => visible to viewers with the watcher RBAC permission.
 */
export function canViewContentModeAudience(
  audience: ContentModeAudience[] | undefined | null,
  viewer: ContentModeViewer,
): boolean {
  const resolved = resolveContentModeAudience(audience);
  if (resolved.includes('learners')) return true;
  if (resolved.includes('admins') && viewer.isAdmin) return true;
  if (resolved.includes('watchers') && viewer.isWatcher) return true;
  return false;
}

/**
 * Whether the Agent tab feature is enabled for the course (independent of the viewer's role).
 */
export function isAgentContentModeOn(course: Pick<CourseEdxData, 'agent_content_mode'>): boolean {
  return course.agent_content_mode === true;
}

/**
 * Whether the Course tab feature is enabled for the course (independent of the viewer's role).
 */
export function isCourseContentModeOn(
  course: Pick<CourseEdxData, 'course_content_mode' | 'agent_content_mode'>,
): boolean {
  return course.course_content_mode !== false || course.agent_content_mode === false;
}
