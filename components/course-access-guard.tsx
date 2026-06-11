'use client';

import type React from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import type { CourseEdxData } from '@/types/courses';
import type { CourseInfoLoadingState } from '@/hooks/courses/use-course-detail';
import {
  canViewContentModeAudience,
  isAgentContentModeOn,
  isCourseContentModeOn,
} from '@/utils/course-content-mode';

export function CourseAccessGuard({
  course,
  courseInfoLoadingState,
  currentTab,
  isAdmin = false,
  isWatcher = false,
  isAdminResolved = true,
  children,
}: {
  course: CourseEdxData | null;
  courseInfoLoadingState: CourseInfoLoadingState;
  currentTab?: string;
  /** Whether the current viewer is a platform admin (gates `admins`-audience tabs). */
  isAdmin?: boolean;
  /** Whether the current viewer has the watcher RBAC permission (gates `watchers`-audience tabs). */
  isWatcher?: boolean;
  /** Whether the admin check has resolved; access decisions wait for this. */
  isAdminResolved?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const tenant = useTenantParam();

  const isLoaded = courseInfoLoadingState === 'successful' || courseInfoLoadingState === 'failure';

  const isNotFound = courseInfoLoadingState === 'failure' && !course;

  // Wait for both the course info and the admin check before deciding access,
  // otherwise an admin could be momentarily redirected before their role resolves.
  const isReady = isLoaded && isAdminResolved;

  const viewer = { isAdmin, isWatcher };

  // Whether each tab's feature is enabled for the course (role-independent).
  const agentFeatureOn = isReady && !!course && isAgentContentModeOn(course);
  const courseFeatureOn = isReady && !!course && isCourseContentModeOn(course);

  // Whether the viewer's role is allowed to see each tab (audience layer).
  const agentAudienceOk =
    isReady && !!course && canViewContentModeAudience(course.agent_content_mode_audience, viewer);
  const courseAudienceOk =
    isReady && !!course && canViewContentModeAudience(course.course_content_mode_audience, viewer);

  const agentAccessible = agentFeatureOn && agentAudienceOk;
  const courseAccessible = courseFeatureOn && courseAudienceOk;

  const onAgentTab = currentTab === 'agent';
  const onCourseTab = currentTab === 'course';

  // Silent sibling redirect only applies when the current tab's *feature* is off
  // (a course-level config). Role/audience denials always go to 403.
  const shouldRedirectAgentToCourse = onAgentTab && !agentFeatureOn && courseAccessible;
  const shouldRedirectCourseToAgent = onCourseTab && !courseFeatureOn && agentAccessible;
  const shouldRedirectToSibling = shouldRedirectAgentToCourse || shouldRedirectCourseToAgent;

  const isTabDisabled =
    isReady &&
    !!course &&
    !shouldRedirectToSibling &&
    ((onAgentTab && !agentAccessible) || (onCourseTab && !courseAccessible));

  useEffect(() => {
    if (shouldRedirectToSibling && pathname) {
      const siblingTab = shouldRedirectAgentToCourse ? 'course' : 'agent';
      const siblingPath = pathname.replace(/\/(agent|course)$/, `/${siblingTab}`);
      router.replace(siblingPath);
    } else if (isTabDisabled) {
      router.push(`/platform/${tenant}/error/403`);
    } else if (isNotFound) {
      router.push(`/platform/${tenant}/error/404`);
    }
  }, [isNotFound, isTabDisabled, shouldRedirectToSibling, shouldRedirectAgentToCourse]);

  if (!isReady || isNotFound || isTabDisabled || shouldRedirectToSibling) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
