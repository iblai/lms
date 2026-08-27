'use client';

import type React from 'react';
import { useEffect } from 'react';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useCourseUserRoles } from '@/hooks/courses/use-course-user-roles';
import { useParams, redirect } from 'next/navigation';

export default function InstructorTab() {
  const params = useParams();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);
  const { data: departmentMemberCheck, isSuccess } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  // Course staff (full or limited) get this tab too — hold the redirect until
  // the course-role listing has settled, or they'd be bounced mid-fetch.
  const { hasCourseStaffAccess, isResolved: rolesResolved } = useCourseUserRoles(courseId);
  const canView = departmentMemberCheck?.is_platform_admin === true || hasCourseStaffAccess;
  useEffect(() => {
    if (isSuccess && rolesResolved && !canView) {
      redirect(`/platform/${tenant}`);
    }
  }, [tenant, isSuccess, rolesResolved, canView]);

  return <EdxIframe />;
}
