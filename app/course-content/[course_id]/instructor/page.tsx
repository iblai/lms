'use client';

import type React from 'react';
import { useContext, useEffect } from 'react';
import { EdxIframe } from '@/components/edx-iframe/edx-iframe';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getTenant } from '@/utils/helpers';
import { redirect } from 'next/navigation';

export default function InstructorTab() {
  const { setActiveTab } = useContext(EdxIframeContext);
  const { data: departmentMemberCheck, isSuccess } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });
  useEffect(() => {
    if (isSuccess) {
      if (!departmentMemberCheck?.is_platform_admin) {
        redirect('/');
      } else {
        setActiveTab('instructor');
      }
    }
  }, [isSuccess, departmentMemberCheck, setActiveTab]);

  return <EdxIframe />;
}
