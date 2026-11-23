'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCanCreateCourse } from '@/components/course-creation-access-guard';
import { useLearnerMode } from '@/hooks/use-learner-mode';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getErrorPageUrl } from '@/utils/helpers';

/**
 * Who may open the native Studio: the audience of the sidebar's Studio entry
 * (platform or department admins, with the config flag on), plus anyone
 * allowed to create courses — creation lands them here.
 */
export function useCanAccessStudio() {
  const tenant = useTenantParam();
  const { isInstructorMode } = useLearnerMode();
  const { canCreateCourse, resolved: creatorResolved } = useCanCreateCourse();
  const { data, isSuccess, isError } = useGetDepartmentMemberCheckQuery(
    { platform_key: tenant },
    { skip: !tenant },
  );
  const isAdmin = !!(data?.is_platform_admin || data?.is_department_admin);

  return {
    canAccessStudio:
      config.settings.studioHeaderMenuEnabled() && isInstructorMode && (isAdmin || canCreateCourse),
    resolved: (isSuccess || isError) && creatorResolved,
  };
}

export function StudioAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const tenant = useTenantParam();
  const { canAccessStudio, resolved } = useCanAccessStudio();

  useEffect(() => {
    if (resolved && !canAccessStudio) {
      router.replace(getErrorPageUrl(403, tenant));
    }
  }, [resolved, canAccessStudio, tenant, router]);

  if (!canAccessStudio) {
    return (
      <div className="flex flex-1 items-center justify-center" data-testid="studio-access-pending">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
