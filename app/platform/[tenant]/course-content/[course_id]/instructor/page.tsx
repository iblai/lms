'use client';

import type React from 'react';
import { useContext, useEffect } from 'react';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useCourseUserRoles } from '@/hooks/courses/use-course-user-roles';
import { useParams, redirect } from 'next/navigation';

export default function InstructorTab() {
  const params = useParams();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);
  const { setActiveTab } = useContext(EdxIframeContext);
  const { data: departmentMemberCheck, isSuccess } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  // Course staff (full or limited) get this tab too — hold the redirect until
  // the course-role listing has settled, or they'd be bounced mid-fetch.
  const { hasCourseStaffAccess, isResolved: rolesResolved } = useCourseUserRoles(courseId);
  const canView = departmentMemberCheck?.is_platform_admin === true || hasCourseStaffAccess;
  useEffect(() => {
    if (isSuccess && rolesResolved) {
      if (!canView) {
        redirect(`/platform/${tenant}`);
      } else {
        setActiveTab('instructor');
      }
    }
  }, [tenant, isSuccess, rolesResolved, canView, setActiveTab]);

  return <EdxIframe />;
}
