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
  children,
}: {
  course: CourseEdxData | null;
  courseInfoLoadingState: CourseInfoLoadingState;
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

  useEffect(() => {
    if (isUnauthorizedTenant) {
      router.push('/error/403');
    } else if (isNotFound) {
      router.push('/error/404');
    }
  }, [isUnauthorizedTenant, isNotFound]);

  if (!isLoaded || isUnauthorizedTenant || isNotFound) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
