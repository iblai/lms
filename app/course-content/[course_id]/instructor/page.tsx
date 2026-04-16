'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
// @ts-ignore
import { CourseContentTabPage } from '@iblai/iblai-js/web-containers/next';
// @ts-ignore
import { useGetDepartmentMemberCheckQuery } from '@iblai/iblai-js/data-layer';

import { config } from '@/lib/config';
import { getTenant } from '@/utils/helpers';

export default function InstructorTab() {
  const { data: departmentMemberCheck, isSuccess } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });

  useEffect(() => {
    if (isSuccess && !departmentMemberCheck?.is_platform_admin) {
      redirect('/');
    }
  }, [isSuccess, departmentMemberCheck]);

  return (
    <CourseContentTabPage
      tab="instructor"
      lmsUrl={config.urls.lms()}
      mfeUrl={config.urls.mfe()}
      legacyLmsUrl={config.urls.legacyLmsUrl()}
    />
  );
}
