'use client';

import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { useCurrentTenant } from '@/utils/localstorage';
import { useTenantParam } from '@/hooks/use-tenant-param';

/**
 * Whether the current user may create courses: tenant admin, further narrowed
 * by the `can_create_course` RBAC permission when RBAC is enabled (the check
 * passes automatically while RBAC is disabled, which is the default).
 */
export function useCanCreateCourse() {
  const tenant = useTenantParam();
  const { currentTenant } = useCurrentTenant();
  const rbacPermissions = useAppSelector(selectRbacPermissions);

  const isAdmin = !!currentTenant?.is_admin;
  const hasRbacPermission = checkRbacPermission(
    rbacPermissions,
    `/platforms/${tenant}/#can_create_course`,
  );

  return {
    canCreateCourse: isAdmin || hasRbacPermission,
    // localStorage-backed state resolves after mount; null means "still unknown".
    resolved: currentTenant !== null,
  };
}
