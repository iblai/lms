'use client';

import { useTenantParam } from '@/hooks/use-tenant-param';
import { config } from '@/lib/config';
import { AnalyticsUsersStats, useAnalyticsSettings } from '@iblai/iblai-js/web-containers';

export default function UsersPage() {
  const tenant = useTenantParam();
  const { usergroupIds } = useAnalyticsSettings();

  // For Skills app, we'll use the analytics users stats component
  // without mentor-specific parameters
  return (
    <AnalyticsUsersStats
      tenantKey={tenant}
      currentSPA={config.settings.appName() || 'skills'}
      mentorId={''}
      usergroupIds={usergroupIds}
    />
  );
}
