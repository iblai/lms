'use client';
import { selectRbacPermissions } from '@/features/rbac';
import { config } from '@/lib/config';
import { useAppSelector } from '@/lib/hooks';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { NotificationDisplay } from '@iblai/iblai-js/web-containers';

export default function NotificationsPage() {
  const tenant = useTenantParam();
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });

  const rbacPermissions = useAppSelector(selectRbacPermissions);

  return (
    <div className="h-full">
      <NotificationDisplay
        org={tenant}
        userId={getUserName()}
        isAdmin={departmentMemberCheck?.is_platform_admin}
        enableRbac={config.settings.enableRBAC()}
        rbacPermissions={rbacPermissions}
      />
    </div>
  );
}
