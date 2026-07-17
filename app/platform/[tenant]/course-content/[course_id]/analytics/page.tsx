'use client';

import { useContext, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnalyticsCourseDetail } from '@iblai/iblai-js/web-containers';
import { CourseOutlineContext } from '@/contexts/course-outline-context';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);
  const { course } = useContext(CourseOutlineContext);
  const { setActiveTab } = useContext(EdxIframeContext);

  const rbacPermissions = useAppSelector(selectRbacPermissions);
  const canViewAnalytics = checkRbacPermission(
    rbacPermissions,
    `/platforms/${tenant}/#can_view_analytics`,
  );

  const { isSuccess, isError } = useGetDepartmentMemberCheckQuery({ platform_key: tenant });
  const permissionsResolved = isSuccess || isError;

  useEffect(() => {
    setActiveTab('analytics');
  }, [setActiveTab]);

  useEffect(() => {
    if (permissionsResolved && !canViewAnalytics) {
      router.push(`/platform/${tenant}/error/403`);
    }
  }, [permissionsResolved, canViewAnalytics, tenant, router]);

  if (!permissionsResolved || !canViewAnalytics) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <AnalyticsCourseDetail
        tenantKey={tenant}
        mentorId={''}
        courseId={courseId}
        courseName={course?.display_name}
        showCourseTitle={false}
      />
    </div>
  );
}
