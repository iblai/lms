'use client';
import { selectRbacPermissions } from '@/features/rbac';
import { config } from '@/lib/config';
import { useAppSelector } from '@/lib/hooks';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getTenant, getUserName } from '@/utils/helpers';
import { NotificationDisplay } from '@iblai/iblai-js/web-containers';

export default function NotificationsPage() {
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });

  const rbacPermissions = useAppSelector(selectRbacPermissions);

  return (
    <div className="h-full pb-14">
      <NotificationDisplay
        org={getTenant()}
        userId={getUserName()}
        isAdmin={departmentMemberCheck?.is_platform_admin}
        enableRbac={config.settings.enableRBAC()}
        rbacPermissions={rbacPermissions}
      />
    </div>
  );
}
