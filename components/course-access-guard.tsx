'use client';

import type React from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getTenants } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import type { CourseEdxData } from '@/types/courses';
import type { CourseInfoLoadingState } from '@/hooks/courses/use-course-detail';
import type { Tenant } from '@/types/tenants';
import { useAppDispatch } from '@/lib/hooks';
import { updateRequestedTenant } from '@/features/tenant';

export function CourseAccessGuard({
  course,
  courseInfoLoadingState,
  currentTab,
  children,
}: {
  course: CourseEdxData | null;
  courseInfoLoadingState: CourseInfoLoadingState;
  currentTab?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const tenant = useTenantParam();

  const isLoaded = courseInfoLoadingState === 'successful' || courseInfoLoadingState === 'failure';

  const isUnauthorizedTenant =
    isLoaded &&
    course?.platform_key &&
    course.platform_key !== tenant &&
    course.platform_key !== 'main';

  const isNotFound = courseInfoLoadingState === 'failure' && !course;

  const agentAccessible = isLoaded && !!course && course.agent_content_mode === true;
  const courseAccessible =
    isLoaded &&
    !!course &&
    (course.course_content_mode !== false || course.agent_content_mode === false);

  const onAgentTab = currentTab === 'agent';
  const onCourseTab = currentTab === 'course';

  const shouldRedirectAgentToCourse = onAgentTab && !agentAccessible && courseAccessible;
  const shouldRedirectCourseToAgent = onCourseTab && !courseAccessible && agentAccessible;
  const shouldRedirectToSibling = shouldRedirectAgentToCourse || shouldRedirectCourseToAgent;

  const isTabDisabled =
    isLoaded &&
    !!course &&
    !shouldRedirectToSibling &&
    ((onAgentTab && !agentAccessible) || (onCourseTab && !courseAccessible));

  useEffect(() => {
    if (shouldRedirectToSibling && pathname) {
      const siblingTab = shouldRedirectAgentToCourse ? 'course' : 'agent';
      const siblingPath = pathname.replace(/\/(agent|course)$/, `/${siblingTab}`);
      router.replace(siblingPath);
    } else if (isUnauthorizedTenant) {
      const tenants = getTenants() as Tenant[];
      const matchingTenant = tenants.find((t) => t?.key === course?.platform_key);
      if (matchingTenant) {
        dispatch(updateRequestedTenant(matchingTenant.key));
      } else {
        router.push(`/${tenant}/error/403`);
      }
    } else if (isTabDisabled) {
      router.push(`/${tenant}/error/403`);
    } else if (isNotFound) {
      router.push(`/${tenant}/error/404`);
    }
  }, [
    isUnauthorizedTenant,
    isNotFound,
    isTabDisabled,
    shouldRedirectToSibling,
    shouldRedirectAgentToCourse,
  ]);

  if (!isLoaded || isUnauthorizedTenant || isNotFound || isTabDisabled || shouldRedirectToSibling) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
