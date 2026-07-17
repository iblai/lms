'use client';
import { selectRbacPermissions } from '@/features/rbac';
import { useAppSelector } from '@/lib/hooks';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getUserName } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { NotificationDisplay } from '@iblai/iblai-js/web-containers';
import { useParams } from 'next/navigation';

export default function NotificationsPage() {
  const tenant = useTenantParam();
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  const params = useParams<{ notificationId: string }>();

  const rbacPermissions = useAppSelector(selectRbacPermissions);
  return (
    <div className="h-full">
      <NotificationDisplay
        org={tenant}
        userId={getUserName()}
        isAdmin={departmentMemberCheck?.is_platform_admin}
        rbacPermissions={rbacPermissions}
        selectedNotificationId={params.notificationId}
      />
    </div>
  );
}
