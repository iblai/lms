'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { AnalyticsUsersStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function UsersPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics users stats component
  // without mentor-specific parameters
  return <AnalyticsUsersStats tenantKey={tenant} mentorId={''} usergroupIds={usergroupIds} />;
}
