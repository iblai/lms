'use client';

import type React from 'react';
import { useContext, useEffect } from 'react';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { redirect } from 'next/navigation';

export default function InstructorTab() {
  const tenant = useTenantParam();
  const { setActiveTab } = useContext(EdxIframeContext);
  const { data: departmentMemberCheck, isSuccess } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  useEffect(() => {
    if (isSuccess) {
      if (!departmentMemberCheck?.is_platform_admin) {
        redirect(`/platform/${tenant}`);
      } else {
        setActiveTab('instructor');
      }
    }
  }, [tenant, isSuccess, departmentMemberCheck, setActiveTab]);

  return <EdxIframe />;
}
