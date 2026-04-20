'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';
import type { CourseEdxData } from '@/types/courses';
import type { CourseInfoLoadingState } from '@/hooks/courses/use-course-detail';

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

  const isLoaded = courseInfoLoadingState === 'successful' || courseInfoLoadingState === 'failure';

  const isUnauthorizedTenant =
    isLoaded &&
    course?.platform_key &&
    course.platform_key !== getTenant() &&
    course.platform_key !== 'main';

  const isNotFound = courseInfoLoadingState === 'failure' && !course;

  const isTabDisabled =
    isLoaded &&
    !!course &&
    ((currentTab === 'agent' && course.agent_content_mode === false) ||
      (currentTab === 'course' && course.course_content_mode !== true));

  useEffect(() => {
    if (isUnauthorizedTenant || isTabDisabled) {
      router.push('/error/403');
    } else if (isNotFound) {
      router.push('/error/404');
    }
  }, [isUnauthorizedTenant, isNotFound, isTabDisabled]);

  if (!isLoaded || isUnauthorizedTenant || isNotFound || isTabDisabled) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
