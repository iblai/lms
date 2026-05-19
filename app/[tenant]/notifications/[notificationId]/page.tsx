'use client';
import { selectRbacPermissions } from '@/features/rbac';
import { useAppSelector } from '@/lib/hooks';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getTenant, getUserName } from '@/utils/helpers';
import { NotificationDisplay } from '@iblai/iblai-js/web-containers';
import { useParams } from 'next/navigation';

export default function NotificationsPage() {
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });
  const params = useParams<{ notificationId: string }>();

  const rbacPermissions = useAppSelector(selectRbacPermissions);
  return (
    <div className="h-full pb-14">
      <NotificationDisplay
        org={getTenant()}
        userId={getUserName()}
        isAdmin={departmentMemberCheck?.is_platform_admin}
        rbacPermissions={rbacPermissions}
        selectedNotificationId={params.notificationId}
      />
    </div>
  );
}
