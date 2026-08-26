'use client';

import { useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, redirect } from 'next/navigation';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useCourseUserRoles } from '@/hooks/courses/use-course-user-roles';

// Staff-only tab; keep its Dialog/Select-heavy tree out of the shared course-content bundle.
const ConfigurationTab = dynamic(
  () =>
    import('@/app/platform/[tenant]/courses/[course_id]/_components/configuration-tab').then(
      (m) => m.ConfigurationTab,
    ),
  {
    loading: () => (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    ),
  },
);

export default function ConfigurationPage() {
  const params = useParams();
  const tenant = useTenantParam();
  const courseId = decodeURIComponent(params.course_id as string);
  const { setActiveTab } = useContext(EdxIframeContext);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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
        setActiveTab('configuration');
      }
    }
  }, [tenant, isSuccess, rolesResolved, canView, setActiveTab]);

  const toggleSection = (index: number | string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (!canView) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <ConfigurationTab
          courseId={courseId}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
      </div>
    </div>
  );
}
