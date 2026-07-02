'use client';

import { useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, redirect } from 'next/navigation';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useTenantParam } from '@/hooks/use-tenant-param';

// Admin-only tab; keep its Dialog/Select-heavy tree out of the shared course-content bundle.
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

  useEffect(() => {
    if (isSuccess) {
      if (!departmentMemberCheck?.is_platform_admin) {
        redirect(`/platform/${tenant}`);
      } else {
        setActiveTab('configuration');
      }
    }
  }, [tenant, isSuccess, departmentMemberCheck, setActiveTab]);

  const toggleSection = (index: number | string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (!departmentMemberCheck?.is_platform_admin) {
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
