'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTenant } from '@/utils/helpers';
import type { CourseEdxData } from '@/types/courses';

export function CourseAccessGuard({
  course,
  loading,
  children,
}: {
  course: CourseEdxData | null;
  loading: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const isUnauthorizedTenant =
    !loading &&
    course?.platform_key &&
    course.platform_key !== getTenant() &&
    course.platform_key !== 'main';

  const isNotFound = !loading && !course;

  useEffect(() => {
    if (isUnauthorizedTenant) {
      router.push('/error/403');
    } else if (isNotFound) {
      router.push('/error/404');
    }
  }, [isUnauthorizedTenant, isNotFound]);

  if (loading || isUnauthorizedTenant || isNotFound) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
